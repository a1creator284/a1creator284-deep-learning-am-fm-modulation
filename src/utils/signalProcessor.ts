export type SignalMode = "AM" | "FM" | "BPSK" | "QPSK" | "QAM";

export type NoiseType = "AWGN" | "Rayleigh" | "Impulse";

export interface SignalPoint {
  time: number;
  message: number;
  carrier: number;
  modulated: number;
  instantaneousFrequency?: number;
  /** I-component for digital modes */
  iComponent?: number;
  /** Q-component for digital modes */
  qComponent?: number;
  /** Symbol index for digital modes */
  symbolIndex?: number;
}

export interface SignalParameters {
  messageAmplitude: number;
  messageFrequency: number;
  carrierAmplitude: number;
  carrierFrequency: number;
  frequencyDeviation: number;
  phase: number;
  duration: number;
  sampleRate: number;
  noiseLevel: number;
  noiseType: NoiseType;
}

export const DEFAULT_SIGNAL_PARAMETERS: SignalParameters = {
  messageAmplitude: 1,
  messageFrequency: 10_000,
  carrierAmplitude: 2,
  carrierFrequency: 100_000,
  frequencyDeviation: 8_000,
  phase: 0,
  duration: 0.0012,
  sampleRate: 1_000_000,
  noiseLevel: 0,
  noiseType: "AWGN",
};

const TWO_PI = 2 * Math.PI;

/* ── Noise generators ─────────────────────────────────────────────── */

/**
 * Box-Muller transform — returns a single standard-normal sample.
 * Two uniform samples → one Gaussian sample.
 */
const boxMullerGaussian = (): number => {
  let u1 = Math.random();
  let u2 = Math.random();
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(TWO_PI * u2);
};

/** Rayleigh-distributed sample with parameter sigma. */
const rayleighSample = (sigma: number): number => {
  let u = Math.random();
  while (u === 0) u = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u));
};

const addTypedNoise = (value: number, noiseLevel: number, noiseType: NoiseType): number => {
  if (noiseLevel <= 0) return value;

  switch (noiseType) {
    case "AWGN":
      return value + boxMullerGaussian() * noiseLevel;
    case "Rayleigh": {
      // Rayleigh fading: multiply the signal by a Rayleigh-distributed fade factor,
      // then add small Gaussian noise for realism
      const fade = rayleighSample(1);
      return value * fade + boxMullerGaussian() * noiseLevel * 0.3;
    }
    case "Impulse": {
      // 5% chance of a large spike, otherwise clean
      if (Math.random() < 0.05) {
        const spike = (Math.random() > 0.5 ? 1 : -1) * noiseLevel * 8;
        return value + spike;
      }
      return value;
    }
    default:
      return value + boxMullerGaussian() * noiseLevel;
  }
};

/* ── Seeded PRNG for reproducible bit generation ──────────────────── */

const createSeededRng = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
};

/* ── Helpers ───────────────────────────────────────────────────────── */

const normalizeValues = (values: number[]) => {
  const maxMagnitude = Math.max(1, ...values.map((value) => Math.abs(value)));
  return values.map((value) => value / maxMagnitude);
};

export const sampleSignalPoints = (points: SignalPoint[], sampleCount = 128) => {
  if (points.length === 0) {
    return Array.from({ length: sampleCount }, () => 0);
  }

  if (points.length === 1) {
    return Array.from({ length: sampleCount }, () => points[0].modulated);
  }

  const sampled = Array.from({ length: sampleCount }, (_, index) => {
    const position = (index / Math.max(sampleCount - 1, 1)) * (points.length - 1);
    const leftIndex = Math.floor(position);
    const rightIndex = Math.min(points.length - 1, Math.ceil(position));
    const blend = position - leftIndex;
    const leftValue = points[leftIndex]?.modulated ?? 0;
    const rightValue = points[rightIndex]?.modulated ?? leftValue;
    return leftValue + (rightValue - leftValue) * blend;
  });

  return normalizeValues(sampled);
};

/* ── AM / FM generators (original, upgraded noise) ────────────────── */

export const generateAMSignal = (params: SignalParameters): SignalPoint[] => {
  const points: SignalPoint[] = [];
  const dt = 1 / params.sampleRate;
  const modulationIndex = params.messageAmplitude / Math.max(params.carrierAmplitude, 0.0001);

  for (let t = 0; t <= params.duration; t += dt) {
    const message = params.messageAmplitude * Math.cos(TWO_PI * params.messageFrequency * t + params.phase);
    const carrier = params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t);
    const envelope = 1 + modulationIndex * Math.cos(TWO_PI * params.messageFrequency * t + params.phase);
    const modulated = addTypedNoise(
      params.carrierAmplitude * envelope * Math.cos(TWO_PI * params.carrierFrequency * t),
      params.noiseLevel,
      params.noiseType,
    );

    points.push({
      time: Number(t.toFixed(8)),
      message,
      carrier,
      modulated,
    });
  }

  return points;
};

export const generateFMSignal = (params: SignalParameters): SignalPoint[] => {
  const points: SignalPoint[] = [];
  const dt = 1 / params.sampleRate;
  const beta = params.frequencyDeviation / Math.max(params.messageFrequency, 0.0001);

  for (let t = 0; t <= params.duration; t += dt) {
    const message = params.messageAmplitude * Math.cos(TWO_PI * params.messageFrequency * t + params.phase);
    const carrier = params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t);
    const frequencySwing = params.frequencyDeviation * Math.sin(TWO_PI * params.messageFrequency * t + params.phase);
    const phaseTerm = beta * Math.sin(TWO_PI * params.messageFrequency * t + params.phase);
    const modulated = addTypedNoise(
      params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t + phaseTerm),
      params.noiseLevel,
      params.noiseType,
    );

    points.push({
      time: Number(t.toFixed(8)),
      message,
      carrier,
      modulated,
      instantaneousFrequency: params.carrierFrequency + frequencySwing,
    });
  }

  return points;
};

/* ── BPSK generator ───────────────────────────────────────────────── */

export const generateBPSKSignal = (params: SignalParameters): SignalPoint[] => {
  const points: SignalPoint[] = [];
  const dt = 1 / params.sampleRate;
  const totalSamples = Math.ceil(params.duration / dt);
  const symbolRate = params.messageFrequency > 0 ? params.messageFrequency : 5_000;
  const samplesPerSymbol = Math.max(4, Math.round(params.sampleRate / symbolRate));
  const rng = createSeededRng(42);

  // Generate enough bits
  const numSymbols = Math.ceil(totalSamples / samplesPerSymbol) + 1;
  const bits = Array.from({ length: numSymbols }, () => (rng() > 0.5 ? 1 : 0));

  let sampleIdx = 0;
  for (let t = 0; t <= params.duration; t += dt) {
    const symbolIdx = Math.floor(sampleIdx / samplesPerSymbol);
    const bit = bits[symbolIdx] ?? 0;
    const phase = bit === 1 ? 0 : Math.PI; // BPSK: 0 → 0°, 1 → 180°
    const message = bit === 1 ? params.messageAmplitude : -params.messageAmplitude;
    const carrier = params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t);
    const modulated = addTypedNoise(
      params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t + phase + params.phase),
      params.noiseLevel,
      params.noiseType,
    );

    points.push({
      time: Number(t.toFixed(8)),
      message,
      carrier,
      modulated,
      iComponent: Math.cos(phase),
      qComponent: Math.sin(phase),
      symbolIndex: symbolIdx,
    });
    sampleIdx++;
  }

  return points;
};

/* ── QPSK generator ───────────────────────────────────────────────── */

export const generateQPSKSignal = (params: SignalParameters): SignalPoint[] => {
  const points: SignalPoint[] = [];
  const dt = 1 / params.sampleRate;
  const totalSamples = Math.ceil(params.duration / dt);
  const symbolRate = params.messageFrequency > 0 ? params.messageFrequency / 2 : 2_500;
  const samplesPerSymbol = Math.max(4, Math.round(params.sampleRate / symbolRate));
  const rng = createSeededRng(73);

  const numSymbols = Math.ceil(totalSamples / samplesPerSymbol) + 1;
  // QPSK: 4 phase states = π/4, 3π/4, 5π/4, 7π/4
  const phaseMap = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  const symbols = Array.from({ length: numSymbols }, () => Math.floor(rng() * 4));

  let sampleIdx = 0;
  for (let t = 0; t <= params.duration; t += dt) {
    const symbolIdx = Math.floor(sampleIdx / samplesPerSymbol);
    const sym = symbols[symbolIdx] ?? 0;
    const symPhase = phaseMap[sym];
    const iVal = Math.cos(symPhase);
    const qVal = Math.sin(symPhase);
    const message = iVal * params.messageAmplitude;
    const carrier = params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t);
    const modulated = addTypedNoise(
      params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t + symPhase + params.phase),
      params.noiseLevel,
      params.noiseType,
    );

    points.push({
      time: Number(t.toFixed(8)),
      message,
      carrier,
      modulated,
      iComponent: iVal,
      qComponent: qVal,
      symbolIndex: symbolIdx,
    });
    sampleIdx++;
  }

  return points;
};

/* ── 4-QAM generator ─────────────────────────────────────────────── */

export const generateQAMSignal = (params: SignalParameters): SignalPoint[] => {
  const points: SignalPoint[] = [];
  const dt = 1 / params.sampleRate;
  const totalSamples = Math.ceil(params.duration / dt);
  const symbolRate = params.messageFrequency > 0 ? params.messageFrequency / 2 : 2_500;
  const samplesPerSymbol = Math.max(4, Math.round(params.sampleRate / symbolRate));
  const rng = createSeededRng(101);

  const numSymbols = Math.ceil(totalSamples / samplesPerSymbol) + 1;
  // 4-QAM constellation: (±1, ±1) / sqrt(2)
  const qamMap: [number, number][] = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  const symbols = Array.from({ length: numSymbols }, () => Math.floor(rng() * 4));

  let sampleIdx = 0;
  for (let t = 0; t <= params.duration; t += dt) {
    const symbolIdx = Math.floor(sampleIdx / samplesPerSymbol);
    const sym = symbols[symbolIdx] ?? 0;
    const [iVal, qVal] = qamMap[sym];
    const normFactor = 1 / Math.SQRT2;
    const iNorm = iVal * normFactor;
    const qNorm = qVal * normFactor;
    const message = iNorm * params.messageAmplitude;
    const carrier = params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t);

    // QAM: I * cos(wt) - Q * sin(wt)
    const modulated = addTypedNoise(
      params.carrierAmplitude *
        (iNorm * Math.cos(TWO_PI * params.carrierFrequency * t + params.phase) -
          qNorm * Math.sin(TWO_PI * params.carrierFrequency * t + params.phase)),
      params.noiseLevel,
      params.noiseType,
    );

    points.push({
      time: Number(t.toFixed(8)),
      message,
      carrier,
      modulated,
      iComponent: iNorm,
      qComponent: qNorm,
      symbolIndex: symbolIdx,
    });
    sampleIdx++;
  }

  return points;
};

/* ── Unified signal dispatcher ────────────────────────────────────── */

export const generateSignal = (mode: SignalMode, params: SignalParameters) => {
  switch (mode) {
    case "AM":
      return generateAMSignal(params);
    case "FM":
      return generateFMSignal(params);
    case "BPSK":
      return generateBPSKSignal(params);
    case "QPSK":
      return generateQPSKSignal(params);
    case "QAM":
      return generateQAMSignal(params);
    default:
      return generateAMSignal(params);
  }
};

export const sampleSignal = (mode: SignalMode, params: SignalParameters, sampleCount = 128) => {
  const signal = generateSignal(mode, params);
  return sampleSignalPoints(signal, sampleCount);
};

export const createRandomSignalParameters = (mode: SignalMode, base?: Partial<SignalParameters>) => {
  const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
  const frequencyDeviationRange = mode === "FM" ? [3_000, 18_000] : [1_500, 10_000];

  return {
    messageAmplitude: Number(randomBetween(base?.messageAmplitude ? base.messageAmplitude * 0.75 : 0.4, base?.messageAmplitude ? base.messageAmplitude * 1.35 : 2.5).toFixed(2)),
    messageFrequency: Number(randomBetween(base?.messageFrequency ? base.messageFrequency * 0.6 : 2_000, base?.messageFrequency ? base.messageFrequency * 1.4 : 20_000).toFixed(0)),
    carrierAmplitude: Number(randomBetween(base?.carrierAmplitude ? base.carrierAmplitude * 0.75 : 1.2, base?.carrierAmplitude ? base.carrierAmplitude * 1.35 : 4).toFixed(2)),
    carrierFrequency: Number(randomBetween(base?.carrierFrequency ? base.carrierFrequency * 0.8 : 40_000, base?.carrierFrequency ? base.carrierFrequency * 1.3 : 180_000).toFixed(0)),
    frequencyDeviation: Number(
      randomBetween(
        base?.frequencyDeviation ? base.frequencyDeviation * 0.7 : frequencyDeviationRange[0],
        base?.frequencyDeviation ? base.frequencyDeviation * 1.5 : frequencyDeviationRange[1],
      ).toFixed(0),
    ),
    phase: randomBetween(0, TWO_PI),
    duration: 0.0012,
    sampleRate: 1_000_000,
    noiseLevel: Number(randomBetween(0, 0.12).toFixed(3)),
    noiseType: (base?.noiseType ?? "AWGN") as NoiseType,
  } satisfies SignalParameters;
};
