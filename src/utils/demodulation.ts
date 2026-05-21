/**
 * demodulation.ts
 * Full demodulation algorithms for AM, FM, and PM signals.
 * Each function takes the modulated signal points + parameters and returns
 * the recovered message, step-by-step intermediate signals, and quality metrics.
 */

import type { SignalParameters, SignalPoint } from "./signalProcessor";

export interface DemodStep {
  label: string;
  description: string;
  formula: string;
}

export interface DemodChartPoint {
  time: number;
  modulated: number;
  original: number;
  recovered: number;
  intermediate1: number; // e.g. rectified / inst-freq / inst-phase
  intermediate2: number; // e.g. smoothed envelope / smoothed freq / smoothed phase
  error: number;
}

export interface DemodMetrics {
  rmse: number;
  correlation: number;
  snrDb: number;
  maxError: number;
  meanError: number;
}

export interface DemodResult {
  mode: "AM" | "FM" | "PM";
  chartPoints: DemodChartPoint[];
  metrics: DemodMetrics;
  steps: DemodStep[];
}

export interface CompareChartPoint {
  time: number;
  original: number;
  amRecovered: number;
  fmRecovered: number;
  pmRecovered: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function movingAvg(arr: number[], win: number): number[] {
  const half = Math.max(1, Math.floor(win / 2));
  return arr.map((_, i) => {
    const s = Math.max(0, i - half);
    const e = Math.min(arr.length, i + half + 1);
    const sl = arr.slice(s, e);
    return sl.reduce((a, b) => a + b, 0) / sl.length;
  });
}

function rmse(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += ((a[i] ?? 0) - (b[i] ?? 0)) ** 2;
  return Math.sqrt(s / Math.max(n, 1));
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  const ma = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const mb = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const ai = (a[i] ?? 0) - ma;
    const bi = (b[i] ?? 0) - mb;
    num += ai * bi; da += ai * ai; db += bi * bi;
  }
  return num / Math.max(Math.sqrt(da * db), 1e-9);
}

function snrDb(signal: number[], noise: number[]): number {
  const sp = signal.reduce((s, v) => s + v * v, 0) / Math.max(signal.length, 1);
  const np = noise.reduce((s, v) => s + v * v, 0) / Math.max(noise.length, 1);
  return 10 * Math.log10(Math.max(sp, 1e-12) / Math.max(np, 1e-12));
}

function downsample<T>(arr: T[], maxPts: number): T[] {
  if (arr.length <= maxPts) return arr;
  const stride = Math.ceil(arr.length / maxPts);
  return arr.filter((_, i) => i % stride === 0 || i === arr.length - 1);
}

// ── AM Envelope Detector ─────────────────────────────────────────────────────
// Steps:
//  1. Full-wave rectification: |s(t)|
//  2. Low-pass filter (moving average) to get envelope
//  3. Remove DC bias (subtract carrier amplitude)
//  4. Normalize to message amplitude range

export function demodulateAM(
  points: SignalPoint[],
  params: SignalParameters,
  maxChartPts = 1200,
): DemodResult {
  const n = points.length;
  const modulated = points.map(p => p.modulated);
  const original = points.map(p => p.message);

  // Step 1 — full-wave rectification
  const rectified = modulated.map(v => Math.abs(v));

  // Step 2 — low-pass filter (moving average window ≈ 1 carrier period)
  const carrierPeriodSamples = Math.max(5, Math.round(params.sampleRate / Math.max(params.carrierFrequency, 1)));
  const lpfWindow = Math.max(5, Math.round(carrierPeriodSamples * 0.8));
  const envelope = movingAvg(rectified, lpfWindow);

  // Step 3 — remove DC (carrier amplitude offset)
  const dcRemoved = envelope.map(v => v - params.carrierAmplitude);

  // Step 4 — normalize to message amplitude
  const peak = Math.max(1e-6, ...dcRemoved.map(v => Math.abs(v)));
  const recovered = dcRemoved.map(v => (v / peak) * params.messageAmplitude);

  const errors = recovered.map((v, i) => v - (original[i] ?? 0));
  const rmsVal = rmse(recovered, original);
  const corrVal = pearson(recovered, original);
  const snr = snrDb(original, errors);
  const maxErr = Math.max(...errors.map(v => Math.abs(v)));
  const meanErr = errors.reduce((s, v) => s + Math.abs(v), 0) / Math.max(errors.length, 1);

  const raw: DemodChartPoint[] = points.map((pt, i) => ({
    time: pt.time,
    modulated: pt.modulated,
    original: pt.message,
    recovered: recovered[i] ?? 0,
    intermediate1: rectified[i] ?? 0,   // rectified
    intermediate2: envelope[i] ?? 0,    // smoothed envelope
    error: errors[i] ?? 0,
  }));

  return {
    mode: "AM",
    chartPoints: downsample(raw, maxChartPts),
    metrics: { rmse: rmsVal, correlation: corrVal, snrDb: snr, maxError: maxErr, meanError: meanErr },
    steps: [
      {
        label: "Step 1 — Full-wave Rectification",
        description: "Take the absolute value of every sample. This folds the negative half of the carrier up, exposing the envelope on both sides.",
        formula: "|s(t)| = |Ac·[1 + μ·m(t)]·cos(2π·fc·t)|",
      },
      {
        label: "Step 2 — Low-Pass Filter (Envelope Detector)",
        description: `Apply a moving-average filter with window ≈ ${lpfWindow} samples (≈ 1 carrier period). This smooths out the carrier ripple and leaves only the slowly-varying envelope.`,
        formula: "env(t) = LPF{ |s(t)| }  ≈  Ac·[1 + μ·m(t)]",
      },
      {
        label: "Step 3 — DC Removal",
        description: `Subtract the carrier amplitude (${params.carrierAmplitude.toFixed(2)} V) to remove the DC offset introduced by the rectification step.`,
        formula: "env_dc(t) = env(t) − Ac  ≈  Ac·μ·m(t)",
      },
      {
        label: "Step 4 — Amplitude Normalization",
        description: `Scale the result so the peak matches the original message amplitude (${params.messageAmplitude.toFixed(2)} V). This recovers m(t).`,
        formula: "m̂(t) = env_dc(t) · (Am / peak)  ≈  m(t)",
      },
    ],
  };
}

// ── FM Frequency Discriminator ───────────────────────────────────────────────
// Steps:
//  1. Extract instantaneous frequency from the stored field (or phase diff)
//  2. Subtract carrier frequency → frequency deviation signal
//  3. Scale by Am / Δf to recover message amplitude
//  4. Low-pass filter to remove noise

export function demodulateFM(
  points: SignalPoint[],
  params: SignalParameters,
  maxChartPts = 1200,
): DemodResult {
  const original = points.map(p => p.message);
  const modulated = points.map(p => p.modulated);
  const dt = 1 / params.sampleRate;

  // Step 1 — instantaneous frequency
  // Use stored field if available; otherwise compute from phase difference
  const instFreq: number[] = points.map((pt, i) => {
    if (pt.instantaneousFrequency !== undefined) return pt.instantaneousFrequency;
    // Phase difference method: Δφ / (2π·dt)
    if (i === 0) return params.carrierFrequency;
    const prev = points[i - 1]?.modulated ?? 0;
    const curr = pt.modulated;
    // Approximate instantaneous frequency via zero-crossing rate in a small window
    return params.carrierFrequency + (curr - prev) / (2 * Math.PI * dt * Math.max(params.carrierAmplitude, 0.01));
  });

  // Step 2 — subtract carrier frequency
  const freqDeviation = instFreq.map(f => f - params.carrierFrequency);

  // Step 3 — scale to message amplitude
  const scaled = freqDeviation.map(fd => (fd / Math.max(params.frequencyDeviation, 1)) * params.messageAmplitude);

  // Step 4 — low-pass filter
  const lpfWindow = Math.max(3, Math.round(params.sampleRate / Math.max(params.messageFrequency * 4, 1)));
  const recovered = movingAvg(scaled, lpfWindow);

  const errors = recovered.map((v, i) => v - (original[i] ?? 0));
  const rmsVal = rmse(recovered, original);
  const corrVal = pearson(recovered, original);
  const snr = snrDb(original, errors);
  const maxErr = Math.max(...errors.map(v => Math.abs(v)));
  const meanErr = errors.reduce((s, v) => s + Math.abs(v), 0) / Math.max(errors.length, 1);

  const raw: DemodChartPoint[] = points.map((pt, i) => ({
    time: pt.time,
    modulated: pt.modulated,
    original: pt.message,
    recovered: recovered[i] ?? 0,
    intermediate1: instFreq[i] ?? params.carrierFrequency,  // instantaneous frequency
    intermediate2: freqDeviation[i] ?? 0,                   // frequency deviation
    error: errors[i] ?? 0,
  }));

  return {
    mode: "FM",
    chartPoints: downsample(raw, maxChartPts),
    metrics: { rmse: rmsVal, correlation: corrVal, snrDb: snr, maxError: maxErr, meanError: meanErr },
    steps: [
      {
        label: "Step 1 — Instantaneous Frequency Extraction",
        description: "Read the instantaneous frequency stored in each signal point. For FM, the carrier frequency varies as fc + Δf·m(t)/Am.",
        formula: "f_inst(t) = fc + Δf·cos(2π·fm·t)  =  fc + Δf·m(t)/Am",
      },
      {
        label: "Step 2 — Frequency Deviation",
        description: `Subtract the carrier frequency (${params.carrierFrequency.toFixed(0)} Hz) to isolate the deviation signal proportional to the message.`,
        formula: "Δf(t) = f_inst(t) − fc  =  Δf·m(t)/Am",
      },
      {
        label: "Step 3 — Amplitude Scaling",
        description: `Multiply by Am/Δf = ${params.messageAmplitude.toFixed(2)}/${params.frequencyDeviation.toFixed(0)} to recover the original message amplitude.`,
        formula: "m̂_raw(t) = Δf(t) · (Am / Δf)  ≈  m(t)",
      },
      {
        label: "Step 4 — Low-Pass Filter",
        description: `Apply a moving-average filter (window ≈ ${lpfWindow} samples) to remove high-frequency noise introduced by the frequency estimation step.`,
        formula: "m̂(t) = LPF{ m̂_raw(t) }  ≈  m(t)",
      },
    ],
  };
}

// ── PM Phase Detector ────────────────────────────────────────────────────────
// Steps:
//  1. Extract instantaneous phase deviation from stored field
//  2. Scale by Am / kp to recover message amplitude
//  3. Low-pass filter

export function demodulatePM(
  points: SignalPoint[],
  params: SignalParameters,
  maxChartPts = 1200,
): DemodResult {
  const original = points.map(p => p.message);
  const kp = params.frequencyDeviation / Math.max(params.messageAmplitude, 1e-6);

  // Step 1 — instantaneous phase deviation
  const instPhase: number[] = points.map((pt, i) => {
    if (pt.instantaneousPhase !== undefined) return pt.instantaneousPhase;
    // Fallback: estimate phase from signal amplitude ratio
    const amp = Math.abs(pt.modulated);
    const sign = i > 0 && (points[i - 1]?.modulated ?? 0) > pt.modulated ? -1 : 1;
    return sign * Math.asin(Math.min(1, amp / Math.max(params.carrierAmplitude, 0.01))) * 0.3;
  });

  // Step 2 — scale by Am / kp
  const scaled = instPhase.map(ph => ph / Math.max(kp, 1e-6));

  // Step 3 — low-pass filter
  const lpfWindow = Math.max(3, Math.round(params.sampleRate / Math.max(params.messageFrequency * 4, 1)));
  const recovered = movingAvg(scaled, lpfWindow);

  const errors = recovered.map((v, i) => v - (original[i] ?? 0));
  const rmsVal = rmse(recovered, original);
  const corrVal = pearson(recovered, original);
  const snr = snrDb(original, errors);
  const maxErr = Math.max(...errors.map(v => Math.abs(v)));
  const meanErr = errors.reduce((s, v) => s + Math.abs(v), 0) / Math.max(errors.length, 1);

  const raw: DemodChartPoint[] = points.map((pt, i) => ({
    time: pt.time,
    modulated: pt.modulated,
    original: pt.message,
    recovered: recovered[i] ?? 0,
    intermediate1: instPhase[i] ?? 0,  // instantaneous phase
    intermediate2: scaled[i] ?? 0,     // scaled phase
    error: errors[i] ?? 0,
  }));

  return {
    mode: "PM",
    chartPoints: downsample(raw, maxChartPts),
    metrics: { rmse: rmsVal, correlation: corrVal, snrDb: snr, maxError: maxErr, meanError: meanErr },
    steps: [
      {
        label: "Step 1 — Instantaneous Phase Extraction",
        description: "Read the instantaneous phase deviation stored in each signal point. For PM, the phase varies as kp·m(t).",
        formula: "φ_inst(t) = kp·m(t)  where kp = Δf / Am",
      },
      {
        label: "Step 2 — Phase-to-Amplitude Scaling",
        description: `Divide by kp = ${kp.toFixed(2)} rad/V to convert the phase deviation back to the original message voltage.`,
        formula: "m̂_raw(t) = φ_inst(t) / kp  ≈  m(t)",
      },
      {
        label: "Step 3 — Low-Pass Filter",
        description: `Apply a moving-average filter (window ≈ ${lpfWindow} samples) to smooth out noise in the phase estimate.`,
        formula: "m̂(t) = LPF{ m̂_raw(t) }  ≈  m(t)",
      },
    ],
  };
}

// ── All-three comparison ─────────────────────────────────────────────────────

export function buildCompareData(
  points: SignalPoint[],
  params: SignalParameters,
  maxChartPts = 1200,
): CompareChartPoint[] {
  const amResult = demodulateAM(points, params, maxChartPts * 3);
  const fmResult = demodulateFM(points, params, maxChartPts * 3);
  const pmResult = demodulatePM(points, params, maxChartPts * 3);

  // All three have the same time axis (same source points), just downsample together
  const stride = Math.max(1, Math.ceil(points.length / maxChartPts));
  return points
    .filter((_, i) => i % stride === 0 || i === points.length - 1)
    .map((pt, idx) => {
      const si = idx * stride;
      return {
        time: pt.time,
        original: pt.message,
        amRecovered: amResult.chartPoints[Math.min(idx, amResult.chartPoints.length - 1)]?.recovered ?? 0,
        fmRecovered: fmResult.chartPoints[Math.min(idx, fmResult.chartPoints.length - 1)]?.recovered ?? 0,
        pmRecovered: pmResult.chartPoints[Math.min(idx, pmResult.chartPoints.length - 1)]?.recovered ?? 0,
      };
    });
}
