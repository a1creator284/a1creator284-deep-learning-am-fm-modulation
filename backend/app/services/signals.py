from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Literal

import numpy as np

SignalMode = Literal["AM", "FM", "PM"]


@dataclass(frozen=True)
class SignalParams:
    message_amplitude: float = 1.0
    message_frequency: float = 10_000.0
    carrier_amplitude: float = 2.0
    carrier_frequency: float = 100_000.0
    frequency_deviation: float = 8_000.0
    phase: float = 0.0
    noise_level: float = 0.0


def normalize_waveform(samples: np.ndarray) -> np.ndarray:
    array = np.asarray(samples, dtype=np.float32).reshape(-1)
    peak = float(np.max(np.abs(array))) if array.size else 1.0
    if peak <= 1e-8:
        return array
    return array / peak


def resample_waveform(samples: np.ndarray, target_length: int) -> np.ndarray:
    array = np.asarray(samples, dtype=np.float32).reshape(-1)
    if array.size == 0:
        return np.zeros(target_length, dtype=np.float32)
    if array.size == target_length:
        return array.astype(np.float32)

    source_index = np.linspace(0.0, 1.0, num=array.size, dtype=np.float32)
    target_index = np.linspace(0.0, 1.0, num=target_length, dtype=np.float32)
    return np.interp(target_index, source_index, array).astype(np.float32)


def preprocess_waveform(samples: np.ndarray | list[float], target_length: int) -> np.ndarray:
    array = np.asarray(samples, dtype=np.float32).reshape(-1)
    array = np.nan_to_num(array, nan=0.0, posinf=0.0, neginf=0.0)
    return normalize_waveform(resample_waveform(array, target_length))


def generate_signal(mode: SignalMode, params: SignalParams, sample_length: int, sample_rate: int) -> np.ndarray:
    time = np.arange(sample_length, dtype=np.float32) / float(sample_rate)
    message = params.message_amplitude * np.cos(2 * math.pi * params.message_frequency * time + params.phase)

    if mode == "AM":
        modulation_index = params.message_amplitude / max(params.carrier_amplitude, 1e-5)
        envelope = 1.0 + modulation_index * np.cos(2 * math.pi * params.message_frequency * time + params.phase)
        modulated = params.carrier_amplitude * envelope * np.cos(2 * math.pi * params.carrier_frequency * time)
    elif mode == "FM":
        beta = params.frequency_deviation / max(params.message_frequency, 1e-5)
        phase_term = beta * np.sin(2 * math.pi * params.message_frequency * time + params.phase)
        modulated = params.carrier_amplitude * np.cos(2 * math.pi * params.carrier_frequency * time + phase_term)
    else:  # PM
        kp = params.frequency_deviation / max(params.message_amplitude, 1e-5)
        phase_term = kp * params.message_amplitude * np.cos(2 * math.pi * params.message_frequency * time + params.phase)
        modulated = params.carrier_amplitude * np.cos(2 * math.pi * params.carrier_frequency * time + phase_term)

    if params.noise_level > 0:
        noise = np.random.normal(loc=0.0, scale=params.noise_level, size=sample_length).astype(np.float32)
        modulated = modulated + noise

    _ = message  # Preserved for future demodulation/inspection extensions.
    return preprocess_waveform(modulated, sample_length)


def create_random_params(mode: SignalMode, rng: np.random.Generator, sample_rate: int = 1_000_000) -> SignalParams:
    nyquist = max(sample_rate / 2.0, 10.0)

    if sample_rate >= 400_000:
        carrier_min = 20_000.0
        carrier_max = min(100_000.0, nyquist * 0.42)
        message_min = 100.0
        message_max = min(10_000.0, carrier_max / 6.0)
        deviation_min = 500.0
        deviation_max = min(20_000.0 if mode in ("FM", "PM") else 10_000.0, carrier_max / 3.0)
    else:
        carrier_min = 80.0
        carrier_max = min(max(220.0, sample_rate * 0.35), 2_000.0)
        message_min = 4.0
        message_max = min(120.0, carrier_max / 8.0)
        deviation_min = 8.0
        deviation_max = min(80.0 if mode in ("FM", "PM") else 35.0, carrier_max / 4.0)

    carrier_max = max(carrier_min + 1.0, carrier_max)
    message_max = max(message_min + 1.0, message_max)
    deviation_max = max(deviation_min + 1.0, deviation_max)

    base_carrier = float(rng.uniform(carrier_min, carrier_max))
    message_frequency = float(rng.uniform(message_min, message_max))
    carrier_amplitude = float(rng.uniform(1.2, 4.5))
    message_amplitude = float(rng.uniform(0.3, min(3.8, carrier_amplitude * 1.25)))
    frequency_deviation = float(rng.uniform(deviation_min, deviation_max))

    return SignalParams(
        message_amplitude=message_amplitude,
        message_frequency=message_frequency,
        carrier_amplitude=carrier_amplitude,
        carrier_frequency=base_carrier,
        frequency_deviation=frequency_deviation,
        phase=float(rng.uniform(0, 2 * math.pi)),
        noise_level=float(rng.uniform(0, 0.12)),
    )
