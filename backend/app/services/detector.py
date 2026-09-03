from pathlib import Path

from PIL import Image
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BASE_DIR / "yolo26m.pt"

_model = None


def _load_model():
    global _model

    if _model is None:
        print("Loading YOLO26m model...")

        try:
            _model = YOLO(str(MODEL_PATH))

        except Exception as exc:
            _model = None

            raise RuntimeError(
                "Failed to load the YOLO26m object detection model."
            ) from exc

        print("YOLO26m model loaded successfully.")

    return _model


def detect_objects(image: Image.Image) -> list[dict]:
    try:
        model = _load_model()

        results = model.predict(
            source=image,
            conf=0.25,
            verbose=False,
        )

        detections = []

        for result in results:
            if result.boxes is None:
                continue

            boxes = result.boxes

            for i in range(len(boxes)):
                class_id = int(boxes.cls[i].item())
                confidence = float(boxes.conf[i].item())

                x1, y1, x2, y2 = boxes.xyxy[i].tolist()

                detections.append(
                    {
                        "label": model.names[class_id],
                        "confidence": round(confidence, 4),
                        "box": {
                            "x1": round(x1, 2),
                            "y1": round(y1, 2),
                            "x2": round(x2, 2),
                            "y2": round(y2, 2),
                        },
                    }
                )

        return detections

    except RuntimeError:
        raise

    except Exception as exc:
        raise RuntimeError(
            "YOLO object detection inference failed."
        ) from exc