"""
ReLife AI - Helper Utilities
File handling: validation, saving, and cleanup.
"""

import os
import uuid
from werkzeug.utils import secure_filename
from config import Config


def allowed_file(filename: str) -> bool:
    """Check if the file extension is in the allowed list."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    )


def validate_image_file(file) -> tuple[bool, str]:
    """
    Validate that the uploaded file is an allowed image type.

    Returns:
        (True, "") if valid
        (False, error_message) if invalid
    """
    if not file or file.filename == "":
        return False, "No file selected"

    if not allowed_file(file.filename):
        allowed = ", ".join(Config.ALLOWED_EXTENSIONS)
        return False, f"File type not allowed. Accepted formats: {allowed}"

    return True, ""


def save_uploaded_file(file) -> str:
    """
    Save the uploaded file to the uploads directory with a UUID filename.
    Returns the full path to the saved file.

    Using UUID prevents:
    - Filename collisions under concurrent requests
    - Path traversal attacks from crafted filenames
    """
    extension = file.filename.rsplit(".", 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{extension}"
    safe_filename = secure_filename(unique_filename)

    upload_path = os.path.join(Config.UPLOAD_FOLDER, safe_filename)
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    file.save(upload_path)

    return upload_path


def cleanup_file(file_path: str) -> None:
    """
    Delete the temporary file after processing.
    Silently ignores errors — cleanup is best-effort.
    """
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        pass  # Don't crash the response if cleanup fails


def format_inr(amount: int) -> str:
    """Format an integer as Indian Rupees string."""
    return f"₹{amount:,}"


def clamp_score(score: int, min_val: int = 0, max_val: int = 100) -> int:
    """Clamp a score to a valid 0-100 range."""
    return max(min_val, min(max_val, score))
