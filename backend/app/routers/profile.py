from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.auth import get_current_user
from app.deps import get_supabase_client

router = APIRouter(
    prefix="/api/v1/profile",
    tags=["profile"],
)


@router.get("/me")
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    response = (
        supabase
        .table("profiles")
        .select("id, role, name, company, created_at")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return response.data
