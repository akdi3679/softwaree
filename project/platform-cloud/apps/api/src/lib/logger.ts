import { pino } from "pino";
import { redactObject } from "./redact";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "cloud-api" },
  formatters: {
    level: (label: string) => ({ level: label }),
    log: (obj: Record<string, unknown>) => redactObject(obj),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }
    : {}),
});

export function withCorrelation(correlationId: string) {
  return logger.child({ correlationId });
}
