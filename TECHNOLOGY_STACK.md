# Proposed Technology Stack

## Backend
- Language: TypeScript (Node.js)
- Framework: Fastify or Express
- Auth: JWT / OAuth2 (optional)
- DB: PostgreSQL (via Prisma or TypeORM)

## Frontend
- Framework: React + TypeScript
- Bundler: Vite
- Styling: Tailwind CSS (optional)

## Infra & DevOps
- Containerization: Docker
- CI: GitHub Actions (super-linter already added)
- Dependabot for dependency updates
- Hosting: Vercel / Cloud Run / GitHub Pages for static frontend

## Notes
These choices prioritize DX and cross-platform compatibility; alternatives can be listed per sub-project.
