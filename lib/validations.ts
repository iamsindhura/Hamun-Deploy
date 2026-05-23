import { z } from "zod";
import { Stage, Priority } from "@prisma/client";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone must be at least 10 digits").optional().or(z.literal("")),
  stage: z.nativeEnum(Stage).default(Stage.LEAD),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  moneyValue: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).max(3, "Maximum of 3 tags allowed").default([]),
  reminderAt: z.date().optional().nullable(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const updateStageSchema = z.object({
  id: z.string(),
  stage: z.nativeEnum(Stage),
});
