import type { SignalMode, SignalParameters } from "./signalProcessor";

export type CommunicationFlowStep = {
  id: string;
  title: string;
  detail: string;
  status: "pending" | "active" | "done";
};

export type ProjectReportInput = {
  mode: SignalMode;
  signalSource: "analog" | "text";
  textMessage: string;
  params: SignalParameters;
  conventionalAccuracy: number;
  deepLearningAccuracy: number | null;
  deepLearningEnabled: boolean;
  predictionLabel: string | null;
  predictionConfidence: number | null;
  modulationIndex: number;
  bandwidth: number;
  estimatedSnr: string;
  backendSummary: string;
  activeAccuracyLabel: string;
  flowCompletedSteps: number;
  flowRunning: boolean;
};

export type GeneratedProjectReport = {
  title: string;
  generatedAt: string;
  executiveSummary: string;
  reportMarkdown: string;
  conclusion: string;
  vivaPoints: string[];
};

export function buildCommunicationFlowSteps(input: ProjectReportInput): CommunicationFlowStep[] {
  const sourceLabel = input.signalSource === "text" ? "text bitstream" : "analog sine message";
  const trained = input.deepLearningAccuracy !== null;

  const steps: Omit<CommunicationFlowStep, "status">[] = [
    {
      id: "message",
      title: "Prepare message source",
      detail: `Current source: ${sourceLabel}. The message waveform is ready to drive ${input.mode} modulation.`,
    },
    {
      id: "carrier",
      title: "Configure carrier",
      detail: `Carrier amplitude ${input.params.carrierAmplitude.toFixed(2)} V at ${input.params.carrierFrequency.toFixed(0)} Hz.`,
    },
    {
      id: "modulation",
      title: `Generate ${input.mode} signal`,
      detail:
        input.mode === "AM"
          ? `AM envelope uses modulation index ${input.modulationIndex.toFixed(2)}.`
          : `FM uses frequency deviation ${input.params.frequencyDeviation.toFixed(0)} Hz and message frequency ${input.params.messageFrequency.toFixed(0)} Hz.`,
    },
    {
      id: "channel",
      title: "Apply channel condition",
      detail: input.params.noiseLevel > 0 ? `Noise level ${input.params.noiseLevel.toFixed(2)} with estimated SNR ${input.estimatedSnr}.` : "Ideal low-noise channel selected for the current waveform.",
    },
    {
      id: "demodulation",
      title: "Inspect recovered message",
      detail: "Demodulation preview estimates the original message from the modulated waveform for comparison.",
    },
    {
      id: "ai",
      title: "Classify with deep learning",
      detail: trained
        ? `Mini model is trained. ${input.deepLearningEnabled ? "Deep learning view is active." : "Deep learning is trained and ready to be turned on."}`
        : "Train the mini model to unlock the AI-assisted accuracy view and prediction confidence.",
    },
    {
      id: "report",
      title: "Generate presentation report",
      detail: "Create a final summary containing parameters, AI comparison, and a viva-ready conclusion.",
    },
  ];

  return steps.map((step, index) => ({
    ...step,
    status: input.flowRunning && index === input.flowCompletedSteps
      ? "active"
      : index < input.flowCompletedSteps
        ? "done"
        : "pending",
  }));
}

export function buildProjectReport(input: ProjectReportInput): GeneratedProjectReport {
  const generatedAt = new Date().toLocaleString();
  const dlAccuracy = input.deepLearningAccuracy;
  const improvement = dlAccuracy === null ? null : Math.max(0, dlAccuracy - input.conventionalAccuracy);
  const sourceLabel = input.signalSource === "text" ? "text-driven digital message" : "analog sinusoidal message";
  const messageSummary = input.signalSource === "text"
    ? `The text message \"${(input.textMessage.trim() || "HELLO SIR THIS IS AN AM SIGNAL").slice(0, 80)}${input.textMessage.trim().length > 80 ? "..." : ""}\" was converted into binary bits and used as the information source.`
    : `The information source was a low-frequency analog waveform with amplitude ${input.params.messageAmplitude.toFixed(2)} V and frequency ${input.params.messageFrequency.toFixed(0)} Hz.`;

  const executiveSummary = dlAccuracy === null
    ? `The project successfully generated and analyzed a ${input.mode} signal using a ${sourceLabel}. Traditional analysis is currently estimated near ${input.conventionalAccuracy.toFixed(1)}% accuracy. A trained deep-learning stage can be added to improve reliability further.`
    : `The project successfully generated and analyzed a ${input.mode} signal using a ${sourceLabel}. Traditional analysis achieved about ${input.conventionalAccuracy.toFixed(1)}% accuracy, while the deep-learning assisted pipeline improved the result to ${dlAccuracy.toFixed(1)}%, giving an improvement of ${improvement?.toFixed(1)} percentage points.`;

  const conclusion = dlAccuracy === null
    ? "Conclusion: the communication chain works correctly with conventional analysis, but the strongest project story appears after the deep-learning model is trained and activated."
    : input.deepLearningEnabled
      ? `Conclusion: deep learning is active and improves modulation understanding from ${input.conventionalAccuracy.toFixed(1)}% to ${dlAccuracy.toFixed(1)}%, which demonstrates the practical value of learned signal features.`
      : `Conclusion: the deep-learning model is trained and available, but the dashboard is currently presenting the traditional path. Turning AI on will highlight the improved ${dlAccuracy.toFixed(1)}% result.`;

  const vivaPoints = [
    `Why AM/FM: ${input.mode} is used to demonstrate how information can be embedded onto a high-frequency carrier for transmission.`,
    `Why deep learning: handcrafted analysis can become less reliable in noise or distortion, while learned waveform features improve robustness.`,
    `Current RF setup: message frequency ${input.params.messageFrequency.toFixed(0)} Hz, carrier frequency ${input.params.carrierFrequency.toFixed(0)} Hz, sample rate ${input.params.sampleRate.toFixed(0)} Hz.`,
    `Signal quality view: estimated SNR ${input.estimatedSnr}, bandwidth ${input.bandwidth.toFixed(1)} Hz, modulation index ${input.modulationIndex.toFixed(2)}.`,
    `Prediction summary: ${input.predictionLabel ? `${input.predictionLabel} at ${((input.predictionConfidence ?? 0) * 100).toFixed(1)}% confidence.` : "No prediction has been generated yet."}`,
    `Backend summary: ${input.backendSummary}.`,
  ];

  const reportMarkdown = [
    "# Deep Learning Signal Modulation Report",
    "",
    `**Generated:** ${generatedAt}`,
    `**Mode:** ${input.mode}`,
    `**Signal source:** ${sourceLabel}`,
    `**Active accuracy view:** ${input.activeAccuracyLabel}`,
    "",
    "## Executive Summary",
    executiveSummary,
    "",
    "## Signal Parameters",
    `- Message amplitude: ${input.params.messageAmplitude.toFixed(2)} V`,
    `- Message frequency: ${input.params.messageFrequency.toFixed(0)} Hz`,
    `- Carrier amplitude: ${input.params.carrierAmplitude.toFixed(2)} V`,
    `- Carrier frequency: ${input.params.carrierFrequency.toFixed(0)} Hz`,
    `- Frequency deviation: ${input.params.frequencyDeviation.toFixed(0)} Hz`,
    `- Phase: ${input.params.phase.toFixed(2)} rad`,
    `- Duration: ${input.params.duration.toFixed(4)} s`,
    `- Sample rate: ${input.params.sampleRate.toFixed(0)} Hz`,
    `- Noise level: ${input.params.noiseLevel.toFixed(2)}`,
    "",
    "## Communication Flow",
    `1. Message source prepared as a ${sourceLabel}.`,
    `2. Carrier configured at ${input.params.carrierFrequency.toFixed(0)} Hz.`,
    `3. ${input.mode} modulation generated using the current waveform settings.`,
    `4. Channel condition evaluated with SNR ${input.estimatedSnr}.`,
    "5. Demodulation preview used to compare original and recovered message behavior.",
    `6. ${dlAccuracy === null ? "Deep-learning step pending until training is run." : `Deep-learning step completed with ${dlAccuracy.toFixed(1)}% accuracy.`}`,
    "7. Final project report generated for presentation.",
    "",
    "## Accuracy Comparison",
    `- Traditional analysis accuracy: ${input.conventionalAccuracy.toFixed(1)}%`,
    `- Deep-learning accuracy: ${dlAccuracy === null ? "Pending" : `${dlAccuracy.toFixed(1)}%`}`,
    `- Improvement: ${improvement === null ? "Pending" : `+${improvement.toFixed(1)}%`}`,
    "",
    "## Message & Channel Notes",
    messageSummary,
    `The occupied bandwidth is approximately ${input.bandwidth.toFixed(1)} Hz and the modulation index is ${input.modulationIndex.toFixed(2)}.`,
    "",
    "## Prediction",
    input.predictionLabel
      ? `Current classifier output: ${input.predictionLabel} with ${(((input.predictionConfidence ?? 0) * 100)).toFixed(1)}% confidence.`
      : "No prediction has been executed yet.",
    "",
    "## Why Deep Learning Matters",
    "Without deep learning, the project relies on simpler interpretation and can lose reliability in noise or difficult conditions.",
    "After deep learning is trained, the system learns waveform patterns directly from data, improving the modulation recognition result.",
    "",
    "## Viva Points",
    ...vivaPoints.map((item) => `- ${item}`),
    "",
    "## Conclusion",
    conclusion,
  ].join("\n");

  return {
    title: `${input.mode} Communication Flow Report`,
    generatedAt,
    executiveSummary,
    reportMarkdown,
    conclusion,
    vivaPoints,
  };
}
