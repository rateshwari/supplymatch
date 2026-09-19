# SupplyMatch

> AI-powered B2B supplier matching platform.

SupplyMatch connects buyers with suitable suppliers using a hybrid AI matching engine that combines semantic similarity with structured business-fit signals.

## Core Idea

A buyer posts a sourcing requirement. A supplier posts an offering. SupplyMatch analyzes both and ranks potential matches based on:

- Product similarity
- Category / subcategory
- Location
- Quantity
- Budget / price
- Delivery timeline

Each match includes an explainable score breakdown and a plain-language explanation of why the supplier matches the requirement.

## Architecture

```text
Next.js Frontend
       │
       │ REST + JWT
       ▼
   FastAPI Backend
       │
       ├── Matching Engine
       │     ├── Sentence Transformers
       │     ├── pgvector similarity
       │     └── Structured scoring
       │
       ▼
Supabase PostgreSQL
       ├── Profiles
       ├── Categories
       ├── Requirements
       ├── Offerings
       ├── Matches
       └── Notifications

Tech Stack
| Layer            | Technology                        |
| ---------------- | --------------------------------- |
| Frontend         | Next.js, TypeScript, Tailwind CSS |
| Backend          | FastAPI, Python                   |
| Database         | Supabase PostgreSQL               |
| Vector Search    | pgvector + HNSW                   |
| Embeddings       | all-MiniLM-L6-v2                  |
| Authentication   | Supabase Auth + JWT               |
| Frontend Hosting | Vercel                            |
| Backend Hosting  | DigitalOcean                      |

Project Structure
supplymatch/
├── frontend/
├── backend/
├── database/
├── docs/
└── .github/
Development Status

🚧 Under active development.

Roadmap
 Database schema
 Authentication
 Client portal
 Supplier portal
 Semantic matching engine
 Structured scoring
 Explainable match results
 Notifications
 Match board
 Automated testing
 CI/CD
 Production deployment