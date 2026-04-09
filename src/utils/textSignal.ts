import type { SignalMode, SignalParameters, SignalPoint } from "./signalProcessor";

export interface TextSignalBuildOptions {
  bitRate?: number;
  audioSampleRate?: number;
  maxGraphBits?: number;
}

export interface TextSignalPayload {
  bits: number[];
  bitString: string;
  graphBits: number[];
  graphPoints: SignalPoint[];
  graphWasTrimmed: boolean;
  totalDuration: number;
  graphDuration: number;
  bitRate: number;
  audioSampleRate: number;
  audioCarrierFrequency: number;
  messageAudio: Float32Array;
  modulatedAudio: Float32Array;
}

const TWO_PI = 2 * Math.PI;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const addNoise = (value: number, noiseLevel: number) => {
  if (noiseLevel <= 0) {
    return value;
  }

  return value + (Math.random() * 2 - 1) * noiseLevel;
};

const normalizeBitLevel = (bit: number) => (bit === 1 ? 1 : -1);

function smoothToward(current: number, target: number, factor: number) {
  return current + (target - current) * factor;
}

function toSafeText(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : "HELLO AM";
}

export function textToBits(message: string) {
  const safeText = toSafeText(message);
  const bytes = Array.from(new TextEncoder().encode(safeText));

  return bytes.flatMap((byte) =>
    Array.from({ length: 8 }, (_, index) => (byte >> (7 - index)) & 1),
  );
}

export function buildTextSignal(
  mode: SignalMode,
  params: SignalParameters,
  message: string,
  options: TextSignalBuildOptions = {},
): TextSignalPayload {
  const bitRate = clamp(options.bitRate ?? 8, 2, 24);
  const audioSampleRate = options.audioSampleRate ?? 22_050;
  const maxGraphBits = options.maxGraphBits ?? 64;
  const bits = textToBits(message);
  const graphBits = bits.slice(0, maxGraphBits);
  const graphWasTrimmed = bits.length > graphBits.length;
  const bitDuration = 1 / bitRate;
  const graphDuration = Math.max(graphBits.length * bitDuration, bitDuration);
  const totalDuration = Math.max(bits.length * bitDuration, bitDuration);
  const graphSampleRate = clamp(Math.round(params.sampleRate), 500, 4_000);
  const modulationIndex = params.messageAmplitude / Math.max(params.carrierAmplitude, 0.0001);
  const graphPoints: SignalPoint[] = [];
  let fmGraphPhase = 0;

  for (let sampleIndex = 0; sampleIndex <= graphDuration * graphSampleRate; sampleIndex += 1) {
    const t = sampleIndex / graphSampleRate;
    const bitIndex = Math.min(graphBits.length - 1, Math.floor(t / bitDuration));
    const bitLevel = normalizeBitLevel(graphBits[Math.max(0, bitIndex)] ?? 0);
    const messageLevel = params.messageAmplitude * bitLevel;
    const carrier = params.carrierAmplitude * Math.cos(TWO_PI * params.carrierFrequency * t + params.phase);

    if (mode === "AM") {
      const envelope = 1 + modulationIndex * bitLevel;
      const modulated = addNoise(
        params.carrierAmplitude * envelope * Math.cos(TWO_PI * params.carrierFrequency * t + params.phase),
        params.noiseLevel,
      );

      graphPoints.push({
        time: Number(t.toFixed(4)),
        message: messageLevel,
        carrier,
        modulated,
      });
      continue;
    }

    const instantaneousFrequency = params.carrierFrequency + params.frequencyDeviation * bitLevel;
    fmGraphPhase += TWO_PI * instantaneousFrequency * (1 / graphSampleRate);
    const modulated = addNoise(params.carrierAmplitude * Math.cos(fmGraphPhase + params.phase), params.noiseLevel);

    graphPoints.push({
      time: Number(t.toFixed(4)),
      message: messageLevel,
      carrier,
      modulated,
      instantaneousFrequency,
    });
  }

  const messageToneZero = clamp(params.messageFrequency * 18, 180, 420);
  const messageToneOne = clamp(messageToneZero * 1.7, 320, 820);
  const audioCarrierFrequency = clamp(params.carrierFrequency * 10, 700, 2_400);
  const audioFrequencyDeviation = clamp(params.frequencyDeviation * 10, 120, 900);
  const totalSamples = Math.max(1, Math.round(totalDuration * audioSampleRate));
  const messageAudio = new Float32Array(totalSamples);
  const modulatedAudio = new Float32Array(totalSamples);
  let fmAudioPhase = 0;
  let smoothedBitLevel = normalizeBitLevel(bits[0] ?? 0);

  for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
    const t = sampleIndex / audioSampleRate;
    const bitIndex = Math.min(bits.length - 1, Math.floor(t / bitDuration));
    const bit = bits[Math.max(0, bitIndex)] ?? 0;
    const bitLevel = normalizeBitLevel(bit);
    smoothedBitLevel = smoothToward(smoothedBitLevel, bitLevel, 0.08);

    const timeInsideBit = t % bitDuration;
    const edgeTime = Math.min(0.01, bitDuration * 0.14);
    const attack = timeInsideBit < edgeTime ? timeInsideBit / edgeTime : 1;
    const release = bitDuration - timeInsideBit < edgeTime ? (bitDuration - timeInsideBit) / edgeTime : 1;
    const edgeEnvelope = clamp(Math.min(attack, release), 0.18, 1);

    const messageTone = bit === 1 ? messageToneOne : messageToneZero;
    messageAudio[sampleIndex] = 0.5 * edgeEnvelope * Math.sin(TWO_PI * messageTone * t);

    if (mode === "AM") {
      const envelope = 0.8 + 0.35 * smoothedBitLevel;
      modulatedAudio[sampleIndex] = Math.tanh(0.78 * envelope * Math.sin(TWO_PI * audioCarrierFrequency * t));
      continue;
    }

    fmAudioPhase += TWO_PI * (audioCarrierFrequency + audioFrequencyDeviation * smoothedBitLevel) / audioSampleRate;
    modulatedAudio[sampleIndex] = Math.tanh(0.82 * Math.sin(fmAudioPhase));
  }

  return {
    bits,
    bitString: bits.join(""),
    graphBits,
    graphPoints,
    graphWasTrimmed,
    totalDuration,
    graphDuration,
    bitRate,
    audioSampleRate,
    audioCarrierFrequency,
    messageAudio,
    modulatedAudio,
  };
}
