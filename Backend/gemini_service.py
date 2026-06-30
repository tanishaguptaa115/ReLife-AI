"""
ReLife AI - Gemini Vision Service
Handles all communication with Google Gemini Vision API.
"""

import google.generativeai as genai
from PIL import Image
import json
import re
import os
from config import Config


def _configure_gemini():
    """Configure the Gemini client with API key."""
    api_key = Config.GEMINI_API_KEY
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not set. Add it to your .env file."
        )
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(Config.GEMINI_MODEL)


def _load_image(image_path: str) -> Image.Image:
    """Load image from disk."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")
    return Image.open(image_path)


def _parse_gemini_json(raw_text: str) -> dict:
    """
    Safely parse Gemini response.
    Strips markdown code fences if Gemini wraps the JSON in them.
    """
    cleaned = raw_text.strip()

    # Strip ```json ... ``` or ``` ... ```
    cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Gemini returned non-JSON response. Raw output: {raw_text[:500]}"
        ) from e


ANALYSIS_PROMPT = """
You are an expert sustainability advisor and resale market analyst in India.

Analyze the uploaded image carefully and return a JSON object with EXACTLY these fields:

{{
  "item_name": "specific name of the item (e.g., Wooden Chair, Samsung TV)",
  "category": "one of: Furniture, Electronics, Clothing, Books, Appliances, Toys, Sports, Kitchen, Decor, Other",
  "condition": "one of: Excellent, Good, Fair, Poor",
  "estimated_resale_value": "realistic Indian resale price as string (e.g., ₹2500)",
  "recommendation": "one of: Sell, Donate, Repair, Recycle",
  "sustainability_score": integer between 0 and 100,
  "explanation": "1-2 sentence reason for the recommendation and score"
}}

Rules:
- Estimate resale value based on Indian second-hand market (OLX, Quikr, Facebook Marketplace India)
- Condition must match visible wear, damage, and age of item
- Recommendation logic: Excellent → Sell, Good → Sell or Donate, Fair → Repair, Poor → Recycle
- Sustainability score: higher = more eco-friendly outcome (recycling/donating > landfill)
- Return ONLY the raw JSON object. No markdown, no explanation outside JSON.
"""

SUSTAINABILITY_PROMPT = """
You are a sustainability expert.

Analyze the uploaded item image and return a JSON object with EXACTLY these fields:

{{
  "item_name": "name of the item",
  "waste_reduction_score": integer between 0 and 100,
  "carbon_impact": "Low / Medium / High",
  "carbon_impact_kg": float representing estimated CO2 saved in kg if reused,
  "circular_economy_score": integer between 0 and 100,
  "landfill_risk": "Low / Medium / High",
  "recommended_action": "one of: Sell, Donate, Repair, Recycle",
  "environmental_benefit": "1 sentence describing the environmental benefit of the recommended action"
}}

Rules:
- Waste reduction score: how much waste is avoided if item is reused vs discarded
- Carbon impact: estimated environmental burden of producing this item type
- Circular economy score: how well this item fits reuse/resale ecosystems
- Return ONLY the raw JSON object. No markdown.
"""


def analyze_item_image(image_path: str) -> dict:
    """
    Send image to Gemini Vision and get full item analysis.

    Args:
        image_path: Local path to the uploaded image.

    Returns:
        Parsed dict with item analysis fields.

    Raises:
        ValueError: If Gemini returns unparseable output.
        FileNotFoundError: If image file doesn't exist.
    """
    model = _configure_gemini()
    image = _load_image(image_path)

    response = model.generate_content(
        [ANALYSIS_PROMPT, image],
        generation_config=genai.GenerationConfig(
            temperature=0.0,  # Low temp = consistent, factual output
            max_output_tokens=1024,
        ),
    )

    return _parse_gemini_json(response.text)


def analyze_sustainability_image(image_path: str) -> dict:
    """
    Send image to Gemini Vision and get detailed sustainability breakdown.

    Args:
        image_path: Local path to the uploaded image.

    Returns:
        Parsed dict with sustainability fields.
    """
    model = _configure_gemini()
    image = _load_image(image_path)

    response = model.generate_content(
        [SUSTAINABILITY_PROMPT, image],
        generation_config=genai.GenerationConfig(
            temperature=0.0,
            max_output_tokens=1024,
        ),
    )

    return _parse_gemini_json(response.text)
