from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.auth import (
    get_current_user,
    require_client_user,
    require_supplier_user,
)
from app.deps import get_supabase_client
from app.main import app


client = TestClient(app)


CLIENT_USER_ID = "client-user-id"
SUPPLIER_USER_ID = "supplier-user-id"


def mock_current_user(user_id: str, role: str) -> dict:
    return {
        "sub": user_id,
        "role": role,
    }


def mock_supabase_with_role(role: str):
    supabase = MagicMock()

    (
        supabase
        .table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value.data
    ) = [
        {
            "role": role,
        }
    ]

    return supabase


def teardown_function():
    app.dependency_overrides.clear()


def test_unauthenticated_notifications_request_is_rejected():
    response = client.get(
        "/api/v1/notifications"
    )

    assert response.status_code == 401


def test_supplier_cannot_create_requirement():
    supabase = mock_supabase_with_role(
        "supplier"
    )

    app.dependency_overrides[
        get_current_user
    ] = lambda: mock_current_user(
        SUPPLIER_USER_ID,
        "supplier",
    )

    app.dependency_overrides[
        get_supabase_client
    ] = lambda: supabase

    response = client.post(
        "/api/v1/requirements",
        json={
            "product": "Industrial Safety Gloves",
            "category_id": 3,
            "quantity": "500 units",
            "budget": "50000",
            "location": "Mumbai",
            "timeline": "10 days",
            "notes": "Authorization test",
        },
    )

    assert response.status_code == 403
    assert (
        response.json()["detail"]
        == "Only client accounts can create requirements"
    )


def test_client_cannot_create_offering():
    supabase = mock_supabase_with_role(
        "client"
    )

    app.dependency_overrides[
        get_current_user
    ] = lambda: mock_current_user(
        CLIENT_USER_ID,
        "client",
    )

    app.dependency_overrides[
        get_supabase_client
    ] = lambda: supabase

    response = client.post(
        "/api/v1/offerings",
        json={
            "product": "Industrial Safety Gloves",
            "category_id": 3,
            "quantity": "500 units",
            "price": "25000",
            "location": "Mumbai",
            "delivery": "10 days",
            "notes": "Authorization test",
        },
    )

    assert response.status_code == 403
    assert (
        response.json()["detail"]
        == "Only supplier accounts can create offerings"
    )


def test_client_cannot_access_another_clients_matches():
    supabase = MagicMock()

    (
        supabase
        .table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value.data
    ) = []

    app.dependency_overrides[
        require_client_user
    ] = lambda: mock_current_user(
        CLIENT_USER_ID,
        "client",
    )

    app.dependency_overrides[
        get_supabase_client
    ] = lambda: supabase

    response = client.get(
        "/api/v1/requirements/"
        "other-requirement-id/matches"
    )

    assert response.status_code == 404
    assert (
        response.json()["detail"]
        == "Requirement not found"
    )


def test_supplier_matches_are_scoped_to_owned_offerings():
    supabase = MagicMock()

    (
        supabase
        .table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value.data
    ) = [
        {
            "id": "supplier-owned-offering",
        }
    ]

    (
        supabase
        .table.return_value
        .select.return_value
        .in_.return_value
        .order.return_value
        .execute.return_value.data
    ) = []

    app.dependency_overrides[
        require_supplier_user
    ] = lambda: mock_current_user(
        SUPPLIER_USER_ID,
        "supplier",
    )

    app.dependency_overrides[
        get_supabase_client
    ] = lambda: supabase

    response = client.get(
        "/api/v1/supplier/matches"
    )

    assert response.status_code == 200
    assert response.json() == []


def test_supplier_cannot_bypass_client_role_guard():
    supabase = mock_supabase_with_role(
        "supplier"
    )

    app.dependency_overrides[
        get_current_user
    ] = lambda: mock_current_user(
        SUPPLIER_USER_ID,
        "supplier",
    )

    app.dependency_overrides[
        get_supabase_client
    ] = lambda: supabase

    response = client.post(
        "/api/v1/requirements",
        json={
            "product": "Industrial Safety Gloves",
            "category_id": 3,
            "quantity": "500 units",
            "budget": "50000",
            "location": "Mumbai",
            "timeline": "10 days",
            "notes": "Role isolation test",
        },
    )

    assert response.status_code == 403


def test_client_cannot_bypass_supplier_role_guard():
    supabase = mock_supabase_with_role(
        "client"
    )

    app.dependency_overrides[
        get_current_user
    ] = lambda: mock_current_user(
        CLIENT_USER_ID,
        "client",
    )

    app.dependency_overrides[
        get_supabase_client
    ] = lambda: supabase

    response = client.post(
        "/api/v1/offerings",
        json={
            "product": "Industrial Safety Gloves",
            "category_id": 3,
            "quantity": "500 units",
            "price": "25000",
            "location": "Mumbai",
            "delivery": "10 days",
            "notes": "Role isolation test",
        },
    )

    assert response.status_code == 403