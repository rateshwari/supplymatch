from fastapi import APIRouter, Depends
from supabase import Client

from app.auth import require_supplier_user
from app.deps import get_supabase_client
from app.schemas.supplier_match import SupplierMatchResponse

router = APIRouter(
    prefix="/api/v1/supplier",
    tags=["supplier matches"],
)


@router.get(
    "/matches",
    response_model=list[SupplierMatchResponse],
)
def get_supplier_matches(
    current_user: dict = Depends(require_supplier_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    offerings_response = (
        supabase
        .table("offerings")
        .select("id")
        .eq("user_id", user_id)
        .execute()
    )

    offering_rows = offerings_response.data or []

    if not offering_rows:
        return []

    offering_ids = [row["id"] for row in offering_rows]

    matches_response = (
        supabase
        .table("matches")
        .select(
            "id, requirement_id, offering_id, score, "
            "breakdown, explanation, tags, status, created_at"
        )
        .in_("offering_id", offering_ids)
        .order("score", desc=True)
        .execute()
    )

    matches = matches_response.data or []

    if not matches:
        return []

    requirement_ids = list(
        dict.fromkeys(
            match["requirement_id"]
            for match in matches
        )
    )

    requirements_response = (
        supabase
        .table("requirements")
        .select(
            "id, product, category_id, quantity, budget, "
            "location, timeline, notes"
        )
        .in_("id", requirement_ids)
        .execute()
    )

    requirements = {
        requirement["id"]: requirement
        for requirement in (requirements_response.data or [])
    }

    enriched_matches = []

    for match in matches:
        requirement = requirements.get(match["requirement_id"])

        if requirement is None:
            continue

        enriched_matches.append(
            {
                **match,
                "requirement": requirement,
            }
        )

    return enriched_matches
