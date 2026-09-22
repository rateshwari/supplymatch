"""
Seed reproducible synthetic data for SupplyMatch.

Creates:
- 1,000 buyer requirements
- 2,000 supplier offerings
- 3,000 total synthetic records

Each requirement receives:
- one strongly related supplier offering
- one distractor supplier offering

Existing records are never deleted or modified.

All generated records contain:
    [SUPPLYMATCH_SEED_V1]

so they can be identified and removed later if necessary.
"""

from __future__ import annotations

import random
import sys
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.deps import get_supabase_client
from app.services.embeddings import get_embedding_model


SEED = 20260922
REQUIREMENT_COUNT = 1_000
OFFERINGS_PER_REQUIREMENT = 2
BATCH_SIZE = 100
SEED_MARKER = "[SUPPLYMATCH_SEED_V1]"

CLIENT_USER_ID = "d6d0269b-6a02-47ab-8c69-736f2a8ec277"
SUPPLIER_USER_ID = "41b2729e-03ae-41fc-9d3b-703417495be7"


LOCATIONS = [
    "Mumbai",
    "Pune",
    "Navi Mumbai",
    "Thane",
    "Delhi",
    "Bengaluru",
    "Hyderabad",
    "Chennai",
    "Ahmedabad",
    "Surat",
    "Kolkata",
    "Jaipur",
    "Nagpur",
    "Nashik",
    "Vadodara",
]

TIMELINES = [
    "3 days",
    "5 days",
    "7 days",
    "10 days",
    "15 days",
    "20 days",
    "30 days",
]

PRODUCTS: dict[int, list[str]] = {
    1: [
        "Industrial Control Panel",
        "LED Display Module",
        "Power Supply Unit",
        "Industrial Networking Switch",
    ],
    2: [
        "Construction Safety Equipment",
        "Structural Support Material",
        "Building Hardware",
        "Construction Site Supplies",
    ],
    3: [
        "Industrial Safety Gloves",
        "CNC Machine Components",
        "Production Line Equipment",
        "Industrial Fasteners",
    ],
    4: [
        "Food Processing Ingredients",
        "Organic Agricultural Produce",
        "Bulk Food Supplies",
        "Agricultural Raw Materials",
    ],
    5: [
        "Packaging Materials",
        "Industrial Packaging Supplies",
        "Protective Packaging",
        "Packaging Components",
    ],
    6: [
        "Industrial Workwear",
        "Cotton Fabric",
        "Polyester Textile Material",
        "Protective Textiles",
    ],
    7: [
        "Medical Consumables",
        "Healthcare Equipment",
        "Hospital Supplies",
        "Protective Medical Equipment",
    ],
    8: [
        "Automotive Components",
        "Vehicle Spare Parts",
        "Automotive Hardware",
        "Industrial Vehicle Components",
    ],
    9: [
        "Carbon Steel Pipes",
        "Stainless Steel Pipes",
        "Industrial Steel Tubes",
        "Structural Steel Pipes",
    ],
    10: [
        "Portland Cement",
        "Construction Cement",
        "Bulk Cement",
        "Industrial Cement",
    ],
    11: [
        "Excavator Components",
        "Construction Machinery Parts",
        "Industrial Earthmoving Equipment",
        "Heavy Construction Equipment",
    ],
    12: [
        "Electronic Components",
        "PCB Components",
        "Industrial Electronic Parts",
        "Circuit Board Components",
    ],
    13: [
        "Industrial Temperature Sensor",
        "Pressure Sensor",
        "Proximity Sensor",
        "Industrial Monitoring Sensor",
    ],
    14: [
        "Rice",
        "Wheat",
        "Maize",
        "Food Grain Supplies",
    ],
    15: [
        "Flexible Packaging Film",
        "Food Packaging Film",
        "Flexible Plastic Packaging",
        "Industrial Flexible Packaging",
    ],
}


NOTES = [
    "Bulk procurement requirement for regular business operations.",
    "Looking for a reliable supplier with consistent quality.",
    "Preferred for commercial procurement and recurring supply.",
    "Supplier should provide consistent specifications and delivery.",
    "Requirement intended for an upcoming procurement cycle.",
    "Quality and delivery reliability are important.",
]


def get_categories(supabase) -> dict[int, str]:
    response = (
        supabase
        .table("categories")
        .select("id, name")
        .order("id")
        .execute()
    )

    categories = {
        row["id"]: row["name"]
        for row in (response.data or [])
    }

    missing = sorted(set(PRODUCTS) - set(categories))

    if missing:
        raise RuntimeError(
            f"Database is missing expected category IDs: {missing}"
        )

    return categories


def random_quantity(rng: random.Random) -> str:
    amount = rng.choice(
        [
            100,
            250,
            500,
            750,
            1000,
            1500,
            2000,
            5000,
            10000,
        ]
    )

    unit = rng.choice(
        [
            "units",
            "pieces",
            "kg",
            "boxes",
        ]
    )

    return f"{amount} {unit}"


def numeric_quantity(quantity: str) -> int:
    return int(quantity.split()[0])


def make_requirement(
    rng: random.Random,
    index: int,
    category_id: int,
) -> dict[str, Any]:
    product = rng.choice(PRODUCTS[category_id])

    quantity = random_quantity(rng)
    budget = rng.choice(
        [
            "5000",
            "10000",
            "25000",
            "50000",
            "75000",
            "100000",
            "250000",
            "500000",
        ]
    )

    location = rng.choice(LOCATIONS)
    timeline = rng.choice(TIMELINES)

    return {
        "user_id": CLIENT_USER_ID,
        "product": product,
        "category_id": category_id,
        "quantity": quantity,
        "budget": budget,
        "location": location,
        "timeline": timeline,
        "notes": (
            f"{SEED_MARKER} "
            f"synthetic requirement {index}. "
            f"{rng.choice(NOTES)}"
        ),
    }


def make_strong_offering(
    rng: random.Random,
    requirement: dict[str, Any],
    index: int,
) -> dict[str, Any]:
    category_id = requirement["category_id"]
    product = requirement["product"]

    required_quantity = numeric_quantity(
        requirement["quantity"]
    )

    offering_quantity = int(
        required_quantity * rng.uniform(1.0, 2.5)
    )

    budget = int(requirement["budget"])

    price = max(
        1,
        int(budget * rng.uniform(0.65, 0.95)),
    )

    return {
        "user_id": SUPPLIER_USER_ID,
        "product": product,
        "category_id": category_id,
        "quantity": f"{offering_quantity} units",
        "price": str(price),
        "location": requirement["location"],
        "delivery": requirement["timeline"],
        "notes": (
            f"{SEED_MARKER} "
            f"strong synthetic offering {index}. "
            f"Matches the buyer's requested product and specifications."
        ),
    }


def make_distractor_offering(
    rng: random.Random,
    requirement: dict[str, Any],
    index: int,
) -> dict[str, Any]:
    category_id = rng.choice(
        [
            category
            for category in PRODUCTS
            if category != requirement["category_id"]
        ]
    )

    product = rng.choice(PRODUCTS[category_id])

    return {
        "user_id": SUPPLIER_USER_ID,
        "product": product,
        "category_id": category_id,
        "quantity": random_quantity(rng),
        "price": str(
            rng.choice(
                [
                    3000,
                    8000,
                    15000,
                    30000,
                    75000,
                    150000,
                    300000,
                ]
            )
        ),
        "location": rng.choice(LOCATIONS),
        "delivery": rng.choice(TIMELINES),
        "notes": (
            f"{SEED_MARKER} "
            f"distractor synthetic offering {index}. "
            f"Unrelated category used for matching evaluation."
        ),
    }


def insert_in_batches(
    supabase,
    table: str,
    rows: list[dict[str, Any]],
) -> None:
    total = len(rows)

    for start in range(0, total, BATCH_SIZE):
        batch = rows[start : start + BATCH_SIZE]

        response = (
            supabase
            .table(table)
            .insert(batch)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                f"Failed inserting {table} batch "
                f"{start} - {start + len(batch)}"
            )

        end = min(start + len(batch), total)

        print(
            f"Inserted {table}: {end}/{total}",
            flush=True,
        )


def generate_embeddings(
    model,
    rows: list[dict[str, Any]],
) -> list[list[float]]:
    texts = []

    for row in rows:
        product = row["product"]
        notes = row.get("notes") or ""

        texts.append(
            f"{product} | {notes}"
        )

    embeddings = model.encode(
        texts,
        batch_size=32,
        normalize_embeddings=True,
        show_progress_bar=True,
    )

    return [
        embedding.tolist()
        for embedding in embeddings
    ]


def main() -> None:
    rng = random.Random(SEED)

    print("Connecting to Supabase...")
    supabase = get_supabase_client()

    print("Validating categories...")
    categories = get_categories(supabase)

    print(
        f"Found {len(categories)} categories."
    )

    requirements: list[dict[str, Any]] = []
    offerings: list[dict[str, Any]] = []

    category_ids = sorted(PRODUCTS)

    print(
        f"Generating {REQUIREMENT_COUNT} requirements..."
    )

    for index in range(1, REQUIREMENT_COUNT + 1):
        category_id = rng.choice(category_ids)

        requirement = make_requirement(
            rng,
            index,
            category_id,
        )

        requirements.append(requirement)

        offerings.append(
            make_strong_offering(
                rng,
                requirement,
                index,
            )
        )

        offerings.append(
            make_distractor_offering(
                rng,
                requirement,
                index,
            )
        )

    print(
        f"Generated {len(requirements)} requirements "
        f"and {len(offerings)} offerings."
    )

    print("Loading embedding model...")
    model = get_embedding_model()

    print("Generating requirement embeddings...")
    requirement_embeddings = generate_embeddings(
        model,
        requirements,
    )

    for row, embedding in zip(
        requirements,
        requirement_embeddings,
    ):
        row["embedding"] = embedding

    print("Generating offering embeddings...")
    offering_embeddings = generate_embeddings(
        model,
        offerings,
    )

    for row, embedding in zip(
        offerings,
        offering_embeddings,
    ):
        row["embedding"] = embedding

    print("Inserting requirements...")
    insert_in_batches(
        supabase,
        "requirements",
        requirements,
    )

    print("Inserting offerings...")
    insert_in_batches(
        supabase,
        "offerings",
        offerings,
    )

    print()
    print("=" * 60)
    print("SUPPLYMATCH SEED COMPLETE")
    print("=" * 60)
    print(f"Requirements inserted: {len(requirements)}")
    print(f"Offerings inserted:    {len(offerings)}")
    print(f"Total records:         {len(requirements) + len(offerings)}")
    print(f"Seed marker:           {SEED_MARKER}")
    print("=" * 60)


if __name__ == "__main__":
    main()