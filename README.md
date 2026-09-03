# VisionAI

A multimodal image analysis platform that combines image captioning, object detection, and visual question answering in a single web application.

## Overview

VisionAI allows users to upload an image and receive multiple forms of AI-powered analysis:

* **Image Captioning** — generates a natural-language description of the image using BLIP-large.
* **Object Detection** — detects objects, confidence scores, and bounding boxes using YOLO26m.
* **Visual Question Answering** — answers natural-language questions about the uploaded image using a BLIP VQA model.
* **Accessibility Mode** — provides read-aloud support for generated descriptions and answers.
* **Interactive Visualization** — displays detected objects with bounding boxes and supports switching between the original and annotated image.

The application is designed as a full-stack inference system with a Next.js frontend and FastAPI backend.

## Architecture

```text
┌──────────────────────┐
│      Next.js UI      │
│                      │
│  Upload / Results    │
│  Detection Viewer    │
│  VQA / Accessibility│
└──────────┬───────────┘
           │ HTTP
           ▼
┌──────────────────────┐
│      FastAPI API     │
│                      │
│  Image Validation    │
│  Request Handling    │
│  Error Handling      │
│  Performance Logging │
└───────┬──────┬───────┘
        │      │
        ▼      ▼
   ┌────────┐ ┌────────┐
   │  BLIP  │ │ YOLO26m│
   │Caption │ │Detection│
   └────────┘ └────────┘
        │
        ▼
   ┌──────────────┐
   │   BLIP VQA   │
   │   Question   │
   │   Answering  │
   └──────────────┘
```

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* CSS

### Backend

* FastAPI
* Python
* Uvicorn
* Pillow

### Machine Learning

* Salesforce BLIP-large — image captioning
* YOLO26m — object detection
* BLIP VQA — visual question answering
* PyTorch
* Hugging Face Transformers
* Ultralytics

### Testing

* Pytest
* FastAPI TestClient
* HTTPX

## Features

### Image Upload

Supports:

* JPEG
* PNG
* WebP

Uploaded images are validated before inference, including:

* MIME type validation
* Empty-file detection
* Maximum file size validation
* Image-content validation

Maximum upload size: **10 MB**

### Image Captioning

BLIP-large generates a natural-language description of the uploaded image.

### Object Detection

YOLO26m identifies objects and returns:

* Object label
* Confidence score
* Bounding box coordinates

The frontend visualizes these detections directly on the image.

### Visual Question Answering

Users can ask questions about the uploaded image and receive model-generated answers.

The interface also generates contextual example questions based on detected objects.

### Accessibility

Accessibility mode provides:

* Read-aloud support using browser speech synthesis
* Narration of generated scene descriptions
* Read-aloud support for VQA answers

## API

### Health Check

```http
GET /health
```

Returns the API health status.

### Image Analysis

```http
POST /api/analyze
```

Accepts an image upload and returns:

* Image dimensions
* Generated caption
* Object detections
* Confidence scores
* Bounding boxes

### Visual Question Answering

```http
POST /api/ask
```

Accepts:

* Image upload
* Natural-language question

Returns the generated answer.

## Project Structure

```text
VisionAI/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── services/
│   │   │   ├── captioner.py
│   │   │   ├── detector.py
│   │   │   └── vqa.py
│   │   └── utils/
│   │       ├── image_utils.py
│   │       └── timer.py
│   ├── tests/
│   │   └── test_api.py
│   ├── requirements.txt
│   └── pytest.ini
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── UploadCard.tsx
│   │   ├── ImageViewer.tsx
│   │   ├── VQASection.tsx
│   │   └── Footer.tsx
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/ipsita675/VisionAI.git
cd VisionAI
```

### 2. Backend

Create and activate a virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn app.main:app --reload
```

The backend runs on:

```text
http://localhost:8000
```

### 3. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

## Testing

Backend API tests can be run with:

```bash
cd backend
pytest
```

The test suite covers:

* Health endpoint
* Invalid file types
* Empty uploads
* Invalid VQA requests
* Successful analysis response structure

## Model Weights

Large model files are intentionally excluded from Git.

The YOLO26m weights file is ignored through `.gitignore` and should be made available locally during setup.

BLIP model weights are loaded through Hugging Face Transformers when the application initializes the models.

## Engineering Considerations

VisionAI includes several production-oriented considerations beyond basic model inference:

* Centralized image validation
* Explicit upload-size limits
* MIME-type validation
* Lazy model loading
* Device-aware PyTorch inference
* Inference timing instrumentation
* Structured application logging
* Graceful API error handling
* Automated API tests
* Separation of API, service, and utility layers
* Frontend loading and error states

## Future Improvements

Potential extensions include:

* Asynchronous inference workers for heavier workloads
* Model caching and lifecycle management
* Persistent analysis history
* GPU-backed deployment
* Containerized deployment
* Additional vision models and analysis tasks

## Author

**Ipsita Pandey**

Electrical Engineering, IIT Ropar

* GitHub: https://github.com/ipsita675
* LinkedIn: https://www.linkedin.com/in/ipsitapandey/
* Email: [msipsitapandey@gmail.com](mailto:msipsitapandey@gmail.com)
