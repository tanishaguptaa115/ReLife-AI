"""
ReLife AI - Recommendation Service
Handles POST /recommendation endpoint.
Returns a lightweight recommendation without full analysis.
Also exposes rule-based recommendation logic as a utility.
"""

from flask import Blueprint, request, jsonify
from gemini_service import analyze_item_image
from helpers import save_uploaded_file, validate_image_file, cleanup_file
import traceback

recommendation_bp = Blueprint("recommendation", __name__)


# Condition → Recommendation mapping (rule-based fallback)
CONDITION_RECOMMENDATION_MAP = {
    "Excellent": "Sell",
    "Good": "Sell",
    "Fair": "Repair",
    "Poor": "Recycle",
}

# Condition → eco score range (rule-based fallback)
CONDITION_ECO_SCORE_MAP = {
    "Excellent": 90,
    "Good": 75,
    "Fair": 55,
    "Poor": 30,
}


def rule_based_recommendation(condition: str) -> dict:
    """
    Fallback rule-based recommendation if Gemini fails.
    Returns recommendation and eco_score based on condition string.
    """
    condition = condition.strip().capitalize()
    recommendation = CONDITION_RECOMMENDATION_MAP.get(condition, "Donate")
    eco_score = CONDITION_ECO_SCORE_MAP.get(condition, 50)
    return {
        "recommendation": recommendation,
        "eco_score": eco_score,
        "source": "rule_based",
    }


@recommendation_bp.route("/recommendation", methods=["POST"])
def get_recommendation():
    """
    POST /recommendation
    Accepts multipart/form-data with an image file under key 'image'.
    Returns a lightweight recommendation with eco score and reason.
    Faster than /analyze — focused response only.
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

        # Reuse full analysis — extract only recommendation fields
        result = analyze_item_image(image_path)

        response = {
            "item_name": result.get("item_name", "Unknown Item"),
            "condition": result.get("condition", "Fair"),
            "recommendation": result.get("recommendation", "Donate"),
            "eco_score": int(result.get("sustainability_score", 50)),
            "reason": result.get("explanation", "No explanation available"),
            "source": "gemini_vision",
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
            "message": "An unexpected error occurred."
        }), 500

    finally:
        if image_path:
            cleanup_file(image_path)
