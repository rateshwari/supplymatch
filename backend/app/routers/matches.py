from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.auth import require_client_user
from app.deps import get_supabase_client
from app.schemas.match import MatchResponse
from app.services.matching_service import find_requirement_matches
from app.services.notifications import create_match_notification

router = APIRouter(
    prefix="/api/v1/requirements",
    tags=["matches"],
)


def verify_requirement_ownership(
    supabase: Client,
    requirement_id: str,
    user_id: str,
) -> None:
    response = (
        supabase.table("requirements")
        .select("id")
        .eq("id", requirement_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found",
        )


@router.post(
    "/{requirement_id}/matches",
    response_model=list[MatchResponse],
)
def generate_requirement_matches(
    requirement_id: str,
    current_user: dict = Depends(require_client_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    verify_requirement_ownership(
        supabase,
        requirement_id,
        user_id,
    )

    ranked_matches = find_requirement_matches(
        supabase,
        requirement_id,
    )

    if not ranked_matches:
        return []

    persisted_matches: list[dict] = []

    for match in ranked_matches:
        payload = {
            "requirement_id": requirement_id,
            "offering_id": match["offering_id"],
            "score": match["score"],
            "breakdown": match["breakdown"],
            "explanation": match["explanation"],
            "tags": match["tags"],
            "status": "pending",
        }

        response = (
            supabase.table("matches")
            .upsert(
                payload,
                on_conflict="requirement_id,offering_id",
            )
            .select(
                "id, requirement_id, offering_id, score, "
                "breakdown, explanation, tags, status, created_at"
            )
            .maybe_single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to save match",
            )

        persisted_matches.append(response.data)
        create_match_notification(
            supabase,
            supplier_user_id=match["supplier_user_id"],
            match_id=response.data["id"],
            requirement_product=match["product"],
            score=match["score"],
        )

    return persisted_matches


@router.get(
    "/{requirement_id}/matches",
    response_model=list[MatchResponse],
)
def get_requirement_matches(
    requirement_id: str,
    current_user: dict = Depends(require_client_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    verify_requirement_ownership(
        supabase,
        requirement_id,
        user_id,
    )

    response = (
        supabase.table("matches")
        .select(
            "id, requirement_id, offering_id, score, "
            "breakdown, explanation, tags, status, created_at"
        )
        .eq("requirement_id", requirement_id)
        .order("score", desc=True)
        .execute()
    )

    return response.data or []