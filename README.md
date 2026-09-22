# SupplyMatch

## AI-Powered B2B Procurement & Supplier Matching Platform

SupplyMatch is an AI-powered B2B procurement platform that connects buyer requirements with relevant supplier offerings using a hybrid semantic and structured matching engine.

The platform combines semantic similarity using sentence embeddings with procurement-specific criteria such as category, location, quantity, budget, and delivery timeline to generate ranked and explainable supplier matches.

---

# Overview

SupplyMatch is designed to simplify B2B procurement by intelligently connecting buyers with suppliers.

A buyer can submit a structured procurement requirement containing:

- Product requirement
- Category
- Quantity
- Budget
- Location
- Delivery timeline
- Additional notes

Suppliers can publish their offerings containing:

- Product offered
- Category
- Available quantity
- Price
- Location
- Delivery timeline
- Additional notes

The SupplyMatch matching engine compares these two sides using semantic similarity and structured procurement criteria.

The result is a ranked list of relevant suppliers with match scores and explainable matching signals.

---

# Problem Statement

Traditional B2B procurement often relies on:

- Manual supplier discovery
- Keyword-based search
- Spreadsheets
- Email communication
- Repeated requirement sharing
- Subjective supplier selection

Keyword-based search also has limitations when buyers and suppliers use different terminology.

For example:

### Buyer Requirement

> Heavy-duty protective gloves for industrial workers

### Supplier Offering

> Abrasion-resistant industrial safety hand protection

Although the two descriptions are semantically related, a simple keyword search may fail to identify their relationship effectively.

SupplyMatch addresses this problem using semantic vector search combined with structured procurement constraints.

---

# Solution

SupplyMatch uses a hybrid matching architecture.

```text
Buyer Requirement
        |
        v
Text Representation
        |
        v
Sentence Embedding
        |
        v
Vector Similarity Search
        |
        v
Top-K Supplier Candidates
        |
        v
Structured Procurement Matching
        |
        v
Hybrid Match Score
        |
        v
Ranked Supplier Matches
```

The system combines:

- Semantic similarity
- Category compatibility
- Location compatibility
- Quantity feasibility
- Budget compatibility
- Delivery compatibility

This allows SupplyMatch to identify suppliers based on both semantic relevance and procurement feasibility.

---

# Key Features

## Client Features

- Client registration
- Client authentication
- Client profile
- Requirement creation
- Requirement listing
- Requirement details
- AI-powered supplier matching
- Ranked supplier matches
- Match scores
- Explainable match reasons
- Match requests
- Notification center
- Supplier response notifications

## Supplier Features

- Supplier registration
- Supplier authentication
- Supplier profile
- Supplier offering creation
- Offering management
- Matched buyer requirements
- Match request notifications
- Match acceptance
- Notification center

## Platform Features

- Role-based workflows
- Supabase authentication
- JWT-protected backend APIs
- FastAPI REST API
- PostgreSQL
- pgvector
- HNSW vector indexing
- Semantic search
- Hybrid matching
- Explainable scoring
- Notifications
- Match requests
- Pagination
- Query batching
- Input validation
- Automated testing
- GitHub Actions CI

---

# User Roles

SupplyMatch currently supports two primary roles.

## Client

Clients represent buyers or procurement teams.

```text
Client Registration
        |
        v
Client Login
        |
        v
Create Requirement
        |
        v
AI Supplier Matching
        |
        v
View Ranked Matches
        |
        v
Send Match Request
        |
        v
Receive Supplier Response
```

## Supplier

Suppliers represent organizations providing products or services.

```text
Supplier Registration
        |
        v
Supplier Login
        |
        v
Create Offering
        |
        v
AI Matching
        |
        v
View Matched Requirements
        |
        v
Receive Match Request
        |
        v
Accept Request
        |
        v
Client Receives Notification
```

---

# System Architecture

```text
                         SUPPLYMATCH
                              |
              +---------------+---------------+
              |                               |
              v                               v
       Next.js Frontend                 Supabase Auth
              |                               |
              | HTTPS + JWT                  |
              v                               |
        FastAPI Backend <---------------------+
              |
       +------+-------+
       |              |
       v              v
 Matching Engine   API Services
       |              |
       |              +-----------------------------+
       |                                            |
       v                                            v
 Sentence                              Profiles / Requirements
 Transformers                          Offerings / Matches
       |                                Notifications
       |                                Match Requests
       v
   Embeddings
       |
       v
 PostgreSQL + pgvector
       |
       +---- HNSW Indexes
       |
       +---- Row Level Security
```

---

# High-Level Architecture

```text
┌──────────────────────────────────────────────┐
│                 Next.js Frontend             │
│                                              │
│  Client Portal       Supplier Portal         │
│  Dashboard           Dashboard               │
│  Requirements        Offerings               │
│  Matches             Notifications            │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTPS + JWT
                       ▼
┌──────────────────────────────────────────────┐
│                 FastAPI Backend              │
│                                              │
│  Authentication                              │
│  Profiles                                    │
│  Requirements                                │
│  Offerings                                   │
│  Matching                                    │
│  Notifications                               │
│  Match Requests                              │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│              Supabase PostgreSQL             │
│                                              │
│  Profiles                                    │
│  Requirements                                │
│  Offerings                                   │
│  Matches                                     │
│  Notifications                               │
│  Categories                                  │
│                                              │
│  pgvector                                    │
│  HNSW Indexes                                │
│  Row Level Security                          │
└──────────────────────────────────────────────┘
```

---

# Application Workflow

## Client Workflow

```text
Client
  |
  v
Register / Login
  |
  v
Dashboard
  |
  v
Create Requirement
  |
  v
Requirement Stored
  |
  v
Generate Embedding
  |
  v
Vector Search
  |
  v
Retrieve Supplier Candidates
  |
  v
Apply Structured Matching
  |
  v
Calculate Match Scores
  |
  v
Rank Suppliers
  |
  v
Client Views Matches
  |
  v
Send Match Request
  |
  v
Supplier Notification
  |
  v
Supplier Accepts
  |
  v
Client Notification
```

## Supplier Workflow

```text
Supplier
  |
  v
Register / Login
  |
  v
Dashboard
  |
  v
Create Offering
  |
  v
Generate Embedding
  |
  v
Store Offering
  |
  v
Requirement Matching
  |
  v
View Matched Requirements
  |
  v
Receive Match Request
  |
  v
Accept Request
  |
  v
Client Notification
```

---

# AI Matching Engine

The core intelligence of SupplyMatch is the hybrid matching engine.

The system does not depend only on keyword matching.

Instead, it combines semantic similarity with structured procurement signals.

## Embedding Model

SupplyMatch uses:

```text
Sentence Transformers
all-MiniLM-L6-v2
```

Embedding dimension:

```text
384
```

The embedding model converts text into numerical vector representations.

For example:

```text
"Industrial Safety Gloves"
```

and:

```text
"Heavy Duty Protective Gloves for Industrial Workers"
```

can be recognized as semantically related even though they are not identical strings.

---

# Matching Pipeline

## Step 1 — Requirement Creation

A client submits:

```text
Company / Client Name
Product Requirement
Category
Quantity Required
Budget
Location
Delivery Timeline
Additional Notes
```

---

## Step 2 — Text Representation

Relevant requirement information is converted into an embedding.

```text
Requirement
    |
    v
Text Representation
    |
    v
all-MiniLM-L6-v2
    |
    v
384-dimensional Vector
```

---

## Step 3 — Vector Retrieval

The requirement embedding is compared against supplier offering embeddings using PostgreSQL and pgvector.

The system retrieves the most semantically similar supplier candidates.

---

## Step 4 — Structured Matching

The retrieved candidates are evaluated using procurement-specific fields:

- Category
- Location
- Quantity
- Budget
- Delivery timeline

---

## Step 5 — Hybrid Scoring

Semantic similarity and structured compatibility are combined into a final score.

```text
Candidate Supplier
       |
       +---- Semantic Similarity
       |
       +---- Category Compatibility
       |
       +---- Location Compatibility
       |
       +---- Quantity Compatibility
       |
       +---- Budget Compatibility
       |
       +---- Delivery Compatibility
       |
       v
Final Match Score
```

---

## Step 6 — Ranking

Suppliers are ranked according to the resulting match score.

Example:

```text
Supplier A    95%
Supplier B    91%
Supplier C    87%
Supplier D    81%
```

---

# Explainable Matching

SupplyMatch is designed to make matching results understandable rather than returning only a numerical score.

A match can contain signals such as:

```text
Strong product similarity
Category compatible
Location compatible
Quantity sufficient
Delivery timeline compatible
Budget compatible
```

This allows users to understand the factors contributing to a supplier match.

---

# Match Score

The matching engine combines semantic similarity with structured procurement criteria.

Conceptually:

```text
Final Score =
    Semantic Similarity
    +
    Category Compatibility
    +
    Location Compatibility
    +
    Quantity Compatibility
    +
    Budget Compatibility
    +
    Delivery Compatibility
```

The final score is normalized and presented to users as a percentage.

The exact implementation of the scoring logic is maintained in the backend matching service.

---

# Technology Stack

## Frontend

| Technology   | Purpose                               |
| ------------ | ------------------------------------- |
| Next.js 16   | React application framework           |
| React 19     | UI development                        |
| TypeScript   | Type-safe frontend development        |
| Tailwind CSS | UI styling                            |
| Supabase JS  | Authentication and session management |
| ESLint       | Code quality and linting              |
| Turbopack    | Build tooling                         |

The frontend uses the Next.js App Router.

## Backend

| Technology            | Purpose                         |
| --------------------- | -------------------------------- |
| Python                | Backend programming language    |
| FastAPI               | REST API framework              |
| Pydantic              | Request and response validation |
| Pydantic Settings     | Environment configuration       |
| Pytest                | Automated testing               |
| Sentence Transformers | Embedding generation            |
| all-MiniLM-L6-v2      | Semantic embedding model        |

## Database

| Technology         | Purpose                               |
| ------------------- | -------------------------------------- |
| PostgreSQL          | Primary relational database           |
| Supabase            | Database and authentication platform  |
| pgvector             | Vector similarity search              |
| HNSW                 | Approximate nearest-neighbor indexing |
| Row Level Security   | Database access control               |

## DevOps

| Technology                    | Purpose                          |
| ------------------------------ | --------------------------------- |
| Git                            | Version control                  |
| GitHub                         | Source control and collaboration |
| GitHub Actions                 | Continuous integration           |
| Vercel                         | Frontend deployment              |
| FastAPI-compatible cloud host  | Backend deployment               |

---

# Project Structure

```text
supplymatch/
│
├── backend/
│   │
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── deps.py
│   │   │
│   │   ├── routers/
│   │   │   ├── profiles.py
│   │   │   ├── requirements.py
│   │   │   ├── offerings.py
│   │   │   ├── matches.py
│   │   │   ├── supplier_matches.py
│   │   │   └── notifications.py
│   │   │
│   │   ├── services/
│   │   │   ├── matching.py
│   │   │   ├── notifications.py
│   │   │   └── ...
│   │   │
│   │   └── ...
│   │
│   ├── scripts/
│   │   ├── seed_demo_data.py
│   │   └── ...
│   │
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_authorization.py
│   │   ├── test_config.py
│   │   ├── test_embeddings.py
│   │   ├── test_health.py
│   │   ├── test_main.py
│   │   ├── test_matches.py
│   │   ├── test_matching.py
│   │   ├── test_matching_service.py
│   │   ├── test_notification_service.py
│   │   ├── test_notifications.py
│   │   ├── test_offerings.py
│   │   ├── test_profile.py
│   │   ├── test_requirements.py
│   │   ├── test_supplier_matches.py
│   │   └── test_vector_search.py
│   │
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   │
│   ├── app/
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── signup/
│   │   ├── dashboard/
│   │   ├── requirements/
│   │   ├── offerings/
│   │   ├── notifications/
│   │   └── supplier/
│   │
│   ├── components/
│   │   ├── app-shell.tsx
│   │   ├── notifications-panel.tsx
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── supabase.ts
│   │   └── supplymatch-api.ts
│   │
│   ├── types/
│   │   └── api.ts
│   │
│   ├── package.json
│   └── ...
│
├── .github/
│   └── workflows/
│       └── backend-ci.yml
│
├── README.md
└── ...
```

---

# Database Architecture

SupplyMatch uses Supabase PostgreSQL as the primary database.

The database stores structured procurement information alongside semantic embeddings using pgvector.

Core entities include:

```text
profiles
requirements
offerings
matches
notifications
categories
```

---

# Database Entities

## Profiles

Stores application-level user information.

Typical fields:

```text
id
role
name
company
created_at
updated_at
```

Roles:

```text
client
supplier
```

## Requirements

Represents buyer procurement requirements.

Typical fields:

```text
id
client_id
product_requirement
category_id
quantity_required
budget
location
delivery_timeline
additional_notes
embedding
created_at
updated_at
```

## Offerings

Represents products or services offered by suppliers.

Typical fields:

```text
id
supplier_id
product_offered
category_id
quantity_available
price
location
delivery_timeline
additional_notes
embedding
created_at
updated_at
```

## Matches

Represents relationships between buyer requirements and supplier offerings.

```text
Requirement
     |
     v
   Match
     |
     v
Offering
```

Match records contain information such as:

```text
requirement_id
offering_id
score
match reasons
status
created_at
```

## Notifications

Stores application notifications for clients and suppliers.

Examples:

```text
New match available
Match request sent
New match request received
Match request accepted
```

---

# Vector Search

Supplier offering embeddings are stored in PostgreSQL using pgvector.

An HNSW index is used for efficient approximate nearest-neighbor search.

```text
Requirement Embedding
        |
        v
pgvector Similarity Search
        |
        v
Top-K Supplier Candidates
        |
        v
Structured Scoring
        |
        v
Final Ranking
```

This approach avoids requiring the application to perform a full comparison against every supplier for every request.

---

# Authentication and Authorization

Authentication is handled through Supabase Auth.

The frontend authenticates the user through Supabase.

The resulting JWT is passed to the FastAPI backend.

```text
Frontend
    |
    | Supabase JWT
    v
FastAPI
    |
    | JWT Verification
    v
Authenticated User
```

## Role-Based Authorization

The backend validates both authentication and application role.

Client-only operations require:

```text
role = client
```

Supplier-only operations require:

```text
role = supplier
```

This prevents authenticated users from automatically gaining access to functionality belonging to another role.

---

# API Architecture

The backend exposes REST APIs through FastAPI.

Major API areas include:

```text
/health
/profile
/requirements
/offerings
/matches
/supplier/matches
/notifications
```

## Health

```http
GET /health
```

Used to verify backend availability.

## Profiles

Profile APIs support:

```text
Create profile
Get current profile
Update profile
```

## Requirements

Requirement APIs support:

```text
Create requirement
List requirements
Get requirement
Generate matches
View matches
```

## Offerings

Offering APIs support:

```text
Create supplier offering
List offerings
Get offering
```

## Matching

Matching APIs support:

```text
Generate supplier matches
Retrieve requirement matches
View match details
Send match requests
```

## Supplier Matching

Supplier-facing matching APIs allow suppliers to retrieve buyer requirements matched to their offerings.

Large datasets are handled using pagination and batching.

## Notifications

Notification APIs support:

```text
Get notifications
Mark notification as read
Create match-request notifications
Create match-acceptance notifications
```

---

# Notifications and Match Requests

SupplyMatch supports direct interaction between buyers and suppliers through match requests.

## Match Request Flow

```text
Client
   |
   | Send Match Request
   v
FastAPI Backend
   |
   | Create Notification
   v
Supplier
   |
   | Receives Notification
   v
Supplier Accepts
   |
   v
FastAPI Backend
   |
   | Create Acceptance Notification
   v
Client
```

The notification interface periodically refreshes so suppliers can receive new match requests without manually reloading the page.

---

# Input Validation

FastAPI and Pydantic are used for request validation.

Validation includes:

- Required fields
- String length limits
- Numeric constraints
- Role validation
- Structured payload validation
- Unexpected field rejection

This reduces malformed API requests and keeps the API contract explicit.

---

# Large Dataset Handling

SupplyMatch supports large supplier datasets through:

```text
Pagination
+
Batching
+
Chunked Queries
```

Large lists of supplier offering IDs are processed in controlled batches rather than being passed through a single oversized database query.

This helps avoid:

- API response limits
- Oversized `.in()` queries
- JSON generation errors
- Excessive memory usage

---

# Synthetic Dataset

SupplyMatch includes a deterministic synthetic dataset generation pipeline for evaluating the matching engine.

The benchmark dataset contains:

```text
1,000 buyer requirements
2,000 supplier offerings
3,000 synthetic records
```

The seed process uses a deterministic seed to make evaluation reproducible.

The generated data includes strong matches and distractor offerings to evaluate retrieval and ranking performance.

---

# Evaluation Results

The matching engine was evaluated using a reproducible synthetic benchmark.

## Dataset

| Metric                 | Value |
| ----------------------- | ----: |
| Buyer Requirements      | 1,000 |
| Supplier Offerings      | 2,000 |
| Requirements Evaluated  | 1,000 |

## Matching Results

| Metric                     |    Result |
| ---------------------------- | ---------: |
| Retrieval Recall@5           |   100.00% |
| Retrieval Recall@10          |   100.00% |
| Retrieval Recall@20          |   100.00% |
| Top-1 Accuracy               |    99.80% |
| Top-5 Recall                 |   100.00% |
| Top-10 Recall                |   100.00% |
| MRR                          |    0.9990 |
| Average Strong-Match Score   |    93.80% |
| Median Latency               | 584.62 ms |
| P95 Latency                  | 773.79 ms |
| Maximum Latency              |   25.07 s |

## Evaluation Note

These results were obtained on a **synthetic benchmark** designed to evaluate the implementation and retrieval pipeline.

They should not be interpreted as production accuracy on real-world procurement data.

Real-world performance can vary depending on:

- Requirement quality
- Supplier data quality
- Product vocabulary
- Requirement ambiguity
- Category distribution
- Geographic distribution
- Pricing patterns
- Dataset size
- Embedding quality

---

# Performance and Scalability

SupplyMatch includes several mechanisms intended to support larger workloads.

## HNSW Vector Indexing

HNSW supports efficient approximate nearest-neighbor retrieval.

## Top-K Retrieval

Only the most relevant vector candidates are retrieved before structured scoring.

## Pagination

Large result sets are paginated.

## Query Batching

Large collections of IDs are processed in batches.

## Stored Embeddings

Embeddings are stored and reused rather than being regenerated for every matching operation.

---

# Local Development

## Prerequisites

Install:

- Git
- Python 3.12+
- Node.js 22+
- npm
- A Supabase project

Recommended:

```text
Python 3.12
Node.js 22+
npm
```

---

# Clone the Repository

```bash
git clone https://github.com/rateshwari/supplymatch.git
cd supplymatch
```

---

# Backend Setup

```bash
cd backend
```

Create a virtual environment:

```bash
python3.12 -m venv .venv
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# Backend Environment Variables

Create:

```text
backend/.env
```

Add:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
FRONTEND_ORIGIN=http://localhost:3000
```

Never commit this file.

---

# Run the Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Health endpoint:

```text
http://localhost:8000/health
```

---

# Backend Tests

Run:

```bash
pytest -q
```

The test suite covers:

- Authentication
- Authorization
- Configuration
- Embeddings
- Health endpoint
- Matching
- Matching service
- Notifications
- Notification service
- Requirements
- Offerings
- Profiles
- Supplier matches
- Vector search
- Large-query behavior

---

# Frontend Setup

Open another terminal.

From the repository root:

```bash
cd frontend
```

Install dependencies:

```bash
npm ci
```

---

# Frontend Environment Variables

Create:

```text
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Only public Supabase configuration should be used in the frontend.

The Supabase service-role key must never be exposed through:

```text
NEXT_PUBLIC_*
```

or frontend source code.

---

# Run the Frontend

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# Frontend Commands

Development:

```bash
npm run dev
```

Lint:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

Production server:

```bash
npm start
```

---

# Demo Dataset

The project includes a synthetic data generation script.

From the backend directory:

```bash
python scripts/seed_demo_data.py
```

The script generates deterministic demo requirements and supplier offerings for evaluating and demonstrating the matching engine.

---

# CI/CD

SupplyMatch uses GitHub Actions.

Workflow:

```text
.github/workflows/backend-ci.yml
```

The workflow validates both backend and frontend code.

## Backend CI

```text
Checkout
    |
    v
Python Setup
    |
    v
Install Dependencies
    |
    v
Run Pytest
```

## Frontend CI

```text
Checkout
    |
    v
Node.js Setup
    |
    v
npm ci
    |
    v
npm run lint
    |
    v
npm run build
```

Pull requests targeting `main` are automatically validated.

Feature branch pushes are also validated.

---

# Deployment

The intended production architecture separates the frontend and backend.

```text
                         Internet
                            |
              +-------------+-------------+
              |                           |
              v                           v
           Vercel                    Backend Host
          Next.js                      FastAPI
              |                           |
              +-------------+-------------+
                            |
                            v
                         Supabase
                    PostgreSQL + pgvector
                       Authentication
                            RLS
```

---

# Frontend Deployment

The Next.js frontend can be deployed to Vercel.

Required production environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

# Backend Deployment

The FastAPI backend requires:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
FRONTEND_ORIGIN=https://your-frontend-domain
```

The backend deployment environment should have sufficient memory to load the sentence-transformer embedding model and process matching workloads.

---

# Supabase Production Configuration

For production authentication, configure the deployed frontend URL in Supabase authentication settings.

The production configuration should include:

```text
Site URL
Redirect URLs
Authentication providers
```

The backend CORS configuration must allow the deployed frontend origin.

---

# Security

SupplyMatch follows several security principles.

## JWT Authentication

Protected API endpoints require authenticated JWTs.

## Role-Based Authorization

Client and supplier functionality is separated by application role.

## Row Level Security

Supabase Row Level Security provides database-level access control.

## Service Role Protection

The Supabase service-role key is backend-only.

It must never be:

- Committed to Git
- Included in frontend source code
- Exposed through `NEXT_PUBLIC_*`
- Returned through an API response

## Environment Variables

Secrets are stored in environment variables rather than source code.

---

# Application Routes

## Public Routes

```text
/
/login
/signup
```

## Shared Routes

```text
/dashboard
/notifications
```

## Client Routes

```text
/requirements
/requirements/new
/requirements/[id]/matches
```

## Supplier Routes

```text
/offerings
/offerings/new
/supplier/matches
```

---

# Current Scope

The current SupplyMatch implementation focuses on:

```text
Buyer Requirements
        +
Supplier Offerings
        +
Semantic Matching
        +
Structured Matching
        +
Explainable Scores
        +
Notifications
        +
Match Requests
```

The current implementation does not include:

- RFQ management
- Negotiation workflows
- Purchase orders
- Payments
- Supplier verification
- Advanced marketplace analytics
- Full procurement lifecycle management
- LLM-based free-text requirement parsing

These are potential future extensions.

---

# Future Enhancements

## Advanced AI Matching

Potential improvements include:

- Cross-encoder reranking
- Domain-specific embedding models
- Learning-to-rank models
- Feedback-based ranking
- Personalized supplier recommendations

## Procurement Intelligence

Potential additions include:

- Price trend analysis
- Supplier performance analytics
- Historical procurement insights
- Lead-time prediction
- Supplier reliability scoring

## Procurement Workflow

Potential additions include:

- RFQ creation
- Supplier quotations
- Negotiation workflows
- Purchase orders
- Contract management
- Procurement approval workflows

## Communication

Potential additions include:

- Email notifications
- WhatsApp notifications
- In-app messaging
- Buyer-supplier chat

## AI Procurement Assistant

A future natural-language workflow could be:

```text
Natural Language Requirement
            |
            v
Requirement Extraction
            |
            v
Structured Procurement Fields
            |
            v
Semantic Matching
            |
            v
Supplier Ranking
```

---

# Design Principles

SupplyMatch follows a structured B2B procurement-oriented design approach.

The interface emphasizes:

- Clear information hierarchy
- Role-specific navigation
- Structured procurement data
- Match score visibility
- Explainable matching
- Consistent visual language
- Responsive layouts
- Fast workflows
- Notification visibility

The application intentionally avoids presenting itself as a generic AI chatbot.

---

# Architecture Summary

```text
                     SUPPLYMATCH
                          |
            +-------------+-------------+
            |                           |
         CLIENT                      SUPPLIER
            |                           |
            v                           v
    Buyer Requirements          Supplier Offerings
            |                           |
            +-------------+-------------+
                          |
                          v
                  Sentence Transformer
                   all-MiniLM-L6-v2
                          |
                          v
                   384-D Embeddings
                          |
                          v
                   PostgreSQL
                    + pgvector
                          |
                          v
                    HNSW Search
                          |
                          v
                    Top-K Retrieval
                          |
                          v
                Structured Matching
                          |
                          v
                   Hybrid Scoring
                          |
                          v
                  Ranked Suppliers
                          |
                          v
                Explainable Results
                          |
                          v
             Match Requests / Alerts
```

---

# Project Status

SupplyMatch currently includes:

- Client authentication
- Supplier authentication
- Client profiles
- Supplier profiles
- Requirement management
- Supplier offering management
- Semantic embeddings
- pgvector search
- HNSW indexing
- Hybrid matching
- Explainable match results
- Supplier matching
- Match request notifications
- Match acceptance notifications
- Role-based authorization
- Input validation
- Pagination
- Large-query batching
- Backend automated tests
- Frontend linting
- Production frontend builds
- GitHub Actions CI
- Synthetic evaluation dataset
- Matching benchmark

---

# Evaluation Summary

The current synthetic benchmark demonstrates the behavior of the matching pipeline on deliberately constructed test data.

```text
1,000 Buyer Requirements
          +
2,000 Supplier Offerings
          |
          v
Semantic Retrieval
          |
          v
100% Recall@5
          |
          v
Hybrid Structured Scoring
          |
          v
99.80% Top-1 Accuracy
          |
          v
100% Top-5 Recall
```

These measurements are benchmark results on synthetic data and are not claims about real-world production accuracy.

---

# Repository

GitHub:

[https://github.com/rateshwari/supplymatch](https://github.com/rateshwari/supplymatch)

---

# License

This project is currently intended for demonstration, academic, hackathon, internship, and portfolio purposes.

An explicit open-source license such as MIT can be added if the project is intended for public redistribution.

---

# SupplyMatch

AI-powered procurement intelligence for connecting buyers with relevant suppliers.
