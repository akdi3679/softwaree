import { z } from 'zod';

/**
 * Project lifecycle states.
 *
 *  CREATING ? ACTIVE ? SUSPENDED ? ACTIVE ? ARCHIVED
 *
 * - CREATING: project is being initialized (Admin device setting up, modules installing)
 * - ACTIVE: normal operating state
 * - SUSPENDED: temporarily disabled (billing issue, security review). Reads still possible for cache, writes blocked.
 * - ARCHIVED: terminal state, read-only. Project can be restored within 30 days, then hard-deleted.
 */
export const ProjectState = {
  CREATING: 'creating',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
} as const;

export type ProjectState = (typeof ProjectState)[keyof typeof ProjectState];

export const ProjectStateSchema = z.nativeEnum(ProjectState);
