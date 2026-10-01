# TASK ID: ADMIN-077.1
# TITLE: Add Admin: read-only dockerized dev environment
# STATUS: pending
# DEPENDENCIES: ARCH-024.2
# ALLOWED FILES: product/docker-compose.dev.yml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
One command: `docker compose up` → Cloud + MinIO + our mesh running.

## REQUIRED IMPLEMENTATION

Create `product/docker-compose.dev.yml`:

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: product
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: product_dev
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U product"]
      interval: 5s
      retries: 5

  minio:
    image: minio/minio:RELEASE.2024-09-01T00-00-00Z
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: miniodev
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  cloud:
    build: ../platform-cloud
    environment:
      DATABASE_URL: postgres://product:dev@postgres:5432/product_dev
      MINIO_URL: http://minio:9000
      MINIO_ACCESS_KEY: minio
      MINIO_SECRET_KEY: miniodev
      VAPID_PUBLIC_KEY: dev
      VAPID_PRIVATE_KEY: dev
      STRIPE_SECRET_KEY: sk_test_dev
      RESEND_API_KEY: re_dev
    ports:
      - "8787:8787"
    depends_on:
      postgres: { condition: service_healthy }
      minio: { condition: service_started }

volumes:
  pg_data:
  minio_data:
```

## TESTS

```bash
cd /workspace/product
test -f docker-compose.dev.yml || { echo "FAIL"; exit 1; }
grep -q "postgres" docker-compose.dev.yml || { echo "FAIL"; exit 1; }
echo "OK"
```
