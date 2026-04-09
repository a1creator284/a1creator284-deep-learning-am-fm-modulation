from __future__ import annotations

from io import StringIO
import csv

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def build_csv_bytes() -> bytes:
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["time", "modulated"])
    for index in range(64):
        writer.writerow([index / 1200, ((-1) ** index) * 0.5])
    return buffer.getvalue().encode("utf-8")


def main() -> None:
    root = client.get("/")
    assert root.status_code == 200, root.text

    health = client.get("/health")
    assert health.status_code == 200, health.text

    config = client.get("/config")
    assert config.status_code == 200, config.text

    device = client.get("/device")
    assert device.status_code == 200, device.text

    self_check_before = client.get("/self-check")
    assert self_check_before.status_code == 200, self_check_before.text

    workflow = client.get("/workflow/overview")
    assert workflow.status_code == 200, workflow.text

    report = client.post(
        "/report/summary",
        json={
            "mode": "AM",
            "signal_source": "analog",
            "params": {
                "message_amplitude": 1.0,
                "message_frequency": 10.0,
                "carrier_amplitude": 2.0,
                "carrier_frequency": 100.0,
                "frequency_deviation": 25.0,
                "phase": 0.0,
                "noise_level": 0.02,
            },
            "sample_rate": 1200,
            "conventional_accuracy": 72.0,
            "deep_learning_accuracy": 84.0,
            "deep_learning_enabled": True,
            "prediction_label": "AM",
            "prediction_confidence": 0.86,
        },
    )
    assert report.status_code == 200, report.text

    active_before = client.get("/models/active")
    assert active_before.status_code in (200, 404), active_before.text

    train = client.post(
        "/train",
        json={
            "samples_per_class": 24,
            "sample_length": 128,
            "sample_rate": 1200,
            "epochs": 1,
            "batch_size": 8,
            "learning_rate": 0.001,
            "validation_split": 0.2,
            "seed": 42,
            "use_mps_if_available": True,
        },
    )
    assert train.status_code == 200, train.text

    generated_predict = client.post(
        "/predict/generated",
        json={
            "mode": "AM",
            "sample_length": 128,
            "sample_rate": 1200,
            "params": {
                "message_amplitude": 1.0,
                "message_frequency": 10.0,
                "carrier_amplitude": 2.0,
                "carrier_frequency": 100.0,
                "frequency_deviation": 25.0,
                "phase": 0.0,
                "noise_level": 0.02,
            },
        },
    )
    assert generated_predict.status_code == 200, generated_predict.text

    waveform_predict = client.post(
        "/predict",
        json={
            "waveform": [0.1, 0.2, -0.1, 0.4, -0.3, 0.1, 0.0, -0.1, 0.2, -0.2, 0.3, -0.1, 0.05, 0.02, -0.01, 0.03],
            "sample_rate": 1200,
        },
    )
    assert waveform_predict.status_code == 200, waveform_predict.text

    upload = client.post(
        "/upload/iq",
        files={"file": ("sample_waveform.csv", build_csv_bytes(), "text/csv")},
    )
    assert upload.status_code == 200, upload.text

    predict_file = client.post(
        "/predict/file",
        files={"file": ("sample_waveform.csv", build_csv_bytes(), "text/csv")},
    )
    assert predict_file.status_code == 200, predict_file.text

    bad_upload = client.post(
        "/upload/iq",
        files={"file": ("bad_waveform.txt", b"not,a,valid,waveform", "text/plain")},
    )
    assert bad_upload.status_code == 400, bad_upload.text

    active_after = client.get("/models/active")
    assert active_after.status_code == 200, active_after.text

    models = client.get("/models")
    assert models.status_code == 200, models.text

    self_check_after = client.get("/self-check")
    assert self_check_after.status_code == 200, self_check_after.text

    workflow_after = client.get("/workflow/overview")
    assert workflow_after.status_code == 200, workflow_after.text

    report_after = client.post(
        "/report/summary",
        json={
            "mode": "FM",
            "signal_source": "analog",
            "params": {
                "message_amplitude": 1.1,
                "message_frequency": 12.0,
                "carrier_amplitude": 2.4,
                "carrier_frequency": 110.0,
                "frequency_deviation": 30.0,
                "phase": 0.0,
                "noise_level": 0.03,
            },
            "sample_rate": 1200,
            "conventional_accuracy": 72.0,
            "deep_learning_accuracy": 85.0,
            "deep_learning_enabled": True,
            "prediction_label": "FM",
            "prediction_confidence": 0.88,
        },
    )
    assert report_after.status_code == 200, report_after.text

    print("Smoke test passed: / /health /config /device /self-check /workflow/overview /report/summary /models /models/active /train /predict /predict/generated /upload/iq /predict/file + invalid upload handling")


if __name__ == "__main__":
    main()
