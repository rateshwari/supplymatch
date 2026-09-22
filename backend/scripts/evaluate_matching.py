"""
Evaluate the SupplyMatch hybrid matching engine.

Synthetic benchmark:
- 1,000 buyer requirements
- 2,000 supplier offerings
- 1 strong offering per requirement
- 1 distractor offering per requirement

Evaluation stages:
1. Vector retrieval recall
2. Hybrid ranking quality
3. Match-score separation
4. Matching latency

Metrics:
- Retrieval Recall@5
- Retrieval Recall@10
- Retrieval Recall@20
- Top-1 accuracy
- Top-5 recall
- Top-10 recall
- Mean Reciprocal Rank (MRR)
- Average strong-match score
- Average distractor score
- Average score separation
- Average latency
- Median latency
- P95 latency
- Maximum latency
"""

from __future__ import annotations

import statistics
import sys
import time
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.deps import get_supabase_client
from app.services.matching_service import find_requirement_matches


SEED_MARKER = "[SUPPLYMATCH_SEED_V1]"
TOP_K = 20


def load_seed_rows(
    supabase,
    table: str,
) -> list[dict[str, Any]]:
    """Load all synthetic rows using pagination."""

    if table == "requirements":
        columns = (
            "id, product, category_id, quantity, "
            "budget, location, timeline, notes"
        )
    else:
        columns = (
            "id, product, category_id, quantity, "
            "price, location, delivery, notes"
        )

    rows: list[dict[str, Any]] = []

    page_size = 500
    start = 0

    while True:
        response = (
            supabase
            .table(table)
            .select(columns)
            .ilike("notes", f"%{SEED_MARKER}%")
            .order("created_at")
            .range(start, start + page_size - 1)
            .execute()
        )

        batch = response.data or []

        if not batch:
            break

        rows.extend(batch)

        if len(batch) < page_size:
            break

        start += page_size

    return rows


def load_seed_requirements(supabase) -> list[dict[str, Any]]:
    return load_seed_rows(
        supabase,
        "requirements",
    )


def load_seed_offerings(supabase) -> list[dict[str, Any]]:
    return load_seed_rows(
        supabase,
        "offerings",
    )


def extract_requirement_index(
    requirement: dict[str, Any],
) -> int | None:
    """Extract synthetic requirement index."""

    notes = requirement.get("notes") or ""

    marker = "synthetic requirement "

    if marker not in notes:
        return None

    try:
        index_text = (
            notes
            .split(marker, 1)[1]
            .split(".", 1)[0]
        )

        return int(index_text)

    except (IndexError, ValueError):
        return None


def build_expected_map(
    offerings: list[dict[str, Any]],
) -> tuple[dict[int, str], dict[int, str]]:
    """
    Build:
        requirement index -> strong offering ID
        requirement index -> distractor offering ID
    """

    strong: dict[int, str] = {}
    distractors: dict[int, str] = {}

    for offering in offerings:
        notes = offering.get("notes") or ""

        if "strong synthetic offering" in notes:
            marker = "strong synthetic offering "

            try:
                index_text = (
                    notes
                    .split(marker, 1)[1]
                    .split(".", 1)[0]
                )

                index = int(index_text)
                strong[index] = offering["id"]

            except (IndexError, ValueError):
                continue

        elif "distractor synthetic offering" in notes:
            marker = "distractor synthetic offering "

            try:
                index_text = (
                    notes
                    .split(marker, 1)[1]
                    .split(".", 1)[0]
                )

                index = int(index_text)
                distractors[index] = offering["id"]

            except (IndexError, ValueError):
                continue

    return strong, distractors


def calculate_percent(
    value: float,
) -> float:
    return round(value * 100, 2)


def percentile(
    values: list[float],
    percentile_value: float,
) -> float:
    """
    Calculate percentile using linear interpolation.
    """

    if not values:
        return 0.0

    ordered = sorted(values)

    if len(ordered) == 1:
        return ordered[0]

    position = (
        percentile_value / 100
    ) * (len(ordered) - 1)

    lower = int(position)
    upper = min(
        lower + 1,
        len(ordered) - 1,
    )

    weight = position - lower

    return (
        ordered[lower]
        + (ordered[upper] - ordered[lower])
        * weight
    )


def main() -> None:
    print("Connecting to Supabase...")

    supabase = get_supabase_client()

    print("Loading synthetic requirements...")

    requirements = load_seed_requirements(
        supabase
    )

    print("Loading synthetic offerings...")

    offerings = load_seed_offerings(
        supabase
    )

    print()

    print(
        f"Synthetic requirements found: {len(requirements)}"
    )

    print(
        f"Synthetic offerings found:    {len(offerings)}"
    )

    if not requirements:
        raise RuntimeError(
            "No synthetic requirements found. "
            "Run scripts/seed_demo_data.py first."
        )

    strong_map, distractor_map = (
        build_expected_map(offerings)
    )

    print(
        f"Expected strong matches identified: "
        f"{len(strong_map)}"
    )

    print(
        f"Expected distractors identified:     "
        f"{len(distractor_map)}"
    )

    if len(strong_map) != len(requirements):
        raise RuntimeError(
            "Expected strong matches do not match "
            "the number of requirements."
        )

    print()

    print("Running matching evaluation...")

    print(
        f"Top-K retrieval: {TOP_K}"
    )

    print()

    retrieval_hits = {
        5: 0,
        10: 0,
        20: 0,
    }

    ranking_hits = {
        1: 0,
        5: 0,
        10: 0,
    }

    reciprocal_ranks: list[float] = []

    strong_scores: list[float] = []

    distractor_scores: list[float] = []

    score_separations: list[float] = []

    latencies_ms: list[float] = []

    evaluated = 0

    skipped = 0

    for position, requirement in enumerate(
        requirements,
        start=1,
    ):
        requirement_index = (
            extract_requirement_index(
                requirement
            )
        )

        if requirement_index is None:
            skipped += 1
            continue

        expected_strong_id = strong_map.get(
            requirement_index
        )

        expected_distractor_id = (
            distractor_map.get(
                requirement_index
            )
        )

        if expected_strong_id is None:
            skipped += 1
            continue

        start_time = time.perf_counter()

        matches = find_requirement_matches(
            supabase,
            requirement["id"],
        )

        elapsed_ms = (
            time.perf_counter()
            - start_time
        ) * 1000

        latencies_ms.append(
            elapsed_ms
        )

        ranked_ids = [
            match["offering_id"]
            for match in matches
        ]

        if not ranked_ids:
            skipped += 1
            continue

        evaluated += 1

        # --------------------------------------------------
        # Retrieval recall
        # --------------------------------------------------

        for cutoff in (
            5,
            10,
            20,
        ):
            if expected_strong_id in ranked_ids[:cutoff]:
                retrieval_hits[cutoff] += 1

        # --------------------------------------------------
        # Ranking metrics
        # --------------------------------------------------

        try:
            rank = (
                ranked_ids.index(
                    expected_strong_id
                )
                + 1
            )

        except ValueError:
            rank = None

        if rank == 1:
            ranking_hits[1] += 1

        if (
            rank is not None
            and rank <= 5
        ):
            ranking_hits[5] += 1

        if (
            rank is not None
            and rank <= 10
        ):
            ranking_hits[10] += 1

        if rank is not None:
            reciprocal_ranks.append(
                1 / rank
            )
        else:
            reciprocal_ranks.append(0)

        # --------------------------------------------------
        # Score metrics
        # --------------------------------------------------

        strong_match = next(
            (
                match
                for match in matches
                if match["offering_id"]
                == expected_strong_id
            ),
            None,
        )

        distractor_match = None

        if expected_distractor_id:
            distractor_match = next(
                (
                    match
                    for match in matches
                    if match["offering_id"]
                    == expected_distractor_id
                ),
                None,
            )

        if strong_match:
            strong_score = (
                strong_match["score"]
            )

            strong_scores.append(
                strong_score
            )

        if distractor_match:
            distractor_score = (
                distractor_match["score"]
            )

            distractor_scores.append(
                distractor_score
            )

        if (
            strong_match
            and distractor_match
        ):
            score_separations.append(
                strong_match["score"]
                - distractor_match["score"]
            )

        if (
            position == 1
            or position % 100 == 0
            or position == len(requirements)
        ):
            print(
                f"Evaluated "
                f"{position}/{len(requirements)}"
            )

    # ------------------------------------------------------
    # Final report
    # ------------------------------------------------------

    print()

    print("=" * 70)
    print(
        "SUPPLYMATCH MATCHING EVALUATION"
    )
    print("=" * 70)

    print()

    print("DATASET")
    print("-" * 70)

    print(
        f"Requirements available:       "
        f"{len(requirements)}"
    )

    print(
        f"Offerings available:          "
        f"{len(offerings)}"
    )

    print(
        f"Requirements evaluated:       "
        f"{evaluated}"
    )

    print(
        f"Requirements skipped:         "
        f"{skipped}"
    )

    print()

    print("VECTOR RETRIEVAL")
    print("-" * 70)

    if evaluated:
        for cutoff in (
            5,
            10,
            20,
        ):
            recall = (
                retrieval_hits[cutoff]
                / evaluated
            )

            print(
                f"Retrieval Recall@{cutoff}:       "
                f"{calculate_percent(recall):.2f}%"
            )

    print()

    print("HYBRID RANKING")
    print("-" * 70)

    if evaluated:
        top1 = (
            ranking_hits[1]
            / evaluated
        )

        top5 = (
            ranking_hits[5]
            / evaluated
        )

        top10 = (
            ranking_hits[10]
            / evaluated
        )

        mrr = (
            statistics.mean(
                reciprocal_ranks
            )
            if reciprocal_ranks
            else 0
        )

        print(
            f"Top-1 accuracy:               "
            f"{calculate_percent(top1):.2f}%"
        )

        print(
            f"Top-5 recall:                  "
            f"{calculate_percent(top5):.2f}%"
        )

        print(
            f"Top-10 recall:                 "
            f"{calculate_percent(top10):.2f}%"
        )

        print(
            f"Mean reciprocal rank (MRR):   "
            f"{mrr:.4f}"
        )

    print()

    print("MATCH SCORE ANALYSIS")
    print("-" * 70)

    if strong_scores:
        print(
            f"Average strong-match score:    "
            f"{statistics.mean(strong_scores):.2f}%"
        )

    if distractor_scores:
        print(
            f"Average distractor score:      "
            f"{statistics.mean(distractor_scores):.2f}%"
        )

    if score_separations:
        print(
            f"Average score separation:      "
            f"{statistics.mean(score_separations):.2f} points"
        )

    print()

    print("LATENCY")
    print("-" * 70)

    if latencies_ms:
        print(
            f"Average latency:               "
            f"{statistics.mean(latencies_ms):.2f} ms"
        )

        print(
            f"Median latency:                "
            f"{statistics.median(latencies_ms):.2f} ms"
        )

        print(
            f"P95 latency:                   "
            f"{percentile(latencies_ms, 95):.2f} ms"
        )

        print(
            f"Maximum latency:               "
            f"{max(latencies_ms):.2f} ms"
        )

    print()

    print("=" * 70)
    print(
        "EVALUATION COMPLETE"
    )
    print("=" * 70)


if __name__ == "__main__":
    main()