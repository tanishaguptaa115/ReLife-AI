"""
ReLife AI - Sustainability Score Service
Handles POST /sustainability-score endpoint.
"""

from flask import Blueprint, request, jsonify
from gemini_service import analyze_sustainability_image
from helpers import save_uploaded_file, validate_image_file, cleanup_file
import traceback

sustainability_bp = Blueprint("sustainability", __name__)


@sustainability_bp.route("/sustainability-score", methods=["POST"])
def sustainability_score():
    """
    POST /sustainability-score
    Accepts multipart/form-data with an image file under key 'image'.
    Returns detailed sustainability breakdown: waste reduction, carbon impact,
    circular economy score.
    """

    if "image" not in request.files:
        return jsonify({
            "error": "No image provided",
            "message": "Send a multipart/form-data request with key 'image'"
        }), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "Empty filename", "message": "File has no name"}), 400

    is_valid, error_msg = validate_image_file(file)
    if not is_valid:
        return jsonify({"error": "Invalid file", "message": error_msg}), 400

    image_path = None
    try:
        image_path = save_uploaded_file(file)

        result = analyze_sustainability_image(image_path)

        response = {
            "item_name": result.get("item_name", "Unknown Item"),
            "waste_reduction_score": int(result.get("waste_reduction_score", 50)),
            "carbon_impact": result.get("carbon_impact", "Medium"),
            "carbon_impact_kg": float(result.get("carbon_impact_kg", 0.0)),
            "circular_economy_score": int(result.get("circular_economy_score", 50)),
            "landfill_risk": result.get("landfill_risk", "Medium"),
            "recommended_action": result.get("recommended_action", "Donate"),
            "environmental_benefit": result.get(
                "environmental_benefit",
                "Reusing this item reduces landfill waste."
            ),
        }

        return jsonify(response), 200

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
        if image_path:
            cleanup_file(image_path)
