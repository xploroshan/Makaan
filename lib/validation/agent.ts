import { z } from "zod";

export const registerAgentSchema = z.object({
  kind: z.enum(["agent", "company"]).default("agent"),
  business_name: z.string().min(2).max(160),
  about: z.string().max(2000).optional(),
  brokerage_terms: z.string().max(1000).optional(),
  areas_served: z.array(z.string().max(120)).max(50).optional(),
  years_active: z.coerce.number().int().min(0).max(100).optional(),
  logo_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
});
export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;

export const updateAgentSchema = registerAgentSchema.partial();
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

export const agentReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
});
export type AgentReviewInput = z.infer<typeof agentReviewSchema>;
