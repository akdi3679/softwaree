import { describe, expect, it } from 'vitest';
import { PermissionSchema, ProjectSchema } from './index';

describe('PermissionSchema', () => {
  it('accepts valid permissions', () => {
    expect(PermissionSchema.safeParse('patient.read').success).toBe(true);
    expect(PermissionSchema.safeParse('medical.patient.create').success).toBe(true);
  });
  it('rejects invalid', () => {
    expect(PermissionSchema.safeParse('patient').success).toBe(false);
    expect(PermissionSchema.safeParse('Patient.Read').success).toBe(false);
  });
});

describe('ProjectSchema', () => {
  it('rejects empty', () => {
    expect(ProjectSchema.safeParse({}).success).toBe(false);
  });
});
