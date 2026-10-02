import { z } from 'zod';
export const SchemaVersionSchema = z
    .string()
    .regex(/^\d+\.\d+$/, 'SchemaVersion must be in format "major.minor"')
    .brand();
//# sourceMappingURL=schema-version.js.map