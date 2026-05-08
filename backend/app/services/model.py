from __future__ import annotations

import torch
from torch import nn

CLASS_NAMES = ["AM", "FM", "PM"]


class ModulationClassifier(nn.Module):
    def __init__(self, input_length: int) -> None:
        super().__init__()
        self.input_length = input_length
        self.features = nn.Sequential(
            nn.Conv1d(1, 16, kernel_size=7, padding=3),
            nn.BatchNorm1d(16),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2),
            nn.Conv1d(16, 32, kernel_size=5, padding=2),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2),
            nn.Conv1d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(16),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 16, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, len(CLASS_NAMES)),
        )

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        features = self.features(inputs)
        return self.classifier(features)


def create_model(input_length: int) -> ModulationClassifier:
    return ModulationClassifier(input_length=input_length)
