# TASK ID: CONTRACT-087.1
# TITLE: Add contract: TypeScript SDK for Cloud API
# STATUS: pending
# DEPENDENCIES: ADMIN-042.2
# ALLOWED FILES: product/contracts/src/sdk/cloud_client.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Typed client for all Cloud endpoints. Used by portal, admin-ui, support-cli.

## REQUIRED IMPLEMENTATION

Create `product/contracts/src/sdk/cloud_client.ts`:

```typescript
export interface AccountSession { token: string; expires_at: string; }
export interface Account { id: string; email: string; plan: string; state: string; }
export interface Project { id: string; name: string; plan: string; state: string; }
export interface Device { id: string; type: string; display_name: string; state: string; }

export class CloudClient {
  constructor(public base_url: string, public token?: string) {}

  private async req<T>(method: string, path: string, body?: any): Promise<T> {
    const r = await fetch(`${this.base_url}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({ message: r.statusText }));
      throw Object.assign(new Error(e.message ?? 'request failed'), { status: r.status, body: e });
    }
    return r.json();
  }

  // Auth
  signup = (email: string, password: string) =>
    this.req<AccountSession>('POST', '/v1/accounts', { email, password });
  login = (email: string, password: string) =>
    this.req<AccountSession>('POST', '/v1/accounts/sessions', { email, password });
  logout = () => this.req<void>('DELETE', '/v1/accounts/sessions/current');

  // Account
  me = () => this.req<{ account: Account }>('GET', '/v1/accounts/me');
  updateMe = (data: Partial<Account>) => this.req<Account>('PATCH', '/v1/accounts/me', data);
  deleteMe = () => this.req<void>('DELETE', '/v1/accounts/me');

  // Projects
  listProjects = () => this.req<{ projects: Project[] }>('GET', '/v1/projects');
  createProject = (name: string, plan: string) =>
    this.req<{ project: Project }>('POST', '/v1/projects', { name, plan });
  archiveProject = (id: string) => this.req<void>('POST', `/v1/projects/${id}/archive`);

  // Devices
  listDevices = (project_id: string) =>
    this.req<{ devices: Device[] }>('GET', `/v1/projects/${project_id}/devices`);
  revokeDevice = (id: string) => this.req<void>('POST', `/v1/devices/${id}/revoke`);

  // Audit
  listAudit = (offset: number, limit: number) =>
    this.req<{ entries: any[]; total: number }>('GET', `/v1/accounts/me/audit?offset=${offset}&limit=${limit}`);
}
```

## TESTS

```bash
cd product
test -f contracts/src/sdk/cloud_client.ts || { echo "FAIL"; exit 1; }
grep -q "CloudClient" contracts/src/sdk/cloud_client.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
