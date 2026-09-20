from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.auth import get_current_user
from app.deps import get_supabase_client
from app.schemas.requirement import RequirementCreateRequest

router = APIRouter(
    prefix="/api/v1/requirements",
    tags=["requirements"],
)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_requirement(
    requirement: RequirementCreateRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    payload = requirement.model_dump()
    payload["user_id"] = user_id

    response = (
        supabase
        .table("requirements")
        .insert(payload)
        .select(
            "id, user_id, product, category_id, quantity, "
            "budget, location, timeline, notes, created_at"
        )
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create requirement",
        )

    return response.data

@router.get("")
def get_my_requirements(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    response = (
        supabase
        .table("requirements")
        .select(
            "id, user_id, product, category_id, quantity, "
            "budget, location, timeline, notes, created_at"
        )
        .eq("user_id", user_id)
        .execute()
    )

    if response.data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirements not found",
        )

    return response.data