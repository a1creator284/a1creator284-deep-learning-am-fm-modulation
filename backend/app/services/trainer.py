from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import json

import torch
from torch import nn

from ..config import ensure_runtime_directories, settings
from ..schemas import EpochMetrics, PredictGeneratedRequest, PredictRequest, TrainRequest, TrainResponse
from ..storage import get_active_model_summary, register_model
from .dataset import create_dataloaders
from .device import get_best_device
from .model import CLASS_NAMES, create_model
from .signals import SignalParams, generate_signal, preprocess_waveform


def _run_epoch(
    model: nn.Module,
    data_loader,
    criterion: nn.Module,
    device: torch.device,
    optimizer: torch.optim.Optimizer | None = None,
) -> tuple[float, float]:
    is_training = optimizer is not None
    model.train(is_training)

    total_loss = 0.0
    total_correct = 0
    total_seen = 0

    for batch_inputs, batch_labels in data_loader:
        batch_inputs = batch_inputs.to(device)
        batch_labels = batch_labels.to(device)

        if optimizer is not None:
            optimizer.zero_grad(set_to_none=True)

        logits = model(batch_inputs)
        loss = criterion(logits, batch_labels)

        if optimizer is not None:
            loss.backward()
            optimizer.step()

        predictions = torch.argmax(logits, dim=1)
        total_correct += int((predictions == batch_labels).sum().item())
        total_seen += int(batch_labels.shape[0])
        total_loss += float(loss.item()) * int(batch_labels.shape[0])

    average_loss = total_loss / max(total_seen, 1)
    accuracy = total_correct / max(total_seen, 1)
    return average_loss, accuracy


def train_classifier(request: TrainRequest) -> TrainResponse:
    ensure_runtime_directories()
    device, device_name = get_best_device(request.use_mps_if_available)
    bundle = create_dataloaders(request)
    model = create_model(request.sample_length).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=request.learning_rate)
    criterion = nn.CrossEntropyLoss()

    history: list[EpochMetrics] = []
    best_val_accuracy = -1.0
    run_id = datetime.now(timezone.utc).strftime("run-%Y%m%d-%H%M%S")
    checkpoint_path = settings.models_dir / f"{run_id}.pt"
    metadata_path = settings.metadata_dir / f"{run_id}.json"

    for epoch in range(1, request.epochs + 1):
        train_loss, train_accuracy = _run_epoch(model, bundle.train_loader, criterion, device, optimizer)
        with torch.no_grad():
            val_loss, val_accuracy = _run_epoch(model, bundle.val_loader, criterion, device, optimizer=None)

        history.append(
            EpochMetrics(
                epoch=epoch,
                train_loss=float(train_loss),
                train_accuracy=float(train_accuracy),
                val_loss=float(val_loss),
                val_accuracy=float(val_accuracy),
            )
        )

        if val_accuracy >= best_val_accuracy:
            best_val_accuracy = float(val_accuracy)
            payload = {
                "state_dict": model.state_dict(),
                "input_length": request.sample_length,
                "sample_rate": request.sample_rate,
                "class_names": CLASS_NAMES,
                "device_used_for_training": device_name,
                "history": [item.model_dump() for item in history],
            }
            torch.save(payload, checkpoint_path)

    summary = {
        "run_id": run_id,
        "checkpoint_path": str(checkpoint_path),
        "metadata_path": str(metadata_path),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "best_val_accuracy": best_val_accuracy,
        "sample_length": request.sample_length,
        "sample_rate": request.sample_rate,
        "device": device_name,
    }

    with metadata_path.open("w", encoding="utf-8") as handle:
        json.dump(
            {
                **summary,
                "request": request.model_dump(),
                "history": [item.model_dump() for item in history],
                "train_size": bundle.train_size,
                "val_size": bundle.val_size,
            },
            handle,
            indent=2,
        )

    register_model(summary)

    return TrainResponse(
        run_id=run_id,
        device=device_name,
        checkpoint_path=str(checkpoint_path),
        metadata_path=str(metadata_path),
        samples_per_class=request.samples_per_class,
        sample_length=request.sample_length,
        sample_rate=request.sample_rate,
        epochs=request.epochs,
        history=history,
        best_val_accuracy=best_val_accuracy,
        active_model_ready=checkpoint_path.exists(),
    )


def load_active_model() -> tuple[nn.Module, dict[str, object], Path]:
    summary = get_active_model_summary()
    if not summary:
        raise FileNotFoundError("No trained model is available yet. Run /train first.")

    checkpoint_path = Path(str(summary["checkpoint_path"]))
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Active model checkpoint was not found: {checkpoint_path}")

    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    input_length = int(checkpoint["input_length"])
    model = create_model(input_length)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    metadata = {
        "input_length": input_length,
        "sample_rate": int(checkpoint.get("sample_rate", settings.default_sample_rate)),
        "class_names": checkpoint.get("class_names", CLASS_NAMES),
        "checkpoint_path": str(checkpoint_path),
    }
    return model, metadata, checkpoint_path


def predict_waveform(samples: list[float], sample_rate: int, sample_length: int | None = None) -> dict[str, object]:
    model, metadata, checkpoint_path = load_active_model()
    preferred_length = sample_length or int(metadata["input_length"])
    processed = preprocess_waveform(samples, preferred_length)
    tensor = torch.from_numpy(processed).unsqueeze(0).unsqueeze(0)

    with torch.no_grad():
        logits = model(tensor)
        probabilities_tensor = torch.softmax(logits, dim=1).squeeze(0)
        probabilities = probabilities_tensor.tolist()

    class_names = list(metadata.get("class_names", CLASS_NAMES))
    best_index = int(torch.argmax(probabilities_tensor).item())
    label = class_names[best_index]
    confidence = float(probabilities[best_index])

    return {
        "label": label,
        "confidence": confidence,
        "probabilities": {class_names[index]: float(value) for index, value in enumerate(probabilities)},
        "sample_length": preferred_length,
        "sample_rate": sample_rate,
        "device": "cpu",
        "model_path": str(checkpoint_path),
    }


def predict_generated_waveform(request: PredictGeneratedRequest) -> dict[str, object]:
    params = SignalParams(
        message_amplitude=request.params.message_amplitude,
        message_frequency=request.params.message_frequency,
        carrier_amplitude=request.params.carrier_amplitude,
        carrier_frequency=request.params.carrier_frequency,
        frequency_deviation=request.params.frequency_deviation,
        phase=request.params.phase,
        noise_level=request.params.noise_level,
    )
    waveform = generate_signal(request.mode, params, request.sample_length, request.sample_rate)
    return predict_waveform(waveform.tolist(), request.sample_rate, request.sample_length)


def predict_from_request(request: PredictRequest) -> dict[str, object]:
    return predict_waveform(request.waveform, request.sample_rate, request.sample_length)
