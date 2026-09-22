from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.auth import require_client_user
from app.deps import get_supabase_client
from app.main import app


client = TestClient(app)


def override_current_user():
    return {"sub": "client-user-123"}


def build_client_profile_table():
    profiles_table = MagicMock()

    (
        profiles_table.select.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(
        data=[{"role": "client"}]
    )

    return profiles_table


def build_offering_table():
    offerings_table = MagicMock()

    (
        offerings_table.select.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(
        data=[
            {
                "product": "Business laptops",
                "quantity": "150",
                "price": "₹450000",
                "location": "Mumbai",
                "delivery": "7 days",
                "notes": "Dell and HP laptops",
                "user_id": "supplier-1",
            }
        ]
    )

    return offerings_table


def build_supplier_profile_table():
    profiles_table = MagicMock()

    (
        profiles_table.select.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(
        data=[
            {
                "name": "Supplier One",
                "company": "ABC Supplies",
            }
        ]
    )

    return profiles_table


def test_generate_requirement_matches_success():
    supabase = MagicMock()

    profiles_table = build_supplier_profile_table()
    offerings_table = build_offering_table()

    requirements_table = MagicMock()
    (
        requirements_table.select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(
        data=[{"id": "req-1"}]
    )

    matches_table = MagicMock()
    notifications_table = MagicMock()

    (
        notifications_table.select.return_value
        .eq.return_value
        .eq.return_value
        .limit.return_value
        .execute.return_value
    ) = MagicMock(data=[])

    (
        notifications_table.insert.return_value
        .select.return_value
        .execute.return_value
    ) = MagicMock(
        data=[
            {
                "id": "notification-1",
                "user_id": "supplier-1",
                "match_id": "match-1",
                "message": (
                    "New requirement match for Business laptops "
                    "with a match score of 97%."
                ),
                "read": False,
                "created_at": "2026-09-20T10:00:00+00:00",
            }
        ]
    )

    persisted_match = {
        "id": "match-1",
        "requirement_id": "req-1",
        "offering_id": "offering-1",
        "score": 97,
        "breakdown": {
            "semantic_similarity": 0.94,
            "category": 1.0,
            "location": 1.0,
            "quantity": 1.0,
            "budget": 1.0,
            "delivery": 1.0,
            "final_score": 0.97,
        },
        "explanation": "Match based on strong product similarity.",
        "tags": ["strong product similarity"],
        "status": "pending",
        "created_at": "2026-09-20T10:00:00+00:00",
    }

    (
        matches_table.upsert.return_value
        .select.return_value
        .execute.return_value
    ) = MagicMock(
        data=[persisted_match]
    )

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "requirements":
            return requirements_table
        if name == "matches":
            return matches_table
        if name == "notifications":
            return notifications_table
        if name == "offerings":
            return offerings_table

        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[require_client_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    ranked_matches = [
        {
            "offering_id": "offering-1",
            "supplier_user_id": "supplier-1",
            "product": "Business laptops",
            "category_id": 1,
            "quantity": "150",
            "price": "₹450000",
            "location": "Mumbai",
            "delivery": "7 days",
            "notes": "Dell and HP laptops",
            "semantic_similarity": 0.94,
            "score": 97,
            "breakdown": persisted_match["breakdown"],
            "explanation": persisted_match["explanation"],
            "tags": persisted_match["tags"],
        }
    ]

    expected_response = [
        {
            **persisted_match,
            "supplier": {
                "name": "Supplier One",
                "company": "ABC Supplies",
            },
            "offering": {
                "product": "Business laptops",
                "quantity": "150",
                "price": "₹450000",
                "location": "Mumbai",
                "delivery": "7 days",
                "notes": "Dell and HP laptops",
            },
        }
    ]

    try:
        with patch(
            "app.routers.matches.find_requirement_matches",
            return_value=ranked_matches,
        ):
            response = client.post(
                "/api/v1/requirements/req-1/matches"
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == expected_response

    matches_table.upsert.assert_called_once_with(
        {
            "requirement_id": "req-1",
            "offering_id": "offering-1",
            "score": 97,
            "breakdown": persisted_match["breakdown"],
            "explanation": persisted_match["explanation"],
            "tags": ["strong product similarity"],
            },
        on_conflict="requirement_id,offering_id",
    )


def test_generate_requirement_matches_rejects_unknown_requirement():
    supabase = MagicMock()

    profiles_table = build_client_profile_table()

    requirements_table = MagicMock()
    (
        requirements_table.select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(
        data=[]
    )

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "requirements":
            return requirements_table

        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[require_client_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.post(
            "/api/v1/requirements/missing-id/matches"
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json()["detail"] == "Requirement not found"


def test_generate_requirement_matches_returns_empty_list():
    supabase = MagicMock()

    profiles_table = build_client_profile_table()

    requirements_table = MagicMock()
    (
        requirements_table.select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(
        data=[{"id": "req-1"}]
    )

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "requirements":
            return requirements_table

        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[require_client_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        with patch(
            "app.routers.matches.find_requirement_matches",
            return_value=[],
        ):
            response = client.post(
                "/api/v1/requirements/req-1/matches"
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == []


def test_get_requirement_matches_success():
    supabase = MagicMock()

    profiles_table = build_supplier_profile_table()
    offerings_table = build_offering_table()

    requirements_table = MagicMock()
    (
        requirements_table.select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(
        data=[{"id": "req-1"}]
    )

    matches_table = MagicMock()

    persisted_matches = [
        {
            "id": "match-1",
            "requirement_id": "req-1",
            "offering_id": "offering-1",
            "score": 97,
            "breakdown": {
                "semantic_similarity": 0.94,
                "category": 1.0,
                "location": 1.0,
                "quantity": 1.0,
                "budget": 1.0,
                "delivery": 1.0,
                "final_score": 0.97,
            },
            "explanation": "Match based on strong product similarity.",
            "tags": ["strong product similarity"],
            "status": "pending",
                "created_at": "2026-09-20T10:00:00+00:00",
        }
    ]

    (
        matches_table.select.return_value
        .eq.return_value
        .order.return_value
        .execute.return_value
    ) = MagicMock(
        data=persisted_matches
    )

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "requirements":
            return requirements_table
        if name == "matches":
            return matches_table
        if name == "offerings":
            return offerings_table

        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[require_client_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    expected_response = [
        {
            **persisted_matches[0],
            "supplier": {
                "name": "Supplier One",
                "company": "ABC Supplies",
            },
            "offering": {
                "product": "Business laptops",
                "quantity": "150",
                "price": "₹450000",
                "location": "Mumbai",
                "delivery": "7 days",
                "notes": "Dell and HP laptops",
            },
        }
    ]

    try:
        response = client.get(
            "/api/v1/requirements/req-1/matches"
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == expected_response


def test_get_requirement_matches_rejects_unknown_requirement():
    supabase = MagicMock()

    profiles_table = build_client_profile_table()

    requirements_table = MagicMock()
    (
        requirements_table.select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(
        data=[]
    )

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "requirements":
            return requirements_table

        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[require_client_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.get(
            "/api/v1/requirements/missing-id/matches"
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json()["detail"] == "Requirement not found"
