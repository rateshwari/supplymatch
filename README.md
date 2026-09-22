# SupplyMatch

## AI-Powered B2B Procurement & Supplier Matching Platform

SupplyMatch is an AI-powered B2B procurement platform that connects buyer requirements with relevant supplier offerings using a hybrid semantic and structured matching engine.

The platform combines semantic similarity using sentence embeddings with procurement-specific criteria such as category, location, quantity, budget, and delivery timeline to generate ranked and explainable supplier matches.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [System Architecture](#system-architecture)
- [Application Workflow](#application-workflow)
- [AI Matching Engine](#ai-matching-engine)
- [Matching Pipeline](#matching-pipeline)
- [Explainable Matching](#explainable-matching)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Architecture](#database-architecture)
- [Authentication and Authorization](#authentication-and-authorization)
- [API Architecture](#api-architecture)
- [Notifications and Match Requests](#notifications-and-match-requests)
- [Synthetic Dataset](#synthetic-dataset)
- [Evaluation Results](#evaluation-results)
- [Performance and Scalability](#performance-and-scalability)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Security](#security)
- [Application Routes](#application-routes)
- [Current Scope](#current-scope)
- [Future Enhancements](#future-enhancements)
- [Project Status](#project-status)
- [Repository](#repository)
- [License](#license)

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

