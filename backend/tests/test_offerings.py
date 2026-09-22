from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
import supabase

from app.auth import get_current_user, require_supplier_user
from app.deps import get_supabase_client
from app.main import app


client = TestClient(app)


def override_current_user():
    return {"sub": "supplier-user-123"}


def override_supplier_user():
    return {"sub": "supplier-user-123"}


def override_supabase():
    return MagicMock()


def clear_overrides():
    app.dependency_overrides.clear()


def setup_function():
    clear_overrides()


def teardown_function():
    clear_overrides()


def test_create_offering_success():
    supabase = MagicMock()

    returned_offering = {
        "id": "offering-123",
        "user_id": "supplier-user-123",
        "product": "Industrial Steel",
        "category_id": 1,
        "quantity": "1000 kg",
        "price": "₹75/kg",
        "location": "Mumbai",
        "delivery": "7 days",
        "notes": "Grade A steel",
        "created_at": "2026-09-20T10:00:00+00:00",
    }

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"role": "supplier"}
    ]

    categories_table = MagicMock()
    categories_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": 1}
    ]

    offerings_table = MagicMock()
    offerings_table.insert.return_value.select.return_value.execute.return_value.data = [
        returned_offering
    ]

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "categories":
            return categories_table
        if name == "offerings":
            return offerings_table
        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[require_supplier_user] = override_supplier_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        with patch(
            "app.routers.offerings.generate_embedding",
            return_value=[0.02] * 384,
        ) as mock_generate_embedding:
            response = client.post(
                "/api/v1/offerings",
                json={
                    "product": "Industrial Steel",
                    "category_id": 1,
                    "quantity": "1000 kg",
                    "price": "₹75/kg",
                    "location": "Mumbai",
                    "delivery": "7 days",
                    "notes": "Grade A steel",
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json() == returned_offering

    # Verify embedding generation.
    mock_generate_embedding.assert_called_once_with(
        "Industrial Steel | Grade A steel"
    )

    # Verify supplier ownership and embedding are included
    # in the database insert payload.
    offerings_table.insert.assert_called_once_with(
        {
            "product": "Industrial Steel",
            "category_id": 1,
            "quantity": "1000 kg",
            "price": "₹75/kg",
            "location": "Mumbai",
            "delivery": "7 days",
            "notes": "Grade A steel",
            "embedding": [0.02] * 384,
            "user_id": "supplier-user-123",
        }
    )


def test_create_offering_unauthenticated():
    response = client.post(
        "/api/v1/offerings",
        json={
            "product": "Industrial Steel",
            "category_id": 1,
            "quantity": "1000 kg",
            "price": "₹75/kg",
            "location": "Mumbai",
            "delivery": "7 days",
        },
    )

    assert response.status_code == 401


def test_create_offering_rejects_client():
    supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"role": "client"}
    ]

    supabase.table.return_value = profiles_table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.post(
            "/api/v1/offerings",
            json={
                "product": "Industrial Steel",
                "category_id": 1,
                "quantity": "1000 kg",
                "price": "₹75/kg",
                "location": "Mumbai",
                "delivery": "7 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Only supplier accounts can create offerings"
    )


def test_create_offering_requires_supplier_role():
    supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"role": "client"}
    ]

    supabase.table.return_value = profiles_table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.post(
            "/api/v1/offerings",
            json={
                "product": "Industrial Steel",
                "category_id": 1,
                "quantity": "1000 kg",
                "price": "₹75/kg",
                "location": "Mumbai",
                "delivery": "7 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Only supplier accounts can create offerings"
    )


def test_create_offering_rejects_unknown_category():
    supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"role": "supplier"}
    ]

    categories_table = MagicMock()
    categories_table.select.return_value.eq.return_value.execute.return_value.data = []

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "categories":
            return categories_table
        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[require_supplier_user] = override_supplier_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.post(
            "/api/v1/offerings",
            json={
                "product": "Industrial Steel",
                "category_id": 999,
                "quantity": "1000 kg",
                "price": "₹75/kg",
                "location": "Mumbai",
                "delivery": "7 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"


def test_create_offering_insert_failure():
    supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"role": "supplier"}
    ]

    categories_table = MagicMock()
    categories_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": 1}
    ]

    offerings_table = MagicMock()
    offerings_table.insert.return_value.select.return_value.execute.return_value.data = []

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "categories":
            return categories_table
        if name == "offerings":
            return offerings_table
        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[require_supplier_user] = override_supplier_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        with patch(
            "app.routers.offerings.generate_embedding",
            return_value=[0.02] * 384,
        ) as mock_generate_embedding:
            response = client.post(
                "/api/v1/offerings",
                json={
                    "product": "Industrial Steel",
                    "category_id": 1,
                    "quantity": "1000 kg",
                    "price": "₹75/kg",
                    "location": "Mumbai",
                    "delivery": "7 days",
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json()["detail"] == "Failed to create offering"

    mock_generate_embedding.assert_called_once_with(
        "Industrial Steel"
    )

    offerings_table.insert.assert_called_once_with(
        {
            "product": "Industrial Steel",
            "category_id": 1,
            "quantity": "1000 kg",
            "price": "₹75/kg",
            "location": "Mumbai",
            "delivery": "7 days",
            "notes": None,
            "embedding": [0.02] * 384,
            "user_id": "supplier-user-123",
        }
    )


def test_create_offering_rejects_empty_product():
    app.dependency_overrides[require_supplier_user] = override_supplier_user
    app.dependency_overrides[get_supabase_client] = override_supabase

    try:
        response = client.post(
            "/api/v1/offerings",
            json={
                "product": "",
                "category_id": 1,
                "quantity": "1000 kg",
                "price": "₹75/kg",
                "location": "Mumbai",
                "delivery": "7 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_create_offering_rejects_zero_category():
    app.dependency_overrides[require_supplier_user] = override_supplier_user
    app.dependency_overrides[get_supabase_client] = override_supabase

    try:
        response = client.post(
            "/api/v1/offerings",
            json={
                "product": "Industrial Steel",
                "category_id": 0,
                "quantity": "1000 kg",
                "price": "₹75/kg",
                "location": "Mumbai",
                "delivery": "7 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_create_offering_rejects_client_supplied_user_id():
    app.dependency_overrides[require_supplier_user] = override_supplier_user
    app.dependency_overrides[get_supabase_client] = override_supabase

    try:
        response = client.post(
            "/api/v1/offerings",
            json={
                "product": "Industrial Steel",
                "category_id": 1,
                "quantity": "1000 kg",
                "price": "₹75/kg",
                "location": "Mumbai",
                "delivery": "7 days",
                "user_id": "attacker-user",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_get_my_offerings_success():
    supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"role": "supplier"}
    ]
    offerings_table = MagicMock()
    offerings_table.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
        {
            "id": "offering-1",
            "user_id": "supplier-user-123",
            "product": "Industrial Steel",
            "category_id": 1,
            "quantity": "1000 kg",
            "price": "₹75/kg",
            "location": "Mumbai",
            "delivery": "7 days",
            "notes": None,
            "created_at": "2026-09-20T10:00:00+00:00",
        }
    ]

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "offerings":
            return offerings_table
        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.get("/api/v1/offerings")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["user_id"] == "supplier-user-123"

    offerings_table.select.return_value.eq.assert_called_once_with(
        "user_id",
        "supplier-user-123",
    )


def test_get_my_offerings_empty():
    supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"role": "supplier"}
    ]

    offerings_table = MagicMock()
    offerings_table.select.return_value.eq.return_value.execute.return_value.data = []

    def table(name):
        if name == "profiles":
            return profiles_table
        if name == "offerings":
            return offerings_table
        raise AssertionError(f"Unexpected table: {name}")

    supabase.table.side_effect = table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.get("/api/v1/offerings")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == []


def test_get_my_offerings_unauthenticated():
    response = client.get("/api/v1/offerings")

    assert response.status_code == 401


def test_get_my_offerings_rejects_client():
    supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.execute.return_value.data = [
        {"role": "client"}
    ]

    supabase.table.return_value = profiles_table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.get("/api/v1/offerings")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Only supplier accounts can create offerings"
    )


def test_get_my_offerings_profile_not_found():
    supabase = MagicMock()

    profiles_table = MagicMock()
    profiles_table.select.return_value.eq.return_value.execute.return_value.data = []

    supabase.table.return_value = profiles_table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.get("/api/v1/offerings")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json()["detail"] == "Profile not found"


def test_create_offering_rejects_unknown_fields():
    app.dependency_overrides[
        require_supplier_user
    ] = override_supplier_user
    app.dependency_overrides[
        get_supabase_client
    ] = override_supabase

    try:
        response = client.post(
            "/api/v1/offerings",
            json={
                "product": "Industrial Steel",
                "category_id": 1,
                "quantity": "1000 kg",
                "price": "₹75/kg",
                "location": "Mumbai",
                "delivery": "7 days",
                "notes": "Grade A steel",
                "user_id": "attacker-user",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_create_offering_rejects_empty_product():
    app.dependency_overrides[
        require_supplier_user
    ] = override_supplier_user
    app.dependency_overrides[
        get_supabase_client
    ] = override_supabase

    try:
        response = client.post(
            "/api/v1/offerings",
            json={
                "product": "",
                "category_id": 1,
                "quantity": "1000 kg",
                "price": "₹75/kg",
                "location": "Mumbai",
                "delivery": "7 days",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422