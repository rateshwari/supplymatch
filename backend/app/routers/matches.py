from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.auth import (
    require_client_user,
    require_supplier_user,
)
from app.deps import get_supabase_client
from app.schemas.match import MatchResponse
from app.services.matching_service import find_requirement_matches
from app.services.notifications import (
    create_match_acceptance_notification,
    create_match_request_notifications,
)


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
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found",
        )


def enrich_match(
    supabase: Client,
    match: dict,
) -> dict:
    offering_response = (
        supabase.table("offerings")
        .select(
            "product, quantity, price, location, delivery, notes, user_id"
        )
        .eq("id", match["offering_id"])
        .execute()
    )

    if not offering_response or not offering_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offering not found",
        )

    offering = offering_response.data[0]

    profile_response = (
        supabase.table("profiles")
        .select("name, company")
        .eq("id", offering["user_id"])
        .execute()
    )

    if not profile_response or not profile_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier profile not found",
        )

    profile = profile_response.data[0]

    return {
        "id": match["id"],
        "requirement_id": match["requirement_id"],
        "offering_id": match["offering_id"],
        "score": match["score"],
        "breakdown": match["breakdown"],
        "explanation": match["explanation"],
        "tags": match["tags"],
        "status": match["status"],
        "created_at": match["created_at"],
        "supplier": {
            "name": profile["name"],
            "company": profile.get("company"),
        },
        "offering": {
            "product": offering["product"],
            "quantity": offering["quantity"],
            "price": offering["price"],
            "location": offering["location"],
            "delivery": offering["delivery"],
            "notes": offering.get("notes"),
        },
    }


# ============================================================
# GENERATE MATCHES
# ============================================================

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
        # IMPORTANT:
        # Do not explicitly set status here.
        #
        # New rows use the database default:
        # pending
        #
        # Existing contacted/confirmed matches keep
        # their current status when matching is run again.
        payload = {
            "requirement_id": requirement_id,
            "offering_id": match["offering_id"],
            "score": match["score"],
            "breakdown": match["breakdown"],
            "explanation": match["explanation"],
            "tags": match["tags"],
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
            .execute()
        )

        if not response or not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to save match",
            )

        saved_match = response.data[0]

        enriched_match = enrich_match(
            supabase,
            saved_match,
        )

        persisted_matches.append(
            enriched_match
        )

    # IMPORTANT:
    #
    # We intentionally DO NOT notify the supplier here.
    #
    # A match being discovered by AI is not the same as
    # the client sending a match request.
    #
    # Notification happens in:
    # PATCH /match/{match_id}/request

    return persisted_matches


# ============================================================
# CLIENT SENDS MATCH REQUEST
# ============================================================

@router.patch(
    "/match/{match_id}/request",
    response_model=MatchResponse,
)
def request_match(
    match_id: str,
    current_user: dict = Depends(require_client_user),
    supabase: Client = Depends(get_supabase_client),
):
    client_user_id = current_user["sub"]

    # --------------------------------------------------------
    # Get match
    # --------------------------------------------------------

    match_response = (
        supabase.table("matches")
        .select(
            "id, requirement_id, offering_id, score, "
            "breakdown, explanation, tags, status, created_at"
        )
        .eq("id", match_id)
        .execute()
    )

    if not match_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found",
        )

    match = match_response.data[0]

    # --------------------------------------------------------
    # Verify client owns the requirement
    # --------------------------------------------------------

    requirement_response = (
        supabase.table("requirements")
        .select(
            "id, user_id, product"
        )
        .eq(
            "id",
            match["requirement_id"],
        )
        .eq(
            "user_id",
            client_user_id,
        )
        .execute()
    )

    if not requirement_response.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this requirement",
        )

    requirement = requirement_response.data[0]

    # --------------------------------------------------------
    # Get supplier from offering
    # --------------------------------------------------------

    offering_response = (
        supabase.table("offerings")
        .select(
            "id, user_id"
        )
        .eq(
            "id",
            match["offering_id"],
        )
        .execute()
    )

    if not offering_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offering not found",
        )

    supplier_user_id = offering_response.data[0]["user_id"]

    # --------------------------------------------------------
    # Only pending matches can be requested
    # --------------------------------------------------------

    if match["status"] == "pending":

        updated_response = (
            supabase.table("matches")
            .update(
                {
                    "status": "contacted"
                }
            )
            .eq(
                "id",
                match_id,
            )
            .select(
                "id, requirement_id, offering_id, score, "
                "breakdown, explanation, tags, status, created_at"
            )
            .execute()
        )

        if not updated_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send match request",
            )

        match = updated_response.data[0]

        # ----------------------------------------------------
        # Notify both client and supplier
        # ----------------------------------------------------

        create_match_request_notifications(
            supabase,
            client_user_id=client_user_id,
            supplier_user_id=supplier_user_id,
            match_id=match_id,
            requirement_product=requirement["product"],
            score=match["score"],
        )

    elif match["status"] in {
        "contacted",
        "confirmed",
    }:
        # Already requested.
        # Return the current match without creating
        # duplicate notifications.
        pass

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Match cannot be requested",
        )

    return enrich_match(
        supabase,
        match,
    )


# ============================================================
# SUPPLIER ACCEPTS MATCH
# ============================================================

@router.patch(
    "/match/{match_id}/accept",
    response_model=MatchResponse,
)
def accept_match(
    match_id: str,
    current_user: dict = Depends(require_supplier_user),
    supabase: Client = Depends(get_supabase_client),
):
    supplier_user_id = current_user["sub"]

    # --------------------------------------------------------
    # Get match
    # --------------------------------------------------------

    match_response = (
        supabase.table("matches")
        .select(
            "id, requirement_id, offering_id, score, "
            "breakdown, explanation, tags, status, created_at"
        )
        .eq(
            "id",
            match_id,
        )
        .execute()
    )

    if not match_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found",
        )

    match = match_response.data[0]

    # --------------------------------------------------------
    # Verify supplier owns offering
    # --------------------------------------------------------

    offering_response = (
        supabase.table("offerings")
        .select(
            "id, user_id"
        )
        .eq(
            "id",
            match["offering_id"],
        )
        .eq(
            "user_id",
            supplier_user_id,
        )
        .execute()
    )

    if not offering_response.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this offering",
        )

    # --------------------------------------------------------
    # Accept only requested matches
    # --------------------------------------------------------

    if match["status"] == "contacted":

        updated_response = (
            supabase.table("matches")
            .update(
                {
                    "status": "confirmed"
                }
            )
            .eq(
                "id",
                match_id,
            )
            .select(
                "id, requirement_id, offering_id, score, "
                "breakdown, explanation, tags, status, created_at"
            )
            .execute()
        )

        if not updated_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to accept match",
            )

        match = updated_response.data[0]

        # ----------------------------------------------------
        # Find client
        # ----------------------------------------------------

        requirement_response = (
            supabase.table("requirements")
            .select(
                "user_id, product"
            )
            .eq(
                "id",
                match["requirement_id"],
            )
            .execute()
        )

        if requirement_response.data:

            client_user_id = requirement_response.data[0][
                "user_id"
            ]

            requirement_product = requirement_response.data[0][
                "product"
            ]

            # ------------------------------------------------
            # Notify client
            # ------------------------------------------------

            create_match_acceptance_notification(
                supabase,
                client_user_id=client_user_id,
                match_id=match_id,
                requirement_product=requirement_product,
            )

    elif match["status"] == "confirmed":
        # Already accepted.
        pass

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Match has not been requested by the client"
            ),
        )

    return enrich_match(
        supabase,
        match,
    )


# ============================================================
# GET MATCHES FOR CLIENT
# ============================================================

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
        .eq(
            "requirement_id",
            requirement_id,
        )
        .order(
            "score",
            desc=True,
        )
        .execute()
    )

    if not response or not response.data:
        return []

    return [
        enrich_match(
            supabase,
            match,
        )
        for match in response.data
    ]