import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient

from app.auth import verify_jwt
from app.config import get_settings
from app.main import app


client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    monkeypatch.setenv(
        "SUPABASE_URL",
        "https://example.supabase.co",
    )
    monkeypatch.setenv(
        "SUPABASE_ANON_KEY",
        "test-anon-key",
    )
    monkeypatch.setenv(
        "SUPABASE_SERVICE_ROLE_KEY",
        "test-service-role-key",
    )
    monkeypatch.setenv(
        "SUPABASE_JWT_SECRET",
        "unused-test-secret",
    )

    get_settings.cache_clear()

    yield

    get_settings.cache_clear()


@pytest.fixture
def signing_key():
    return ec.generate_private_key(ec.SECP256R1())


@pytest.fixture
def valid_token(signing_key):
    return jwt.encode(
        {
            "sub": "test-user-id",
            "role": "authenticated",
            "aud": "authenticated",
            "iss": "https://example.supabase.co/auth/v1",
        },
        signing_key,
        algorithm="ES256",
        headers={
            "kid": "test-key-id",
        },
    )


@pytest.fixture
def mock_jwks(monkeypatch, signing_key):
    class MockSigningKey:
        key = signing_key.public_key()

    class MockPyJWKClient:
        def __init__(self, url, **kwargs):
            assert url == (
                "https://example.supabase.co"
                "/auth/v1/.well-known/jwks.json"
            )

        def get_signing_key_from_jwt(self, token):
            return MockSigningKey()

    monkeypatch.setattr(
        "app.auth.PyJWKClient",
        MockPyJWKClient,
    )


def test_verify_jwt_returns_payload(valid_token, mock_jwks):
    payload = verify_jwt(valid_token)

    assert payload["sub"] == "test-user-id"
    assert payload["role"] == "authenticated"


def test_verify_jwt_rejects_invalid_token():
    with pytest.raises(Exception):
        verify_jwt("not-a-valid-jwt")


def test_verify_jwt_rejects_wrong_signing_key(mock_jwks):
    different_key = ec.generate_private_key(ec.SECP256R1())

    token = jwt.encode(
        {
            "sub": "test-user-id",
            "role": "authenticated",
            "aud": "authenticated",
            "iss": "https://example.supabase.co/auth/v1",
        },
        different_key,
        algorithm="ES256",
        headers={
            "kid": "test-key-id",
        },
    )

    with pytest.raises(Exception):
        verify_jwt(token)


def test_verify_jwt_rejects_non_authenticated_audience(
    signing_key,
    mock_jwks,
):
    token = jwt.encode(
        {
            "sub": "test-user-id",
            "role": "authenticated",
            "aud": "wrong-audience",
            "iss": "https://example.supabase.co/auth/v1",
        },
        signing_key,
        algorithm="ES256",
        headers={
            "kid": "test-key-id",
        },
    )

    with pytest.raises(Exception):
        verify_jwt(token)


def test_me_requires_authentication():
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_me_with_invalid_token():
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401


def test_me_with_valid_token(valid_token, mock_jwks):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {valid_token}"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "user_id": "test-user-id",
        "role": "authenticated",
    }
