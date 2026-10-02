import type { ProjectId } from '../../contracts/src/identity/project-id';
import type { UserId } from '../../contracts/src/identity/user-id';
import type { DeviceId } from '../../contracts/src/identity/device-id';

export interface AccountSession {
  token: string;
  expiresAt: string;
}

export interface Account {
  userId: UserId;
  email: string;
  displayName: string;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  projectId: ProjectId;
  ownerUserId: UserId;
  name: string;
  businessType: string;
  planId: string;
  state: 'creating' | 'active' | 'suspended' | 'archived';
  currentAdminDeviceId?: DeviceId;
  createdAt: string;
}

export interface Device {
  deviceId: DeviceId;
  ownerUserId: UserId;
  projectId?: ProjectId;
  role: 'admin' | 'user' | 'cloud_service' | 'ops';
  publicKey: string;
  state: 'pending' | 'active' | 'suspended' | 'revoked' | 'replaced';
  displayName: string;
  createdAt: string;
}

export interface Invitation {
  invitationId: string;
  projectId: ProjectId;
  invitedByUserId: UserId;
  invitedEmail: string;
  initialRole: string;
  expiresAt: string;
  createdAt: string;
}

export interface ModuleManifest {
  moduleId: string;
  name: string;
  version: string;
  description: string;
  minCoreVersion: string;
  minAppVersion: string;
  requiredPermissions: string[];
  providedCommands: string[];
  providedEvents: string[];
  providedQueries: string[];
  schemaMigrations: { version: number; up: string; down?: string }[];
  capabilities: string[];
  binaryFormat: 'wasm32-wasip2';
  binarySizeBytes: number;
  sha256: string;
  signedBy: string;
  signedAt: string;
}

export interface ModulePackage {
  manifest: ModuleManifest;
  binary: string;
  signatures: unknown;
  packagingFormatVersion: number;
}

export interface AuditEntry {
  id: string;
  projectId: ProjectId;
  userId: UserId;
  deviceId: DeviceId;
  action: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface UpdateInfo {
  latestVersion: string;
  minVersion: string;
  releaseNotes: string;
  downloadUrl: string;
  sha256: string;
}
