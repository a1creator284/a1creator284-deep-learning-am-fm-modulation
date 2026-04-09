export type BackendHealth = {
  service: string;
  status: string;
  api_version: string;
  device: string;
  model_ready: boolean;
  active_run_id: string | null;
  last_model_path: string | null;
  base_url: string;
};

export type BackendEndpointCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type BackendEndpointSmokeReport = {
  baseUrl: string;
  executedAt: string;
  results: BackendEndpointCheck[];
};

export type BackendTrainHistoryPoint = {
  epoch: number;
  train_loss: number;
  train_accuracy: number;
  val_loss: number;
  val_accuracy: number;
};

export type BackendTrainPayload = {
  samples_per_class: number;
  sample_length: number;
  sample_rate: number;
  epochs: number;
  batch_size: number;
  learning_rate: number;
  validation_split: number;
  seed: number;
  use_mps_if_available: boolean;
};

export type BackendTrainResult = {
  run_id: string;
  device: string;
  checkpoint_path: string;
  metadata_path: string;
  samples_per_class: number;
  sample_length: number;
  sample_rate: number;
  epochs: number;
  history: BackendTrainHistoryPoint[];
  best_val_accuracy: number;
  active_model_ready: boolean;
};

export type BackendPredictPayload = {
  waveform: number[];
  sample_rate: number;
  sample_length?: number;
};

export type BackendPredictResult = {
  label: string;
  confidence: number;
  probabilities: Record<string, number>;
  sample_length: number;
  sample_rate: number;
  device: string;
  model_path: string;
};

export type BackendReportPayload = {
  mode: "AM" | "FM";
  signal_source: "analog" | "text";
  text_message?: string | null;
  params: {
    message_amplitude: number;
    message_frequency: number;
    carrier_amplitude: number;
    carrier_frequency: number;
    frequency_deviation: number;
    phase: number;
    noise_level: number;
  };
  sample_rate: number;
  conventional_accuracy: number;
  deep_learning_accuracy?: number | null;
  deep_learning_enabled: boolean;
  prediction_label?: string | null;
  prediction_confidence?: number | null;
};

export type BackendReportResult = {
  title: string;
  generated_at: string;
  mode: string;
  signal_source: string;
  executive_summary: string;
  conventional_accuracy: number;
  deep_learning_accuracy: number | null;
  improvement: number | null;
  modulation_index: number;
  bandwidth: number;
  estimated_snr: string;
  active_model_ready: boolean;
  sections: Array<{ heading: string; body: string }>;
  viva_points: string[];
  recommendations: string[];
  conclusion: string;
};

type RootResponse = {
  service?: string;
  version?: string;
  docs?: string;
  endpoints?: string[];
};

type ConfigResponse = {
  port: number;
  default_sample_rate: number;
  allow_origins: string[];
};

type DeviceResponse = {
  active_device?: string;
  mps_available?: boolean;
  cuda_available?: boolean;
};

type ModelSummary = {
  run_id: string;
  is_active: boolean;
};

type SelfCheckResponse = {
  overall_ok: boolean;
  active_model_ready: boolean;
  results: Array<{ ok: boolean }>;
};

type WorkflowOverviewResponse = {
  status: string;
  active_model_ready: boolean;
  steps: Array<{ ready: boolean }>;
};

type ReportSummaryResponse = {
  title: string;
  mode: string;
  improvement: number | null;
};

type TrainResponse = {
  run_id: string;
  device: string;
  epochs: number;
  best_val_accuracy: number;
};

type PredictResponse = {
  label: string;
  confidence: number;
};

type UploadResponse = {
  sample_count: number;
  file_name: string;
};

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim() || "";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

function getCandidateBackendBases() {
  const candidates = [
    configuredApiBase,
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8002",
    "http://127.0.0.1:8010",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://localhost:8002",
    "http://localhost:8010",
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeBaseUrl);

  return Array.from(new Set(candidates));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown error";
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Request failed with status ${response.status}.`);
  }

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

async function requestJson<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, init);
  return readJsonResponse<T>(response);
}

function buildDemoWaveform() {
  return Array.from({ length: 128 }, (_, index) => {
    const phase = (2 * Math.PI * index) / 32;
    return Number((0.65 * Math.sin(phase) * (1 + 0.3 * Math.sin(phase / 4))).toFixed(6));
  });
}

function buildDemoCsvBlob() {
  const lines = ["time,modulated"];

  for (let index = 0; index < 96; index += 1) {
    const time = index / 1200;
    const value = 0.75 * Math.sin((2 * Math.PI * index) / 18) * (1 + 0.25 * Math.sin((2 * Math.PI * index) / 64));
    lines.push(`${time.toFixed(6)},${value.toFixed(6)}`);
  }

  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}

async function runCheck<T>(
  id: string,
  label: string,
  runner: () => Promise<T>,
  formatter: (result: T) => string,
): Promise<BackendEndpointCheck> {
  try {
    const result = await runner();
    return {
      id,
      label,
      ok: true,
      detail: formatter(result),
    };
  } catch (error) {
    return {
      id,
      label,
      ok: false,
      detail: getErrorMessage(error),
    };
  }
}

export function getBackendApiBaseUrl() {
  return getCandidateBackendBases()[0] ?? "http://127.0.0.1:8000";
}

export function getBackendDocsUrl(baseUrl = getBackendApiBaseUrl()) {
  return `${normalizeBaseUrl(baseUrl)}/docs`;
}

export async function discoverBackendApiBaseUrl(signal?: AbortSignal) {
  const candidates = getCandidateBackendBases();

  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/health`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      if (response.ok) {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(`No FastAPI backend was detected. Tried: ${candidates.join(", ")}`);
}

export async function fetchBackendHealth(signal?: AbortSignal, preferredBaseUrl?: string): Promise<BackendHealth> {
  const orderedCandidates = [
    ...(preferredBaseUrl ? [normalizeBaseUrl(preferredBaseUrl)] : []),
    ...getCandidateBackendBases(),
  ].filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);

  for (const candidate of orderedCandidates) {
    try {
      const health = await requestJson<Omit<BackendHealth, "base_url">>(candidate, "/health", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      return {
        ...health,
        base_url: candidate,
      };
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(`No FastAPI backend was detected. Tried: ${orderedCandidates.join(", ")}`);
}

async function resolveWorkingBaseUrl(preferredBaseUrl?: string, signal?: AbortSignal) {
  if (!preferredBaseUrl) {
    return discoverBackendApiBaseUrl(signal);
  }

  try {
    await fetchBackendHealth(signal, preferredBaseUrl);
    return normalizeBaseUrl(preferredBaseUrl);
  } catch {
    return discoverBackendApiBaseUrl(signal);
  }
}

export async function trainBackendModel(payload: BackendTrainPayload, preferredBaseUrl?: string, signal?: AbortSignal) {
  const baseUrl = await resolveWorkingBaseUrl(preferredBaseUrl, signal);
  const result = await requestJson<BackendTrainResult>(baseUrl, "/train", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  return { baseUrl, result };
}

export async function predictBackendWaveform(payload: BackendPredictPayload, preferredBaseUrl?: string, signal?: AbortSignal) {
  const baseUrl = await resolveWorkingBaseUrl(preferredBaseUrl, signal);
  const result = await requestJson<BackendPredictResult>(baseUrl, "/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  return { baseUrl, result };
}

export async function requestBackendReportSummary(payload: BackendReportPayload, preferredBaseUrl?: string, signal?: AbortSignal) {
  const baseUrl = await resolveWorkingBaseUrl(preferredBaseUrl, signal);
  const result = await requestJson<BackendReportResult>(baseUrl, "/report/summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  return { baseUrl, result };
}

export async function runBackendEndpointSmokeTest(
  preferredBaseUrl?: string,
  signal?: AbortSignal,
): Promise<BackendEndpointSmokeReport> {
  const baseUrl = await resolveWorkingBaseUrl(preferredBaseUrl, signal);
  const waveform = buildDemoWaveform();
  const csvBlob = buildDemoCsvBlob();
  const trainPayload = {
    samples_per_class: 20,
    sample_length: 128,
    sample_rate: 1200,
    epochs: 1,
    batch_size: 8,
    learning_rate: 0.001,
    validation_split: 0.2,
    seed: 42,
    use_mps_if_available: true,
  };

  const results = [
    await runCheck(
      "root",
      "GET /",
      () => requestJson<RootResponse>(baseUrl, "/", { method: "GET", signal }),
      (result) => `${result.endpoints?.length ?? 0} endpoints advertised`,
    ),
    await runCheck(
      "health",
      "GET /health",
      () => requestJson<Omit<BackendHealth, "base_url">>(baseUrl, "/health", { method: "GET", signal }),
      (result) => `${result.status} on ${result.device}`,
    ),
    await runCheck(
      "config",
      "GET /config",
      () => requestJson<ConfigResponse>(baseUrl, "/config", { method: "GET", signal }),
      (result) => `port ${result.port}, sample rate ${result.default_sample_rate}`,
    ),
    await runCheck(
      "device",
      "GET /device",
      () => requestJson<DeviceResponse>(baseUrl, "/device", { method: "GET", signal }),
      (result) => `${result.active_device ?? "unknown"} / MPS ${result.mps_available ? "available" : "not available"}`,
    ),
    await runCheck(
      "self_check_before",
      "GET /self-check",
      () => requestJson<SelfCheckResponse>(baseUrl, "/self-check", { method: "GET", signal }),
      (result) => `${result.results.filter((item) => item.ok).length}/${result.results.length} backend checks passed`,
    ),
    await runCheck(
      "workflow_overview",
      "GET /workflow/overview",
      () => requestJson<WorkflowOverviewResponse>(baseUrl, "/workflow/overview", { method: "GET", signal }),
      (result) => `${result.steps.filter((step) => step.ready).length}/${result.steps.length} workflow steps ready`,
    ),
    await runCheck(
      "report_summary_before",
      "POST /report/summary",
      () =>
        requestJson<ReportSummaryResponse>(baseUrl, "/report/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "AM",
            signal_source: "analog",
            params: {
              message_amplitude: 1.0,
              message_frequency: 10,
              carrier_amplitude: 2.2,
              carrier_frequency: 100,
              frequency_deviation: 25,
              phase: 0,
              noise_level: 0.02,
            },
            sample_rate: 1200,
            conventional_accuracy: 72,
            deep_learning_accuracy: 84,
            deep_learning_enabled: true,
            prediction_label: "AM",
            prediction_confidence: 0.86,
          }),
          signal,
        }),
      (result) => `${result.title} / improvement ${result.improvement?.toFixed(1) ?? "pending"}%`,
    ),
    await runCheck(
      "models_before",
      "GET /models",
      () => requestJson<ModelSummary[]>(baseUrl, "/models", { method: "GET", signal }),
      (result) => `${result.length} model(s) currently registered`,
    ),
    await runCheck(
      "train",
      "POST /train",
      () =>
        requestJson<TrainResponse>(baseUrl, "/train", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(trainPayload),
          signal,
        }),
      (result) => `run ${result.run_id} trained on ${result.device} with best val ${(result.best_val_accuracy * 100).toFixed(1)}%`,
    ),
    await runCheck(
      "predict_generated",
      "POST /predict/generated",
      () =>
        requestJson<PredictResponse>(baseUrl, "/predict/generated", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "AM",
            sample_length: 128,
            sample_rate: 1200,
            params: {
              message_amplitude: 1.0,
              message_frequency: 10,
              carrier_amplitude: 2.2,
              carrier_frequency: 100,
              frequency_deviation: 25,
              phase: 0,
              noise_level: 0.02,
            },
          }),
          signal,
        }),
      (result) => `${result.label} ${(result.confidence * 100).toFixed(1)}%`,
    ),
    await runCheck(
      "predict_waveform",
      "POST /predict",
      () =>
        requestJson<PredictResponse>(baseUrl, "/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            waveform,
            sample_rate: 1200,
            sample_length: 128,
          }),
          signal,
        }),
      (result) => `${result.label} ${(result.confidence * 100).toFixed(1)}%`,
    ),
    await runCheck(
      "upload_iq",
      "POST /upload/iq",
      async () => {
        const formData = new FormData();
        formData.append("file", csvBlob, "sample_waveform.csv");
        return requestJson<UploadResponse>(baseUrl, "/upload/iq", {
          method: "POST",
          body: formData,
          signal,
        });
      },
      (result) => `${result.file_name} / ${result.sample_count} samples`,
    ),
    await runCheck(
      "predict_file",
      "POST /predict/file",
      async () => {
        const formData = new FormData();
        formData.append("file", csvBlob, "sample_waveform.csv");
        return requestJson<PredictResponse>(baseUrl, "/predict/file", {
          method: "POST",
          body: formData,
          signal,
        });
      },
      (result) => `${result.label} ${(result.confidence * 100).toFixed(1)}%`,
    ),
    await runCheck(
      "invalid_upload",
      "POST /upload/iq (invalid)",
      async () => {
        const formData = new FormData();
        formData.append("file", new Blob(["not,a,valid,waveform"], { type: "text/plain" }), "bad_waveform.txt");
        const response = await fetch(`${baseUrl}/upload/iq`, {
          method: "POST",
          body: formData,
          signal,
        });
        if (response.status !== 400) {
          throw new Error(`Expected HTTP 400 for invalid upload, received ${response.status}`);
        }
        return { status: response.status };
      },
      (result) => `invalid upload rejected with HTTP ${result.status}`,
    ),
    await runCheck(
      "active_model",
      "GET /models/active",
      () => requestJson<ModelSummary>(baseUrl, "/models/active", { method: "GET", signal }),
      (result) => `active model run ${result.run_id}`,
    ),
    await runCheck(
      "models_after",
      "GET /models (after train)",
      () => requestJson<ModelSummary[]>(baseUrl, "/models", { method: "GET", signal }),
      (result) => `${result.length} model(s) registered after smoke test`,
    ),
    await runCheck(
      "self_check_after",
      "GET /self-check (after train)",
      () => requestJson<SelfCheckResponse>(baseUrl, "/self-check", { method: "GET", signal }),
      (result) => `${result.results.filter((item) => item.ok).length}/${result.results.length} backend checks passed after training`,
    ),
    await runCheck(
      "report_summary_after",
      "POST /report/summary (after train)",
      () =>
        requestJson<ReportSummaryResponse>(baseUrl, "/report/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "FM",
            signal_source: "analog",
            params: {
              message_amplitude: 1.1,
              message_frequency: 12,
              carrier_amplitude: 2.4,
              carrier_frequency: 110,
              frequency_deviation: 30,
              phase: 0,
              noise_level: 0.03,
            },
            sample_rate: 1200,
            conventional_accuracy: 72,
            deep_learning_accuracy: 85,
            deep_learning_enabled: true,
            prediction_label: "FM",
            prediction_confidence: 0.88,
          }),
          signal,
        }),
      (result) => `${result.mode} summary / improvement ${result.improvement?.toFixed(1) ?? "pending"}%`,
    ),
  ];

  return {
    baseUrl,
    executedAt: new Date().toLocaleString(),
    results,
  };
}
