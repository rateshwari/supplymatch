from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.auth import get_current_user, require_client_user
from app.deps import get_supabase_client


client = TestClient(app)


def override_auth():
    return {
        "sub": "user-123",
    }


def override_supabase():
    return MagicMock()


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

    # Mock the profiles table used by require_client_user.
    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"role": "client"})
    )

    # Mock the categories table used by the requirement endpoint.
    categories_table = MagicMock()
    categories_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"id": 1})
    )

    # Mock the requirements insert.
    requirements_table = MagicMock()
    requirements_table.insert.return_value.select.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data=returned_requirement)
    )

    mock_supabase.table.side_effect = lambda table_name: {
        "profiles": profiles_table,
        "categories": categories_table,
        "requirements": requirements_table,
    }[table_name]

    # Only override JWT authentication.
    # The real require_client_user dependency must execute.
    app.dependency_overrides[get_current_user] = override_auth
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        with patch(
            "app.routers.requirements.generate_embedding",
            return_value=[0.01] * 384,
        ) as mock_generate_embedding:
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

    # Verify embedding generation.
    mock_generate_embedding.assert_called_once_with(
        "100 laptops | Business laptops"
    )

    # Verify application-level role authorization.
    profiles_table.select.assert_called_once_with("role")
    profiles_table.select.return_value.eq.assert_called_once_with(
        "id",
        "user-123",
    )

    # Verify category validation.
    categories_table.select.assert_called_once_with("id")
    categories_table.select.return_value.eq.assert_called_once_with(
        "id",
        1,
    )

    # Verify requirement creation and ownership.
    requirements_table.insert.assert_called_once_with(
        {
            "product": "100 laptops",
            "category_id": 1,
            "quantity": "100",
            "budget": "₹500000",
            "location": "Mumbai",
            "timeline": "30 days",
            "notes": "Business laptops",
            "embedding": [0.01] * 384,
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
    app.dependency_overrides[require_client_user] = override_auth
    app.dependency_overrides[get_supabase_client] = override_supabase

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
    app.dependency_overrides[require_client_user] = override_auth
    app.dependency_overrides[get_supabase_client] = override_supabase

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
    app.dependency_overrides[require_client_user] = override_auth
    app.dependency_overrides[get_supabase_client] = override_supabase

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


def test_create_requirement_returns_404_for_unknown_category():
    mock_supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"role": "client"})
    )

    categories_table = MagicMock()
    categories_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data=None)
    )

    mock_supabase.table.side_effect = lambda table_name: {
        "profiles": profiles_table,
        "categories": categories_table,
    }[table_name]

    app.dependency_overrides[get_current_user] = override_auth
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.post(
            "/api/v1/requirements",
            json={
                "product": "100 laptops",
                "category_id": 99999,
                "quantity": "100",
                "budget": "₹500000",
                "location": "Mumbai",
                "timeline": "30 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"


def test_create_requirement_returns_403_for_supplier():
    mock_supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"role": "supplier"})
    )

    mock_supabase.table.side_effect = lambda table_name: {
        "profiles": profiles_table,
    }[table_name]

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

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Only client accounts can create requirements"
    )


def test_create_requirement_returns_400_when_insert_fails():
    mock_supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"role": "client"})
    )

    categories_table = MagicMock()
    categories_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"id": 1})
    )

    requirements_table = MagicMock()
    requirements_table.insert.return_value.select.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data=None)
    )

    mock_supabase.table.side_effect = lambda table_name: {
        "profiles": profiles_table,
        "categories": categories_table,
        "requirements": requirements_table,
    }[table_name]

    app.dependency_overrides[get_current_user] = override_auth
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        with patch(
            "app.routers.requirements.generate_embedding",
            return_value=[0.01] * 384,
        ) as mock_generate_embedding:
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

    mock_generate_embedding.assert_called_once_with(
        "100 laptops"
    )

    requirements_table.insert.assert_called_once_with(
        {
            "product": "100 laptops",
            "category_id": 1,
            "quantity": "100",
            "budget": "₹500000",
            "location": "Mumbai",
            "timeline": "30 days",
            "notes": None,
            "embedding": [0.01] * 384,
            "user_id": "user-123",
        }
    )


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

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"role": "client"})
    )

    requirements_table = MagicMock()

    requirements_table.select.return_value.eq.return_value.order.return_value.execute.return_value = (
        MagicMock(data=returned_requirements)
    )

    mock_supabase.table.side_effect = lambda table_name: {
        "profiles": profiles_table,
        "requirements": requirements_table,
    }[table_name]

    app.dependency_overrides[get_current_user] = override_auth
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get("/api/v1/requirements")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == returned_requirements

    requirements_table.select.assert_called_once_with(
        "id, user_id, product, category_id, quantity, "
        "budget, location, timeline, notes, created_at"
    )

    requirements_table.select.return_value.eq.assert_called_once_with(
        "user_id",
        "user-123",
    )


def test_get_my_requirements_requires_authentication():
    response = client.get("/api/v1/requirements")

    assert response.status_code == 401


def test_get_my_requirements_returns_empty_list():
    mock_supabase = MagicMock()

    requirements_table = MagicMock()

    requirements_table.select.return_value.eq.return_value.order.return_value.execute.return_value = (
        MagicMock(data=[])
    )

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"role": "client"})
    )

    mock_supabase.table.side_effect = lambda table_name: {
        "profiles": profiles_table,
        "requirements": requirements_table,
    }[table_name]

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

    requirements_table = MagicMock()

    requirements_table.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[])
    )

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"role": "client"})
    )

    mock_supabase.table.side_effect = lambda table_name: {
        "profiles": profiles_table,
        "requirements": requirements_table,
    }[table_name]

    app.dependency_overrides[require_client_user] = lambda: {
        "sub": "different-user-456",
        "role": "client",
    }

    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get("/api/v1/requirements")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200

    requirements_table.select.return_value.eq.assert_called_once_with(
        "user_id",
        "different-user-456",
    )


def test_supplier_cannot_list_requirements():
    mock_supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = (
        MagicMock(data={"role": "supplier"})
    )

    mock_supabase.table.side_effect = lambda table_name: {
        "profiles": profiles_table,
    }[table_name]

    app.dependency_overrides[get_current_user] = override_auth
    app.dependency_overrides[get_supabase_client] = lambda: mock_supabase

    try:
        response = client.get("/api/v1/requirements")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Only client accounts can create requirements"
    )