import logging

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.schemas.analysis import AnalysisResponse, VQAResponse
from app.utils.image_utils import validate_and_load_image
from app.utils.timer import Timer


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VisionAI API",
    description=(
        "Computer vision API for image captioning, "
        "object detection, and visual question answering."
    ),
    version="1.0.0",
)


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "VisionAI API",
    }


# ---------------------------------------------------------------------------
# Image analysis
# ---------------------------------------------------------------------------

@app.post(
    "/api/analyze",
    response_model=AnalysisResponse,
)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an uploaded image using:
    - BLIP-large for image captioning
    - YOLO26m for object detection
    """

    try:
        from app.services.captioner import generate_caption
        from app.services.detector import detect_objects

        with Timer() as request_timer:

            try:
                with Timer() as validation_timer:
                    image = await validate_and_load_image(file)

            except Exception:
                logger.exception(
                    "ANALYZE | image validation failed"
                )
                raise

            try:
                with Timer() as caption_timer:
                    caption = generate_caption(image)

            except Exception:
                logger.exception(
                    "ANALYZE | captioning failed"
                )
                raise

            try:
                with Timer() as detection_timer:
                    detections = detect_objects(image)

            except Exception:
                logger.exception(
                    "ANALYZE | object detection failed"
                )
                raise

        logger.info(
            "ANALYZE | validation=%.2fms | caption=%.2fms | "
            "detection=%.2fms | request=%.2fms",
            validation_timer.elapsed_ms,
            caption_timer.elapsed_ms,
            detection_timer.elapsed_ms,
            request_timer.elapsed_ms,
        )

        return {
            "success": True,
            "filename": file.filename,
            "image": {
                "width": image.width,
                "height": image.height,
            },
            "caption": caption,
            "detections": detections,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "ANALYZE | request failed | filename=%s",
            file.filename,
        )

        raise HTTPException(
            status_code=500,
            detail="Image analysis failed. Please try again.",
        ) from exc


# ---------------------------------------------------------------------------
# Visual question answering
# ---------------------------------------------------------------------------

@app.post(
    "/api/ask",
    response_model=VQAResponse,
)
async def ask_question(
    file: UploadFile = File(...),
    question: str = Form(""),
):
    """
    Answer a natural-language question about an uploaded image
    using the BLIP visual question answering model.
    """

    if not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    try:
        from app.services.vqa import answer_question

        image = await validate_and_load_image(file)

        with Timer() as vqa_timer:
            answer = answer_question(
                image=image,
                question=question,
            )

        logger.info(
            "VQA | inference=%.2fms",
            vqa_timer.elapsed_ms,
        )

        return {
            "success": True,
            "question": question.strip(),
            "answer": answer,
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("VQA failed")

        raise HTTPException(
            status_code=500,
            detail="Unable to answer the question. Please try again.",
        ) from exc