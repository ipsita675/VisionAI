from io import BytesIO

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError


MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


async def validate_and_load_image(file: UploadFile) -> Image.Image:
    """
    Validate an uploaded image and return it as an RGB PIL Image.

    Validation includes:
    - supported MIME type
    - non-empty file
    - maximum file size
    - valid image contents
    """

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Could not determine the uploaded file type.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported image format. "
                "Please upload a JPEG, PNG, or WebP image."
            ),
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Maximum allowed size is 10 MB.",
        )

    try:
        image = Image.open(BytesIO(contents))
        image.load()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    return image.convert("RGB")