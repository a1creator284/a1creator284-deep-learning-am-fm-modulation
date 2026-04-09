from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os


@dataclass(frozen=True)
class Settings:
    project_name: str = "Signal Modulation Deep Learning Backend"
    api_version: str = "1.0.0"
    host: str = os.getenv("MODLAB_HOST", "127.0.0.1")
    port: int = int(os.getenv("MODLAB_PORT", "8000"))
    default_sample_rate: int = int(os.getenv("MODLAB_DEFAULT_SAMPLE_RATE", "1000000"))
    model_registry_file_name: str = "model_registry.json"

    @property
    def backend_root(self) -> Path:
        return Path(__file__).resolve().parents[1]

    @property
    def artifact_dir(self) -> Path:
        return Path(os.getenv("MODLAB_ARTIFACT_DIR", str(self.backend_root / "artifacts")))

    @property
    def models_dir(self) -> Path:
        return self.artifact_dir / "models"

    @property
    def metadata_dir(self) -> Path:
        return self.artifact_dir / "metadata"

    @property
    def uploads_dir(self) -> Path:
        return self.artifact_dir / "uploads"

    @property
    def registry_path(self) -> Path:
        return self.artifact_dir / self.model_registry_file_name

    @property
    def allow_origins(self) -> list[str]:
        raw_origins = os.getenv(
            "MODLAB_ALLOW_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
        )
        return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


settings = Settings()


def ensure_runtime_directories() -> None:
    for directory in (settings.artifact_dir, settings.models_dir, settings.metadata_dir, settings.uploads_dir):
        directory.mkdir(parents=True, exist_ok=True)
