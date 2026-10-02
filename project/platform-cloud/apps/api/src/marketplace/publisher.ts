import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { modulePublishers } from "../db/schema/module-publishers";
import { modules, moduleVersions } from "../db/schema/modules";
import { signModulePackage } from "../services/module-signing";

export const PublishRequestSchema = z.object({
  publisher_id: z.string(),
  module_id: z.string().regex(/^[a-z0-9_-]+$/),
  name: z.string().min(3).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(2000),
  category: z.enum(["medical", "food-lab", "retail", "service", "industrial", "other"]),
  min_plan: z.enum(["local", "starter", "team", "enterprise"]),
  price_cents: z.number().int().min(0),
  binary: z.string(),
});

export interface PublishResult {
  module_id: string;
  version: string;
  sha256: string;
  review_status: "pending_review";
}

type SignatureBundle = {
  cloud_root: { signature: string; public_key: string; algorithm: string; signed_at: string };
  project_license: { signature: string; project_id: string; plan_id: string; algorithm: string; signed_at: string };
  device_bind: { signature: string; device_id: string; algorithm: string; signed_at: string };
};

export async function publish(
  req: z.infer<typeof PublishRequestSchema>,
): Promise<PublishResult> {
  const publishers = await db
    .select()
    .from(modulePublishers)
    .where(eq(modulePublishers.id, req.publisher_id))
    .limit(1);
  const publisher = publishers[0];
  if (!publisher) throw new Error("publisher not found");
  if (!publisher.verified) throw new Error("publisher not verified");

  const binary = Buffer.from(req.binary, "base64");
  const sha256 = createHash("sha256").update(binary).digest("hex");

  const manifest = {
    module_id: req.module_id,
    name: req.name,
    version: req.version,
    description: req.description,
    min_core_version: "0.1.0",
    min_app_version: "0.1.0",
    required_permissions: [] as string[],
    provided_commands: [] as string[],
    provided_events: [] as string[],
    provided_queries: [] as string[],
    capabilities: [] as string[],
    binary_format: "wasm32-wasip2" as const,
    binary_size_bytes: binary.length,
    sha256,
    signed_by: "cloud_root" as const,
    signed_at: new Date().toISOString(),
  };

  const existing = await db
    .select()
    .from(modules)
    .where(eq(modules.moduleId, req.module_id))
    .limit(1);

  let moduleRowId: string;
  if (existing.length === 0) {
    const inserted = await db
      .insert(modules)
      .values({
        moduleId: req.module_id,
        name: req.name,
        description: req.description,
        category: req.category,
        priceCents: req.price_cents,
        publisherId: req.publisher_id,
        reviewStatus: "pending",
      })
      .returning({ id: modules.id });
    moduleRowId = inserted[0]!.id;
  } else {
    moduleRowId = existing[0]!.id;
  }

  const signatures = await signModulePackage({
    manifest,
    binary,
    projectId: "pending",
    planId: "pending",
    deviceId: "pending",
    deviceBindKey: "pending",
  });

  // signModulePackage returns camelCase keys; we persist snake_case.
  const signatureBundle: SignatureBundle = {
    cloud_root: {
      signature: signatures.cloudRoot.signature,
      public_key: signatures.cloudRoot.publicKey,
      algorithm: signatures.cloudRoot.algorithm,
      signed_at: signatures.cloudRoot.signedAt,
    },
    project_license: {
      signature: signatures.projectLicense.signature,
      project_id: signatures.projectLicense.projectId,
      plan_id: signatures.projectLicense.planId,
      algorithm: signatures.projectLicense.algorithm,
      signed_at: signatures.projectLicense.signedAt,
    },
    device_bind: {
      signature: signatures.deviceBind.signature,
      device_id: signatures.deviceBind.deviceId,
      algorithm: signatures.deviceBind.algorithm,
      signed_at: signatures.deviceBind.signedAt,
    },
  };

  await db.insert(moduleVersions).values({
    moduleId: moduleRowId,
    version: req.version,
    minCoreVersion: "0.1.0",
    minAppVersion: "0.1.0",
    binarySizeBytes: binary.length,
    sha256,
    packagePath: "modules/" + req.module_id + "/" + req.version + ".wasm",
    manifest,
    signatures: signatureBundle,
    reviewStatus: "pending",
  });

  return {
    module_id: req.module_id,
    version: req.version,
    sha256,
    review_status: "pending_review",
  };
}