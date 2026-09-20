"""
Pure matching and scoring logic for SupplyMatch.

This module intentionally has no FastAPI or database dependencies.
It converts structured supplier/client information into normalized
scores and produces an explainable hybrid match result.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


# ---------------------------------------------------------------------------
# Scoring weights
# ---------------------------------------------------------------------------

SEMANTIC_WEIGHT = 0.50
CATEGORY_WEIGHT = 0.15
LOCATION_WEIGHT = 0.10
QUANTITY_WEIGHT = 0.10
BUDGET_WEIGHT = 0.10
DELIVERY_WEIGHT = 0.05


# ---------------------------------------------------------------------------
# Result model
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class MatchResult:
    """Complete explainable result for one requirement/offering pair."""

    score: int
    breakdown: dict[str, float]
    explanation: str
    tags: list[str]


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------

def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    """Keep a numeric score inside the [0, 1] interval."""
    return max(minimum, min(value, maximum))


def normalize_text(value: str) -> str:
    """Normalize text for simple deterministic comparisons."""
    return " ".join(value.lower().strip().split())


# ---------------------------------------------------------------------------
# Category scoring
# ---------------------------------------------------------------------------

def category_score(requirement_category: Any, offering_category: Any) -> float:
    """
    Score category compatibility.

    Exact category match = 1.0.
    Missing/invalid category = 0.0.
    """

    if requirement_category is None or offering_category is None:
        return 0.0

    return (
        1.0
        if str(requirement_category).strip() == str(offering_category).strip()
        else 0.0
    )


# ---------------------------------------------------------------------------
# Location scoring
# ---------------------------------------------------------------------------

def location_score(requirement_location: str, offering_location: str) -> float:
    """
    Score location compatibility.

    Current deterministic rules:

    - Exact normalized match: 1.0
    - One location contains the other: 0.8
    - Otherwise: 0.0

    This intentionally avoids external geocoding in the pure scoring layer.
    """

    if not requirement_location or not offering_location:
        return 0.0

    requirement = normalize_text(requirement_location)
    offering = normalize_text(offering_location)

    if requirement == offering:
        return 1.0

    if requirement in offering or offering in requirement:
        return 0.8

    return 0.0


# ---------------------------------------------------------------------------
# Numeric extraction
# ---------------------------------------------------------------------------

def extract_number(value: str) -> float | None:
    """
    Extract the first numeric value from a text field.

    Supports common formats such as:
        "500 kg"
        "₹2,00,000"
        "1.5 tons"
        "$5000"
    """

    if not value:
        return None

    cleaned = value.replace(",", "")

    match = re.search(r"\d+(?:\.\d+)?", cleaned)

    if not match:
        return None

    try:
        return float(match.group())
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Quantity scoring
# ---------------------------------------------------------------------------

def quantity_score(requirement_quantity: str, offering_quantity: str) -> float:
    """
    Score supplier quantity compatibility.

    If the supplier quantity is equal to or greater than the requested
    quantity, it receives 1.0.

    If the supplier quantity is smaller, the score is proportional to
    how much of the requested quantity it can cover.

    Missing/unparseable values receive 0.0.
    """

    required = extract_number(requirement_quantity)
    available = extract_number(offering_quantity)

    if required is None or available is None or required <= 0:
        return 0.0

    if available >= required:
        return 1.0

    return clamp(available / required)


# ---------------------------------------------------------------------------
# Budget / price scoring
# ---------------------------------------------------------------------------

def budget_score(requirement_budget: str, offering_price: str) -> float:
    """
    Score supplier price against the client's budget.

    Rules:

    - Price <= budget: 1.0
    - Price above budget: proportional penalty
    - Missing/unparseable values: 0.0
    """

    budget = extract_number(requirement_budget)
    price = extract_number(offering_price)

    if budget is None or price is None or budget <= 0 or price < 0:
        return 0.0

    if price <= budget:
        return 1.0

    return clamp(budget / price)


# ---------------------------------------------------------------------------
# Delivery / timeline scoring
# ---------------------------------------------------------------------------

def extract_days(value: str) -> float | None:
    """
    Extract an approximate number of days from a delivery/timeline string.

    Examples:
        "7 days" -> 7
        "within 5 days" -> 5
        "2 weeks" -> 14
        "48 hours" -> 2
    """

    if not value:
        return None

    text = normalize_text(value)

    number = extract_number(text)

    if number is None:
        return None

    if "week" in text:
        return number * 7

    if "hour" in text:
        return number / 24

    if "month" in text:
        return number * 30

    return number


def delivery_score(requirement_timeline: str, offering_delivery: str) -> float:
    """
    Score supplier delivery compatibility.

    If the supplier can deliver within the client's required timeline,
    score = 1.0.

    Otherwise the score is proportional to how close the supplier's
    delivery time is to the requested timeline.
    """

    required_days = extract_days(requirement_timeline)
    supplier_days = extract_days(offering_delivery)

    if required_days is None or supplier_days is None or required_days <= 0:
        return 0.0

    if supplier_days <= required_days:
        return 1.0

    return clamp(required_days / supplier_days)


# ---------------------------------------------------------------------------
# Semantic similarity
# ---------------------------------------------------------------------------

def semantic_score(similarity: float) -> float:
    """
    Normalize/validate cosine similarity returned by pgvector.

    Expected input range is [0, 1].
    """

    return clamp(float(similarity))


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------

def build_tags(
    *,
    semantic: float,
    category: float,
    location: float,
    quantity: float,
    budget: float,
    delivery: float,
) -> list[str]:
    """Generate human-readable tags from component scores."""

    tags: list[str] = []

    if semantic >= 0.85:
        tags.append("strong product similarity")
    elif semantic >= 0.70:
        tags.append("good product similarity")

    if category == 1.0:
        tags.append("same category")

    if location >= 0.8:
        tags.append("location compatible")

    if quantity >= 0.8:
        tags.append("quantity compatible")

    if budget >= 0.8:
        tags.append("budget compatible")

    if delivery >= 0.8:
        tags.append("delivery compatible")

    return tags


# ---------------------------------------------------------------------------
# Explanation
# ---------------------------------------------------------------------------

def build_explanation(
    *,
    semantic: float,
    category: float,
    location: float,
    quantity: float,
    budget: float,
    delivery: float,
) -> str:
    """Build a deterministic explanation for the match."""

    strengths: list[str] = []

    if semantic >= 0.85:
        strengths.append("strong product similarity")
    elif semantic >= 0.70:
        strengths.append("good product similarity")

    if category == 1.0:
        strengths.append("same category")

    if location >= 0.8:
        strengths.append("compatible location")

    if quantity >= 0.8:
        strengths.append("compatible quantity")

    if budget >= 0.8:
        strengths.append("compatible budget")

    if delivery >= 0.8:
        strengths.append("compatible delivery timeline")

    if not strengths:
        return "Limited compatibility based on the available matching fields."

    if len(strengths) == 1:
        return strengths[0].capitalize() + "."

    return (
        "Match based on "
        + ", ".join(strengths[:-1])
        + ", and "
        + strengths[-1]
        + "."
    ).capitalize()


# ---------------------------------------------------------------------------
# Final hybrid score
# ---------------------------------------------------------------------------

def calculate_match(
    *,
    semantic_similarity: float,
    requirement_category: Any,
    offering_category: Any,
    requirement_location: str,
    offering_location: str,
    requirement_quantity: str,
    offering_quantity: str,
    requirement_budget: str,
    offering_price: str,
    requirement_timeline: str,
    offering_delivery: str,
) -> MatchResult:
    """
    Calculate the complete hybrid match result.

    Every component is normalized to [0, 1].
    The weighted result is converted to an integer score from 0 to 100.
    """

    semantic = semantic_score(semantic_similarity)
    category = category_score(requirement_category, offering_category)
    location = location_score(requirement_location, offering_location)
    quantity = quantity_score(requirement_quantity, offering_quantity)
    budget = budget_score(requirement_budget, offering_price)
    delivery = delivery_score(requirement_timeline, offering_delivery)

    final_score = (
        semantic * SEMANTIC_WEIGHT
        + category * CATEGORY_WEIGHT
        + location * LOCATION_WEIGHT
        + quantity * QUANTITY_WEIGHT
        + budget * BUDGET_WEIGHT
        + delivery * DELIVERY_WEIGHT
    )

    score = round(clamp(final_score) * 100)

    breakdown = {
        "semantic_similarity": round(semantic, 4),
        "category": round(category, 4),
        "location": round(location, 4),
        "quantity": round(quantity, 4),
        "budget": round(budget, 4),
        "delivery": round(delivery, 4),
        "final_score": round(clamp(final_score), 4),
    }

    tags = build_tags(
        semantic=semantic,
        category=category,
        location=location,
        quantity=quantity,
        budget=budget,
        delivery=delivery,
    )

    explanation = build_explanation(
        semantic=semantic,
        category=category,
        location=location,
        quantity=quantity,
        budget=budget,
        delivery=delivery,
    )

    return MatchResult(
        score=score,
        breakdown=breakdown,
        explanation=explanation,
        tags=tags,
    )