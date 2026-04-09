from __future__ import annotations

from pydantic import BaseModel, Field


class SignalGenerationParams(BaseModel):
    message_amplitude: float = Field(default=1.0, gt=0, le=8)
    message_frequency: float = Field(default=10_000.0, ge=0, le=10_000)
    carrier_amplitude: float = Field(default=2.0, gt=0, le=12)
    carrier_frequency: float = Field(default=100_000.0, ge=0, le=100_000)
    frequency_deviation: float = Field(default=8_000.0, ge=0, le=20_000)
    phase: float = Field(default=0.0, ge=0, le=6.283185307179586)
    noise_level: float = Field(default=0.0, ge=0, le=1.0)


class TrainRequest(BaseModel):
    samples_per_class: int = Field(default=400, ge=20, le=5000)
    sample_length: int = Field(default=256, ge=64, le=4096)
    sample_rate: int = Field(default=1_000_000, ge=100, le=2_000_000)
    epochs: int = Field(default=8, ge=1, le=100)
    batch_size: int = Field(default=32, ge=4, le=1024)
    learning_rate: float = Field(default=0.001, gt=0, le=1)
    validation_split: float = Field(default=0.2, gt=0.05, lt=0.5)
    seed: int = Field(default=42, ge=0)
    use_mps_if_available: bool = True


class EpochMetrics(BaseModel):
    epoch: int
    train_loss: float
    train_accuracy: float
    val_loss: float
    val_accuracy: float


class TrainResponse(BaseModel):
    run_id: str
    device: str
    checkpoint_path: str
    metadata_path: str
    samples_per_class: int
    sample_length: int
    sample_rate: int
    epochs: int
    history: list[EpochMetrics]
    best_val_accuracy: float
    active_model_ready: bool


class PredictRequest(BaseModel):
    waveform: list[float] = Field(..., min_length=16)
    sample_rate: int = Field(default=1_000_000, ge=1, le=2_000_000)
    sample_length: int | None = Field(default=None, ge=16, le=4096)


class PredictGeneratedRequest(BaseModel):
    mode: str = Field(default="AM", pattern="^(AM|FM)$")
    sample_length: int = Field(default=256, ge=64, le=4096)
    sample_rate: int = Field(default=1_000_000, ge=100, le=2_000_000)
    params: SignalGenerationParams = Field(default_factory=SignalGenerationParams)


class PredictResponse(BaseModel):
    label: str
    confidence: float
    probabilities: dict[str, float]
    sample_length: int
    sample_rate: int
    device: str
    model_path: str


class UploadResponse(BaseModel):
    file_name: str
    saved_path: str
    sample_count: int
    sample_rate: int
    preview: list[float]


class ModelSummary(BaseModel):
    run_id: str
    checkpoint_path: str
    metadata_path: str
    created_at: str
    best_val_accuracy: float
    sample_length: int
    sample_rate: int
    device: str
    is_active: bool


class HealthResponse(BaseModel):
    service: str
    status: str
    api_version: str
    device: str
    model_ready: bool
    active_run_id: str | None
    last_model_path: str | None


class ConfigResponse(BaseModel):
    project_name: str
    api_version: str
    host: str
    port: int
    allow_origins: list[str]
    artifact_dir: str
    models_dir: str
    uploads_dir: str
    default_sample_rate: int


class SelfCheckItem(BaseModel):
    id: str
    label: str
    ok: bool
    detail: str


class SelfCheckResponse(BaseModel):
    service: str
    status: str
    executed_at: str
    overall_ok: bool
    active_model_ready: bool
    active_run_id: str | None
    results: list[SelfCheckItem]


class WorkflowStep(BaseModel):
    id: str
    title: str
    detail: str
    ready: bool


class WorkflowOverviewResponse(BaseModel):
    service: str
    status: str
    generated_at: str
    active_model_ready: bool
    steps: list[WorkflowStep]


class ReportSection(BaseModel):
    heading: str
    body: str


class ReportSummaryRequest(BaseModel):
    mode: str = Field(default="AM", pattern="^(AM|FM)$")
    signal_source: str = Field(default="analog", pattern="^(analog|text)$")
    text_message: str | None = Field(default=None, max_length=5000)
    params: SignalGenerationParams = Field(default_factory=SignalGenerationParams)
    sample_rate: int = Field(default=1_000_000, ge=100, le=2_000_000)
    conventional_accuracy: float = Field(default=72.0, ge=0, le=100)
    deep_learning_accuracy: float | None = Field(default=None, ge=0, le=100)
    deep_learning_enabled: bool = False
    prediction_label: str | None = Field(default=None, max_length=20)
    prediction_confidence: float | None = Field(default=None, ge=0, le=1)


class ReportSummaryResponse(BaseModel):
    title: str
    generated_at: str
    mode: str
    signal_source: str
    executive_summary: str
    conventional_accuracy: float
    deep_learning_accuracy: float | None
    improvement: float | None
    modulation_index: float
    bandwidth: float
    estimated_snr: str
    active_model_ready: bool
    sections: list[ReportSection]
    viva_points: list[str]
    recommendations: list[str]
    conclusion: str
