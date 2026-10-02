import { z } from 'zod';
/**
 * Tracks the delivery of a single event to a single User.
 *
 * The Admin's outbox has one of these per (event, user) pair.
 * Status transitions: PENDING ? DELIVERED, or PENDING ? DENIED, or PENDING ? FAILED.
 */
export declare const DeliveryStatus: {
    readonly PENDING: "pending";
    readonly DELIVERED: "delivered";
    readonly DENIED: "denied";
    readonly FAILED: "failed";
};
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];
export declare const EventDeliveryRecordSchema: z.ZodObject<{
    eventId: z.ZodBranded<z.ZodString, "EventId">;
    userId: z.ZodBranded<z.ZodString, "UserId">;
    deviceId: z.ZodBranded<z.ZodString, "DeviceId">;
    status: z.ZodNativeEnum<{
        readonly PENDING: "pending";
        readonly DELIVERED: "delivered";
        readonly DENIED: "denied";
        readonly FAILED: "failed";
    }>;
    attemptedAt: z.ZodOptional<z.ZodString>;
    deliveredAt: z.ZodOptional<z.ZodString>;
    deniedReason: z.ZodOptional<z.ZodString>;
    failureReason: z.ZodOptional<z.ZodString>;
    attemptCount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    deviceId: string & z.BRAND<"DeviceId">;
    status: "failed" | "pending" | "delivered" | "denied";
    eventId: string & z.BRAND<"EventId">;
    userId: string & z.BRAND<"UserId">;
    attemptCount: number;
    attemptedAt?: string | undefined;
    deliveredAt?: string | undefined;
    deniedReason?: string | undefined;
    failureReason?: string | undefined;
}, {
    deviceId: string;
    status: "failed" | "pending" | "delivered" | "denied";
    eventId: string;
    userId: string;
    attemptedAt?: string | undefined;
    deliveredAt?: string | undefined;
    deniedReason?: string | undefined;
    failureReason?: string | undefined;
    attemptCount?: number | undefined;
}>;
export type EventDeliveryRecord = z.infer<typeof EventDeliveryRecordSchema>;
//# sourceMappingURL=delivery.d.ts.map