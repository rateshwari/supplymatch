from fastapi import APIRouter, Depends, status
from supabase import Client

from app.auth import get_current_user
from app.deps import get_supabase_client
from app.schemas.notification import NotificationResponse
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["notifications"],
)


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_my_notifications(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    response = (
        supabase.table("notifications")
        .select(
            "id, user_id, match_id, message, read, created_at"
        )
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    response = (
        supabase.table("notifications")
        .update({"read": True})
        .eq("id", notification_id)
        .eq("user_id", user_id)
        .select(
            "id, user_id, match_id, message, read, created_at"
        )
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return response.data