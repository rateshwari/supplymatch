# SupplyMatch

### AI-Powered B2B Procurement & Supplier Matching Platform

SupplyMatch is an AI-powered B2B procurement platform that connects buyer requirements with relevant supplier offerings using a hybrid matching engine.

Instead of relying only on keyword matching, SupplyMatch combines:

- Semantic similarity using sentence embeddings
- Vector similarity search with PostgreSQL + pgvector
- Structured procurement criteria
- Category compatibility
- Location compatibility
- Quantity feasibility
- Budget compatibility
- Delivery timeline compatibility
- Explainable match scores
- Supplier notifications
- Client-to-supplier match requests
- Role-based buyer and supplier workflows

The platform is designed to reduce the time required to discover relevant suppliers and make procurement matching more structured, transparent, and explainable.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [System Architecture](#system-architecture)
- [Application Flow](#application-flow)
- [AI Matching Engine](#ai-matching-engine)
- [Matching Pipeline](#matching-pipeline)
- [Match Score](#match-score)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Architecture](#database-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [API Architecture](#api-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Notifications & Match Requests](#notifications--match-requests)
- [Synthetic Dataset](#synthetic-dataset)
- [Evaluation Results](#evaluation-results)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Production Deployment](#production-deployment)
- [Security](#security)
- [Performance & Scalability](#performance--scalability)
- [Future Enhancements](#future-enhancements)
- [Project Status](#project-status)
- [License](#license)

---

# Overview

SupplyMatch provides two primary experiences:

### Buyer / Client

A buyer can:

1. Create an account
2. Submit procurement requirements
3. Specify product, category, quantity, budget, location, and delivery timeline
4. View AI-ranked supplier matches
5. Inspect match scores and match reasons
6. Send a match request to a supplier
7. Receive notifications when suppliers respond

### Supplier

A supplier can:

1. Create an account
2. Create supplier offerings
3. Specify products, categories, quantities, pricing, locations, and delivery timelines
4. Receive automatically generated matches
5. View buyer requirements matched to their offerings
6. Receive match request notifications
7. Accept match requests
8. Track procurement-related notifications

---

# Problem Statement

Traditional B2B procurement workflows often depend on:

- Manual supplier discovery
- Keyword-based search
- Spreadsheets
- Email communication
- Repeated requirement sharing
- Subjective supplier selection

A buyer searching for a product may use different terminology from the supplier offering that product.

For example:

> Buyer:
>
> "Heavy-duty protective gloves for industrial workers"

while a supplier may list:

> "Abrasion-resistant industrial safety hand protection"

A keyword-only search may not recognize these as strongly related.

SupplyMatch addresses this problem through semantic matching combined with structured procurement constraints.

---

# Solution

SupplyMatch converts buyer requirements and supplier offerings into semantic vector representations.

The matching engine then:

1. Generates embeddings
2. Performs vector similarity retrieval
3. Retrieves candidate supplier offerings
4. Applies structured procurement criteria
5. Calculates an explainable match score
6. Ranks suppliers
7. Returns the most relevant matches

This creates a hybrid:

```text
Semantic Similarity
        +
Structured Procurement Matching
        =
Explainable Supplier Matching
