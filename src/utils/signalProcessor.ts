export type SignalMode = "AM" | "FM";

export interface SignalPoint {
  time: number;
  message: number;
  carrier: number;
  modulated: number;
  instantaneousFrequency?: number;
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
};

const TWO_PI = 2 * Math.PI;

const addNoise = (value: number, noiseLevel: number) => {
  if (noiseLevel <= 0) {
    return value;
  }

  return value + (Math.random() * 2 - 1) * noiseLevel;
};

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

export const generateAMSignal = (params: SignalParameters): SignalPoint[] => {
  const points: SignalPoint[] = [];
  const dt = 1 / params.sampleRate;
  const modulationIndex = params.messageAmplitude / Math.max(params.carrierAmplitude, 0.0001);

  for (let t = 0; t <= params.duration; t += dt) {
    const message = params.messageAmplitude * Math.cos(TWO_PI * params.messageFrequency * t + params.phase);
    const carrier = params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t);
    const envelope = 1 + modulationIndex * Math.cos(TWO_PI * params.messageFrequency * t + params.phase);
    const modulated = addNoise(
      params.carrierAmplitude * envelope * Math.cos(TWO_PI * params.carrierFrequency * t),
      params.noiseLevel,
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
    const modulated = addNoise(
      params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t + phaseTerm),
      params.noiseLevel,
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

export const generateSignal = (mode: SignalMode, params: SignalParameters) => {
  return mode === "AM" ? generateAMSignal(params) : generateFMSignal(params);
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
  } satisfies SignalParameters;
};
