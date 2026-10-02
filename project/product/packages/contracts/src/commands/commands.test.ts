import { describe, expect, it } from 'vitest';
import {
  CommandEnvelopeSchema,
  CommandType,
  CommandTypeSchema,
} from './index';

describe('CommandTypeSchema', () => {
  it('accepts valid command types', () => {
    expect(CommandTypeSchema.safeParse('patient.create').success).toBe(true);
    expect(CommandTypeSchema.safeParse('module.patient.create').success).toBe(true);
    expect(CommandTypeSchema.safeParse('project.invite_user').success).toBe(true);
  });

  it('rejects invalid command types', () => {
    expect(CommandTypeSchema.safeParse('PatientCreate').success).toBe(false);
    expect(CommandTypeSchema.safeParse('patient').success).toBe(false);
    expect(CommandTypeSchema.safeParse('patient.').success).toBe(false);
    expect(CommandTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('CommandType constants', () => {
  it('has the expected core types', () => {
    expect(CommandType.PROJECT_CREATE).toBe('project.create');
    expect(CommandType.DEVICE_REGISTER).toBe('device.register');
    expect(CommandType.MODULE_INSTALL).toBe('module.install');
  });
});

describe('CommandEnvelopeSchema', () => {
  it('requires all mandatory fields', () => {
    const result = CommandEnvelopeSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
