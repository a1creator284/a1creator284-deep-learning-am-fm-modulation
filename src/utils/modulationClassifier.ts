import {
  createRandomSignalParameters,
  sampleSignal,
  type SignalMode,
  type SignalParameters,
} from "./signalProcessor";

export type MiniModel = {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;
  w1: number[][];
  b1: number[];
  w2: number[][];
  b2: number[];
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

const randomWeight = () => (Math.random() * 2 - 1) * 0.08;

const createMatrix = (rows: number, cols: number) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => randomWeight()));

const createVector = (length: number) => Array.from({ length }, () => 0);

const dot = (weights: number[][], inputs: number[]) =>
  weights.map((row) => row.reduce((sum, weight, index) => sum + weight * inputs[index], 0));

const relu = (values: number[]) => values.map((value) => Math.max(0, value));

const reluDerivative = (values: number[]) => values.map((value) => (value > 0 ? 1 : 0));

const softmax = (values: number[]) => {
  const maxValue = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - maxValue));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
};

const shuffle = <T,>(items: T[]) => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
};

const argMax = (values: number[]) => values.reduce((bestIndex, value, index, array) => (value > array[bestIndex] ? index : bestIndex), 0);

export function createMiniModel(inputSize = 128, hiddenSize = 24): MiniModel {
  return {
    inputSize,
    hiddenSize,
    outputSize: 3,
    w1: createMatrix(hiddenSize, inputSize),
    b1: createVector(hiddenSize),
    w2: createMatrix(3, hiddenSize),
    b2: createVector(3),
  };
}

export function buildSyntheticDataset(
  baseParams: SignalParameters,
  samplesPerClass: number,
  sampleLength: number,
): TrainingSample[] {
  const dataset: TrainingSample[] = [];

  (['AM', 'FM', 'PM'] as SignalMode[]).forEach((signalMode, classIndex) => {
    for (let index = 0; index < samplesPerClass; index += 1) {
      const randomizedParams = createRandomSignalParameters(signalMode, baseParams);
      const features = sampleSignal(signalMode, randomizedParams, sampleLength);
      dataset.push({
        features,
        label: classIndex as 0 | 1 | 2,
      });
    }
  });

  return shuffle(dataset);
}

function forward(model: MiniModel, inputs: number[]) {
  const z1 = dot(model.w1, inputs).map((value, index) => value + model.b1[index]);
  const a1 = relu(z1);
  const z2 = dot(model.w2, a1).map((value, index) => value + model.b2[index]);
  const probabilities = softmax(z2);

  return {
    z1,
    a1,
    z2,
    probabilities,
  };
}

export function predictMiniModel(model: MiniModel, inputs: number[]) {
  const output = forward(model, inputs);
  const predictedIndex = argMax(output.probabilities);

  return {
    probabilities: output.probabilities,
    predictedIndex,
  };
}

export async function trainMiniModel(
  model: MiniModel,
  dataset: TrainingSample[],
  epochs: number,
  learningRate: number,
  onEpochEnd?: (stats: EpochStats) => void,
) {
  const totalSamples = dataset.length;

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const shuffledDataset = shuffle(dataset);
    let totalLoss = 0;
    let correct = 0;

    for (const sample of shuffledDataset) {
      const { z1, a1, probabilities } = forward(model, sample.features);
      const predictedIndex = argMax(probabilities);

      if (predictedIndex === sample.label) {
        correct += 1;
      }

      const clippedProbability = Math.max(probabilities[sample.label], 1e-8);
      totalLoss += -Math.log(clippedProbability);

      const dz2 = probabilities.slice();
      dz2[sample.label] -= 1;

      const dw2 = model.w2.map((row, outputIndex) =>
        row.map((_, hiddenIndex) => dz2[outputIndex] * a1[hiddenIndex]),
      );
      const db2 = dz2;

      const da1 = model.w2[0].map((_, hiddenIndex) =>
        model.w2.reduce((sum, outputRow, outputIndex) => sum + outputRow[hiddenIndex] * dz2[outputIndex], 0),
      );
      const dz1 = da1.map((value, index) => value * reluDerivative(z1)[index]);

      const dw1 = model.w1.map((row, hiddenIndex) =>
        row.map((_, inputIndex) => dz1[hiddenIndex] * sample.features[inputIndex]),
      );
      const db1 = dz1;

      model.w2 = model.w2.map((row, outputIndex) =>
        row.map((weight, hiddenIndex) => weight - learningRate * dw2[outputIndex][hiddenIndex]),
      );
      model.b2 = model.b2.map((bias, outputIndex) => bias - learningRate * db2[outputIndex]);
      model.w1 = model.w1.map((row, hiddenIndex) =>
        row.map((weight, inputIndex) => weight - learningRate * dw1[hiddenIndex][inputIndex]),
      );
      model.b1 = model.b1.map((bias, hiddenIndex) => bias - learningRate * db1[hiddenIndex]);
    }

    onEpochEnd?.({
      epoch: epoch + 1,
      loss: totalLoss / totalSamples,
      accuracy: correct / totalSamples,
    });

    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
}