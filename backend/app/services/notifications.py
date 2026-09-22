from __future__ import annotations

from typing import Any

from supabase import Client


def _create_notification(
    supabase: Client,
    *,
    user_id: str,
    match_id: str,
    message: str,
) -> dict[str, Any] | None:
    """
    Create a notification if the exact notification does not
    already exist for the user and match.
    """

    existing_response = (
        supabase.table("notifications")
        .select("id")
        .eq("user_id", user_id)
        .eq("match_id", match_id)
        .eq("message", message)
        .limit(1)
        .execute()
    )

    if existing_response.data:
        return None

    response = (
        supabase.table("notifications")
        .insert(
            {
                "user_id": user_id,
                "match_id": match_id,
                "message": message,
                "read": False,
            }
        )
        .select(
            "id, user_id, match_id, message, read, created_at"
        )
        .execute()
    )

    if not response or not response.data:
        return None

    return response.data[0]


def create_match_request_notifications(
    supabase: Client,
    *,
    client_user_id: str,
    supplier_user_id: str,
    match_id: str,
    requirement_product: str,
    score: int,
) -> None:
    """
    Notify both parties after a client sends a match request.
    """

    _create_notification(
        supabase,
        user_id=supplier_user_id,
        match_id=match_id,
        message=(
            f"New match request for {requirement_product} "
            f"with a match score of {score}%."
        ),
    )

    _create_notification(
        supabase,
        user_id=client_user_id,
        match_id=match_id,
        message=(
            f"Match request sent for {requirement_product}. "
            f"The supplier has been notified."
        ),
    )


def create_match_acceptance_notification(
    supabase: Client,
    *,
    client_user_id: str,
    match_id: str,
    requirement_product: str,
) -> None:
    """
    Notify the client when the supplier accepts the match.
    """

    _create_notification(
        supabase,
        user_id=client_user_id,
        match_id=match_id,
        message=(
            f"Your supplier match for {requirement_product} "
            f"has been accepted."
        ),
    )