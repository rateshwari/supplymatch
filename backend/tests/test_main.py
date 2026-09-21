from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_cors_preflight_allows_frontend_origin():
    response = client.options(
        "/api/v1/profile/me",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert response.headers["access-control-allow-credentials"] == "true"