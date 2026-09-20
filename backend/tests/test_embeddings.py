import pytest

from app.services.embeddings import (
    EMBEDDING_DIMENSION,
    MODEL_NAME,
    build_embedding_text,
    generate_embedding,
)


def test_embedding_dimension():
    embedding = generate_embedding("industrial steel supply")

    assert len(embedding) == EMBEDDING_DIMENSION
    assert EMBEDDING_DIMENSION == 384


def test_embedding_contains_floats():
    embedding = generate_embedding("industrial steel supply")

    assert all(isinstance(value, float) for value in embedding)


def test_embedding_is_normalized():
    embedding = generate_embedding("industrial steel supply")

    magnitude = sum(value * value for value in embedding) ** 0.5

    assert magnitude == pytest.approx(1.0, abs=1e-5)


def test_model_name():
    assert MODEL_NAME == "all-MiniLM-L6-v2"


def test_empty_text_rejected():
    with pytest.raises(ValueError, match="Text cannot be empty"):
        generate_embedding("")


def test_whitespace_text_rejected():
    with pytest.raises(ValueError, match="Text cannot be empty"):
        generate_embedding("   ")


def test_build_embedding_text_with_product_and_notes():
    result = build_embedding_text(
        "Industrial Steel Sheets",
        "Grade A, corrosion resistant",
    )

    assert result == (
        "Industrial Steel Sheets | Grade A, corrosion resistant"
    )


def test_build_embedding_text_without_notes():
    result = build_embedding_text("Industrial Steel Sheets")

    assert result == "Industrial Steel Sheets"


def test_build_embedding_text_ignores_empty_notes():
    result = build_embedding_text(
        "Industrial Steel Sheets",
        "   ",
    )

    assert result == "Industrial Steel Sheets"