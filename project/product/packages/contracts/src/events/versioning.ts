export const CURRENT_SCHEMA_VERSION = 1;

export interface VersionedEvent<T = unknown> {
  event_type: string;
  schema_version: number;
  payload: T;
}

export type Upgrader = (oldPayload: unknown, oldVersion: number) => unknown;

export class EventUpgrader {
  private upgraders = new Map<string, Upgrader[]>();

  register(eventType: string, upgraders: Upgrader[]) {
    if (upgraders.length !== CURRENT_SCHEMA_VERSION - 1) {
      throw new Error(
        "expected " + (CURRENT_SCHEMA_VERSION - 1) + " upgraders for " + eventType + ", got " + upgraders.length,
      );
    }
    this.upgraders.set(eventType, upgraders);
  }

  upgrade<T>(event: VersionedEvent): VersionedEvent<T> {
    if (event.schema_version === CURRENT_SCHEMA_VERSION) {
      return event as VersionedEvent<T>;
    }
    const upgraders = this.upgraders.get(event.event_type);
    if (!upgraders) {
      throw new Error("no upgraders registered for " + event.event_type);
    }
    let payload: unknown = event.payload;
    for (let v = event.schema_version; v < CURRENT_SCHEMA_VERSION; v++) {
      const up = upgraders[v - 1];
      if (!up) throw new Error("missing upgrader step " + v + " for " + event.event_type);
      payload = up(payload, v);
    }
    return {
      event_type: event.event_type,
      schema_version: CURRENT_SCHEMA_VERSION,
      payload: payload as T,
    };
  }
}