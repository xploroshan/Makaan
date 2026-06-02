import { z } from "zod";

/** A room within a co-living / PG listing (full upsert representation). */
export const colivingRoomSchema = z
  .object({
    name: z.string().trim().min(1, "Give the room a name").max(60),
    room_type: z.enum(["single", "double", "triple", "dormitory"]),
    total_beds: z.coerce.number().int().min(1).max(50),
    occupied_beds: z.coerce.number().int().min(0).max(50).default(0),
    rent: z.coerce.number().min(0).max(10_000_000).optional(),
  })
  .refine((v) => v.occupied_beds <= v.total_beds, {
    message: "Occupied beds can't exceed total beds",
    path: ["occupied_beds"],
  });

export type ColivingRoomInput = z.infer<typeof colivingRoomSchema>;
