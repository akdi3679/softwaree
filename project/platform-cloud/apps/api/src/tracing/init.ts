import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import type { Context, Next } from "hono";
import { trace, SpanStatusCode } from "@opentelemetry/api";

let started = false;

export function initTracing() {
  if (started) return;
  started = true;
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        "http://localhost:4318/v1/traces",
    }),
  });
  sdk.start();
  process.on("SIGTERM", () => {
    sdk.shutdown().catch(console.error);
  });
}

export async function tracingMiddleware(c: Context, next: Next) {
  const tracer = trace.getTracer("product-cloud");
  return tracer.startActiveSpan(
    c.req.method + " " + c.req.path,
    async (span) => {
      span.setAttribute("http.method", c.req.method);
      span.setAttribute("http.path", c.req.path);
      const corr = (c.get as (k: string) => unknown)("correlationId");
      if (typeof corr === "string" && corr) {
        span.setAttribute("correlation_id", corr);
      }
      try {
        await next();
        span.setAttribute("http.status_code", c.res.status);
        if (c.res.status >= 500) {
          span.setStatus({ code: SpanStatusCode.ERROR });
        }
      } catch (e: unknown) {
        const err = e as Error;
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message });
        throw e;
      } finally {
        span.end();
      }
    },
  );
}
