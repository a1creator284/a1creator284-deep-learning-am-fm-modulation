from __future__ import annotations

from pathlib import Path
import json
from typing import Any

from .config import ensure_runtime_directories, settings


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def load_registry() -> dict[str, Any]:
    ensure_runtime_directories()
    return read_json(settings.registry_path, {"active_run_id": None, "models": []})


def save_registry(payload: dict[str, Any]) -> None:
    ensure_runtime_directories()
    write_json(settings.registry_path, payload)


def register_model(summary: dict[str, Any]) -> None:
    registry = load_registry()
    models = [model for model in registry.get("models", []) if model.get("run_id") != summary.get("run_id")]
    models.append(summary)
    registry["models"] = sorted(models, key=lambda item: item.get("created_at", ""), reverse=True)
    registry["active_run_id"] = summary.get("run_id")
    save_registry(registry)


def list_models() -> list[dict[str, Any]]:
    registry = load_registry()
    active_run_id = registry.get("active_run_id")
    models: list[dict[str, Any]] = []

    for model in registry.get("models", []):
        item = dict(model)
        item["is_active"] = item.get("run_id") == active_run_id
        models.append(item)

    return models


def get_active_model_summary() -> dict[str, Any] | None:
    registry = load_registry()
    active_run_id = registry.get("active_run_id")
    if not active_run_id:
        return None

    for model in registry.get("models", []):
        if model.get("run_id") == active_run_id:
            item = dict(model)
            item["is_active"] = True
            return item

    return None
