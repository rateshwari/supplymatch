"""
End-to-end matching service for SupplyMatch.

This service:
1. Fetches a client requirement.
2. Builds its semantic embedding.
3. Retrieves candidate supplier offerings through pgvector.
4. Applies the hybrid structured + semantic scoring logic.
5. Returns ranked, explainable matches.

Database persistence is intentionally handled separately so this
service remains straightforward to test.
"""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from supabase import Client

from app.services.embeddings import build_embedding_text, generate_embedding
from app.services.matching import MatchResult, calculate_match
from app.services.vector_search import find_similar_offerings


def get_requirement(
    supabase: Client,
    requirement_id: str,
) -> dict[str, Any]:
    """Fetch a requirement by ID."""

    response = (
        supabase.table("requirements")
        .select(
            "id, user_id, product, category_id, quantity, "
            "budget, location, timeline, notes"
        )
        .eq("id", requirement_id)
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found",
        )

    return response.data


def calculate_offering_match(
    requirement: dict[str, Any],
    offering: dict[str, Any],
) -> MatchResult:
    """Calculate a hybrid match between one requirement and offering."""

    return calculate_match(
        semantic_similarity=float(offering.get("similarity", 0.0)),
        requirement_category=requirement["category_id"],
        offering_category=offering["category_id"],
        requirement_location=requirement["location"],
        offering_location=offering["location"],
        requirement_quantity=requirement["quantity"],
        offering_quantity=offering["quantity"],
        requirement_budget=requirement["budget"],
        offering_price=offering["price"],
        requirement_timeline=requirement["timeline"],
        offering_delivery=offering["delivery"],
    )


def find_requirement_matches(
    supabase: Client,
    requirement_id: str,
    *,
    match_count: int = 20,
) -> list[dict[str, Any]]:
    """
    Find and rank supplier offerings for a requirement.

    The returned records contain the supplier offering plus the
    explainable hybrid match result.
    """

    requirement = get_requirement(
        supabase,
        requirement_id,
    )

    embedding_text = build_embedding_text(
        requirement["product"],
        requirement.get("notes"),
    )

    requirement_embedding = generate_embedding(embedding_text)

    offerings = find_similar_offerings(
        supabase,
        requirement_embedding,
        match_count=match_count,
    )

    ranked_matches: list[dict[str, Any]] = []

    for offering in offerings:
        result = calculate_offering_match(
            requirement,
            offering,
        )

        ranked_matches.append(
            {
                "offering_id": offering["id"],
                "supplier_user_id": offering["user_id"],
                "product": offering["product"],
                "category_id": offering["category_id"],
                "quantity": offering["quantity"],
                "price": offering["price"],
                "location": offering["location"],
                "delivery": offering["delivery"],
                "notes": offering.get("notes"),
                "semantic_similarity": offering.get("similarity", 0.0),
                "score": result.score,
                "breakdown": result.breakdown,
                "explanation": result.explanation,
                "tags": result.tags,
            }
        )

    ranked_matches.sort(
        key=lambda match: match["score"],
        reverse=True,
    )

    return ranked_matches