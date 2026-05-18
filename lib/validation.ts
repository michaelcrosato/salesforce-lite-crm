import { z } from "zod";
import {
  ACCOUNT_STATUSES,
  ACTIVITY_TYPES,
  CONTACT_STATUSES,
  DEALER_ORDER_STATUSES,
  DEAL_STAGES,
  LEAD_STATUSES
} from "@/lib/crm-constants";
import {
  CAMPAIGN_STATUSES,
  CASE_PRIORITIES,
  CASE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES
} from "@/lib/crm/registry";
import { postalCodeSchema } from "@/lib/postal";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalDate = z.preprocess((value) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return new Date(value);
}, z.date().optional());

const requiredDate = (message: string) =>
  z.preprocess((value) => {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value !== "string" && typeof value !== "number") {
      return undefined;
    }

    if (typeof value === "string" && value.trim().length === 0) {
      return undefined;
    }

    return new Date(value);
  }, z.date({ required_error: message, invalid_type_error: message }));

export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export const contactStatusSchema = z.enum(CONTACT_STATUSES);
export const dealStageSchema = z.enum(DEAL_STAGES);
export const activityTypeSchema = z.enum(ACTIVITY_TYPES);
export const leadStatusSchema = z.enum(LEAD_STATUSES);
export const dealerOrderStatusSchema = z.enum(DEALER_ORDER_STATUSES);
export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);
export const caseStatusSchema = z.enum(CASE_STATUSES);
export const casePrioritySchema = z.enum(CASE_PRIORITIES);
export const campaignStatusSchema = z.enum(CAMPAIGN_STATUSES);

const blankStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim().length === 0 ? undefined : value;

const optionalPostalCode = z.preprocess(
  blankStringToUndefined,
  postalCodeSchema.optional()
);

const requiredInteger = (
  message: string,
  refine: (schema: z.ZodNumber) => z.ZodNumber = (schema) => schema
) =>
  z.preprocess(
    blankStringToUndefined,
    refine(
      z.coerce
        .number({
          invalid_type_error: message
        })
        .int(message)
    )
  );

const optionalNonNegativeInteger = (message: string) =>
  z.preprocess(
    blankStringToUndefined,
    z.coerce
      .number({
        invalid_type_error: message
      })
      .int(message)
      .min(0, message)
      .optional()
  );

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Account name is required."),
  domain: optionalText,
  industry: optionalText,
  city: optionalText,
  region: optionalText,
  status: accountStatusSchema,
  ownerId: optionalText,
  healthScore: requiredInteger("Health score must be a whole number.", (schema) =>
    schema
      .min(0, "Health score must be at least 0.")
      .max(100, "Health score cannot exceed 100.")
  )
});

export const contactFormSchema = z.object({
  accountId: optionalText,
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: optionalText.pipe(z.string().email("Enter a valid email.").optional()),
  phone: optionalText,
  title: optionalText,
  status: contactStatusSchema
});

export const dealFormSchema = z.object({
  accountId: optionalText,
  contactId: optionalText,
  ownerId: optionalText,
  name: z.string().trim().min(1, "Deal name is required."),
  stage: dealStageSchema,
  value: requiredInteger("Value must be a whole number.", (schema) =>
    schema.min(0, "Value must be 0 or greater.")
  ),
  probability: requiredInteger("Probability must be a whole number.", (schema) =>
    schema
      .min(0, "Probability must be at least 0.")
      .max(100, "Probability cannot exceed 100.")
  ),
  expectedCloseDate: optionalText
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

export const leadFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  phone: optionalText,
  email: optionalText.pipe(z.string().email("Enter a valid email.").optional()),
  postalCode: optionalPostalCode,
  province: optionalText,
  source: optionalText
});

export const leadStatusUpdateSchema = z.object({
  leadId: z.string().trim().min(1, "Lead is required."),
  status: leadStatusSchema
});

export const activityFilterSchema = z
  .union([activityTypeSchema, z.literal("all")])
  .default("all");

export const forecastQuerySchema = z.object({
  multiplier: z.coerce.number().min(0.5).max(3).optional(),
  assignmentRate: z.coerce.number().min(10).max(100).optional(),
  area: optionalText
});

export const idSchema = z.string().trim().min(1, "ID is required.");

export const accountCreateSchema = accountFormSchema;
export const accountUpdateSchema = accountFormSchema.partial();

export const contactCreateSchema = contactFormSchema;
export const contactUpdateSchema = contactFormSchema.partial();

export const opportunityCreateSchema = dealFormSchema.extend({
  expectedCloseDate: optionalDate
});
export const opportunityUpdateSchema = opportunityCreateSchema.partial();

export const opportunityStageHistoryCreateSchema = z.object({
  dealId: idSchema,
  fromStage: dealStageSchema.optional(),
  toStage: dealStageSchema,
  changedAt: optionalDate,
  changedByUserId: optionalText
});

export const leadCreateSchema = leadFormSchema.extend({
  status: leadStatusSchema.default("new"),
  areaId: optionalText,
  assignedOrderId: optionalText,
  assignmentReason: optionalText
});
export const leadUpdateSchema = leadCreateSchema.partial();

export const activityCreateSchema = z.object({
  accountId: optionalText,
  contactId: optionalText,
  dealId: optionalText,
  leadId: optionalText,
  taskId: optionalText,
  caseId: optionalText,
  userId: optionalText,
  type: activityTypeSchema,
  title: z.string().trim().min(1, "Activity title is required."),
  rawText: optionalText,
  summary: optionalText,
  nextStep: optionalText,
  createdAt: optionalDate
});
export const activityUpdateSchema = activityCreateSchema.partial();

export const noteCreateSchema = activityCreateSchema.omit({ type: true }).extend({
  type: z.literal("note").optional()
});
export const noteUpdateSchema = noteCreateSchema.partial();

export const dealerOrderCreateSchema = z.object({
  accountId: idSchema,
  name: z.string().trim().min(1, "Dealer order name is required."),
  monthlyQuota: requiredInteger("Monthly quota must be a whole number.", (schema) =>
    schema.min(0, "Monthly quota must be 0 or greater.")
  ),
  status: dealerOrderStatusSchema,
  startDate: requiredDate("Start date is required."),
  endDate: optionalDate
});
export const dealerOrderUpdateSchema = dealerOrderCreateSchema.partial();

export const areaCreateSchema = z.object({
  name: z.string().trim().min(1, "Area name is required."),
  province: optionalText,
  region: optionalText,
  postalPrefixes: z.string().trim().min(1, "Postal prefixes are required.")
});
export const areaUpdateSchema = areaCreateSchema.partial();

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Task title is required."),
  description: optionalText,
  dueDate: optionalDate,
  status: taskStatusSchema.default("open"),
  priority: taskPrioritySchema.default("normal"),
  ownerId: optionalText,
  accountId: optionalText,
  contactId: optionalText,
  dealId: optionalText,
  leadId: optionalText
});
export const taskUpdateSchema = taskCreateSchema.partial();

export const caseCreateSchema = z.object({
  subject: z.string().trim().min(1, "Case subject is required."),
  description: optionalText,
  status: caseStatusSchema.default("new"),
  priority: casePrioritySchema.default("normal"),
  accountId: optionalText,
  contactId: optionalText,
  ownerId: optionalText
});
export const caseUpdateSchema = caseCreateSchema.partial();

export const campaignCreateSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required."),
  description: optionalText,
  status: campaignStatusSchema.default("planned"),
  startDate: optionalDate,
  endDate: optionalDate,
  budget: optionalNonNegativeInteger("Budget must be a whole number and 0 or greater."),
  ownerId: optionalText,
  leadIds: z.array(idSchema).optional(),
  contactIds: z.array(idSchema).optional()
});
export const campaignUpdateSchema = campaignCreateSchema.partial();

export function isDealStage(value: string): value is z.infer<typeof dealStageSchema> {
  return dealStageSchema.safeParse(value).success;
}

export function isActivityType(value: string): value is z.infer<typeof activityTypeSchema> {
  return activityTypeSchema.safeParse(value).success;
}

export function isLeadStatus(value: string): value is z.infer<typeof leadStatusSchema> {
  return leadStatusSchema.safeParse(value).success;
}
