from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.auth import get_current_user
from app.deps import get_supabase_client
from app.schemas.profile import ProfileCreateRequest, ProfileUpdateRequest

router = APIRouter(
    prefix="/api/v1/profile",
    tags=["profile"],
)


@router.post(
    "/me",
    status_code=status.HTTP_201_CREATED,
)
def create_my_profile(
    profile: ProfileCreateRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    existing_response = (
        supabase
        .table("profiles")
        .select("id")
        .eq("id", user_id)
        .execute()
    )

    if existing_response and existing_response.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profile already exists",
        )

    payload = profile.model_dump()
    payload["id"] = user_id

    response = (
        supabase
        .table("profiles")
        .insert(payload)
        .select("id, role, name, company, created_at")
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create profile",
        )

    return response.data[0]


@router.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    response = (
        supabase.table("profiles")
        .select("id, role, name, company, created_at")
        .eq("id", user_id)
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return response.data[0]


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

    if "name" in updates and updates["name"] is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile name cannot be null",
        )

    response = (
        supabase
        .table("profiles")
        .update(updates)
        .eq("id", user_id)
        .select("id, role, name, company, created_at")
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return response.data[0]