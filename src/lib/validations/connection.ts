import { z } from "zod";

export const SendConnectionRequestSchema = z.object({
  receiverId: z.string().uuid("Invalid receiver user ID"),
});

export const RespondConnectionRequestSchema = z.object({
  action: z.enum(["accept", "reject"], {
    errorMap: () => ({ message: "Action must be either 'accept' or 'reject'" }),
  }),
});

export const ConnectionRequestsQuerySchema = z.object({
  direction: z.enum(["incoming", "outgoing", "all"]).default("all"),
});
