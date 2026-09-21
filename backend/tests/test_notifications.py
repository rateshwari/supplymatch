from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.auth import get_current_user
from app.deps import get_supabase_client
from app.main import app


client = TestClient(app)


def override_current_user():
    return {"sub": "supplier-user-123"}


def test_get_my_notifications_success():
    supabase = MagicMock()

    notifications_table = MagicMock()

    notifications = [
        {
            "id": "notification-1",
            "user_id": "supplier-user-123",
            "match_id": "match-1",
            "message": "New requirement match for Industrial Steel with a match score of 92%.",
            "read": False,
            "created_at": "2026-09-20T10:00:00+00:00",
        }
    ]

    (
        notifications_table.select.return_value
        .eq.return_value
        .order.return_value
        .execute.return_value
    ) = MagicMock(data=notifications)

    supabase.table.return_value = notifications_table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.get("/api/v1/notifications")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == notifications


def test_get_my_notifications_returns_empty_list():
    supabase = MagicMock()

    notifications_table = MagicMock()

    (
        notifications_table.select.return_value
        .eq.return_value
        .order.return_value
        .execute.return_value
    ) = MagicMock(data=[])

    supabase.table.return_value = notifications_table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.get("/api/v1/notifications")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == []


def test_get_my_notifications_requires_authentication():
    response = client.get("/api/v1/notifications")

    assert response.status_code in (401, 403)

def test_mark_notification_as_read_success():
    supabase = MagicMock()

    notifications_table = MagicMock()

    notification = {
        "id": "notification-1",
        "user_id": "supplier-user-123",
        "match_id": "match-1",
        "message": "New requirement match.",
        "read": True,
        "created_at": "2026-09-20T10:00:00+00:00",
    }

    (
        notifications_table.update.return_value
        .eq.return_value
        .eq.return_value
        .select.return_value
        .execute.return_value
    ) = MagicMock(data=[notification])

    supabase.table.return_value = notifications_table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.patch(
            "/api/v1/notifications/notification-1/read"
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == notification

def test_mark_notification_as_read_rejects_unknown_notification():
    supabase = MagicMock()

    notifications_table = MagicMock()

    (
        notifications_table.update.return_value
        .eq.return_value
        .eq.return_value
        .select.return_value
        .execute.return_value
    ) = MagicMock(data=[])

    supabase.table.return_value = notifications_table

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_supabase_client] = lambda: supabase

    try:
        response = client.patch(
            "/api/v1/notifications/unknown-notification/read"
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json()["detail"] == "Notification not found"