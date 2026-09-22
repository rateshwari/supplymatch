from fastapi import APIRouter, Depends
from supabase import Client

from app.auth import require_supplier_user
from app.deps import get_supabase_client
from app.schemas.supplier_match import SupplierMatchResponse

router = APIRouter(
    prefix="/api/v1/supplier",
    tags=["supplier matches"],
)

PAGE_SIZE = 500
QUERY_BATCH_SIZE = 100


def get_supplier_offering_ids(
    supabase: Client,
    user_id: str,
) -> list[str]:
    offering_ids: list[str] = []
    start = 0

    while True:
        response = (
            supabase
            .table("offerings")
            .select("id")
            .eq("user_id", user_id)
            .range(start, start + PAGE_SIZE - 1)
            .execute()
        )

        rows = response.data or []

        if not rows:
            break

        offering_ids.extend(
            row["id"]
            for row in rows
        )

        if len(rows) < PAGE_SIZE:
            break

        start += PAGE_SIZE

    return offering_ids


def get_matches_for_offerings(
    supabase: Client,
    offering_ids: list[str],
) -> list[dict]:
    matches: list[dict] = []

    for start in range(
        0,
        len(offering_ids),
        QUERY_BATCH_SIZE,
    ):
        batch = offering_ids[
            start : start + QUERY_BATCH_SIZE
        ]

        response = (
            supabase
            .table("matches")
            .select(
                "id, requirement_id, offering_id, score, "
                "breakdown, explanation, tags, status, created_at"
            )
            .in_("offering_id", batch)
            .execute()
        )

        matches.extend(response.data or [])

    matches.sort(
        key=lambda match: match["score"],
        reverse=True,
    )

    return matches


def get_requirements(
    supabase: Client,
    requirement_ids: list[str],
) -> dict[str, dict]:
    requirements: dict[str, dict] = {}

    for start in range(
        0,
        len(requirement_ids),
        QUERY_BATCH_SIZE,
    ):
        batch = requirement_ids[
            start : start + QUERY_BATCH_SIZE
        ]

        response = (
            supabase
            .table("requirements")
            .select(
                "id, product, category_id, quantity, budget, "
                "location, timeline, notes"
            )
            .in_("id", batch)
            .execute()
        )

        for requirement in response.data or []:
            requirements[requirement["id"]] = requirement

    return requirements


@router.get(
    "/matches",
    response_model=list[SupplierMatchResponse],
)
def get_supplier_matches(
    current_user: dict = Depends(require_supplier_user),
    supabase: Client = Depends(get_supabase_client),
):
    user_id = current_user["sub"]

    offering_ids = get_supplier_offering_ids(
        supabase,
        user_id,
    )

    if not offering_ids:
        return []

    matches = get_matches_for_offerings(
        supabase,
        offering_ids,
    )

    if not matches:
        return []

    requirement_ids = list(
        dict.fromkeys(
            match["requirement_id"]
            for match in matches
        )
    )

    requirements = get_requirements(
        supabase,
        requirement_ids,
    )

    enriched_matches = []

    for match in matches:
        requirement = requirements.get(
            match["requirement_id"]
        )

        if requirement is None:
            continue

        enriched_matches.append(
            {
                **match,
                "requirement": requirement,
            }
        )

    return enriched_matches
