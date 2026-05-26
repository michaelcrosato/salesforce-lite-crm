import type { AuditEvent, Contact, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  CSV_IMPORT_APPLY_CAPABILITY_CONTENT_TYPE,
  CSV_IMPORT_APPLY_CAPABILITY_VERSION,
  getCsvImportApplyActionCapability,
  type CsvImportApplyManualExecutorPath
} from "@/lib/server/csvImportApplyCapabilities";
import {
  CSV_IMPORT_PREVIEW_MAX_LIMIT,
  type CsvImportPreviewEntity
} from "@/lib/server/csvImportPreview";
import {
  previewCsvImportWithPreflightDiagnostics,
  type CsvImportPreflightResult,
  type CsvImportPreflightRow,
  type CsvImportReadinessStatus,
  type CsvImportRowActionKind
} from "@/lib/server/csvImportPreflight";
import {
  buildAuditEventCreateData,
  type AuditMetadataValue
} from "@/lib/services/auditEvents";
import { contactCreateSchema, idSchema } from "@/lib/validation";

export const CSV_CONTACT_IMPORT_MANUAL_APPLY_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const CSV_CONTACT_IMPORT_MANUAL_APPLY_VERSION =
  "2026-05-25.s40-f2" as const;

export type CsvContactImportManualApplyStatus =
  | "blocked"
  | "completed"
  | "failed"
  | "partial";

export type CsvContactImportManualApplyRowStatus =
  | "blocked"
  | "created"
  | "failed"
  | "skipped";

export type CsvContactImportManualApplyBlockReasonCode =
  | "contact_create_failed"
  | "contact_data_invalid_at_apply"
  | "contact_row_blocked_by_validation"
  | "manual_executor_unavailable"
  | "no_create_candidates"
  | "operator_approval_required";

export type CsvContactImportManualApplySkipReasonCode =
  | "contact_review_candidate_not_create_safe";

export type CsvContactImportManualApplyReadFlags = {
  metadata: true;
  csvInput: true;
  database: true;
  previewContracts: true;
  preflightDiagnostics: true;
  capabilityMatrix: true;
  approval: true;
};

export type CsvContactImportManualApplyWriteFlags = {
  database: true;
  contacts: true;
  auditEvents: true;
  importApply: true;
  leads: false;
  routingAssignments: false;
  dealerOrders: false;
  pacingEngine: false;
  accounts: false;
  updates: false;
  upserts: false;
  duplicateMerge: false;
  files: false;
  backgroundJobs: false;
  externalServices: false;
  salesforce: false;
  routes: false;
  routeHandlers: false;
  productUi: false;
  schema: false;
  crmContract: false;
};

export type CsvContactImportManualApplySafety = {
  deterministic: true;
  readOnly: false;
  previewOnly: false;
  contactsOnly: true;
  createsOnly: true;
  manualExecutorOnly: true;
  operatorApprovalRequired: true;
  approvalPersistence: false;
  leadApply: false;
  leadRouting: false;
  routingReassignment: false;
  dealerOrderWrites: false;
  pacingEngineChanges: false;
  accountCreation: false;
  updates: false;
  upserts: false;
  duplicateMerge: false;
  fileStorage: false;
  backgroundJobs: false;
  salesforceIntegration: false;
  externalAi: false;
  network: false;
  externalServices: false;
  routeHandlers: false;
  productUi: false;
  crmContractChanges: false;
  schemaChanges: false;
};

export type CsvContactImportManualApplyApproval = {
  approved: boolean;
  actorUserId: string;
  approvedAt: string | null;
  note: string | null;
};

export type CsvContactImportManualApplyContactSnapshot = Pick<
  Contact,
  | "accountId"
  | "email"
  | "firstName"
  | "id"
  | "lastName"
  | "phone"
  | "status"
  | "title"
>;

export type CsvContactImportManualApplyRowOutcome = {
  rowNumber: number;
  rowAction: CsvImportRowActionKind;
  readinessStatus: CsvImportReadinessStatus;
  status: CsvContactImportManualApplyRowStatus;
  attempted: boolean;
  created: boolean;
  contactId: string | null;
  auditEventId: string | null;
  contact: CsvContactImportManualApplyContactSnapshot | null;
  blockReasons: readonly CsvContactImportManualApplyBlockReasonCode[];
  skippedReasons: readonly CsvContactImportManualApplySkipReasonCode[];
  diagnosticCodes: readonly string[];
  errors: readonly string[];
  message: string;
  error: string | null;
};

export type CsvContactImportManualApplySummary = {
  entity: "contacts";
  totalRows: number;
  createCandidateRows: number;
  reviewCandidateRows: number;
  sourceBlockedRows: number;
  attemptedRows: number;
  createdRows: number;
  skippedRows: number;
  blockedRows: number;
  failedRows: number;
  auditEventCount: number;
  operatorApprovalRequired: true;
  operatorApproved: boolean;
  didMutate: boolean;
};

export type CsvContactImportManualApplySource = {
  previewModule: "lib/server/csvImportPreview.ts";
  preflightModule: "lib/server/csvImportPreflight.ts";
  capabilityContentType: typeof CSV_IMPORT_APPLY_CAPABILITY_CONTENT_TYPE;
  capabilityVersion: typeof CSV_IMPORT_APPLY_CAPABILITY_VERSION;
  capabilityModule: "lib/server/csvImportApplyCapabilities.ts";
  manualExecutorPath: CsvImportApplyManualExecutorPath | null;
  executorScope: "operator-approved-csv-contact-import-manual-apply";
  routeScope: readonly string[];
};

export type CsvContactImportManualApplyResult = {
  contentType: typeof CSV_CONTACT_IMPORT_MANUAL_APPLY_CONTENT_TYPE;
  executionType: "csv-contact-import-manual-apply";
  executionVersion: typeof CSV_CONTACT_IMPORT_MANUAL_APPLY_VERSION;
  generatedAt: string | null;
  status: CsvContactImportManualApplyStatus;
  blockReasons: readonly CsvContactImportManualApplyBlockReasonCode[];
  approval: CsvContactImportManualApplyApproval;
  summary: CsvContactImportManualApplySummary;
  rows: readonly CsvContactImportManualApplyRowOutcome[];
  preflight: CsvImportPreflightResult;
  source: CsvContactImportManualApplySource;
  read: CsvContactImportManualApplyReadFlags;
  write: CsvContactImportManualApplyWriteFlags;
  safety: CsvContactImportManualApplySafety;
};

type ParsedCsvContactImportManualApplyInput = z.infer<
  typeof csvContactImportManualApplyInputSchema
>;

type ParsedCsvContactImportManualApplyApproval =
  ParsedCsvContactImportManualApplyInput["approval"];

type ContactCreateData = z.infer<typeof contactCreateSchema>;

type CreatedContactResult = {
  contact: Contact;
  auditEvent: AuditEvent;
};

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

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const approvalSchema = z
  .object({
    approved: z.boolean(),
    actorUserId: idSchema,
    approvedAt: optionalDate,
    note: optionalText
  })
  .strict();

const csvContactImportManualApplyInputSchema = z
  .object({
    entity: z.literal("contacts"),
    csv: z.string().min(1, "CSV input is required."),
    limit: z.number().int().min(0).max(CSV_IMPORT_PREVIEW_MAX_LIMIT).optional(),
    generatedAt: optionalDate,
    approval: approvalSchema
  })
  .strict();

export async function executeCsvContactImportApply(
  input: unknown
): Promise<CsvContactImportManualApplyResult> {
  const parsed = csvContactImportManualApplyInputSchema.parse(input);
  const preflight = await previewCsvImportWithPreflightDiagnostics(
    parsed.entity,
    parsed.csv,
    {
      limit: parsed.limit
    }
  );
  const capability = getCsvImportApplyActionCapability(
    parsed.entity,
    "create_candidate"
  );
  const manualExecutorPath = capability?.manualExecutorPath ?? null;
  const blockReasons = buildRunBlockReasons(parsed, preflight, manualExecutorPath);
  const rowBlockReasons = blockReasons.filter(
    (reason) => reason !== "no_create_candidates"
  );
  const rows: CsvContactImportManualApplyRowOutcome[] = [];

  for (const row of preflight.rows) {
    if (row.action.action === "review_candidate") {
      rows.push(skippedReviewCandidate(row));
      continue;
    }

    if (row.action.action === "blocked") {
      rows.push(blockedSourceRow(row));
      continue;
    }

    if (rowBlockReasons.length > 0) {
      rows.push(blockedCreateCandidate(row, rowBlockReasons));
      continue;
    }

    rows.push(await executeCreateCandidate(row, parsed, manualExecutorPath));
  }

  return buildResult(parsed, preflight, manualExecutorPath, blockReasons, rows);
}

function buildRunBlockReasons(
  input: ParsedCsvContactImportManualApplyInput,
  preflight: CsvImportPreflightResult,
  manualExecutorPath: CsvImportApplyManualExecutorPath | null
): CsvContactImportManualApplyBlockReasonCode[] {
  const reasons: CsvContactImportManualApplyBlockReasonCode[] = [];

  if (!input.approval.approved) {
    reasons.push("operator_approval_required");
  }

  if (manualExecutorPath === null) {
    reasons.push("manual_executor_unavailable");
  }

  if (preflight.actionSummary.createCandidateRows === 0) {
    reasons.push("no_create_candidates");
  }

  return reasons;
}

async function executeCreateCandidate(
  row: CsvImportPreflightRow,
  input: ParsedCsvContactImportManualApplyInput,
  manualExecutorPath: CsvImportApplyManualExecutorPath | null
): Promise<CsvContactImportManualApplyRowOutcome> {
  const parsedData = contactCreateSchema.safeParse(row.data);

  if (!parsedData.success) {
    return blockedCreateCandidate(row, ["contact_data_invalid_at_apply"]);
  }

  try {
    const created = await createContactWithAudit(
      parsedData.data,
      row,
      input,
      manualExecutorPath
    );

    return {
      rowNumber: row.rowNumber,
      rowAction: row.action.action,
      readinessStatus: row.readiness.status,
      status: "created",
      attempted: true,
      created: true,
      contactId: created.contact.id,
      auditEventId: created.auditEvent.id,
      contact: contactSnapshot(created.contact),
      blockReasons: [],
      skippedReasons: [],
      diagnosticCodes: diagnosticCodes(row),
      errors: [...row.errors],
      message: `Created contact ${contactLabel(created.contact)} from CSV row ${row.rowNumber}.`,
      error: null
    };
  } catch (error) {
    return {
      rowNumber: row.rowNumber,
      rowAction: row.action.action,
      readinessStatus: row.readiness.status,
      status: "failed",
      attempted: true,
      created: false,
      contactId: null,
      auditEventId: null,
      contact: null,
      blockReasons: ["contact_create_failed"],
      skippedReasons: [],
      diagnosticCodes: diagnosticCodes(row),
      errors: [...row.errors],
      message: `CSV contact apply failed for row ${row.rowNumber}.`,
      error:
        error instanceof Error
          ? error.message
          : "Unknown CSV contact apply error."
    };
  }
}

async function createContactWithAudit(
  data: ContactCreateData,
  row: CsvImportPreflightRow,
  input: ParsedCsvContactImportManualApplyInput,
  manualExecutorPath: CsvImportApplyManualExecutorPath | null
): Promise<CreatedContactResult> {
  const contactData: Prisma.ContactUncheckedCreateInput = data;

  return prisma.$transaction(async (tx) => {
    const contact = await tx.contact.create({ data: contactData });
    const auditEvent = await tx.auditEvent.create({
      data: buildAuditEventCreateData({
        category: "record",
        action: "created",
        actorUserId: input.approval.actorUserId,
        entityType: "contact",
        entityId: contact.id,
        summary: `CSV contact import manual apply created contact ${contactLabel(contact)}.`,
        metadata: auditMetadata(contact, row, input, manualExecutorPath),
        occurredAt: input.approval.approvedAt
      })
    });

    return { contact, auditEvent };
  });
}

function auditMetadata(
  contact: Contact,
  row: CsvImportPreflightRow,
  input: ParsedCsvContactImportManualApplyInput,
  manualExecutorPath: CsvImportApplyManualExecutorPath | null
): Record<string, AuditMetadataValue> {
  return {
    source: "csv_contact_import_manual_apply_executor",
    executionVersion: CSV_CONTACT_IMPORT_MANUAL_APPLY_VERSION,
    capabilityVersion: CSV_IMPORT_APPLY_CAPABILITY_VERSION,
    manualExecutorPath,
    generatedAt: input.generatedAt?.toISOString() ?? null,
    rowNumber: row.rowNumber,
    rowAction: row.action.action,
    readinessStatus: row.readiness.status,
    diagnosticCodes: diagnosticCodes(row),
    errorCount: row.errors.length,
    createdContactId: contact.id,
    accountId: contact.accountId,
    contactStatus: contact.status,
    contactEmail: contact.email,
    approval: approvalMetadata(input.approval)
  };
}

function approvalMetadata(
  approval: ParsedCsvContactImportManualApplyApproval
): Record<string, AuditMetadataValue> {
  return {
    approved: approval.approved,
    actorUserId: approval.actorUserId,
    approvedAt: approval.approvedAt?.toISOString() ?? null,
    note: approval.note ?? null
  };
}

function skippedReviewCandidate(
  row: CsvImportPreflightRow
): CsvContactImportManualApplyRowOutcome {
  return {
    rowNumber: row.rowNumber,
    rowAction: row.action.action,
    readinessStatus: row.readiness.status,
    status: "skipped",
    attempted: false,
    created: false,
    contactId: null,
    auditEventId: null,
    contact: null,
    blockReasons: [],
    skippedReasons: ["contact_review_candidate_not_create_safe"],
    diagnosticCodes: diagnosticCodes(row),
    errors: [...row.errors],
    message: `Skipped CSV row ${row.rowNumber}; review candidates are not create-safe for apply.`,
    error: null
  };
}

function blockedSourceRow(
  row: CsvImportPreflightRow
): CsvContactImportManualApplyRowOutcome {
  return {
    rowNumber: row.rowNumber,
    rowAction: row.action.action,
    readinessStatus: row.readiness.status,
    status: "blocked",
    attempted: false,
    created: false,
    contactId: null,
    auditEventId: null,
    contact: null,
    blockReasons: ["contact_row_blocked_by_validation"],
    skippedReasons: [],
    diagnosticCodes: diagnosticCodes(row),
    errors: [...row.errors],
    message: `Blocked CSV row ${row.rowNumber}; validation or CSV structure errors must be resolved before apply.`,
    error: null
  };
}

function blockedCreateCandidate(
  row: CsvImportPreflightRow,
  reasons: readonly CsvContactImportManualApplyBlockReasonCode[]
): CsvContactImportManualApplyRowOutcome {
  return {
    rowNumber: row.rowNumber,
    rowAction: row.action.action,
    readinessStatus: row.readiness.status,
    status: "blocked",
    attempted: false,
    created: false,
    contactId: null,
    auditEventId: null,
    contact: null,
    blockReasons: [...reasons],
    skippedReasons: [],
    diagnosticCodes: diagnosticCodes(row),
    errors: [...row.errors],
    message: `Blocked CSV row ${row.rowNumber}: ${reasons.join(", ")}.`,
    error: null
  };
}

function buildResult(
  input: ParsedCsvContactImportManualApplyInput,
  preflight: CsvImportPreflightResult,
  manualExecutorPath: CsvImportApplyManualExecutorPath | null,
  blockReasons: readonly CsvContactImportManualApplyBlockReasonCode[],
  rows: readonly CsvContactImportManualApplyRowOutcome[]
): CsvContactImportManualApplyResult {
  return {
    contentType: CSV_CONTACT_IMPORT_MANUAL_APPLY_CONTENT_TYPE,
    executionType: "csv-contact-import-manual-apply",
    executionVersion: CSV_CONTACT_IMPORT_MANUAL_APPLY_VERSION,
    generatedAt: input.generatedAt?.toISOString() ?? null,
    status: resultStatus(rows),
    blockReasons,
    approval: {
      approved: input.approval.approved,
      actorUserId: input.approval.actorUserId,
      approvedAt: input.approval.approvedAt?.toISOString() ?? null,
      note: input.approval.note ?? null
    },
    summary: buildSummary(preflight, input.approval, rows),
    rows,
    preflight,
    source: {
      previewModule: "lib/server/csvImportPreview.ts",
      preflightModule: "lib/server/csvImportPreflight.ts",
      capabilityContentType: CSV_IMPORT_APPLY_CAPABILITY_CONTENT_TYPE,
      capabilityVersion: CSV_IMPORT_APPLY_CAPABILITY_VERSION,
      capabilityModule: "lib/server/csvImportApplyCapabilities.ts",
      manualExecutorPath,
      executorScope: "operator-approved-csv-contact-import-manual-apply",
      routeScope: [preflight.route]
    },
    read: readFlags(),
    write: writeFlags(),
    safety: safetyFlags()
  };
}

function buildSummary(
  preflight: CsvImportPreflightResult,
  approval: ParsedCsvContactImportManualApplyApproval,
  rows: readonly CsvContactImportManualApplyRowOutcome[]
): CsvContactImportManualApplySummary {
  return {
    entity: "contacts",
    totalRows: rows.length,
    createCandidateRows: preflight.actionSummary.createCandidateRows,
    reviewCandidateRows: preflight.actionSummary.reviewCandidateRows,
    sourceBlockedRows: preflight.actionSummary.blockedRows,
    attemptedRows: rows.filter((row) => row.attempted).length,
    createdRows: rows.filter((row) => row.status === "created").length,
    skippedRows: rows.filter((row) => row.status === "skipped").length,
    blockedRows: rows.filter((row) => row.status === "blocked").length,
    failedRows: rows.filter((row) => row.status === "failed").length,
    auditEventCount: rows.filter((row) => row.auditEventId).length,
    operatorApprovalRequired: true,
    operatorApproved: approval.approved,
    didMutate: rows.some((row) => row.created)
  };
}

function resultStatus(
  rows: readonly CsvContactImportManualApplyRowOutcome[]
): CsvContactImportManualApplyStatus {
  const createdRows = rows.filter((row) => row.status === "created").length;
  const failedRows = rows.filter((row) => row.status === "failed").length;
  const blockedRows = rows.filter((row) => row.status === "blocked").length;
  const skippedRows = rows.filter((row) => row.status === "skipped").length;

  if (failedRows > 0 && createdRows === 0) {
    return "failed";
  }

  if (createdRows === 0) {
    return "blocked";
  }

  if (failedRows > 0 || blockedRows > 0 || skippedRows > 0) {
    return "partial";
  }

  return "completed";
}

function readFlags(): CsvContactImportManualApplyReadFlags {
  return {
    metadata: true,
    csvInput: true,
    database: true,
    previewContracts: true,
    preflightDiagnostics: true,
    capabilityMatrix: true,
    approval: true
  };
}

function writeFlags(): CsvContactImportManualApplyWriteFlags {
  return {
    database: true,
    contacts: true,
    auditEvents: true,
    importApply: true,
    leads: false,
    routingAssignments: false,
    dealerOrders: false,
    pacingEngine: false,
    accounts: false,
    updates: false,
    upserts: false,
    duplicateMerge: false,
    files: false,
    backgroundJobs: false,
    externalServices: false,
    salesforce: false,
    routes: false,
    routeHandlers: false,
    productUi: false,
    schema: false,
    crmContract: false
  };
}

function safetyFlags(): CsvContactImportManualApplySafety {
  return {
    deterministic: true,
    readOnly: false,
    previewOnly: false,
    contactsOnly: true,
    createsOnly: true,
    manualExecutorOnly: true,
    operatorApprovalRequired: true,
    approvalPersistence: false,
    leadApply: false,
    leadRouting: false,
    routingReassignment: false,
    dealerOrderWrites: false,
    pacingEngineChanges: false,
    accountCreation: false,
    updates: false,
    upserts: false,
    duplicateMerge: false,
    fileStorage: false,
    backgroundJobs: false,
    salesforceIntegration: false,
    externalAi: false,
    network: false,
    externalServices: false,
    routeHandlers: false,
    productUi: false,
    crmContractChanges: false,
    schemaChanges: false
  };
}

function diagnosticCodes(row: CsvImportPreflightRow): string[] {
  return row.diagnostics.map((diagnostic) => diagnostic.code);
}

function contactSnapshot(
  contact: Contact
): CsvContactImportManualApplyContactSnapshot {
  return {
    id: contact.id,
    accountId: contact.accountId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    title: contact.title,
    status: contact.status
  };
}

function contactLabel(contact: Pick<Contact, "firstName" | "lastName">): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

export function isCsvContactImportManualApplyEntity(
  entity: CsvImportPreviewEntity
): entity is "contacts" {
  return entity === "contacts";
}
