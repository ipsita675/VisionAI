from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


client = TestClient(app)


def create_test_image() -> BytesIO:
    image = Image.new("RGB", (100, 100), color="white")

    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    buffer.seek(0)

    return buffer


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "VisionAI API",
    }


def test_rejects_unsupported_file_type():
    response = client.post(
        "/api/analyze",
        files={
            "file": (
                "test.txt",
                b"this is not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert "Unsupported image format" in response.json()["detail"]


def test_rejects_empty_file():
    response = client.post(
        "/api/analyze",
        files={
            "file": (
                "empty.jpg",
                b"",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "The uploaded image is empty."


def test_rejects_empty_question():
    image = create_test_image()

    response = client.post(
        "/api/ask",
        files={
            "file": (
                "test.jpg",
                image,
                "image/jpeg",
            )
        },
        data={
            "question": "   ",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Question cannot be empty."


def test_analyze_returns_expected_structure(monkeypatch):
    def mock_generate_caption(image):
        return "A person standing outdoors."


    def mock_detect_objects(image):
        return [
            {
                "label": "person",
                "confidence": 0.95,
                "box": {
                    "x1": 10.0,
                    "y1": 20.0,
                    "x2": 80.0,
                    "y2": 90.0,
                },
            }
        ]


    monkeypatch.setattr(
        "app.main.generate_caption",
        mock_generate_caption,
    )

    monkeypatch.setattr(
        "app.main.detect_objects",
        mock_detect_objects,
    )

    image = create_test_image()

    response = client.post(
        "/api/analyze",
        files={
            "file": (
                "test.jpg",
                image,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["filename"] == "test.jpg"

    assert data["image"] == {
        "width": 100,
        "height": 100,
    }

    assert data["caption"] == "A person standing outdoors."

    assert len(data["detections"]) == 1
    assert data["detections"][0]["label"] == "person"
    assert data["detections"][0]["confidence"] == 0.95
    assert data["detections"][0]["box"] == {
        "x1": 10.0,
        "y1": 20.0,
        "x2": 80.0,
        "y2": 90.0,
    }