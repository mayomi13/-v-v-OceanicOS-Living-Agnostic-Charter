# Local Development

Prereqs: Node.js 18+, Docker, Docker Compose, npm

1. Install workspace dependencies:

```bash
npm run bootstrap
```

2. Start Postgres and services via Docker Compose (this starts backend and frontend):

```bash
docker-compose up --build
```

3. The API will be available at `http://localhost:3000` and frontend at `http://localhost:5173`.

Prisma setup (optional — to use Postgres instead of JSON fallback):

1. Install Prisma tools and client in the backend:

```bash
cd backend
npm install prisma @prisma/client
```

2. Generate the Prisma client and apply migrations (Postgres must be running):

```bash
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate dev --name init --schema=prisma/schema.prisma
```

Note: If `prisma generate` fails with a missing wasm file in `@prisma/client/generator-build`, try running `npm install` at the repository root to ensure `node_modules` are installed correctly, or run the generate command inside a container that matches your host architecture.

Fallback: the backend currently uses a JSON file (`backend/data/proposals.json`) as a simple persistence layer if Prisma is not configured.

