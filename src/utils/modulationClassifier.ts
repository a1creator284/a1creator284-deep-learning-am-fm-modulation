import {
  createRandomSignalParameters,
  generateSignal,
  sampleSignal,
  type SignalMode,
  type SignalParameters,
} from "./signalProcessor";

// ── Types ──────────────────────────────────────────────────────────────────

export type MiniModel = {
  inputSize: number;
  h1Size: number;
  h2Size: number;
  outputSize: number;
  // Layer 1
  w1: number[][];
  b1: number[];
  // Layer 2
  w2: number[][];
  b2: number[];
  // Output layer
  w3: number[][];
  b3: number[];
};

export type TrainingSample = {
  features: number[];
  label: 0 | 1 | 2;
};

export type EpochStats = {
  epoch: number;
  loss: number;
  accuracy: number;
};

// ── Weight initialisation (He init for ReLU layers) ───────────────────────

const heWeight = (fanIn: number) => {
  // Box-Muller Gaussian * sqrt(2/fanIn)
  let u1 = Math.random();
  let u2 = Math.random();
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return gaussian * Math.sqrt(2 / fanIn);
};

const createMatrix = (rows: number, cols: number) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => heWeight(cols)),
  );

const createVector = (length: number) => Array.from({ length }, () => 0);

// ── Math helpers ──────────────────────────────────────────────────────────

const dot = (W: number[][], x: number[]) =>
  W.map((row) => row.reduce((s, w, i) => s + w * x[i], 0));

const addBias = (z: number[], b: number[]) => z.map((v, i) => v + b[i]);

/** Leaky ReLU — avoids dying neurons, better than plain ReLU for small nets */
const LEAKY = 0.01;
const lrelu = (z: number[]) => z.map((v) => (v > 0 ? v : LEAKY * v));
const lreluGrad = (z: number[]) => z.map((v) => (v > 0 ? 1 : LEAKY));

const softmax = (z: number[]) => {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
};

const argMax = (v: number[]) =>
  v.reduce((best, val, i, arr) => (val > arr[best] ? i : best), 0);

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── Engineered features ───────────────────────────────────────────────────
/**
 * Extracts 8 hand-crafted discriminative features from a raw waveform.
 * These are mathematically meaningful for AM/FM/PM separation:
 *
 *  AM signature: amplitude envelope varies, instantaneous frequency is constant
 *  FM signature: amplitude envelope is constant, instantaneous frequency varies
 *  PM signature: amplitude constant, phase varies proportionally to message
 *
 * Features:
 *  0 — envelope variance (high for AM, low for FM/PM)
 *  1 — normalised envelope range (max-min of |x|)
 *  2 — zero-crossing rate (high for FM with large beta)
 *  3 — mean absolute value
 *  4 — RMS power
 *  5 — peak-to-RMS ratio (crest factor)
 *  6 — spectral centroid proxy (weighted mean of |diff|)
 *  7 — instantaneous frequency variance proxy (variance of consecutive diffs)
 */
function extractEngineeredFeatures(samples: number[]): number[] {
  const n = samples.length;
  if (n === 0) return Array(8).fill(0);

  // Envelope via absolute value
  const env = samples.map(Math.abs);
  const envMean = env.reduce((s, v) => s + v, 0) / n;
  const envVar = env.reduce((s, v) => s + (v - envMean) ** 2, 0) / n;
  const envMax = Math.max(...env);
  const envMin = Math.min(...env);
  const envRange = envMax - envMin;

  // Zero-crossing rate
  let zcr = 0;
  for (let i = 1; i < n; i++) {
    if (samples[i - 1] * samples[i] < 0) zcr++;
  }
  const zcrNorm = zcr / n;

  // Mean absolute value
  const mav = envMean;

  // RMS
  const rms = Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / n);

  // Crest factor (peak / RMS)
  const crest = rms > 0 ? envMax / rms : 0;

  // Spectral centroid proxy — weighted mean of |first differences|
  const diffs = [];
  for (let i = 1; i < n; i++) diffs.push(Math.abs(samples[i] - samples[i - 1]));
  const diffMean = diffs.reduce((s, v) => s + v, 0) / diffs.length;
  const spectralProxy = diffMean;

  // Instantaneous frequency variance proxy — variance of consecutive diffs
  const diffVar = diffs.reduce((s, v) => s + (v - diffMean) ** 2, 0) / diffs.length;

  // Normalise each feature to roughly [0,1] range
  return [
    Math.min(envVar, 2) / 2,          // 0 — envelope variance
    Math.min(envRange, 4) / 4,        // 1 — envelope range
    zcrNorm,                           // 2 — ZCR (already 0-1)
    Math.min(mav, 2) / 2,             // 3 — mean abs
    Math.min(rms, 2) / 2,             // 4 — RMS
    Math.min(crest, 4) / 4,           // 5 — crest factor
    Math.min(spectralProxy, 0.5) / 0.5, // 6 — spectral proxy
    Math.min(diffVar, 0.1) / 0.1,     // 7 — IF variance proxy
  ];
}

/**
 * Concatenates the raw downsampled waveform with the 8 engineered features.
 * This gives the model both raw pattern recognition AND physics-based cues.
 */
export function buildFeatureVector(samples: number[]): number[] {
  const engineered = extractEngineeredFeatures(samples);
  return [...samples, ...engineered];
}

// ── Model factory ─────────────────────────────────────────────────────────

/**
 * Two-hidden-layer network:
 *   Input(inputSize+8) → H1(h1Size) → H2(h2Size) → Output(3)
 *
 * Default: 264 inputs (256 raw + 8 features) → 64 → 32 → 3
 */
export function createMiniModel(inputSize = 256, hiddenSize = 64): MiniModel {
  const totalInput = inputSize + 8; // raw + engineered features
  const h1 = hiddenSize;
  const h2 = Math.max(16, Math.floor(hiddenSize / 2));
  return {
    inputSize: totalInput,
    h1Size: h1,
    h2Size: h2,
    outputSize: 3,
    w1: createMatrix(h1, totalInput),
    b1: createVector(h1),
    w2: createMatrix(h2, h1),
    b2: createVector(h2),
    w3: createMatrix(3, h2),
    b3: createVector(3),
  };
}

// ── Dataset builder ───────────────────────────────────────────────────────

export function buildSyntheticDataset(
  baseParams: SignalParameters,
  samplesPerClass: number,
  sampleLength: number,
): TrainingSample[] {
  const dataset: TrainingSample[] = [];

  (["AM", "FM", "PM"] as SignalMode[]).forEach((signalMode, classIndex) => {
    for (let i = 0; i < samplesPerClass; i++) {
      // Mix: 70% randomised params, 30% zero-noise clean samples for sharp boundaries
      const useClean = i < Math.floor(samplesPerClass * 0.3);
      const p = useClean
        ? { ...createRandomSignalParameters(signalMode, baseParams), noiseLevel: 0 }
        : createRandomSignalParameters(signalMode, baseParams);

      const rawSamples = sampleSignal(signalMode, p, sampleLength);
      const features = buildFeatureVector(rawSamples);

      dataset.push({ features, label: classIndex as 0 | 1 | 2 });
    }
  });

  return shuffle(dataset);
}

// ── Forward pass ──────────────────────────────────────────────────────────

function forward(model: MiniModel, x: number[]) {
  const z1 = addBias(dot(model.w1, x), model.b1);
  const a1 = lrelu(z1);
  const z2 = addBias(dot(model.w2, a1), model.b2);
  const a2 = lrelu(z2);
  const z3 = addBias(dot(model.w3, a2), model.b3);
  const probs = softmax(z3);
  return { z1, a1, z2, a2, z3, probs };
}

// ── Predict ───────────────────────────────────────────────────────────────

export function predictMiniModel(model: MiniModel, rawSamples: number[]) {
  const x = buildFeatureVector(rawSamples);
  const { probs } = forward(model, x);
  return { probabilities: probs, predictedIndex: argMax(probs) };
}

// ── Train ─────────────────────────────────────────────────────────────────

export async function trainMiniModel(
  model: MiniModel,
  dataset: TrainingSample[],
  epochs: number,
  learningRate: number,
  onEpochEnd?: (stats: EpochStats) => void,
) {
  const n = dataset.length;

  for (let epoch = 0; epoch < epochs; epoch++) {
    // Learning rate decay: halve every 5 epochs
    const lr = learningRate * Math.pow(0.7, Math.floor(epoch / 5));

    const shuffled = shuffle(dataset);
    let totalLoss = 0;
    let correct = 0;

    for (const sample of shuffled) {
      const { z1, a1, z2, a2, probs } = forward(model, sample.features);
      const pred = argMax(probs);
      if (pred === sample.label) correct++;

      totalLoss += -Math.log(Math.max(probs[sample.label], 1e-9));

      // ── Backprop output layer ──
      const dz3 = probs.slice();
      dz3[sample.label] -= 1;

      const dw3 = model.w3.map((_, o) => a2.map((a) => dz3[o] * a));
      const db3 = dz3;

      // ── Backprop H2 ──
      const da2 = model.w3[0].map((_, h) =>
        model.w3.reduce((s, row, o) => s + row[h] * dz3[o], 0),
      );
      const dz2 = da2.map((v, i) => v * lreluGrad(z2)[i]);

      const dw2 = model.w2.map((_, h) => a1.map((a) => dz2[h] * a));
      const db2 = dz2;

      // ── Backprop H1 ──
      const da1 = model.w2[0].map((_, h) =>
        model.w2.reduce((s, row, h2) => s + row[h] * dz2[h2], 0),
      );
      const dz1 = da1.map((v, i) => v * lreluGrad(z1)[i]);

      const dw1 = model.w1.map((_, h) => sample.features.map((f) => dz1[h] * f));
      const db1 = dz1;

      // ── Update weights ──
      model.w3 = model.w3.map((row, o) => row.map((w, h) => w - lr * dw3[o][h]));
      model.b3 = model.b3.map((b, o) => b - lr * db3[o]);
      model.w2 = model.w2.map((row, h) => row.map((w, i) => w - lr * dw2[h][i]));
      model.b2 = model.b2.map((b, h) => b - lr * db2[h]);
      model.w1 = model.w1.map((row, h) => row.map((w, i) => w - lr * dw1[h][i]));
      model.b1 = model.b1.map((b, h) => b - lr * db1[h]);
    }

    onEpochEnd?.({ epoch: epoch + 1, loss: totalLoss / n, accuracy: correct / n });
    // Yield to browser between epochs
    await new Promise((r) => window.setTimeout(r, 0));
  }
}
