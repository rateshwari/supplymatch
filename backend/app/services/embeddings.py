"""
Embedding service for SupplyMatch.

Uses sentence-transformers with all-MiniLM-L6-v2.
The model produces 384-dimensional embeddings.
"""

from __future__ import annotations

from functools import lru_cache

from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Load the embedding model once and reuse it."""
    return SentenceTransformer(MODEL_NAME)

def build_embedding_text(
    product: str,
    notes: str | None = None,
) -> str:
    """
    Build the semantic text used to generate an embedding.

    Product information is always included. Optional notes provide
    additional product specifications or context.
    """

    parts = [product.strip()]

    if notes and notes.strip():
        parts.append(notes.strip())

    return " | ".join(parts)

def generate_embedding(text: str) -> list[float]:
    """
    Generate a normalized embedding for the supplied text.

    Returns:
        A list containing exactly 384 floating-point values.
    """

    if not text or not text.strip():
        raise ValueError("Text cannot be empty.")

    model = get_embedding_model()

    embedding = model.encode(
        text,
        normalize_embeddings=True,
    )

    if len(embedding) != EMBEDDING_DIMENSION:
        raise ValueError(
            f"Expected embedding dimension {EMBEDDING_DIMENSION}, "
            f"got {len(embedding)}."
        )

    return embedding.tolist()