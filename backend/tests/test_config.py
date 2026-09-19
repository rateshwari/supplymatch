from app.config import settings


def test_supabase_configuration_loaded():
    assert settings.supabase_url
    assert settings.supabase_anon_key
    assert settings.supabase_service_role_key