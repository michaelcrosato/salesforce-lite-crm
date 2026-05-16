import { z } from "zod";
import {
  ACCOUNT_STATUSES,
  ACTIVITY_TYPES,
  CONTACT_STATUSES,
  DEAL_STAGES
} from "@/lib/crm-constants";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export const contactStatusSchema = z.enum(CONTACT_STATUSES);
export const dealStageSchema = z.enum(DEAL_STAGES);
export const activityTypeSchema = z.enum(ACTIVITY_TYPES);

export const contactFormSchema = z.object({
  accountId: optionalText,
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: optionalText.pipe(z.string().email("Enter a valid email.").optional()),
  phone: optionalText,
  title: optionalText,
  status: contactStatusSchema
});

export const noteFormSchema = z.object({
  contactId: z.string().trim().min(1, "Contact is required."),
  dealId: optionalText,
  rawText: z.string().trim().min(8, "Add at least a short note.")
});

export const dealMoveSchema = z.object({
  dealId: z.string().trim().min(1, "Deal is required."),
  stage: dealStageSchema
});

export const activityFilterSchema = z
  .union([activityTypeSchema, z.literal("all")])
  .default("all");

export function isDealStage(value: string): value is z.infer<typeof dealStageSchema> {
  return dealStageSchema.safeParse(value).success;
}

export function isActivityType(value: string): value is z.infer<typeof activityTypeSchema> {
  return activityTypeSchema.safeParse(value).success;
}
