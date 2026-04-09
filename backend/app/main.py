from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO, StringIO
from pathlib import Path
from typing import Annotated
import csv
import json
import re

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import ensure_runtime_directories, settings
from .schemas import (
    ConfigResponse,
    HealthResponse,
    ModelSummary,
    PredictGeneratedRequest,
    PredictRequest,
    PredictResponse,
    ReportSummaryRequest,
    ReportSummaryResponse,
    SelfCheckItem,
    SelfCheckResponse,
    TrainRequest,
    TrainResponse,
    UploadResponse,
    WorkflowOverviewResponse,
)
from .services.device import get_best_device, get_device_summary
from .services.reporting import build_report_summary, build_workflow_overview
from .services.signals import SignalParams, generate_signal, preprocess_waveform
from .services.trainer import predict_from_request, predict_generated_waveform, train_classifier
from .storage import get_active_model_summary, list_models

ensure_runtime_directories()

app = FastAPI(
    title=settings.project_name,
    version=settings.api_version,
    description="FastAPI + PyTorch backend for AM/FM waveform training, prediction, and IQ file uploads.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
PREFERRED_COLUMNS = ["modulated", "waveform", "signal", "samples", "value", "amplitude"]


@app.get("/")
def root() -> dict[str, object]:
    return {
        "service": settings.project_name,
        "version": settings.api_version,
        "docs": "/docs",
        "endpoints": [
            "/health",
            "/config",
            "/device",
            "/models",
            "/models/active",
            "/self-check",
            "/workflow/overview",
            "/report/summary",
            "/train",
            "/predict",
            "/predict/generated",
            "/upload/iq",
            "/predict/file",
        ],
    }


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    _, device_name = get_best_device(prefer_mps=True)
    active_summary = get_active_model_summary()
    return HealthResponse(
        service=settings.project_name,
        status="ok",
        api_version=settings.api_version,
        device=device_name,
        model_ready=active_summary is not None,
        active_run_id=None if active_summary is None else str(active_summary.get("run_id")),
        last_model_path=None if active_summary is None else str(active_summary.get("checkpoint_path")),
    )


@app.get("/config", response_model=ConfigResponse)
def config() -> ConfigResponse:
    return ConfigResponse(
        project_name=settings.project_name,
        api_version=settings.api_version,
        host=settings.host,
        port=settings.port,
        allow_origins=settings.allow_origins,
        artifact_dir=str(settings.artifact_dir),
        models_dir=str(settings.models_dir),
        uploads_dir=str(settings.uploads_dir),
        default_sample_rate=settings.default_sample_rate,
    )


@app.get("/device")
def device() -> dict[str, object]:
    _, active_device = get_best_device(prefer_mps=True)
    return {"active_device": active_device, **get_device_summary()}


@app.get("/models", response_model=list[ModelSummary])
def models() -> list[ModelSummary]:
    return [ModelSummary(**item) for item in list_models()]


@app.get("/models/active", response_model=ModelSummary)
def active_model() -> ModelSummary:
    summary = get_active_model_summary()
    if summary is None:
        raise HTTPException(status_code=404, detail="No active model is available yet. Run /train first.")
    return ModelSummary(**summary)


@app.get("/self-check", response_model=SelfCheckResponse)
def self_check() -> SelfCheckResponse:
    active_summary = get_active_model_summary()
    sample_rate = max(1_200, settings.default_sample_rate)
    generated = generate_signal(
        "AM",
        SignalParams(
            message_amplitude=1.0,
            message_frequency=min(10_000.0, sample_rate / 120.0),
            carrier_amplitude=2.0,
            carrier_frequency=min(100_000.0, sample_rate / 8.0),
            frequency_deviation=min(8_000.0, sample_rate / 16.0),
            phase=0.0,
            noise_level=0.01,
        ),
        sample_length=128,
        sample_rate=sample_rate,
    )
    processed = preprocess_waveform(generated, 128)
    csv_preview = _parse_text_waveform("time,modulated\n0.0,0.1\n0.1,-0.2\n0.2,0.3\n0.3,-0.1")
    device_summary = get_device_summary()

    results = [
        SelfCheckItem(
            id="device",
            label="Device detection",
            ok=True,
            detail=f"Active backend device probe completed. MPS available: {device_summary.get('mps_available')}",
        ),
        SelfCheckItem(
            id="waveform",
            label="Waveform generation",
            ok=generated.size == 128 and np.isfinite(generated).all(),
            detail=f"Generated {generated.size} AM samples at {sample_rate} Hz.",
        ),
        SelfCheckItem(
            id="preprocess",
            label="Waveform preprocessing",
            ok=processed.size == 128 and np.isfinite(processed).all(),
            detail="Resampling and normalization pipeline completed successfully.",
        ),
        SelfCheckItem(
            id="parser",
            label="Upload parser",
            ok=csv_preview.size == 4 and np.isfinite(csv_preview).all(),
            detail="CSV waveform parsing logic responded with numeric samples.",
        ),
        SelfCheckItem(
            id="registry",
            label="Model registry",
            ok=True,
            detail=f"Registry access succeeded. {len(list_models())} model record(s) available.",
        ),
        SelfCheckItem(
            id="active_model",
            label="Active model availability",
            ok=active_summary is not None,
            detail=(
                f"Active model run {active_summary.get('run_id')} is ready."
                if active_summary is not None
                else "No trained active model yet. Run /train to enable backend inference routes fully."
            ),
        ),
    ]

    overall_ok = all(item.ok for item in results if item.id != "active_model")
    return SelfCheckResponse(
        service=settings.project_name,
        status="ok" if overall_ok else "degraded",
        executed_at=datetime.now(timezone.utc).isoformat(),
        overall_ok=overall_ok,
        active_model_ready=active_summary is not None,
        active_run_id=None if active_summary is None else str(active_summary.get("run_id")),
        results=results,
    )


@app.get("/workflow/overview", response_model=WorkflowOverviewResponse)
def workflow_overview() -> WorkflowOverviewResponse:
    return build_workflow_overview(active_model_ready=get_active_model_summary() is not None)


@app.post("/report/summary", response_model=ReportSummaryResponse)
def report_summary(request: ReportSummaryRequest) -> ReportSummaryResponse:
    return build_report_summary(request, active_model_ready=get_active_model_summary() is not None)


@app.post("/train", response_model=TrainResponse)
def train(request: TrainRequest) -> TrainResponse:
    try:
        return train_classifier(request)
    except Exception as error:  # pragma: no cover - safeguard for runtime failures
        raise HTTPException(status_code=500, detail=f"Training failed: {error}") from error


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    try:
        return PredictResponse(**predict_from_request(request))
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except Exception as error:  # pragma: no cover - safeguard for runtime failures
        raise HTTPException(status_code=500, detail=f"Prediction failed: {error}") from error


@app.post("/predict/generated", response_model=PredictResponse)
def predict_generated(request: PredictGeneratedRequest) -> PredictResponse:
    try:
        return PredictResponse(**predict_generated_waveform(request))
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except Exception as error:  # pragma: no cover - safeguard for runtime failures
        raise HTTPException(status_code=500, detail=f"Generated prediction failed: {error}") from error


@app.post("/upload/iq", response_model=UploadResponse)
async def upload_iq(file: Annotated[UploadFile, File(description="CSV, TXT, JSON, or NPY waveform file")]) -> UploadResponse:
    try:
        file_name, saved_path, samples = await _read_and_store_upload(file)
        return UploadResponse(
            file_name=file_name,
            saved_path=str(saved_path),
            sample_count=int(samples.size),
            sample_rate=settings.default_sample_rate,
            preview=samples[:12].astype(float).tolist(),
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:  # pragma: no cover - safeguard for runtime failures
        raise HTTPException(status_code=500, detail=f"Upload failed: {error}") from error


@app.post("/predict/file", response_model=PredictResponse)
async def predict_file(file: Annotated[UploadFile, File(description="CSV, TXT, JSON, or NPY waveform file")]) -> PredictResponse:
    try:
        _, _, samples = await _read_and_store_upload(file)
        return PredictResponse(**predict_from_request(PredictRequest(waveform=samples.astype(float).tolist())))
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:  # pragma: no cover - safeguard for runtime failures
        raise HTTPException(status_code=500, detail=f"File prediction failed: {error}") from error


async def _read_and_store_upload(file: UploadFile) -> tuple[str, Path, np.ndarray]:
    raw = await file.read()
    if not raw:
        raise ValueError("Uploaded file is empty.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ValueError("Uploaded file is too large. Keep it under 10 MB.")

    safe_name = _safe_filename(file.filename or "signal_upload.bin")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    saved_path = settings.uploads_dir / f"{timestamp}-{safe_name}"
    saved_path.write_bytes(raw)
    samples = _parse_waveform_payload(safe_name, raw)
    if samples.size < 16:
        raise ValueError("Uploaded waveform has too few numeric samples.")
    return safe_name, saved_path, samples


def _safe_filename(name: str) -> str:
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-.")
    return sanitized or "signal_upload.bin"


def _parse_waveform_payload(file_name: str, raw: bytes) -> np.ndarray:
    suffix = Path(file_name).suffix.lower()

    if suffix == ".npy":
        array = np.load(BytesIO(raw), allow_pickle=False)
        return _extract_numeric_array(array)

    text = raw.decode("utf-8", errors="ignore")
    if suffix == ".json":
        return _parse_json_waveform(text)
    if suffix in {".csv", ".txt", ".dat", ".log"}:
        return _parse_text_waveform(text)

    try:
        return _parse_json_waveform(text)
    except Exception:
        return _parse_text_waveform(text)


def _parse_json_waveform(text: str) -> np.ndarray:
    payload = json.loads(text)
    if isinstance(payload, list):
        return _extract_numeric_array(payload)
    if isinstance(payload, dict):
        for key in ("waveform", "samples", "modulated", "signal", "data"):
            if key in payload:
                return _extract_numeric_array(payload[key])
    raise ValueError("JSON file does not contain a supported waveform key.")


def _parse_text_waveform(text: str) -> np.ndarray:
    stripped = text.strip()
    if not stripped:
        raise ValueError("Text upload does not contain any waveform values.")

    first_line = stripped.splitlines()[0]
    if any(character.isalpha() for character in first_line):
        return _parse_csv_with_header(stripped)

    try:
        rows = list(csv.reader(StringIO(stripped)))
        values = [_last_numeric_value(row) for row in rows if row]
        numeric = [value for value in values if value is not None]
        if numeric:
            return np.asarray(numeric, dtype=np.float32)
    except Exception:
        pass

    tokens = re.split(r"[\s,;]+", stripped)
    numeric = [float(token) for token in tokens if token]
    return np.asarray(numeric, dtype=np.float32)


def _parse_csv_with_header(text: str) -> np.ndarray:
    reader = csv.DictReader(StringIO(text))
    if not reader.fieldnames:
        raise ValueError("CSV header could not be parsed.")

    normalized_field_map = {field.lower().strip(): field for field in reader.fieldnames}
    selected_field = None
    for preferred in PREFERRED_COLUMNS:
        if preferred in normalized_field_map:
            selected_field = normalized_field_map[preferred]
            break
    if selected_field is None:
        selected_field = reader.fieldnames[-1]

    values: list[float] = []
    for row in reader:
        value = row.get(selected_field)
        if value is None or value == "":
            continue
        try:
            values.append(float(value))
        except ValueError:
            continue

    if not values:
        raise ValueError("CSV file did not contain numeric waveform values.")
    return np.asarray(values, dtype=np.float32)


def _last_numeric_value(row: list[str]) -> float | None:
    for item in reversed(row):
        token = item.strip()
        if not token:
            continue
        try:
            return float(token)
        except ValueError:
            continue
    return None


def _extract_numeric_array(payload: object) -> np.ndarray:
    array = np.asarray(payload, dtype=np.float32)
    if array.ndim == 1:
        return array.reshape(-1)
    if array.ndim >= 2:
        flattened = array.reshape(array.shape[0], -1)
        return flattened[:, -1].astype(np.float32)
    raise ValueError("Waveform array shape is not supported.")
