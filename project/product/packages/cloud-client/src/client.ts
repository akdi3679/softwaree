import { request } from './http';
import type {
  Account,
  AccountSession,
  Device,
  Project,
  Invitation,
  ModuleManifest,
  ModulePackage,
  AuditEntry,
  UpdateInfo,
} from './types';

export class CloudClient {
  constructor(
    public readonly baseUrl: string,
    private token?: string,
  ) {}

  setToken(token: string) {
    this.token = token;
  }

  private req<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>(this.baseUrl, path, options, this.token);
  }

  signup(email: string, password: string) {
    return this.req<AccountSession>('/v1/accounts', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  login(email: string, password: string) {
    return this.req<AccountSession>('/v1/accounts/sessions', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  logout() {
    return this.req<void>('/v1/accounts/sessions/current', { method: 'DELETE' });
  }

  me() {
    return this.req<{ account: Account }>('/v1/accounts/me');
  }

  listProjects() {
    return this.req<{ projects: Project[] }>('/v1/projects');
  }

  createProject(input: { name: string; businessType: string; planId: string }) {
    return this.req<{ project: Project }>('/v1/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  inviteUser(projectId: string, input: { email: string; role: string }) {
    return this.req<{ invitation: Invitation }>(`/v1/projects/${projectId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  approveMembership(projectId: string, membershipId: string) {
    return this.req<void>(`/v1/projects/${projectId}/memberships/${membershipId}/approve`, {
      method: 'POST',
    });
  }

  registerDevice(input: { publicKey: string; role: 'admin' | 'user'; projectId?: string }) {
    return this.req<{ device: Device }>('/v1/devices/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  replaceDevice(deviceId: string, input: { newPublicKey: string }) {
    return this.req<{ device: Device }>(`/v1/devices/${deviceId}/replace`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  listModules() {
    return this.req<{ modules: ModuleManifest[] }>('/v1/modules');
  }

  getModuleVersions(moduleId: string) {
    return this.req<{ versions: string[] }>(`/v1/modules/${moduleId}/versions`);
  }

  getModuleManifest(moduleId: string, version: string) {
    return this.req<{ manifest: ModuleManifest }>(`/v1/modules/${moduleId}/versions/${version}/manifest`);
  }

  downloadModule(moduleId: string, version: string) {
    return this.req<ModulePackage>(`/v1/modules/${moduleId}/versions/${version}/package`);
  }

  uploadAudit(entries: AuditEntry[]) {
    return this.req<void>('/v1/audit', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    });
  }

  checkCoreUpdates() {
    return this.req<UpdateInfo>('/v1/updates/core');
  }

  checkAppUpdates() {
    return this.req<UpdateInfo>('/v1/updates/app');
  }
}
