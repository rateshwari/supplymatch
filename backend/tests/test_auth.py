import jwt
import pytest

from app.auth import verify_jwt
from app.config import get_settings
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TEST_SECRET = "test-secret-key-that-is-at-least-32-bytes-long"


def test_verify_jwt_returns_payload(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)

    get_settings.cache_clear()

    token = jwt.encode(
        {
            "sub": "test-user-id",
            "role": "authenticated",
            "aud": "authenticated",
        },
        TEST_SECRET,
        algorithm="HS256",
    )

    payload = verify_jwt(token)

    assert payload["sub"] == "test-user-id"
    assert payload["role"] == "authenticated"


def test_verify_jwt_rejects_invalid_token(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)

    get_settings.cache_clear()

    with pytest.raises(Exception):
        verify_jwt("not-a-valid-jwt")


def test_me_requires_authentication():
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_me_with_invalid_token():
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401

def test_me_with_valid_token(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)

    get_settings.cache_clear()

    token = jwt.encode(
        {
            "sub": "test-user-id",
            "role": "authenticated",
            "aud": "authenticated",
        },
        TEST_SECRET,
        algorithm="HS256",
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "user_id": "test-user-id",
        "role": "authenticated",
    }