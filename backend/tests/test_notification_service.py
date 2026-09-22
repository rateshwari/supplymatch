from unittest.mock import MagicMock

from app.services.notifications import (
    create_match_acceptance_notification,
    create_match_request_notifications,
)


def build_supabase_mock(existing_data=None):
    supabase = MagicMock()

    notifications_table = MagicMock()
    supabase.table.return_value = notifications_table

    duplicate_check = MagicMock(
        data=existing_data or []
    )

    (
        notifications_table
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .limit.return_value
        .execute.return_value
    ) = duplicate_check

    return supabase, notifications_table


def test_create_match_request_notifications_success():

    supabase, notifications_table = build_supabase_mock()

    supplier_notification = {
        "id": "supplier-notification-1",
        "user_id": "supplier-user-123",
        "match_id": "match-1",
        "message": (
            "New match request for Industrial Safety Gloves "
            "with a match score of 92%."
        ),
        "read": False,
        "created_at": "2026-09-20T10:00:00+00:00",
    }

    client_notification = {
        "id": "client-notification-1",
        "user_id": "client-user-123",
        "match_id": "match-1",
        "message": (
            "Match request sent for Industrial Safety Gloves. "
            "The supplier has been notified."
        ),
        "read": False,
        "created_at": "2026-09-20T10:00:00+00:00",
    }

    (
        notifications_table
        .insert.return_value
        .select.return_value
        .execute.side_effect
    ) = [
        MagicMock(data=[supplier_notification]),
        MagicMock(data=[client_notification]),
    ]

    result = create_match_request_notifications(
        supabase,
        client_user_id="client-user-123",
        supplier_user_id="supplier-user-123",
        match_id="match-1",
        requirement_product="Industrial Safety Gloves",
        score=92,
    )

    assert result is None

    assert (
        notifications_table.insert.call_count
        == 2
    )


def test_create_match_request_notifications_skips_duplicates():

    existing_notification = {
        "id": "notification-existing",
    }

    supabase, notifications_table = build_supabase_mock(
        existing_notification
    )

    create_match_request_notifications(
        supabase,
        client_user_id="client-user-123",
        supplier_user_id="supplier-user-123",
        match_id="match-1",
        requirement_product="Industrial Safety Gloves",
        score=92,
    )

    notifications_table.insert.assert_not_called()


def test_create_match_acceptance_notification():

    supabase, notifications_table = build_supabase_mock()

    notification = {
        "id": "notification-acceptance-1",
        "user_id": "client-user-123",
        "match_id": "match-1",
        "message": (
            "Your supplier match for Industrial Safety Gloves "
            "has been accepted."
        ),
        "read": False,
        "created_at": "2026-09-20T10:00:00+00:00",
    }

    (
        notifications_table
        .insert.return_value
        .select.return_value
        .execute.return_value
    ) = MagicMock(
        data=[notification]
    )

    result = create_match_acceptance_notification(
        supabase,
        client_user_id="client-user-123",
        match_id="match-1",
        requirement_product="Industrial Safety Gloves",
    )

    assert result is None

    notifications_table.insert.assert_called_once()