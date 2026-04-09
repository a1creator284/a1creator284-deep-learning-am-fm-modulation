from __future__ import annotations

import torch


def get_best_device(prefer_mps: bool = True) -> tuple[torch.device, str]:
    if prefer_mps and torch.backends.mps.is_available():
        return torch.device("mps"), "mps"
    if torch.cuda.is_available():
        return torch.device("cuda"), "cuda"
    return torch.device("cpu"), "cpu"


def get_device_summary() -> dict[str, bool | str]:
    return {
        "mps_available": torch.backends.mps.is_available(),
        "cuda_available": torch.cuda.is_available(),
        "cpu_available": True,
    }
