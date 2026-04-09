# Backend README — Deep Learning Signal Modulation Lab

This folder contains the **real Python backend** for the project.

It is built with:
- **FastAPI** for REST APIs
- **PyTorch** for deep learning
- **NumPy** for signal generation and preprocessing
- **Uvicorn** for serving the API
- **Pydantic** for typed request/response validation

The backend is designed for:
- training an AM/FM classifier
- predicting from raw waveform arrays
- predicting from generated AM/FM parameters
- uploading waveform files
- checking backend readiness
- returning workflow/report summaries
- supporting a Mac M3 local development setup

---

# 1. Why this backend exists

The frontend already demonstrates modulation and a browser-side mini AI demo.

The backend adds a more realistic architecture:
- real REST API
- real Python ML pipeline
- artifact/model registry
- upload endpoints
- backend diagnostics
- training and inference outside the browser

This makes the overall project look more complete and industry-style.

---

# 2. Main backend capabilities

## System endpoints
- `GET /`
- `GET /health`
- `GET /config`
- `GET /device`
- `GET /models`
- `GET /models/active`
- `GET /self-check`
- `GET /workflow/overview`

## Reporting endpoint
- `POST /report/summary`

## ML/data endpoints
- `POST /train`
- `POST /predict`
- `POST /predict/generated`
- `POST /upload/iq`
- `POST /predict/file`

---

# 3. Backend folder structure

```text
backend/
├── app/
│   ├── services/
│   │   ├── dataset.py
│   │   ├── device.py
│   │   ├── model.py
│   │   ├── reporting.py
│   │   ├── signals.py
│   │   └── trainer.py
│   ├── config.py
│   ├── main.py
│   ├── schemas.py
│   └── storage.py
├── tests/
│   ├── live_smoke_test.py
│   └── smoke_test.py
├── README.md
└── requirements.txt
```

---

# 4. What each backend file does

## `app/main.py`
Main FastAPI entrypoint.

It:
- creates the API app
- applies CORS
- defines all routes
- validates uploads
- handles errors

## `app/schemas.py`
Contains all Pydantic request/response models.

It defines:
- signal generation params
- train request/response
- predict request/response
- upload response
- self-check response
- workflow response
- report summary response

## `app/config.py`
Stores configuration such as:
- project name
- API version
- host/port defaults
- artifact directories
- sample-rate defaults

## `app/storage.py`
Handles model metadata and active model registry.

## `app/services/signals.py`
Generates and preprocesses AM/FM waveforms.

## `app/services/dataset.py`
Creates synthetic AM/FM datasets for training.

## `app/services/model.py`
Defines the PyTorch model architecture.

## `app/services/trainer.py`
Handles:
- model training
- loading active model
- waveform prediction

## `app/services/device.py`
Detects device support such as:
- MPS (Apple GPU)
- CUDA
- CPU

## `app/services/reporting.py`
Builds:
- workflow overview response
- structured backend report summary

---

# 5. Mac M3 setup

## Step 1: Go to backend folder
```bash
cd "/Users/rajaryan/Downloads/deep-learning-am-modulation (1)/backend"
```

## Step 2: Create virtual environment
```bash
python3 -m venv .venv
```

## Step 3: Activate it
```bash
source .venv/bin/activate
```

## Step 4: Upgrade pip
```bash
python -m pip install --upgrade pip
```

## Step 5: Install dependencies
```bash
pip install -r requirements.txt
```

## Step 6: Optional MPS fallback
```bash
export PYTORCH_ENABLE_MPS_FALLBACK=1
```

## Step 7: Start the backend
```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
```

Backend docs:
```text
http://127.0.0.1:8002/docs
```

---

# 6. Why PyTorch is useful here

PyTorch is used because:
- it is a strong deep-learning framework
- it supports Apple Silicon through **MPS**
- it is flexible for custom signal models
- it is widely used in research and production

On your Mac M3, local training can use **MPS** if available.

Important note:
- MPS works on your local Mac
- MPS does **not** work on most cloud free deployments like Render

---

# 7. Endpoint details

## `GET /`
Returns:
- service info
- version
- docs URL
- list of available endpoints

## `GET /health`
Returns:
- service status
- active device
- whether a trained model is available
- active run id

## `GET /config`
Returns backend configuration summary.

## `GET /device`
Returns device availability:
- active device
- MPS availability
- CUDA availability

## `GET /models`
Returns all registered trained models.

## `GET /models/active`
Returns the currently active model.

## `GET /self-check`
Runs backend readiness checks for:
- device detection
- waveform generation
- preprocessing
- upload parser
- model registry
- active model availability

## `GET /workflow/overview`
Returns a structured list of communication-flow steps that the project uses.

## `POST /report/summary`
Returns a structured report summary from:
- mode
- signal source
- signal parameters
- baseline accuracy
- DL accuracy
- prediction info

## `POST /train`
Trains the backend classifier.

## `POST /predict`
Predicts modulation from raw waveform samples.

## `POST /predict/generated`
Generates a waveform from parameters and predicts it.

## `POST /upload/iq`
Uploads waveform data file and returns parsed summary.

## `POST /predict/file`
Uploads a file and predicts its modulation.

---

# 8. Example curl commands

## Health
```bash
curl http://127.0.0.1:8002/health
```

## Device
```bash
curl http://127.0.0.1:8002/device
```

## Workflow overview
```bash
curl http://127.0.0.1:8002/workflow/overview
```

## Self-check
```bash
curl http://127.0.0.1:8002/self-check
```

## Train
```bash
curl -X POST http://127.0.0.1:8002/train \
  -H "Content-Type: application/json" \
  -d '{
    "samples_per_class": 24,
    "sample_length": 128,
    "sample_rate": 1200,
    "epochs": 1,
    "batch_size": 8,
    "learning_rate": 0.001,
    "validation_split": 0.2,
    "seed": 42,
    "use_mps_if_available": true
  }'
```

## Predict generated waveform
```bash
curl -X POST http://127.0.0.1:8002/predict/generated \
  -H "Content-Type: application/json" \
  -d '{
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
      "noise_level": 0.02
    }
  }'
```

## Report summary
```bash
curl -X POST http://127.0.0.1:8002/report/summary \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "AM",
    "signal_source": "analog",
    "params": {
      "message_amplitude": 1.2,
      "message_frequency": 10.0,
      "carrier_amplitude": 2.6,
      "carrier_frequency": 100.0,
      "frequency_deviation": 25.0,
      "phase": 0.0,
      "noise_level": 0.02
    },
    "sample_rate": 1200,
    "conventional_accuracy": 72.0,
    "deep_learning_accuracy": 84.0,
    "deep_learning_enabled": true,
    "prediction_label": "AM",
    "prediction_confidence": 0.86
  }'
```

---

# 9. Testing the backend

## In-process smoke test
```bash
cd "/Users/rajaryan/Downloads/deep-learning-am-modulation (1)"
source .venv/bin/activate
cd backend
python tests/smoke_test.py
```

## Live smoke test
```bash
cd "/Users/rajaryan/Downloads/deep-learning-am-modulation (1)"
source .venv/bin/activate
cd backend
MODLAB_BASE_URL=http://127.0.0.1:8002 python tests/live_smoke_test.py
```

## What the smoke tests cover
- `/`
- `/health`
- `/config`
- `/device`
- `/models`
- `/models/active`
- `/self-check`
- `/workflow/overview`
- `/report/summary`
- `/train`
- `/predict`
- `/predict/generated`
- `/upload/iq`
- `/predict/file`
- invalid upload rejection

---

# 10. Backend behavior and validation

The backend now validates:
- uploaded file size
- empty uploads
- waveform parsing
- minimum sample count
- request payload structure
- mode values (`AM` / `FM`)
- sample-rate ranges
- frequency ranges

This makes the backend safer and more presentation-ready.

---

# 11. Backend and frontend relationship

Frontend uses backend for:
- live health check
- backend endpoint smoke test
- future training/prediction integration
- showing active device/model status
- report and workflow alignment

The backend is also useful as a separate standalone API for testing with Swagger.

---

# 12. Future backend improvements

Possible future work:
- store uploaded datasets for training
- train on user-uploaded real data
- add authentication
- add confusion matrix endpoint
- add metrics history endpoint
- add model delete endpoint
- add deployment-ready inference endpoint with caching

---

# 13. Final backend summary

This backend makes the project much stronger because it adds:
- real APIs
- real training flow
- real prediction routes
- real upload parsing
- diagnostics
- report and workflow services
- a more industry-style architecture for your AM/FM deep-learning project
