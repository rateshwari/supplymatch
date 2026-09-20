from unittest.mock import MagicMock

import pytest

from app.services.vector_search import (
    DEFAULT_MATCH_COUNT,
    find_similar_offerings,
)


def test_find_similar_offerings_success():
    supabase = MagicMock()

    expected_results = [
        {
            "id": "offering-1",
            "user_id": "supplier-1",
            "product": "Industrial Steel",
            "category_id": 1,
            "quantity": "1000 kg",
            "price": "₹75000",
            "location": "Mumbai",
            "delivery": "7 days",
            "notes": "Grade A steel",
            "similarity": 0.94,
        },
        {
            "id": "offering-2",
            "user_id": "supplier-2",
            "product": "Steel Sheets",
            "category_id": 1,
            "quantity": "500 kg",
            "price": "₹50000",
            "location": "Pune",
            "delivery": "10 days",
            "notes": None,
            "similarity": 0.87,
        },
    ]

    rpc_response = MagicMock()
    rpc_response.data = expected_results

    supabase.rpc.return_value.execute.return_value = rpc_response

    embedding = [0.01] * 384

    result = find_similar_offerings(
        supabase,
        embedding,
        match_count=10,
    )

    assert result == expected_results

    supabase.rpc.assert_called_once_with(
        "match_offerings",
        {
            "query_embedding": embedding,
            "match_count": 10,
        },
    )


def test_find_similar_offerings_uses_default_match_count():
    supabase = MagicMock()

    rpc_response = MagicMock()
    rpc_response.data = []

    supabase.rpc.return_value.execute.return_value = rpc_response

    embedding = [0.01] * 384

    result = find_similar_offerings(
        supabase,
        embedding,
    )

    assert result == []

    supabase.rpc.assert_called_once_with(
        "match_offerings",
        {
            "query_embedding": embedding,
            "match_count": DEFAULT_MATCH_COUNT,
        },
    )


def test_find_similar_offerings_rejects_wrong_embedding_dimension():
    supabase = MagicMock()

    embedding = [0.01] * 383

    with pytest.raises(
        ValueError,
        match="Expected a 384-dimensional embedding",
    ):
        find_similar_offerings(
            supabase,
            embedding,
        )

    supabase.rpc.assert_not_called()


def test_find_similar_offerings_rejects_too_large_match_count():
    supabase = MagicMock()

    embedding = [0.01] * 384

    with pytest.raises(
        ValueError,
        match="match_count must be between 1 and 100",
    ):
        find_similar_offerings(
            supabase,
            embedding,
            match_count=101,
        )

    supabase.rpc.assert_not_called()


def test_find_similar_offerings_rejects_zero_match_count():
    supabase = MagicMock()

    embedding = [0.01] * 384

    with pytest.raises(
        ValueError,
        match="match_count must be between 1 and 100",
    ):
        find_similar_offerings(
            supabase,
            embedding,
            match_count=0,
        )

    supabase.rpc.assert_not_called()


def test_find_similar_offerings_returns_empty_when_database_returns_none():
    supabase = MagicMock()

    rpc_response = MagicMock()
    rpc_response.data = None

    supabase.rpc.return_value.execute.return_value = rpc_response

    embedding = [0.01] * 384

    result = find_similar_offerings(
        supabase,
        embedding,
    )

    assert result == []