"""
Vector search service for SupplyMatch.

Retrieves supplier offerings using pgvector cosine similarity.
The database performs the actual vector search through Supabase.
"""

from __future__ import annotations

from typing import Any

from supabase import Client


DEFAULT_MATCH_COUNT = 20


def find_similar_offerings(
    supabase: Client,
    query_embedding: list[float],
    *,
    match_count: int = DEFAULT_MATCH_COUNT,
) -> list[dict[str, Any]]:
    """
    Find supplier offerings semantically similar to a query embedding.

    Args:
        supabase: Existing Supabase service-role client.
        query_embedding: 384-dimensional query embedding.
        match_count: Maximum number of candidates to retrieve.

    Returns:
        Supplier offering records ordered by similarity.

    Raises:
        ValueError: If the embedding dimension is invalid or match_count
            is outside the allowed range.
    """

    if len(query_embedding) != 384:
        raise ValueError(
            f"Expected a 384-dimensional embedding, got {len(query_embedding)}."
        )

    if not 1 <= match_count <= 100:
        raise ValueError("match_count must be between 1 and 100.")

    response = supabase.rpc(
        "match_offerings",
        {
            "query_embedding": query_embedding,
            "match_count": match_count,
        },
    ).execute()

    return response.data or []