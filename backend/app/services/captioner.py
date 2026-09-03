import torch
from PIL import Image
from transformers import BlipForConditionalGeneration, BlipProcessor


MODEL_NAME = "Salesforce/blip-image-captioning-large"


_processor = None
_model = None


def _get_device():
    if torch.backends.mps.is_available():
        return torch.device("mps")

    return torch.device("cpu")


def _load_model():
    global _processor, _model

    if _processor is None or _model is None:
        device = _get_device()

        print(
            f"Loading BLIP-large image captioning model on {device}..."
        )

        try:
            _processor = BlipProcessor.from_pretrained(MODEL_NAME)

            _model = BlipForConditionalGeneration.from_pretrained(
                MODEL_NAME
            )

            _model.to(device)
            _model.eval()

        except Exception as exc:
            _processor = None
            _model = None

            raise RuntimeError(
                "Failed to load the BLIP-large image captioning model."
            ) from exc

        print("BLIP-large model loaded successfully.")

    return _processor, _model


def generate_caption(image: Image.Image) -> str:
    try:
        processor, model = _load_model()

        device = next(model.parameters()).device

        inputs = processor(
            images=image,
            return_tensors="pt",
        )

        inputs = {
            key: value.to(device)
            for key, value in inputs.items()
        }

        with torch.no_grad():
            output = model.generate(
                **inputs,
                max_new_tokens=60,
                num_beams=3,
                repetition_penalty=1.1,
            )

        caption = processor.decode(
            output[0],
            skip_special_tokens=True,
        )

        caption = caption.strip()

        if not caption:
            raise RuntimeError(
                "BLIP returned an empty caption."
            )

        return caption

    except RuntimeError:
        raise

    except Exception as exc:
        raise RuntimeError(
            "BLIP image captioning inference failed."
        ) from exc