export async function signModulePackage(input: {
  manifest: unknown;
  binary: Buffer;
  projectId: string;
  planId: string;
  deviceId: string;
  deviceBindKey: string;
}) {
  // Placeholder signatures
  return {
    cloudRoot: { signature: 'sig', publicKey: 'pub', algorithm: 'ed25519', signedAt: new Date().toISOString() },
    projectLicense: { signature: 'sig', projectId: input.projectId, planId: input.planId, algorithm: 'ed25519', signedAt: new Date().toISOString() },
    deviceBind: { signature: 'mac', deviceId: input.deviceId, algorithm: 'hmac-sha256', signedAt: new Date().toISOString() },
  };
}
