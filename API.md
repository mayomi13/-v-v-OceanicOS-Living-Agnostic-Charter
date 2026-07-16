# API Documentation

## Overview

The vΩ∞v OceanicOS API provides endpoints for accessing the Living Agnostic Charter and managing governance proposals.

**Base URL**: `http://localhost:3000` (development) or configured production URL

## Endpoints

### Health Check

**Endpoint**: `GET /health`

**Description**: Returns the health status of the API.

**Response** (200 OK):
```json
{
  "status": "ok"
}
```

---

### Get Charter

**Endpoint**: `GET /charter`

**Description**: Returns the full text of the Living Agnostic Charter.

**Response** (200 OK):
```json
{
  "content": "# vΩ∞v OceanicOS Living Agnostic Charter\n\n..."
}
```

**Errors**:
- 404 Not Found: Charter document not found

---

### List Proposals

**Endpoint**: `GET /proposals`

**Description**: Returns all proposals, ordered by creation date (newest first).

**Query Parameters**: None

**Response** (200 OK):
```json
[
  {
    "id": "cktz4v3q80000qz088p2b5c8o",
    "title": "Add voting mechanism",
    "body": "Proposal to implement quadratic voting...",
    "status": "open",
    "createdAt": "2026-07-16T14:30:00.000Z"
  },
  {
    "id": "cktz4v3q80001qz088p2b5c8p",
    "title": "Update governance structure",
    "body": "Proposal to streamline governance...",
    "status": "approved",
    "createdAt": "2026-07-15T10:15:00.000Z"
  }
]
```

---

### Create Proposal

**Endpoint**: `POST /proposals`

**Description**: Creates a new governance proposal.

**Request Body**:
```json
{
  "title": "string (required, max 255 characters)",
  "body": "string (optional, proposal details)"
}
```

**Response** (201 Created):
```json
{
  "id": "cktz4v3q80002qz088p2b5c8q",
  "title": "Add voting mechanism",
  "body": "Proposal to implement quadratic voting...",
  "status": "open",
  "createdAt": "2026-07-16T14:30:00.000Z"
}
```

**Errors**:
- 400 Bad Request: Missing required fields or invalid data
- 500 Internal Server Error: Database error

---

## Status Values

Proposals can have the following status values:

| Status | Description |
|--------|-------------|
| `open` | Proposal is active and accepting feedback |
| `approved` | Proposal has been approved |
| `rejected` | Proposal has been rejected |
| `withdrawn` | Proposal has been withdrawn by author |

---

## Data Types

### Proposal Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique proposal identifier (CUID format) |
| `title` | string | Proposal title |
| `body` | string \| null | Detailed proposal description |
| `status` | string | Current proposal status |
| `createdAt` | ISO 8601 | Timestamp of proposal creation |

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP Status Codes:
- `200 OK`: Request successful
- `201 Created`: Resource successfully created
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently, no rate limiting is enforced. This will be added in future releases for production deployments.

---

## Versioning

The API is currently in **version 1.0** (v0.1.0 release).

Future versions may introduce breaking changes with updated endpoints (e.g., `/api/v2/...`).

---

## Examples

### Create a Proposal

```bash
curl -X POST http://localhost:3000/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement quarterly governance reviews",
    "body": "Proposal to establish quarterly review cycles for governance decisions."
  }'
```

### Get All Proposals

```bash
curl http://localhost:3000/proposals
```

### Get Health Status

```bash
curl http://localhost:3000/health
```

---

## Frontend Integration

The frontend automatically proxies API calls to the backend:

- In development: Vite proxy routes `/api/*` to `http://backend:3000`
- In production: Configure environment variable `VITE_API_URL`

Frontend code:
```typescript
// API calls automatically routed to backend
const response = await fetch('/api/proposals');
```
