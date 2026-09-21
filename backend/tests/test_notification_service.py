from unittest.mock import MagicMock

from app.services.notifications import create_match_notification


def test_create_match_notification_success():
    supabase = MagicMock()

    notifications_table = MagicMock()
    supabase.table.return_value = notifications_table

    notifications_table.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )

    notification = {
        "id": "notification-1",
        "user_id": "supplier-user-123",
        "match_id": "match-1",
        "message": (
            "New requirement match for Industrial Steel "
            "with a match score of 92%."
        ),
        "read": False,
        "created_at": "2026-09-20T10:00:00+00:00",
    }

    (
        notifications_table.insert.return_value
        .select.return_value
        .execute.return_value
    ) = MagicMock(data=[notification])

    result = create_match_notification(
        supabase,
        supplier_user_id="supplier-user-123",
        match_id="match-1",
        requirement_product="Industrial Steel",
        score=92,
    )

    assert result == notification


def test_create_match_notification_skips_duplicate():
    supabase = MagicMock()

    notifications_table = MagicMock()
    supabase.table.return_value = notifications_table

    existing_notification = {
        "id": "notification-existing",
    }

    (
        notifications_table.select.return_value
        .eq.return_value
        .eq.return_value
        .limit.return_value
        .execute.return_value
    ) = MagicMock(data=[existing_notification])

    result = create_match_notification(
        supabase,
        supplier_user_id="supplier-user-123",
        match_id="match-1",
        requirement_product="Industrial Steel",
        score=92,
    )

    assert result is None

    notifications_table.insert.assert_not_called()