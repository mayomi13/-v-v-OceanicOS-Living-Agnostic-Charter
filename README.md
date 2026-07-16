# vΩ∞v OceanicOS Living Agnostic Charter

This repository contains the **Living Agnostic Charter** and a complete full-stack reference implementation for governance proposal management.

**Version**: 0.1.0 (Initial Release)

---

## Quick Start

### Local Development (Docker)

Requires: Docker, Docker Compose, Node.js 18+

```bash
# 1. Clone repository
git clone https://github.com/mayomi13/-v-v-OceanicOS-Living-Agnostic-Charter.git
cd -v-v-OceanicOS-Living-Agnostic-Charter

# 2. Start services
docker-compose up --build

# 3. Access services
echo "Backend API: http://localhost:3000"
echo "Frontend UI: http://localhost:5173"
```

---

## Documentation

- **[API.md](./API.md)** - REST API reference (endpoints, examples, types)
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Local development setup and testing
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide (Docker, K8s, managed platforms)
- **[RELEASE.md](./RELEASE.md)** - Release notes, roadmap, versioning strategy
- **[OBSERVABILITY.md](./OBSERVABILITY.md)** - Logging, metrics, alerting setup
- **[PROJECT_SCOPE.md](./PROJECT_SCOPE.md)** - Project goals and vision
- **[TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md)** - Tech decisions and rationale

---

## Features

✅ **REST API** - Charter and governance proposals endpoints  
✅ **Web UI** - React-based frontend for viewing and creating proposals  
✅ **Persistent Database** - PostgreSQL with Prisma ORM  
✅ **Docker Environment** - Complete containerized development setup  
✅ **Automated Testing** - Backend integration tests with CI/CD  
✅ **Production Ready** - Deployment guides and observability setup  

---

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   React + Vite  │  (port 5173)
└────────┬────────┘
         │ HTTP
         │ /api/*
┌────────▼────────┐
│   Backend       │
│ Fastify + TS    │  (port 3000)
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │
│  PostgreSQL 15  │  (port 5432)
└─────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TypeScript |
| Backend | Fastify 4, TypeScript, Prisma 5 |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Testing | Jest, Node test runner |
| CI/CD | GitHub Actions |
| Containerization | Docker, Docker Compose |

---

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |
| GET | `/charter` | Get charter document |
| GET | `/proposals` | List all proposals |
| POST | `/proposals` | Create new proposal |

See [API.md](./API.md) for detailed documentation with examples.

---

## Development

### Setup (Docker)

```bash
docker-compose up --build
```

### Setup (Local)

See [DEVELOPMENT.md](./DEVELOPMENT.md) for Node.js and PostgreSQL setup.

### Run Tests

```bash
npm run test:backend   # Backend integration tests
npm run test:api       # API endpoint tests
npm run test:coverage  # Coverage report
```

### Build for Production

```bash
npm run build          # Build backend and frontend
npm run start          # Start production server
```

---

## Deployment

### Quick Deploy (Docker Compose)

```bash
# Set environment variables
export DATABASE_URL="postgresql://user:pass@host/db"
export VITE_API_URL="https://api.yourdomain.com"

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Staging/production setup
- Kubernetes deployment
- Managed platform options (Heroku, Railway, Render)
- Database backup and restore
- Zero-downtime deployment strategies

---

## Observability

Monitor production with:
- **Health checks**: `/health` endpoint
- **Structured logging**: JSON format to log aggregation
- **Metrics**: Prometheus-compatible `/metrics` endpoint
- **Alerting**: Alert rules and integrations
- **Distributed tracing**: OpenTelemetry/Jaeger

See [OBSERVABILITY.md](./OBSERVABILITY.md) for setup guide.

---

## Release Information

**Current Version**: 0.1.0 (July 16, 2026)

### Features in v0.1.0

- Core proposal management API
- Charter document serving
- Web UI for proposals
- PostgreSQL persistence
- Automated testing
- Docker Compose environment
- GitHub Actions CI pipeline

### Roadmap

- **v0.2.0**: User authentication, voting mechanism, search
- **v0.3.0**: Advanced voting, delegation, GraphQL API
- **v1.0.0**: Security hardening, monitoring, multi-region

See [RELEASE.md](./RELEASE.md) for complete release strategy and versioning.

---

## Community

- **Report Issues**: [GitHub Issues](https://github.com/mayomi13/-v-v-OceanicOS-Living-Agnostic-Charter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mayomi13/-v-v-OceanicOS-Living-Agnostic-Charter/discussions)
- **Contributing**: See [CONTRIBUTING.md](./.github/CONTRIBUTING.md)

---

## License

Licensed under [MIT License](./LICENSE)

---

## Support

- 📖 **Documentation**: See links above for detailed guides
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/mayomi13/-v-v-OceanicOS-Living-Agnostic-Charter/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/mayomi13/-v-v-OceanicOS-Living-Agnostic-Charter/discussions)
- 📧 **Contact**: Open an issue for other inquiries

---

Last Updated: July 16, 2026
