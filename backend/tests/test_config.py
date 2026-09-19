from app.config import Settings


def test_supabase_configuration_loaded():
    test_settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_anon_key="test-anon-key",
        supabase_service_role_key="test-service-role-key",
    )

    assert test_settings.supabase_url == "https://example.supabase.co"
    assert test_settings.supabase_anon_key == "test-anon-key"
    assert test_settings.supabase_service_role_key == "test-service-role-key"