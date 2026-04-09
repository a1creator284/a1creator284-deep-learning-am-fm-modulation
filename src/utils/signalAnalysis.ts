import type { SignalMode, SignalParameters, SignalPoint } from "./signalProcessor";

export interface SpectrumPoint {
  frequency: number;
  amplitude: number;
  normalized: number;
}

export interface RecoveredPoint {
  time: number;
  message: number;
  recovered: number;
  error: number;
}

export interface SignalQualityMetrics {
  rms: number;
  mean: number;
  peak: number;
  crestFactor: number;
  dynamicRange: number;
  zeroCrossingRate: number;
}

export interface DiagnosticResult {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface FrontendDiagnosticInput {
  mode: SignalMode;
  params: SignalParameters;
  points: SignalPoint[];
  textMessage: string;
  textBitRate: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function resampleValues(points: SignalPoint[], length = 256) {
  if (points.length === 0) {
    return Array.from({ length }, () => 0);
  }

  if (points.length === 1) {
    return Array.from({ length }, () => points[0]?.modulated ?? 0);
  }

  return Array.from({ length }, (_, index) => {
    const position = (index / Math.max(length - 1, 1)) * (points.length - 1);
    const leftIndex = Math.floor(position);
    const rightIndex = Math.min(points.length - 1, Math.ceil(position));
    const blend = position - leftIndex;
    const leftValue = points[leftIndex]?.modulated ?? 0;
    const rightValue = points[rightIndex]?.modulated ?? leftValue;
    return leftValue + (rightValue - leftValue) * blend;
  });
}

function movingAverage(values: number[], windowSize: number) {
  if (values.length === 0) {
    return [];
  }

  const radius = Math.max(1, Math.floor(windowSize / 2));

  return values.map((_, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(values.length, index + radius + 1);
    const slice = values.slice(start, end);
    const total = slice.reduce((sum, value) => sum + value, 0);
    return total / Math.max(slice.length, 1);
  });
}

function normalizeRange(values: number[], targetPeak: number) {
  const peak = Math.max(1e-6, ...values.map((value) => Math.abs(value)));
  return values.map((value) => (value / peak) * targetPeak);
}

export function computeSignalSpectrum(points: SignalPoint[], sampleRate: number, maxBins = 96): SpectrumPoint[] {
  const sampleCount = clamp(Math.min(points.length, 256), 32, 256);
  const samples = resampleValues(points, sampleCount);
  const mean = samples.reduce((sum, value) => sum + value, 0) / sampleCount;
  const centered = samples.map((value, index) => {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / Math.max(sampleCount - 1, 1));
    return (value - mean) * window;
  });

  const half = Math.floor(sampleCount / 2);
  const bins = Array.from({ length: Math.min(half, maxBins) }, (_, binIndex) => {
    let real = 0;
    let imaginary = 0;

    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const angle = (2 * Math.PI * binIndex * sampleIndex) / sampleCount;
      real += centered[sampleIndex] * Math.cos(angle);
      imaginary -= centered[sampleIndex] * Math.sin(angle);
    }

    return {
      frequency: (binIndex * sampleRate) / sampleCount,
      amplitude: Math.sqrt(real ** 2 + imaginary ** 2) / sampleCount,
    };
  });

  const peak = Math.max(1e-6, ...bins.map((bin) => bin.amplitude));

  return bins.map((bin) => ({
    ...bin,
    normalized: bin.amplitude / peak,
  }));
}

export function recoverMessageSignal(
  points: SignalPoint[],
  mode: SignalMode,
  params: SignalParameters,
): RecoveredPoint[] {
  if (points.length === 0) {
    return [];
  }

  if (mode === "AM") {
    const envelope = points.map((point) => Math.abs(point.modulated));
    const smoothed = movingAverage(envelope, Math.max(5, Math.round(points.length / 18)));
    const centered = smoothed.map((value) => value - params.carrierAmplitude);
    const normalized = normalizeRange(centered, Math.max(params.messageAmplitude, 0.5));

    return points.map((point, index) => {
      const recovered = normalized[index] ?? 0;
      return {
        time: point.time,
        message: point.message,
        recovered,
        error: recovered - point.message,
      };
    });
  }

  const recoveredFrequency = points.map((point) => {
    const instantaneousFrequency = point.instantaneousFrequency ?? params.carrierFrequency;
    return ((instantaneousFrequency - params.carrierFrequency) / Math.max(params.frequencyDeviation, 1e-6)) * params.messageAmplitude;
  });
  const smoothed = movingAverage(recoveredFrequency, Math.max(3, Math.round(points.length / 26)));

  return points.map((point, index) => {
    const recovered = smoothed[index] ?? 0;
    return {
      time: point.time,
      message: point.message,
      recovered,
      error: recovered - point.message,
    };
  });
}

export function computeSignalQualityMetrics(points: SignalPoint[]): SignalQualityMetrics {
  if (points.length === 0) {
    return {
      rms: 0,
      mean: 0,
      peak: 0,
      crestFactor: 0,
      dynamicRange: 0,
      zeroCrossingRate: 0,
    };
  }

  const values = points.map((point) => point.modulated);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const peak = Math.max(...values.map((value) => Math.abs(value)), 0);
  const rms = Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0) / values.length);
  const nonZeroMagnitudes = values.map((value) => Math.abs(value)).filter((value) => value > 1e-6);
  const minMagnitude = nonZeroMagnitudes.length > 0 ? Math.min(...nonZeroMagnitudes) : 1e-6;
  const zeroCrossings = values.reduce((count, value, index) => {
    if (index === 0) {
      return count;
    }

    const previous = values[index - 1] ?? 0;
    return previous === 0 || value === 0 || Math.sign(previous) === Math.sign(value) ? count : count + 1;
  }, 0);

  return {
    rms,
    mean,
    peak,
    crestFactor: peak / Math.max(rms, 1e-6),
    dynamicRange: 20 * Math.log10(peak / Math.max(minMagnitude, 1e-6)),
    zeroCrossingRate: zeroCrossings / Math.max(values.length - 1, 1),
  };
}

export function buildWavBlob(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let index = 0; index < samples.length; index += 1) {
    const value = clamp(samples[index] ?? 0, -1, 1);
    view.setInt16(44 + index * bytesPerSample, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function runFrontendDiagnostics({
  mode,
  params,
  points,
  textMessage,
  textBitRate,
}: FrontendDiagnosticInput): DiagnosticResult[] {
  const hasFiniteValues = points.every(
    (point) =>
      Number.isFinite(point.time) &&
      Number.isFinite(point.message) &&
      Number.isFinite(point.carrier) &&
      Number.isFinite(point.modulated) &&
      (point.instantaneousFrequency === undefined || Number.isFinite(point.instantaneousFrequency)),
  );
  const spectrum = computeSignalSpectrum(points, params.sampleRate);
  const recovered = recoverMessageSignal(points, mode, params);
  const localStorageWorks = (() => {
    try {
      const key = "signal-lab-self-check";
      window.localStorage.setItem(key, "ok");
      const value = window.localStorage.getItem(key) === "ok";
      window.localStorage.removeItem(key);
      return value;
    } catch {
      return false;
    }
  })();

  return [
    {
      id: "waveform",
      label: "Waveform pipeline",
      ok: points.length >= 32 && hasFiniteValues,
      detail: points.length >= 32 ? `${points.length} valid samples generated.` : "Too few waveform samples were produced.",
    },
    {
      id: "demodulation",
      label: "Demodulation preview",
      ok: recovered.length === points.length && recovered.every((point) => Number.isFinite(point.recovered)),
      detail: recovered.length === points.length ? `${mode} recovery preview generated successfully.` : "Recovered signal preview failed.",
    },
    {
      id: "spectrum",
      label: "Spectrum analyzer",
      ok: spectrum.length >= 16 && spectrum.every((point) => Number.isFinite(point.amplitude)),
      detail: `${spectrum.length} spectrum bins prepared for display.`,
    },
    {
      id: "audio",
      label: "Browser audio output",
      ok: typeof window.AudioContext !== "undefined" || typeof (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== "undefined",
      detail: "AudioContext capability checked for message and modulated playback.",
    },
    {
      id: "speech",
      label: "Speech synthesis",
      ok: "speechSynthesis" in window,
      detail: "Speech engine checked for original-text playback.",
    },
    {
      id: "storage",
      label: "Session persistence",
      ok: localStorageWorks,
      detail: localStorageWorks ? "Save/load session is available." : "localStorage is blocked in this browser.",
    },
    {
      id: "text-input",
      label: "Text message encoder",
      ok: textMessage.trim().length > 0 && textBitRate >= 2 && textBitRate <= 24,
      detail: `Message length ${textMessage.trim().length} characters, bit rate ${textBitRate} bps.`,
    },
    {
      id: "endpoints",
      label: "Backend endpoints",
      ok: true,
      detail: "Frontend diagnostics passed. Connect the FastAPI backend locally or through VITE_API_BASE_URL to enable real training, prediction, model registry, and IQ upload checks.",
    },
  ];
}
