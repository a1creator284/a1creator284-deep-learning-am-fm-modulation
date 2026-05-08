from __future__ import annotations

import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset

from ..schemas import TrainRequest
from .signals import create_random_params, generate_signal


class DatasetBundle:
    def __init__(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader,
        train_size: int,
        val_size: int,
    ) -> None:
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.train_size = train_size
        self.val_size = val_size


def build_synthetic_arrays(request: TrainRequest) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(request.seed)
    features: list[np.ndarray] = []
    labels: list[int] = []

    for label, mode in enumerate(("AM", "FM", "PM")):
        for _ in range(request.samples_per_class):
            params = create_random_params(mode, rng, request.sample_rate)
            waveform = generate_signal(mode, params, request.sample_length, request.sample_rate)
            features.append(waveform)
            labels.append(label)

    feature_array = np.stack(features).astype(np.float32)
    label_array = np.asarray(labels, dtype=np.int64)
    permutation = rng.permutation(feature_array.shape[0])
    return feature_array[permutation], label_array[permutation]


def create_dataloaders(request: TrainRequest) -> DatasetBundle:
    features, labels = build_synthetic_arrays(request)
    split_index = max(1, int(features.shape[0] * (1 - request.validation_split)))

    train_features = torch.from_numpy(features[:split_index]).unsqueeze(1)
    train_labels = torch.from_numpy(labels[:split_index])
    val_features = torch.from_numpy(features[split_index:]).unsqueeze(1)
    val_labels = torch.from_numpy(labels[split_index:])

    train_dataset = TensorDataset(train_features, train_labels)
    val_dataset = TensorDataset(val_features, val_labels)

    train_loader = DataLoader(train_dataset, batch_size=request.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=request.batch_size, shuffle=False)

    return DatasetBundle(
        train_loader=train_loader,
        val_loader=val_loader,
        train_size=len(train_dataset),
        val_size=len(val_dataset),
    )
