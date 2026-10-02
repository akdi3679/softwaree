import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { accounts } from "../db/schema/accounts";

export const REGION_BY_COUNTRY: Record<string, string> = {
  // EU
  DE: "eu", FR: "eu", NL: "eu", IT: "eu", ES: "eu", PL: "eu", SE: "eu", IE: "eu",
  GB: "eu", UK: "eu", CH: "eu", AT: "eu", BE: "eu", DK: "eu", FI: "eu", NO: "eu",
  // US
  US: "us", CA: "us", MX: "us",
  // APAC
  JP: "apac", KR: "apac", CN: "apac", IN: "apac", SG: "apac", AU: "apac", NZ: "apac",
  HK: "apac", TW: "apac",
};

const REGION_URLS: Record<string, string> = {
  eu: process.env.CLOUD_EU_URL ?? "https://cloud-eu.product.local",
  us: process.env.CLOUD_US_URL ?? "https://cloud-us.product.local",
  apac: process.env.CLOUD_APAC_URL ?? "https://cloud-apac.product.local",
};

export function regionForCountry(country: string): string {
  return REGION_BY_COUNTRY[country.toUpperCase()] ?? "us";
}

export function urlForRegion(region: string): string {
  return REGION_URLS[region] ?? REGION_URLS.us ?? "https://cloud-us.product.local";
}

export async function resolveRegion(accountId: string): Promise<string> {
  const rows = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  const account = rows[0];
  if (!account) return "us";
  return account.region ?? "us";
}

export function shouldRedirectToHome(
  _req: Request,
  accountRegion: string,
): { redirect: boolean; url?: string } {
  const currentRegion = process.env.CURRENT_REGION ?? "us";
  if (accountRegion !== currentRegion) {
    return { redirect: true, url: urlForRegion(accountRegion) };
  }
  return { redirect: false };
}