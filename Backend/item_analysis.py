"""
ReLife AI - Item Analysis Service
Handles POST /analyze endpoint.
"""

from flask import Blueprint, request, jsonify
from gemini_service import analyze_item_image
from helpers import save_uploaded_file, validate_image_file, cleanup_file
import traceback

item_analysis_bp = Blueprint("item_analysis", __name__)


@item_analysis_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    POST /analyze
    Accepts multipart/form-data with an image file under key 'image'.
    Returns full item analysis including resale value, condition, and recommendation.
    """

    # Validate file presence
    if "image" not in request.files:
        return jsonify({
            "error": "No image provided",
            "message": "Send a multipart/form-data request with key 'image'"
        }), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({
            "error": "Empty filename",
            "message": "The uploaded file has no name"
        }), 400

    # Validate image type
    is_valid, error_msg = validate_image_file(file)
    if not is_valid:
        return jsonify({"error": "Invalid file", "message": error_msg}), 400

    # Save file temporarily
    image_path = None
    try:
        image_path = save_uploaded_file(file)

        # Call Gemini Vision
        result = analyze_item_image(image_path)

        print("=" * 60)
        print("GEMINI RESULT:")
        print(result)
        print("=" * 60)

        # Normalize and validate output fields
        response = {
            "item_name": result.get("item_name", "Unknown Item"),
            "category": result.get("category", "Other"),
            "condition": result.get("condition", "Fair"),
            "estimated_value": result.get("estimated_resale_value", "N/A"),
            "recommendation": result.get("recommendation", "Donate"),
            "eco_score": int(result.get("sustainability_score", 50)),
            "reason": result.get("explanation", "No explanation provided"),
        }

        return jsonify(response), 200

    except FileNotFoundError as e:
        return jsonify({"error": "File error", "message": str(e)}), 500

    except ValueError as e:
        return jsonify({
            "error": "AI processing error",
            "message": str(e)
        }), 502

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred. Check server logs."
        }), 500

    finally:
        # Always clean up the temp file
        if image_path:
            cleanup_file(image_path)
