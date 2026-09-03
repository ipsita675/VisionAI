import torch
from PIL import Image
from transformers import BlipForQuestionAnswering, BlipProcessor


MODEL_NAME = "Salesforce/blip-vqa-base"

_processor = None
_model = None


def _load_model():
    global _processor, _model

    if _processor is None or _model is None:
        print("Loading BLIP VQA model...")

        _processor = BlipProcessor.from_pretrained(MODEL_NAME)
        _model = BlipForQuestionAnswering.from_pretrained(MODEL_NAME)

        _model.eval()

        print("BLIP VQA model loaded successfully.")

    return _processor, _model


def answer_question(image: Image.Image, question: str) -> str:
    if not question or not question.strip():
        raise ValueError("Question cannot be empty.")

    processor, model = _load_model()

    inputs = processor(
        images=image,
        text=question.strip(),
        return_tensors="pt",
    )

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=30,
            num_beams=3,
        )

    answer = processor.decode(
        output[0],
        skip_special_tokens=True,
    )

    return answer.strip()