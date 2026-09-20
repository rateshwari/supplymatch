from __future__ import annotations

from typing import Any

from supabase import Client


def create_match_notification(
    supabase: Client,
    *,
    supplier_user_id: str,
    match_id: str,
    requirement_product: str,
    score: int,
) -> dict[str, Any] | None:
    """
    Create a supplier notification for a match if one does not
    already exist for the same supplier and match.
    """

    existing_response = (
        supabase.table("notifications")
        .select("id")
        .eq("user_id", supplier_user_id)
        .eq("match_id", match_id)
        .limit(1)
        .execute()
    )

    if existing_response.data:
        return None

    message = (
        f"New requirement match for {requirement_product} "
        f"with a match score of {score}%."
    )

    response = (
        supabase.table("notifications")
        .insert(
            {
                "user_id": supplier_user_id,
                "match_id": match_id,
                "message": message,
                "read": False,
            }
        )
        .select(
            "id, user_id, match_id, message, read, created_at"
        )
        .maybe_single()
        .execute()
    )

    return response.data