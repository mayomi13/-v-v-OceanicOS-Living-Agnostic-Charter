# Observability & Monitoring Guide

## Overview

This guide covers implementing logging, metrics, and alerting for the vΩ∞v OceanicOS system in production.

---

## Health Checks

### Application Health Endpoints

All services should expose health check endpoints:

```bash
# Backend health
curl http://localhost:3000/health
# Response: {"status": "ok"}

# Frontend health (via response code)
curl -o /dev/null -w "%{http_code}" http://localhost:5173
# Response: 200

# Database health
docker-compose exec db pg_isready -U postgres
# Response: accepting connections
```

### Health Check Configuration

Docker Compose includes built-in health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s        # Check every 30 seconds
  timeout: 10s         # Wait max 10s for response
  retries: 3           # Mark unhealthy after 3 failures
  start_period: 10s    # Wait 10s before first check
```

---

## Logging

### Backend Logging

Implement structured logging with Pino:

```typescript
// backend/src/logger.ts
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  // Production: JSON format for log aggregation
  formatters: !isDevelopment ? {
    level: (label) => {
      return { level: label.toUpperCase() };
    }
  } : undefined
});
```

### Log Levels

| Level | Use Case |
|-------|----------|
| `trace` | Very detailed debugging (disabled in prod) |
| `debug` | Development debugging info |
| `info` | Important events (startup, config) |
| `warn` | Warnings that don't affect functionality |
| `error` | Errors that need attention |
| `fatal` | Critical errors that stop the service |

### Log Aggregation

#### Local Development

Logs are printed to stdout with pretty formatting:

```bash
docker-compose logs -f backend
```

#### Production - ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# docker-compose.prod.yml
services:
  backend:
    # ... existing config ...
    logging:
      driver: "splunk"
      options:
        splunk-token: "${SPLUNK_HEC_TOKEN}"
        splunk-url: "${SPLUNK_URL}"
        tag: "vovv-backend"
```

#### Production - Cloud Providers

**AWS CloudWatch**:
```typescript
import AWSXRay from 'aws-xray-sdk-core';
logger.info({ service: 'backend' }, 'Server started');
```

**GCP Cloud Logging**:
```typescript
import { LoggingWinston } from '@google-cloud/logging-winston';
const winston = require('winston');
const loggingWinston = new LoggingWinston();
logger.add(loggingWinston);
```

---

## Metrics

### Key Metrics to Track

#### Request Metrics

```typescript
// Requests per second
metric: 'http.requests.total'
labels: { method, endpoint, status }

// Response time
metric: 'http.response.time_ms'
labels: { method, endpoint }

// Error rate
metric: 'http.errors.total'
labels: { endpoint, error_type }
```

#### Database Metrics

```typescript
metric: 'db.query.duration_ms'
labels: { operation, table }

metric: 'db.connection.pool.active'
labels: { host }

metric: 'db.proposal.count'
labels: { status }
```

#### System Metrics

```typescript
metric: 'process.memory.usage_bytes'
metric: 'process.cpu.usage_percent'
metric: 'process.uptime_seconds'
```

### Prometheus Implementation

Install Prometheus client:

```bash
npm install prom-client
```

Create metrics in backend:

```typescript
// backend/src/metrics.ts
import client from 'prom-client';

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

export const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table']
});

// Expose metrics endpoint
app.get('/metrics', async (request, reply) => {
  reply.type('text/plain');
  return client.register.metrics();
});
```

### Prometheus Configuration

```yaml
# infra/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'vovv-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  - job_name: 'vovv-database'
    static_configs:
      - targets: ['localhost:5432']
    metrics_path: '/metrics'
```

### Grafana Dashboards

Create dashboards to visualize metrics:

```json
{
  "dashboard": {
    "title": "vΩ∞v OceanicOS",
    "panels": [
      {
        "title": "Requests per Second",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_response_time_ms)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_errors_total[1m])"
          }
        ]
      }
    ]
  }
}
```

---

## Alerting

### Alert Rules

Define alert thresholds in Prometheus:

```yaml
# infra/alerts.yml
groups:
  - name: vovv
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected ({{ $value | humanizePercentage }})"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_response_time_ms) > 1000
        for: 5m
        annotations:
          summary: "High response time (p95: {{ $value }}ms)"

      # Database connection issues
      - alert: DatabaseConnectionError
        expr: up{job="vovv-database"} == 0
        for: 1m
        annotations:
          summary: "Database is unreachable"

      # Low disk space
      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
        for: 5m
        annotations:
          summary: "Low disk space ({{ $value | humanizePercentage }} available)"

      # High memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / (1024 * 1024) > 500
        for: 5m
        annotations:
          summary: "High memory usage ({{ $value }}MB)"
```

### Alerting Channels

#### Email Alerts

```yaml
# infra/alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: 'email'
  group_by: ['alertname', 'cluster']

receivers:
  - name: 'email'
    email_configs:
      - to: 'ops@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alerts@example.com'
        auth_password: '${SMTP_PASSWORD}'
```

#### Slack Alerts

```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'
```

#### PagerDuty Alerts

```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        description: '{{ .GroupLabels.alertname }}'
```

---

## Distributed Tracing

### OpenTelemetry Implementation

Install OpenTelemetry:

```bash
npm install \
  @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-jaeger
```

Initialize tracing:

```typescript
// backend/src/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-trace-jaeger';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();
```

### Jaeger UI

Access trace visualization at `http://localhost:16686`

---

## APM (Application Performance Monitoring)

### Datadog Integration

```typescript
// backend/src/index.ts
import tracer from 'dd-trace';

tracer.init({
  env: process.env.DD_ENV || 'development',
  service: 'vovv-backend',
  version: '0.1.0'
});

const app = fastify({
  requestIdLogLabel: 'req_id',
  disableRequestLogging: false,
  requestTimeout: 30000
});

// Datadog spans for custom metrics
tracer.trace('proposal.create', async (span) => {
  span.setTag('proposal.status', 'open');
  // proposal creation logic
});
```

---

## Uptime Monitoring

### Ping Service Integration

```bash
# Use Uptime Robot or similar service to monitor
# Configure to ping health endpoints every 5 minutes

curl --url https://api.oceanicos.example.com/health \
  --max-time 10 \
  --retry 2
```

### Status Page

Host a public status page (e.g., using Statuspage.io):

- Displays service status
- Shows incident history
- Automatic updates from health checks

---

## Performance Profiling

### Node.js Profiling

Enable profiling in production:

```bash
# CPU profiling
node --prof backend/dist/index.js

# Generate profile report
node --prof-process isolate-*.log > report.txt
```

### Memory Debugging

```typescript
import heapdump from 'heapdump';

// Generate heap snapshot
setTimeout(() => {
  heapdump.writeSnapshot(`./heaps/${Date.now()}.heapsnapshot`);
}, 60000);
```

---

## Dashboard Checklist

**Essential Metrics Dashboard Should Display**:

- [ ] Requests per second (all endpoints)
- [ ] Response time (p50, p95, p99)
- [ ] Error rate and error types
- [ ] Database query performance
- [ ] Active connections
- [ ] Memory usage over time
- [ ] CPU usage over time
- [ ] Disk space available
- [ ] Proposal creation rate
- [ ] Uptime percentage

---

## Production Monitoring Setup

### Recommended Stack

- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack or CloudWatch
- **Tracing**: Jaeger or Datadog APM
- **Alerting**: Prometheus AlertManager + Slack
- **Uptime**: Datadog or Uptime Robot
- **Status Page**: Statuspage.io

### Implementation Timeline

- **Week 1**: Deploy Prometheus + Grafana (internal dashboards)
- **Week 2**: Add structured logging with ELK Stack
- **Week 3**: Implement OpenTelemetry tracing
- **Week 4**: Configure alerting rules
- **Week 5**: Set up public status page

---

## Troubleshooting

### No Metrics Being Collected

```bash
# Verify Prometheus can scrape endpoint
curl http://localhost:3000/metrics

# Check Prometheus targets
# http://localhost:9090/targets
```

### Missing Logs

```bash
# Check log level
echo $LOG_LEVEL

# Verify log transport is configured
docker-compose logs backend | grep "DEBUG\|ERROR"
```

### Alert Not Triggering

```bash
# Check AlertManager status
curl http://localhost:9093

# Verify alert rule syntax
promtool check rules alerts.yml
```

---

See also:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [API.md](./API.md) - API endpoints
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup
