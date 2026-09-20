from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.main import app
from app.auth import get_current_user
from app.deps import get_supabase_client


client = TestClient(app)


def mock_auth():
    return {"sub": "user-123", "role": "client"}


def override_auth():
    return mock_auth()


def test_create_requirement_success():
    mock_supabase = MagicMock()

    returned_requirement = {
        "id": "req-123",
        "user_id": "user-123",
        "product": "100 laptops",
        "category_id": 1,
        "quantity": "100",
        "budget": "₹500000",
        "location": "Mumbai",
        "timeline": "30 days",
        "notes": "Business laptops",
        "created_at": "2026-09-20T10:00:00+00:00",
    }

    (
        mock_supabase
        .table.return_value
        .insert.return_value
        .select.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = MagicMock(data=returned_requirement)

    app.dependency_overrides[get_current_user] = override_auth

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/requirements",
            json={
                "product": "100 laptops",
                "category_id": 1,
                "quantity": "100",
                "budget": "₹500000",
                "location": "Mumbai",
                "timeline": "30 days",
                "notes": "Business laptops",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json() == returned_requirement

    mock_supabase.table.assert_called_once_with("requirements")

    mock_supabase.table.return_value.insert.assert_called_once_with(
        {
            "product": "100 laptops",
            "category_id": 1,
            "quantity": "100",
            "budget": "₹500000",
            "location": "Mumbai",
            "timeline": "30 days",
            "notes": "Business laptops",
            "user_id": "user-123",
        }
    )


def test_create_requirement_requires_authentication():
    response = client.post(
        "/api/v1/requirements",
        json={
            "product": "100 laptops",
            "category_id": 1,
            "quantity": "100",
            "budget": "₹500000",
            "location": "Mumbai",
            "timeline": "30 days",
        },
    )

    assert response.status_code == 401


def test_create_requirement_rejects_user_id_from_request():
    app.dependency_overrides[get_current_user] = override_auth

    try:
        response = client.post(
            "/api/v1/requirements",
            json={
                "product": "100 laptops",
                "category_id": 1,
                "quantity": "100",
                "budget": "₹500000",
                "location": "Mumbai",
                "timeline": "30 days",
                "user_id": "attacker-user",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_create_requirement_validates_required_fields():
    app.dependency_overrides[get_current_user] = override_auth

    try:
        response = client.post(
            "/api/v1/requirements",
            json={
                "product": "",
                "category_id": 1,
                "quantity": "100",
                "budget": "₹500000",
                "location": "Mumbai",
                "timeline": "30 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_create_requirement_rejects_invalid_category_id():
    app.dependency_overrides[get_current_user] = override_auth

    try:
        response = client.post(
            "/api/v1/requirements",
            json={
                "product": "100 laptops",
                "category_id": 0,
                "quantity": "100",
                "budget": "₹500000",
                "location": "Mumbai",
                "timeline": "30 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_create_requirement_returns_400_when_insert_fails():
    mock_supabase = MagicMock()

    (
        mock_supabase
        .table.return_value
        .insert.return_value
        .select.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = MagicMock(data=None)

    app.dependency_overrides[get_current_user] = override_auth

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/requirements",
            json={
                "product": "100 laptops",
                "category_id": 1,
                "quantity": "100",
                "budget": "₹500000",
                "location": "Mumbai",
                "timeline": "30 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400


def test_get_my_requirements_success():
    mock_supabase = MagicMock()

    returned_requirements = [
        {
            "id": "req-1",
            "user_id": "user-123",
            "product": "100 laptops",
            "category_id": 1,
            "quantity": "100",
            "budget": "₹500000",
            "location": "Mumbai",
            "timeline": "30 days",
            "notes": "Business laptops",
            "created_at": "2026-09-20T10:00:00+00:00",
        },
        {
            "id": "req-2",
            "user_id": "user-123",
            "product": "50 monitors",
            "category_id": 2,
            "quantity": "50",
            "budget": "₹200000",
            "location": "Pune",
            "timeline": "45 days",
            "notes": None,
            "created_at": "2026-09-20T11:00:00+00:00",
        },
    ]

    (
        mock_supabase
        .table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(data=returned_requirements)

    app.dependency_overrides[get_current_user] = override_auth
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get("/api/v1/requirements")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == returned_requirements

    mock_supabase.table.assert_called_once_with("requirements")

    mock_supabase.table.return_value.select.assert_called_once_with(
        "id, user_id, product, category_id, quantity, "
        "budget, location, timeline, notes, created_at"
    )

    mock_supabase.table.return_value.select.return_value.eq.assert_called_once_with(
        "user_id",
        "user-123",
    )


def test_get_my_requirements_requires_authentication():
    response = client.get("/api/v1/requirements")

    assert response.status_code == 401


def test_get_my_requirements_returns_empty_list():
    mock_supabase = MagicMock()

    (
        mock_supabase
        .table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(data=[])

    app.dependency_overrides[get_current_user] = override_auth
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get("/api/v1/requirements")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == []


def test_get_my_requirements_uses_authenticated_user_id():
    mock_supabase = MagicMock()

    (
        mock_supabase
        .table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value
    ) = MagicMock(data=[])

    app.dependency_overrides[get_current_user] = lambda: {
        "sub": "different-user-456",
        "role": "client",
    }

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get("/api/v1/requirements")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200

    mock_supabase.table.return_value.select.return_value.eq.assert_called_once_with(
        "user_id",
        "different-user-456",
    )