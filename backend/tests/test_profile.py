from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.auth import get_current_user
from app.deps import get_supabase_client
from app.main import app


client = TestClient(app)


def make_supabase_mock(profile_data):
    class Query:
        def select(self, *_args):
            return self

        def eq(self, column, value):
            assert column == "id"
            assert value == "user-123"
            return self

        def execute(self):
            data = [] if profile_data is None else [profile_data]
            return SimpleNamespace(data=data)

    class SupabaseMock:
        def table(self, table_name):
            assert table_name == "profiles"
            return Query()

    return SupabaseMock()


def override_current_user():
    return {
        "sub": "user-123",
        "role": "client",
    }

def make_create_supabase_mock(
    existing_profile,
    created_profile,
    expected_payload,
):
    class Query:
        def __init__(self):
            self.operation = None

        def select(self, *_args):
            return self

        def eq(self, column, value):
            assert column == "id"
            assert value == "user-123"
            return self

        def insert(self, payload):
            self.operation = "insert"
            assert payload == expected_payload
            return self

        def execute(self):
            if self.operation == "insert":
                data = [] if created_profile is None else [created_profile]
                return SimpleNamespace(data=data)

            data = [] if existing_profile is None else [existing_profile]
            return SimpleNamespace(data=data)

    class SupabaseMock:
        def table(self, table_name):
            assert table_name == "profiles"
            return Query()

    return SupabaseMock()

def test_create_my_profile_success():
    profile = {
        "id": "user-123",
        "role": "client",
        "name": "Test User",
        "company": "Test Company",
        "created_at": "2026-09-20T00:00:00+00:00",
    }

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: make_create_supabase_mock(
        None,
        profile,
        {
            "role": "client",
            "name": "Test User",
            "company": "Test Company",
            "id": "user-123",
        },
    )

    try:
        response = client.post(
            "/api/v1/profile/me",
            json={
                "role": "client",
                "name": "Test User",
                "company": "Test Company",
            },
        )

        assert response.status_code == 201
        assert response.json() == profile
    finally:
        app.dependency_overrides.clear()


def test_create_my_profile_rejects_duplicate():
    existing_profile = {
        "id": "user-123",
    }

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: make_create_supabase_mock(
        existing_profile,
        None,
        {},
    )

    try:
        response = client.post(
            "/api/v1/profile/me",
            json={
                "role": "client",
                "name": "Test User",
            },
        )

        assert response.status_code == 409
        assert response.json() == {
            "detail": "Profile already exists"
        }
    finally:
        app.dependency_overrides.clear()


def test_create_my_profile_rejects_invalid_role():
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: make_create_supabase_mock(
        None,
        None,
        {},
    )

    try:
        response = client.post(
            "/api/v1/profile/me",
            json={
                "role": "admin",
                "name": "Test User",
            },
        )

        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_create_my_profile_requires_authentication():
    response = client.post(
        "/api/v1/profile/me",
        json={
            "role": "client",
            "name": "Test User",
        },
    )

    assert response.status_code == 401

def test_get_my_profile_success():
    profile = {
        "id": "user-123",
        "role": "client",
        "name": "Test User",
        "company": "Test Company",
        "created_at": "2026-09-20T00:00:00+00:00",
    }

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: make_supabase_mock(
        profile
    )

    try:
        response = client.get("/api/v1/profile/me")

        assert response.status_code == 200
        assert response.json() == profile
    finally:
        app.dependency_overrides.clear()


def test_get_my_profile_not_found():
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: make_supabase_mock(None)

    try:
        response = client.get("/api/v1/profile/me")

        assert response.status_code == 404
        assert response.json() == {"detail": "Profile not found"}
    finally:
        app.dependency_overrides.clear()


def test_get_my_profile_requires_authentication():
    response = client.get("/api/v1/profile/me")

    assert response.status_code == 401


def make_update_supabase_mock(profile_data, expected_updates):
    class Query:
        def select(self, *_args):
            return self

        def update(self, updates):
            assert updates == expected_updates
            return self

        def eq(self, column, value):
            assert column == "id"
            assert value == "user-123"
            return self

        def execute(self):
            data = [] if profile_data is None else [profile_data]
            return SimpleNamespace(data=data)

    class SupabaseMock:
        def table(self, table_name):
            assert table_name == "profiles"
            return Query()

    return SupabaseMock()


def test_update_my_profile_success():
    profile = {
        "id": "user-123",
        "role": "client",
        "name": "Updated User",
        "company": "Updated Company",
        "created_at": "2026-09-20T00:00:00+00:00",
    }

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = (
        lambda: make_update_supabase_mock(
            profile,
            {
                "name": "Updated User",
                "company": "Updated Company",
            },
        )
    )

    try:
        response = client.patch(
            "/api/v1/profile/me",
            json={
                "name": "Updated User",
                "company": "Updated Company",
            },
        )

        assert response.status_code == 200
        assert response.json() == profile
    finally:
        app.dependency_overrides.clear()


def test_update_my_profile_requires_field():
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = (
        lambda: make_update_supabase_mock(None, {})
    )

    try:
        response = client.patch(
            "/api/v1/profile/me",
            json={},
        )

        assert response.status_code == 400
        assert response.json() == {
            "detail": "At least one profile field must be provided"
        }
    finally:
        app.dependency_overrides.clear()


def test_update_my_profile_rejects_role_change():
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = (
        lambda: make_update_supabase_mock(None, {})
    )

    try:
        response = client.patch(
            "/api/v1/profile/me",
            json={
                "role": "admin",
            },
        )

        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_update_my_profile_not_found():
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = (
        lambda: make_update_supabase_mock(
    None,
    {
        "name": "Updated User",
        "company": "Updated Company",
    },
)
    )

    try:
        response = client.patch(
            "/api/v1/profile/me",
            json={
                "name": "Updated User",
                "company": "Updated Company",
            },
        )

        assert response.status_code == 404
        assert response.json() == {"detail": "Profile not found"}
    finally:
        app.dependency_overrides.clear()


def test_update_my_profile_partial_update():
    profile = {
        "id": "user-123",
        "role": "client",
        "name": "Updated User",
        "company": "Original Company",
        "created_at": "2026-09-20T00:00:00+00:00",
    }

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = (
        lambda: make_update_supabase_mock(
            profile,
            {"name": "Updated User"},
        )
    )

    try:
        response = client.patch(
            "/api/v1/profile/me",
            json={"name": "Updated User"},
        )

        assert response.status_code == 200
        assert response.json() == profile
    finally:
        app.dependency_overrides.clear()

def test_update_my_profile_rejects_null_name():
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = (
        lambda: make_update_supabase_mock(None, {})
    )

    try:
        response = client.patch(
            "/api/v1/profile/me",
            json={"name": None},
        )

        assert response.status_code == 400
        assert response.json() == {
    "detail": "Profile name cannot be null"
}
    finally:
        app.dependency_overrides.clear()


def test_update_my_profile_allows_null_company():
    profile = {
        "id": "user-123",
        "role": "client",
        "name": "Test User",
        "company": None,
        "created_at": "2026-09-20T00:00:00+00:00",
    }

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = (
        lambda: make_update_supabase_mock(
            profile,
            {"company": None},
        )
    )

    try:
        response = client.patch(
            "/api/v1/profile/me",
            json={"company": None},
        )

        assert response.status_code == 200
        assert response.json() == profile
    finally:
        app.dependency_overrides.clear()


def test_update_my_profile_requires_authentication():
    response = client.patch(
        "/api/v1/profile/me",
        json={"name": "Updated User"},
    )

    assert response.status_code == 401