from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.auth import require_supplier_user
from app.deps import get_supabase_client
from app.schemas.offering import (
    OfferingCreateRequest,
    OfferingResponse,
)

router = APIRouter(
    prefix="/api/v1/offerings",
    tags=["offerings"],
)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=OfferingResponse,
)
def create_offering(
    offering: OfferingCreateRequest,
    current_user: dict = Depends(require_supplier_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    category_response = (
        supabase
        .table("categories")
        .select("id")
        .eq("id", offering.category_id)
        .maybe_single()
        .execute()
    )

    if not category_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    payload = offering.model_dump()
    payload["user_id"] = user_id

    response = (
        supabase
        .table("offerings")
        .insert(payload)
        .select(
            "id, user_id, product, category_id, quantity, "
            "price, location, delivery, notes, created_at"
        )
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create offering",
        )

    return response.data


@router.get(
    "",
    response_model=list[OfferingResponse],
)
def get_my_offerings(
    current_user: dict = Depends(require_supplier_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    response = (
        supabase
        .table("offerings")
        .select(
            "id, user_id, product, category_id, quantity, "
            "price, location, delivery, notes, created_at"
        )
        .eq("user_id", user_id)
        .execute()
    )

    if response.data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offerings not found",
        )

    return response.data