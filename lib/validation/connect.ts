import { z } from "zod";

import { uuid } from "./common";

export const createEnquirySchema = z.object({
  listing_id: uuid,
  message: z.string().max(1000).optional(),
});
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

export const enquiryConsentSchema = z.object({
  action: z.enum(["accept", "decline"]),
});
export type EnquiryConsentInput = z.infer<typeof enquiryConsentSchema>;

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const scheduleVisitSchema = z.object({
  listing_id: uuid,
  slot: z.string().datetime({ offset: true }),
  mode: z.enum(["physical", "video"]).default("physical"),
});
export type ScheduleVisitInput = z.infer<typeof scheduleVisitSchema>;

export const visitStatusSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled"]),
});
export type VisitStatusInput = z.infer<typeof visitStatusSchema>;

export const ratePropertySchema = z.object({
  visit_id: uuid,
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});
export type RatePropertyInput = z.infer<typeof ratePropertySchema>;

export const reportSchema = z.object({
  subject_type: z.enum(["listing", "user", "message"]),
  subject_id: z.string().min(1).max(200),
  reason: z.string().min(3).max(200),
  detail: z.string().max(1000).optional(),
});
export type ReportInput = z.infer<typeof reportSchema>;
