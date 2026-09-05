# VisionAI

AI-powered image analysis application combining **image captioning, object detection, visual question answering, and accessibility-focused narration** in a full-stack web application.

## Features

* Upload JPG, PNG, and WebP images
* Drag-and-drop image upload
* AI-generated image captions using **BLIP-large**
* Object detection using **YOLO26m**
* Detection confidence scores and bounding boxes
* Toggle between original image and detection view
* Hover synchronization between detected objects and bounding boxes
* Visual Question Answering using **BLIP VQA**
* Context-aware suggested questions based on detected objects
* Accessibility mode with automatic narration
* Browser-based text-to-speech using SpeechSynthesis
* Request validation and file-size limits
* Structured API responses using Pydantic
* Graceful error handling
* Stage-level backend logging
* Cold-start and warm-inference performance measurement
* Automated API tests with mocked model inference
* Dockerized FastAPI API service

---

## Architecture

```text
                        ┌──────────────────────┐
                        │      Next.js UI      │
                        │                      │
                        │  Upload              │
                        │  Image Viewer        │
                        │  Detection Overlay   │
                        │  VQA                 │
                        │  Accessibility       │
                        └──────────┬───────────┘
                                   │
                              HTTP / REST
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │      FastAPI         │
                        │                      │
                        │  /health             │
                        │  /api/analyze        │
                        │  /api/ask            │
                        │                      │
                        │  Validation          │
                        │  Pydantic schemas    │
                        │  Error handling      │
                        │  Logging             │
                        │  Timing              │
                        └──────────┬───────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
               BLIP-large      YOLO26m       BLIP VQA
              Captioning      Detection       Question
                                                Answering
```

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* CSS
* Browser SpeechSynthesis API

### Backend

* Python
* FastAPI
* Pydantic
* Uvicorn
* Pillow

### Machine Learning

* PyTorch
* Hugging Face Transformers
* BLIP-large for image captioning
* BLIP VQA for visual question answering
* Ultralytics YOLO26m for object detection

### Testing

* Pytest
* FastAPI TestClient
* Mocked model inference

### Deployment / Infrastructure

* Docker
* Docker Compose

---

## Backend Structure

```text
backend/
├── Dockerfile
├── .dockerignore
├── requirements.txt
├── requirements.docker.txt
├── pytest.ini
├── app/
│   ├── main.py
│   ├── schemas/
│   │   └── analysis.py
│   ├── services/
│   │   ├── captioner.py
│   │   ├── detector.py
│   │   └── vqa.py
│   └── utils/
│       ├── image_utils.py
│       └── timer.py
└── tests/
    └── test_api.py
```

### Model lifecycle

The ML services use lazy-loaded singleton-style model instances.

Models are loaded only when the corresponding functionality is first requested and are then reused for subsequent requests.

This avoids repeatedly loading large models into memory and significantly reduces warm-request latency.

---

## API

### `GET /health`

Lightweight health-check endpoint.

Example response:

```json
{
  "status": "ok",
  "service": "VisionAI API"
}
```

The endpoint does not require ML dependencies to be initialized.

---

### `POST /api/analyze`

Accepts an image and performs:

1. Image validation
2. BLIP image captioning
3. YOLO object detection
4. Timing and structured logging

Example response structure:

```json
{
  "success": true,
  "filename": "image.jpg",
  "image": {
    "width": 1920,
    "height": 1080
  },
  "caption": "A person standing outdoors.",
  "detections": [
    {
      "label": "person",
      "confidence": 0.95,
      "box": {
        "x1": 120.5,
        "y1": 80.2,
        "x2": 640.1,
        "y2": 920.4
      }
    }
  ]
}
```

---

### `POST /api/ask`

Accepts an image and natural-language question.

Uses BLIP VQA to answer questions about the image.

Example:

```text
Question:
How many people are in the image?

Answer:
There are two people.
```

---

## Request Safety

Uploaded images are validated before inference.

The backend checks:

* MIME type
* Empty uploads
* Maximum file size
* Actual image validity
* Image decoding
* RGB conversion

Supported formats:

```text
JPEG
PNG
WebP
```

Maximum upload size:

```text
10 MB
```

Invalid requests receive appropriate HTTP error responses rather than reaching the ML inference layer.

---

## Error Handling

The backend separates failures by processing stage.

For `/api/analyze`:

```text
Upload
  ↓
Validation
  ↓
Captioning
  ↓
Object Detection
  ↓
Response
```

Failures are logged with their corresponding stage.

The API exposes safe user-facing error messages while retaining detailed exception information in server logs.

---

## Performance Benchmark

Measured on the development machine.

| Metric             | Cold Request | Warm Request |
| ------------------ | -----------: | -----------: |
| Total request      |     11.947 s |      2.252 s |
| BLIP captioning    |     11.382 s |      1.934 s |
| YOLO detection     |      0.514 s |      0.308 s |
| Validation         |      0.051 s |      0.010 s |
| BLIP model loading |      8.602 s |            — |
| YOLO model loading |      0.185 s |            — |

The measurements demonstrate the impact of model initialization and the benefit of reusing loaded models across requests.

BLIP captioning is the dominant warm-request bottleneck, accounting for roughly 86% of the warm `/api/analyze` latency.

---

## Testing

The backend currently contains **9 automated API tests** covering:

* Health endpoint
* Unsupported file types
* Empty uploads
* Empty VQA questions
* Successful image analysis
* Captioning failure handling
* Object detection failure handling
* Successful VQA
* VQA inference failure handling

Model inference is mocked during API tests, allowing the test suite to run without downloading or loading the large ML models.

Run tests with:

```bash
cd backend
pytest
```

Expected result:

```text
9 passed
```

---

## Docker

The FastAPI API layer can be run inside Docker using Docker Compose.

Build:

```bash
docker compose build
```

Start:

```bash
docker compose up
```

Health check:

```bash
curl http://localhost:8000/health
```

### Docker design

The Docker image intentionally uses a lightweight dependency set.

The current containerization milestone covers the **FastAPI API service and its application lifecycle**, while the heavyweight ML inference stack remains configured for local execution.

This avoids unnecessarily large container images containing PyTorch, Transformers, and model dependencies while still demonstrating containerized backend deployment.

---

## Accessibility

VisionAI includes an accessibility-oriented mode designed to make image analysis easier to consume without continuously reading the interface.

Accessibility mode can:

* Narrate the generated scene description
* Read analysis results aloud
* Read VQA answers using browser text-to-speech

The application uses the browser's native `SpeechSynthesis` API rather than requiring a separate speech service.

---

## Project Structure

```text
VisionAI/
│
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── requirements.docker.txt
│   ├── pytest.ini
│   ├── yolo26m.pt
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── analysis.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── captioner.py
│   │   │   ├── detector.py
│   │   │   └── vqa.py
│   │   │
│   │   └── utils/
│   │       ├── image_utils.py
│   │       └── timer.py
│   │
│   └── tests/
│       └── test_api.py
│
└── frontend/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    │
    ├── components/
    │   ├── Header.tsx
    │   ├── ImageViewer.tsx
    │   ├── UploadCard.tsx
    │   ├── VQASection.tsx
    │   └── Footer.tsx
    │
    └── package.json
```

---

## Future Improvements

Potential future engineering improvements include:

* Content-hash based inference caching
* Background inference jobs
* Job-status APIs for long-running inference
* Concurrent inference benchmarking
* Production model serving infrastructure
* GPU-enabled container deployment

These are intentionally outside the current scope of the project.

---

## Author

**Ipsita Pandey**

GitHub: https://github.com/ipsita675

LinkedIn: https://www.linkedin.com/in/ipsitapandey/

Email: [msipsitapandey@gmail.com](mailto:msipsitapandey@gmail.com)
