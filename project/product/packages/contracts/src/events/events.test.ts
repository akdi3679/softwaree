import { describe, expect, it } from 'vitest';
import { EventEnvelopeSchema, EventType, EventTypeSchema } from './index';
import { DeliveryStatus } from './delivery';

describe('EventTypeSchema', () => {
  it('accepts valid event types', () => {
    expect(EventTypeSchema.safeParse('patient.created').success).toBe(true);
    expect(EventTypeSchema.safeParse('module.patient.created').success).toBe(true);
    expect(EventTypeSchema.safeParse('project.suspended').success).toBe(true);
  });
  it('rejects invalid event types', () => {
    expect(EventTypeSchema.safeParse('PatientCreated').success).toBe(false);
    expect(EventTypeSchema.safeParse('patient').success).toBe(false);
  });
});

describe('EventType constants', () => {
  it('has matching pairs with CommandType', () => {
    expect(EventType.PROJECT_CREATED).toBe('project.created');
    expect(EventType.DEVICE_REGISTERED).toBe('device.registered');
    expect(EventType.MODULE_INSTALLED).toBe('module.installed');
  });
});

describe('DeliveryStatus', () => {
  it('has 4 statuses', () => {
    expect(Object.keys(DeliveryStatus).length).toBe(4);
  });
});

describe('EventEnvelopeSchema', () => {
  it('rejects empty object', () => {
    expect(EventEnvelopeSchema.safeParse({}).success).toBe(false);
  });
});
