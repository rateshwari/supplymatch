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

        def maybe_single(self):
            return self

        def execute(self):
            return SimpleNamespace(data=profile_data)

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
