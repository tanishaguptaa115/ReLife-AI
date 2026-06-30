"""
ReLife AI - Response Schemas
Defines the expected structure of all API responses.
Used for documentation and as reference for response builders.
These are dataclasses — not enforced at runtime, but useful for
IDE autocompletion and keeping response shapes consistent.
"""

from dataclasses import dataclass, asdict
from typing import Literal


@dataclass
class ItemAnalysisResponse:
    item_name: str
    category: str
    condition: Literal["Excellent", "Good", "Fair", "Poor"]
    estimated_value: str
    recommendation: Literal["Sell", "Donate", "Repair", "Recycle"]
    eco_score: int  # 0-100
    reason: str

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class SustainabilityResponse:
    item_name: str
    waste_reduction_score: int      # 0-100
    carbon_impact: Literal["Low", "Medium", "High"]
    carbon_impact_kg: float         # Estimated CO2 saved in kg
    circular_economy_score: int     # 0-100
    landfill_risk: Literal["Low", "Medium", "High"]
    recommended_action: Literal["Sell", "Donate", "Repair", "Recycle"]
    environmental_benefit: str

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class RecommendationResponse:
    item_name: str
    condition: Literal["Excellent", "Good", "Fair", "Poor"]
    recommendation: Literal["Sell", "Donate", "Repair", "Recycle"]
    eco_score: int
    reason: str
    source: Literal["gemini_vision", "rule_based"]

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ErrorResponse:
    error: str
    message: str

    def to_dict(self) -> dict:
        return asdict(self)


# Valid values reference
VALID_CONDITIONS = ["Excellent", "Good", "Fair", "Poor"]
VALID_RECOMMENDATIONS = ["Sell", "Donate", "Repair", "Recycle"]
VALID_CATEGORIES = [
    "Furniture", "Electronics", "Clothing", "Books",
    "Appliances", "Toys", "Sports", "Kitchen", "Decor", "Other"
]
VALID_CARBON_IMPACT = ["Low", "Medium", "High"]
