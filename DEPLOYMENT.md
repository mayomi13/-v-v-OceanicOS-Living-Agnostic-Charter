# Deployment Guide

## Overview

This guide covers deploying vΩ∞v OceanicOS to various environments, from local development to production.

---

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Node.js 18+ (for local deployment)
- PostgreSQL 15+ (for production databases)
- GitHub Actions configured (for CI/CD)

---

## Deployment Environments

### 1. Local Development

**See**: [DEVELOPMENT.md](./DEVELOPMENT.md)

```bash
docker-compose up --build
```

---

### 2. Staging Environment

**Purpose**: Test full deployment pipeline before production.

#### Setup Staging Database

```bash
# Create staging database
createdb -h staging-db-host -U postgres vovv_staging
```

#### Deploy to Staging

```bash
# Set environment variables
export NODE_ENV=staging
export DATABASE_URL="postgresql://postgres:password@staging-db-host:5432/vovv_staging"
export VITE_API_URL="https://staging-api.example.com"

# Install dependencies
npm run bootstrap

# Run migrations
npm run db:migrate:deploy

# Build and start services
docker-compose -f docker-compose.staging.yml up -d
```

#### Verify Staging Deployment

```bash
curl https://staging-api.example.com/health
curl https://staging.example.com
```

---

### 3. Production Environment

#### Security Considerations

- Use HTTPS only (TLS/SSL certificates)
- Enable environment variable encryption for secrets
- Use private Docker registries for images
- Configure firewall rules (limit inbound to ports 443, 80)
- Enable database backups (automated daily snapshots)
- Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)

#### Environment Variables

Create `.env.production` with required variables:

```bash
# Database
DATABASE_URL="postgresql://prod_user:secure_password@prod-db:5432/vovv_prod"

# Backend
NODE_ENV="production"
PORT=3000

# Frontend
VITE_API_URL="https://api.oceanicos.example.com"

# Logging
LOG_LEVEL="info"
LOG_FORMAT="json"
```

#### Deploy Steps

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm run bootstrap

# 3. Run database migrations
npm run db:migrate:deploy

# 4. Build backend
cd backend && npm run build && cd ..

# 5. Build frontend
cd frontend && npm run build && cd ..

# 6. Start services with production compose file
docker-compose -f docker-compose.prod.yml up -d
```

#### Health Checks

```bash
# API health
curl https://api.oceanicos.example.com/health

# Frontend availability
curl https://oceanicos.example.com

# Database connectivity
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -c "SELECT 1"
```

---

## Deployment Options

### Option A: Docker Compose (Recommended for Small to Medium)

**Pros**: Simple, reproducible, all-in-one setup
**Cons**: Limited autoscaling, requires manual failover

#### Production Compose File

See `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: vovv-backend:0.1.0
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NODE_ENV: production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: vovv-frontend:0.1.0
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: ${VITE_API_URL}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5173"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: vovv_prod
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  db-data:
```

---

### Option B: Kubernetes (Recommended for Large Scale)

**Pros**: Auto-scaling, declarative config, multi-region support
**Cons**: More complex, higher operational overhead

#### Kubernetes Manifests

Create `infra/k8s/` with deployment manifests:

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vovv-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vovv-backend
  template:
    metadata:
      labels:
        app: vovv-backend
    spec:
      containers:
      - name: backend
        image: vovv-backend:0.1.0
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

Deploy to Kubernetes:

```bash
kubectl apply -f infra/k8s/
kubectl get pods -l app=vovv-backend
```

---

### Option C: Managed Platforms

**Heroku, Railway, Render**

These platforms abstract infrastructure management.

```bash
# Deploy to Heroku (example)
git push heroku main

# Set environment variables
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set VITE_API_URL="https://your-app.herokuapp.com"
```

---

## Database Migrations

### Running Migrations in Production

```bash
# Dry run to see what will execute
npm run db:migrate:resolve

# Apply migrations
npm run db:migrate:deploy

# Verify schema
docker-compose exec db psql -U postgres -d vovv_prod -c "\dt"
```

### Backup Before Migration

```bash
# Backup production database
pg_dump -h prod-db -U postgres vovv_prod > backup-$(date +%Y%m%d).sql

# Restore if needed
psql -h prod-db -U postgres vovv_prod < backup-20260716.sql
```

---

## Monitoring & Logging

### Health Endpoints

Monitor these endpoints regularly:

```bash
# API health
GET /health → should return {"status": "ok"}

# Charter endpoint
GET /charter → should return charter content
```

### Log Aggregation

Configure centralized logging (ELK Stack, CloudWatch, Datadog):

```javascript
// backend/src/logging.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-stackdriver'
  }
});
```

### Alerts

Set up alerts for:
- High error rates (> 5% of requests)
- Slow response times (> 1 second)
- Database connection failures
- Disk space warnings (> 80% full)

---

## Rollback Procedures

### Quick Rollback

```bash
# Revert to previous Docker image
docker-compose -f docker-compose.prod.yml down
git checkout HEAD~1
npm run bootstrap
docker-compose -f docker-compose.prod.yml up -d
```

### Database Rollback

```bash
# If migrations caused issues
npm run db:migrate:resolve  # see history
npm run db:migrate:deploy --version=previous-version
```

---

## Performance Optimization

### Backend

- Enable gzip compression in Fastify
- Use connection pooling for PostgreSQL
- Implement caching (Redis) for charter document

### Frontend

- Enable Gzip/Brotli compression
- Use CDN for static assets
- Implement lazy loading for proposal lists

### Database

- Add indexes on frequently queried columns (`status`, `createdAt`)
- Archive old proposals to cold storage
- Set up read replicas for high-traffic scenarios

---

## Post-Deployment Checklist

- [ ] Verify all health endpoints respond correctly
- [ ] Test API endpoints (curl or Postman)
- [ ] Confirm frontend loads without errors
- [ ] Verify database backups are working
- [ ] Check logs for errors or warnings
- [ ] Verify SSL/TLS certificate validity (if HTTPS)
- [ ] Test email notifications (if configured)
- [ ] Run smoke tests against production

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Verify database connection
docker-compose exec backend psql -c "SELECT 1"
```

### Frontend doesn't load

```bash
# Check network tab in browser DevTools
# Verify VITE_API_URL is correct
# Check frontend build artifacts in dist/
```

### Database migration fails

```bash
# Resolve failed migration
npm run db:migrate:resolve

# Review migration history
npm run db:migrate:status

# View schema
docker-compose exec db psql -U postgres -d vovv_prod -c "\d+"
```

---

## Support

For deployment issues, consult:
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Local setup
- [API.md](./API.md) - Endpoint documentation
- GitHub Issues for bugs or feature requests
