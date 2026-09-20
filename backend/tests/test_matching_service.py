from unittest.mock import MagicMock, patch

import pytest

from app.services.matching_service import (
    calculate_offering_match,
    find_requirement_matches,
    get_requirement,
)


def test_get_requirement_success():
    supabase = MagicMock()

    requirement = {
        "id": "req-1",
        "user_id": "client-1",
        "product": "100 laptops",
        "category_id": 1,
        "quantity": "100",
        "budget": "₹500000",
        "location": "Mumbai",
        "timeline": "30 days",
        "notes": "Business laptops",
    }

    (
        supabase.table.return_value
        .select.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = MagicMock(data=requirement)

    result = get_requirement(
        supabase,
        "req-1",
    )

    assert result == requirement


def test_get_requirement_not_found():
    supabase = MagicMock()

    (
        supabase.table.return_value
        .select.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = MagicMock(data=None)

    with pytest.raises(Exception) as exc_info:
        get_requirement(
            supabase,
            "missing-id",
        )

    assert exc_info.value.status_code == 404


def test_calculate_offering_match():
    requirement = {
        "category_id": 1,
        "quantity": "100",
        "budget": "₹500000",
        "location": "Mumbai",
        "timeline": "30 days",
    }

    offering = {
        "category_id": 1,
        "quantity": "200",
        "price": "₹450000",
        "location": "Mumbai",
        "delivery": "7 days",
        "similarity": 0.94,
    }

    result = calculate_offering_match(
        requirement,
        offering,
    )

    assert result.score == 97
    assert result.breakdown["semantic_similarity"] == 0.94
    assert result.breakdown["category"] == 1.0


@patch(
    "app.services.matching_service.generate_embedding",
    return_value=[0.01] * 384,
)
@patch(
    "app.services.matching_service.find_similar_offerings",
)
def test_find_requirement_matches(
    mock_find_similar_offerings,
    mock_generate_embedding,
):
    supabase = MagicMock()

    requirement = {
        "id": "req-1",
        "user_id": "client-1",
        "product": "100 laptops",
        "category_id": 1,
        "quantity": "100",
        "budget": "₹500000",
        "location": "Mumbai",
        "timeline": "30 days",
        "notes": "Business laptops",
    }

    offering = {
        "id": "offering-1",
        "user_id": "supplier-1",
        "product": "Business laptops",
        "category_id": 1,
        "quantity": "150",
        "price": "₹450000",
        "location": "Mumbai",
        "delivery": "7 days",
        "notes": "Dell and HP laptops",
        "similarity": 0.94,
    }

    (
        supabase.table.return_value
        .select.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = MagicMock(data=requirement)

    mock_find_similar_offerings.return_value = [offering]

    results = find_requirement_matches(
        supabase,
        "req-1",
    )

    assert len(results) == 1

    match = results[0]

    assert match["offering_id"] == "offering-1"
    assert match["supplier_user_id"] == "supplier-1"
    assert match["score"] == 97
    assert match["semantic_similarity"] == 0.94
    assert "breakdown" in match
    assert "explanation" in match
    assert "tags" in match

    mock_generate_embedding.assert_called_once_with(
        "100 laptops | Business laptops"
    )

    mock_find_similar_offerings.assert_called_once_with(
        supabase,
        [0.01] * 384,
        match_count=20,
    )