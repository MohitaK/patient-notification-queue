# patient-notification-queue

A minimal monorepo demonstrating a producer/consumer queue pattern for a healthcare patient notification system.

## What it does

A REST API (producer) receives notification requests and pushes them into a Redis queue. A separate worker process picks up jobs from the queue and processes them. They never talk to each other directly — Redis is the only middleman.

```
POST /notify
     │
     ▼
  Producer → Redis queue → Worker → sends notification
```

## Stack

| Tool | Role |
|---|---|
| Express | HTTP server for the producer |
| BullMQ | Queue library built on top of Redis |
| Redis | Stores and orders the jobs |
| Docker Compose | Runs Redis locally |
| Terraform | Provisions Redis (ElastiCache) on AWS |

## Project structure

```
packages/
  producer/     Express API — receives requests, pushes jobs to Redis
  worker/       Long-running process — picks up and processes jobs
terraform/      AWS ElastiCache Redis infrastructure
docker-compose.yml  Local Redis for development
```

## Running locally

**Prerequisites:** Docker, Node.js 18+

**1. Start Redis:**
```bash
docker-compose up
```

**2. Install dependencies:**
```bash
npm install
```

**3. Start the worker (Terminal 1):**
```bash
npm run worker
```

**4. Start the producer (Terminal 2):**
```bash
npm run producer
```

**5. Send a notification:**
```bash
# Critical lab result — high priority, jumps the queue
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{"patientId":"p001","type":"lab_result","priority":"critical","message":"Potassium level critical"}'

# Routine appointment reminder — normal priority
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{"patientId":"p002","type":"appointment","priority":"normal","message":"Reminder: appointment tomorrow at 10am"}'
```

## Notification types

| type | priority |
|---|---|
| `lab_result` | `critical` or `normal` |
| `appointment` | `normal` |
| `rx_ready` | `normal` |

Priority `critical` = score 1, `normal` = score 10. Lower score is processed first.

## Deploying to AWS

**Prerequisites:** AWS account, Terraform installed, VPC with private subnets.

```bash
cd terraform
terraform init
terraform apply \
  -var="vpc_id=vpc-xxxxxxxx" \
  -var='subnet_ids=["subnet-aaa","subnet-bbb"]'
```

After apply, Terraform outputs the Redis endpoint:
```
redis_endpoint = "notification-queue.abc123.us-east-1.cache.amazonaws.com"
```

Set it as an env var when running producer and worker:
```bash
REDIS_HOST=notification-queue.abc123.us-east-1.cache.amazonaws.com npm run producer
REDIS_HOST=notification-queue.abc123.us-east-1.cache.amazonaws.com npm run worker
```

## Key concepts

- **Async decoupling** — producer returns instantly, worker processes in the background
- **Priority queue** — critical jobs skip ahead of routine ones
- **Retry with backoff** — failed jobs retry 3 times (1s → 2s → 4s delays)
- **Concurrency** — worker processes 3 jobs simultaneously
- **Dead letter** — jobs that exhaust all retries are kept in Redis for inspection, never silently dropped
