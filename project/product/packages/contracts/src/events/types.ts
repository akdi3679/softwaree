import { z } from "zod";

export const PatientCreatedV1 = z.object({
  patient_id: z.string(),
  full_name: z.string(),
  phone: z.string(),
  date_of_birth: z.string(),
});

export const PatientCreatedV2 = z.object({
  patient_id: z.string(),
  full_name: z.string(),
  phone: z.string(),
  date_of_birth: z.string(),
  created_by_user_id: z.string(),
  created_at: z.string(),
});

export function upgradePatientCreatedV1ToV2(old: unknown): unknown {
  const v1 = PatientCreatedV1.parse(old);
  return {
    ...v1,
    created_by_user_id: "unknown",
    created_at: new Date(0).toISOString(),
  };
}

export const PatientCreated = {
  V1: PatientCreatedV1,
  V2: PatientCreatedV2,
  current: PatientCreatedV2,
};
