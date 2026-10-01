# TASK ID: LAUNCH-001.1
# TITLE: OpenAPI 3.1 spec for the Cloud HTTP API
# STATUS: pending
# DEPENDENCIES: ADMIN-095.2
# ALLOWED FILES: platform-cloud/openapi.yaml, platform-cloud/openapi.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Single source of truth for the Cloud API. Generated docs site, client SDKs, contract tests.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/openapi.yaml`:

```yaml
openapi: 3.1.0
info:
  title: Product Cloud API
  version: 1.0.0
  description: |
    The Cloud control-plane API. All endpoints require a Bearer token in
    `Authorization` header, obtained from POST /v1/accounts/sessions.
  contact:
    email: api@example.com
  license:
    name: Proprietary
servers:
  - url: https://api.example.com
    description: Production
  - url: http://localhost:8787
    description: Local dev
security:
  - bearerAuth: []
paths:
  /v1/accounts:
    post:
      summary: Create a new account
      tags: [Auth]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateAccountRequest'
      responses:
        '201':
          description: Account created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AccountSession'
        '400': { $ref: '#/components/responses/Validation' }
        '409': { $ref: '#/components/responses/Conflict' }
        '429': { $ref: '#/components/responses/RateLimited' }
  /v1/accounts/sessions:
    post:
      summary: Sign in
      tags: [Auth]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Signed in
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AccountSession'
        '401': { $ref: '#/components/responses/Unauthorized' }
  /v1/accounts/me:
    get:
      summary: Get current account
      tags: [Account]
      responses:
        '200':
          description: Account info
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Account'
  /v1/projects:
    get:
      summary: List projects for the current account
      tags: [Projects]
      responses:
        '200':
          description: Projects
          content:
            application/json:
              schema:
                type: object
                properties:
                  projects:
                    type: array
                    items: { $ref: '#/components/schemas/Project' }
    post:
      summary: Create a new project
      tags: [Projects]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProjectRequest'
      responses:
        '201':
          description: Project created
          content:
            application/json:
              schema:
                type: object
                properties:
                  project: { $ref: '#/components/schemas/Project' }
  /v1/health:
    get:
      summary: Liveness check
      security: []
      responses:
        '200': { description: OK }
  /metrics:
    get:
      summary: Prometheus metrics
      security: []
      responses:
        '200':
          description: Metrics
          content:
            text/plain: {}
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Error:
      type: object
      required: [category, message]
      properties:
        category:
          type: string
          enum: [auth, forbidden, not_found, validation, conflict, rate_limited, protocol, internal, crypto]
        message: { type: string }
        request_id: { type: string }
    CreateAccountRequest:
      type: object
      required: [email, password]
      properties:
        email: { type: string, format: email }
        password: { type: string, minLength: 12, maxLength: 200 }
    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email: { type: string, format: email }
        password: { type: string }
    AccountSession:
      type: object
      required: [token, expires_at]
      properties:
        token: { type: string }
        expires_at: { type: string, format: date-time }
    Account:
      type: object
      properties:
        id: { type: string, pattern: '^acc_[a-z2-7]{22}$' }
        email: { type: string, format: email }
        plan: { type: string, enum: [local, starter, team, enterprise] }
        state: { type: string }
    Project:
      type: object
      properties:
        id: { type: string, pattern: '^proj_[a-z2-7]{22}$' }
        name: { type: string }
        plan: { type: string }
        state: { type: string, enum: [active, suspended, archived] }
    CreateProjectRequest:
      type: object
      required: [name, plan]
      properties:
        name: { type: string, minLength: 1, maxLength: 100 }
        plan: { type: string, enum: [local, starter, team, enterprise] }
        module_id: { type: string, nullable: true }
  responses:
    Validation:
      description: Validation failed
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
    Conflict:
      description: Conflict
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
    Unauthorized:
      description: Not signed in
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
    RateLimited:
      description: Too many requests
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
```

Create `platform-cloud/openapi.ts`:

```typescript
// Run: npx @redocly/cli build-docs openapi.yaml
// Or: npx swagger-cli bundle openapi.yaml -o dist/openapi.json
export const OPENAPI_URL = '/v1/openapi.yaml';
```

## TESTS

```bash
cd platform-cloud
python3 -c "import yaml; d = yaml.safe_load(open('openapi.yaml')); assert d['openapi'].startswith('3'); assert '/v1/accounts' in d['paths']" || { echo "FAIL"; exit 1; }
echo "OK"
```
