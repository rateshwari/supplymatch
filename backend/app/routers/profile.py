from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.auth import get_current_user
from app.deps import get_supabase_client
from app.schemas.profile import ProfileUpdateRequest

router = APIRouter(
    prefix="/api/v1/profile",
    tags=["profile"],
)


@router.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    response = (
        supabase
        .table("profiles")
        .select("id, role, name, company, created_at")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return response.data


@router.patch("/me")
def update_my_profile(
    profile_update: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    updates = profile_update.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one profile field must be provided",
        )

    if any(value is None for value in updates.values()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile fields cannot be null",
        )

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one profile field must be provided",
        )

    response = (
        supabase
        .table("profiles")
        .update(updates)
        .eq("id", user_id)
        .select("id, role, name, company, created_at")
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return response.data