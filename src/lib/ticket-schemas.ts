import { Priority, TicketStatus } from "@prisma/client";
import { z } from "zod";

export const ticketSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(5),
  category: z.string().trim().min(2),
  priority: z.nativeEnum(Priority),
});

export const updateTicketSchema = ticketSchema.extend({
  status: z.nativeEnum(TicketStatus),
  assignedToId: z.string().optional().nullable(),
});
