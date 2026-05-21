import { prisma } from "@/lib/prisma";
import { resolveAreaForLead } from "@/lib/routing/leadRouter";
import {
  previewCsvImport,
  summarizeCsvImportIssues,
  type CsvImportPreviewEntity,
  type CsvImportPreviewOptions,
  type CsvImportPreviewResult,
  type CsvImportPreviewRow
} from "@/lib/server/csvImportPreview";
import {
  contactCreateSchema,
  leadCreateSchema
} from "@/lib/validation";
import type { z } from "zod";

export type CsvImportPreflightDiagnosticCategory =
  | "duplicate"
  | "contactability"
  | "relationship";

export type CsvImportPreflightDiagnosticCode =
  | "contact_duplicate_email"
  | "contact_duplicate_name_phone"
  | "contact_missing_contact_method"
  | "contact_account_not_found"
  | "lead_duplicate_email"
  | "lead_duplicate_name_phone"
  | "lead_missing_contact_method"
  | "lead_postal_missing"
  | "lead_area_not_found";

export type CsvImportPreflightRelatedRecord = {
  entity: "contacts" | "leads" | "accounts" | "areas";
  id: string;
  label: string;
};

export type CsvImportPreflightDiagnostic = {
  rowNumber: number;
  severity: "warning";
  category: CsvImportPreflightDiagnosticCategory;
  code: CsvImportPreflightDiagnosticCode;
  fieldKey: string | null;
  message: string;
  relatedRecord: CsvImportPreflightRelatedRecord | null;
};

export type CsvImportReadinessStatus = "ready" | "needs_review" | "blocked";

export type CsvImportReadinessReasonSource =
  | "header"
  | "parse"
  | "row_validation"
  | "diagnostic_warning";

export type CsvImportReadinessReason = {
  source: CsvImportReadinessReasonSource;
  severity: "error" | "warning";
  code: string;
  fieldKey: string | null;
  message: string;
};

export type CsvImportRowReadiness = {
  status: CsvImportReadinessStatus;
  canImport: boolean;
  reasonCount: number;
  reasons: CsvImportReadinessReason[];
};

export type CsvImportReadinessSummary = {
  totalRows: number;
  readyRows: number;
  needsReviewRows: number;
  blockedRows: number;
  importableRows: number;
  errorReasons: number;
  warningReasons: number;
  globalErrorCount: number;
};

export type CsvImportPreflightRow = CsvImportPreviewRow & {
  diagnostics: CsvImportPreflightDiagnostic[];
  readiness: CsvImportRowReadiness;
};

export type CsvImportPreflightResult = Omit<CsvImportPreviewResult, "rows"> & {
  rows: CsvImportPreflightRow[];
  diagnostics: CsvImportPreflightDiagnostic[];
  warningRows: number;
  readinessSummary: CsvImportReadinessSummary;
};

type ContactImportData = z.infer<typeof contactCreateSchema>;
type LeadImportData = z.infer<typeof leadCreateSchema>;

type ImportPersonData = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

type ExistingPersonRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
};

type ExistingContactRecord = ExistingPersonRecord & {
  accountId: string | null;
};

type ExistingLeadRecord = ExistingPersonRecord & {
  postalCode: string | null;
};

type DiagnosticInput = Omit<CsvImportPreflightDiagnostic, "rowNumber" | "severity">;

type ValidPreflightRow<TData extends ImportPersonData> = {
  rowNumber: number;
  data: TData;
};

function createEmptyReadiness(): CsvImportRowReadiness {
  return {
    status: "ready",
    canImport: true,
    reasonCount: 0,
    reasons: []
  };
}

function clonePreviewRows(preview: CsvImportPreviewResult): CsvImportPreflightRow[] {
  return preview.rows.map((row) => ({
    ...row,
    diagnostics: [],
    readiness: createEmptyReadiness()
  }));
}

function buildGlobalReadinessReasons(
  preview: Pick<CsvImportPreviewResult, "headerErrors" | "parseErrors">
): CsvImportReadinessReason[] {
  return [
    ...preview.headerErrors.map((message): CsvImportReadinessReason => ({
      source: "header",
      severity: "error",
      code: "header_error",
      fieldKey: null,
      message
    })),
    ...preview.parseErrors.map((message): CsvImportReadinessReason => ({
      source: "parse",
      severity: "error",
      code: "parse_error",
      fieldKey: null,
      message
    }))
  ];
}

function buildRowReadiness(
  row: CsvImportPreflightRow,
  globalReasons: readonly CsvImportReadinessReason[]
): CsvImportRowReadiness {
  const reasons: CsvImportReadinessReason[] = [
    ...globalReasons,
    ...row.errors.map((message): CsvImportReadinessReason => ({
      source: "row_validation",
      severity: "error",
      code: "row_validation_error",
      fieldKey: null,
      message
    })),
    ...row.diagnostics.map((diagnostic): CsvImportReadinessReason => ({
      source: "diagnostic_warning",
      severity: diagnostic.severity,
      code: diagnostic.code,
      fieldKey: diagnostic.fieldKey,
      message: diagnostic.message
    }))
  ];
  const hasErrors = reasons.some((reason) => reason.severity === "error");
  const hasWarnings = reasons.some((reason) => reason.severity === "warning");
  const status: CsvImportReadinessStatus = hasErrors
    ? "blocked"
    : hasWarnings
      ? "needs_review"
      : "ready";

  return {
    status,
    canImport: !hasErrors,
    reasonCount: reasons.length,
    reasons
  };
}

function applyReadiness(
  rows: CsvImportPreflightRow[],
  globalReasons: readonly CsvImportReadinessReason[]
) {
  for (const row of rows) {
    row.readiness = buildRowReadiness(row, globalReasons);
  }
}

function summarizeReadiness(
  rows: readonly CsvImportPreflightRow[],
  globalErrorCount: number
): CsvImportReadinessSummary {
  const readyRows = rows.filter((row) => row.readiness.status === "ready").length;
  const needsReviewRows = rows.filter(
    (row) => row.readiness.status === "needs_review"
  ).length;
  const blockedRows = rows.filter((row) => row.readiness.status === "blocked").length;
  const errorReasons = rows.reduce(
    (total, row) =>
      total + row.readiness.reasons.filter((reason) => reason.severity === "error").length,
    0
  );
  const warningReasons = rows.reduce(
    (total, row) =>
      total + row.readiness.reasons.filter((reason) => reason.severity === "warning").length,
    0
  );

  return {
    totalRows: rows.length,
    readyRows,
    needsReviewRows,
    blockedRows,
    importableRows: readyRows + needsReviewRows,
    errorReasons,
    warningReasons,
    globalErrorCount
  };
}

function validRowsForSchema<TData extends ImportPersonData>(
  rows: readonly CsvImportPreflightRow[],
  schema: z.ZodType<TData, z.ZodTypeDef, unknown>
): ValidPreflightRow<TData>[] {
  const validRows: ValidPreflightRow<TData>[] = [];

  for (const row of rows) {
    if (row.status !== "valid" || !row.data) {
      continue;
    }

    const parsed = schema.safeParse(row.data);

    if (parsed.success) {
      validRows.push({
        rowNumber: row.rowNumber,
        data: parsed.data
      });
    }
  }

  return validRows;
}

function appendDiagnostic(
  rows: CsvImportPreflightRow[],
  rowNumber: number,
  input: DiagnosticInput
) {
  const row = rows.find((candidate) => candidate.rowNumber === rowNumber);

  if (!row) {
    return;
  }

  row.diagnostics.push({
    rowNumber,
    severity: "warning",
    ...input
  });
}

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function trimOptional(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function personLabel(record: ExistingPersonRecord): string {
  return `${record.firstName} ${record.lastName}`.trim();
}

function hasContactMethod(data: ImportPersonData): boolean {
  return Boolean(normalizeOptional(data.email) || normalizeOptional(data.phone));
}

function findDuplicateByEmail<TRecord extends ExistingPersonRecord>(
  records: readonly TRecord[],
  email: string | null | undefined
): TRecord | null {
  const normalizedEmail = normalizeOptional(email);

  if (!normalizedEmail) {
    return null;
  }

  return (
    records.find((record) => normalizeOptional(record.email) === normalizedEmail) ?? null
  );
}

function findDuplicateByNamePhone<TRecord extends ExistingPersonRecord>(
  records: readonly TRecord[],
  data: ImportPersonData
): TRecord | null {
  const firstName = normalizeOptional(data.firstName);
  const lastName = normalizeOptional(data.lastName);
  const phone = normalizeOptional(data.phone);

  if (!firstName || !lastName || !phone) {
    return null;
  }

  return (
    records.find(
      (record) =>
        normalizeOptional(record.firstName) === firstName &&
        normalizeOptional(record.lastName) === lastName &&
        normalizeOptional(record.phone) === phone
    ) ?? null
  );
}

function addContactabilityWarning(
  rows: CsvImportPreflightRow[],
  row: ValidPreflightRow<ImportPersonData>,
  code: Extract<
    CsvImportPreflightDiagnosticCode,
    "contact_missing_contact_method" | "lead_missing_contact_method"
  >
) {
  if (hasContactMethod(row.data)) {
    return;
  }

  appendDiagnostic(rows, row.rowNumber, {
    category: "contactability",
    code,
    fieldKey: null,
    message: "No email or phone is present for this row.",
    relatedRecord: null
  });
}

function addDuplicateWarnings(
  rows: CsvImportPreflightRow[],
  row: ValidPreflightRow<ImportPersonData>,
  records: readonly ExistingPersonRecord[],
  entity: "contacts" | "leads",
  emailCode: Extract<
    CsvImportPreflightDiagnosticCode,
    "contact_duplicate_email" | "lead_duplicate_email"
  >,
  namePhoneCode: Extract<
    CsvImportPreflightDiagnosticCode,
    "contact_duplicate_name_phone" | "lead_duplicate_name_phone"
  >
) {
  const emailDuplicate = findDuplicateByEmail(records, row.data.email);

  if (emailDuplicate) {
    appendDiagnostic(rows, row.rowNumber, {
      category: "duplicate",
      code: emailCode,
      fieldKey: "email",
      message: `Existing ${entity.slice(0, -1)} has this email: ${personLabel(emailDuplicate)}.`,
      relatedRecord: {
        entity,
        id: emailDuplicate.id,
        label: personLabel(emailDuplicate)
      }
    });
  }

  const namePhoneDuplicate = findDuplicateByNamePhone(records, row.data);

  if (namePhoneDuplicate && namePhoneDuplicate.id !== emailDuplicate?.id) {
    appendDiagnostic(rows, row.rowNumber, {
      category: "duplicate",
      code: namePhoneCode,
      fieldKey: "phone",
      message: `Existing ${entity.slice(0, -1)} has this name and phone: ${personLabel(namePhoneDuplicate)}.`,
      relatedRecord: {
        entity,
        id: namePhoneDuplicate.id,
        label: personLabel(namePhoneDuplicate)
      }
    });
  }
}

async function addContactDiagnostics(rows: CsvImportPreflightRow[]) {
  const validRows = validRowsForSchema<ContactImportData>(rows, contactCreateSchema);
  const accountIds = [
    ...new Set(
      validRows
        .map((row) => trimOptional(row.data.accountId))
        .filter((accountId): accountId is string => accountId !== null)
    )
  ];

  const [contacts, accounts] = await Promise.all([
    prisma.contact.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        accountId: true
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
        { id: "asc" }
      ]
    }),
    accountIds.length > 0
      ? prisma.account.findMany({
          where: {
            id: {
              in: accountIds
            }
          },
          select: {
            id: true,
            name: true
          }
        })
      : Promise.resolve([])
  ]);
  const accountIdSet = new Set(accounts.map((account) => account.id));

  for (const row of validRows) {
    addContactabilityWarning(rows, row, "contact_missing_contact_method");
    addDuplicateWarnings(
      rows,
      row,
      contacts satisfies ExistingContactRecord[],
      "contacts",
      "contact_duplicate_email",
      "contact_duplicate_name_phone"
    );

    const accountId = trimOptional(row.data.accountId);
    if (accountId && !accountIdSet.has(accountId)) {
      appendDiagnostic(rows, row.rowNumber, {
        category: "relationship",
        code: "contact_account_not_found",
        fieldKey: "accountId",
        message: `No account exists with id ${accountId}.`,
        relatedRecord: null
      });
    }
  }
}

async function addLeadDiagnostics(rows: CsvImportPreflightRow[]) {
  const validRows = validRowsForSchema<LeadImportData>(rows, leadCreateSchema);
  const [leads, areas] = await Promise.all([
    prisma.lead.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        postalCode: true
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
        { id: "asc" }
      ]
    }),
    prisma.area.findMany({
      select: {
        id: true,
        name: true,
        postalPrefixes: true
      },
      orderBy: [
        { name: "asc" },
        { id: "asc" }
      ]
    })
  ]);

  for (const row of validRows) {
    addContactabilityWarning(rows, row, "lead_missing_contact_method");
    addDuplicateWarnings(
      rows,
      row,
      leads satisfies ExistingLeadRecord[],
      "leads",
      "lead_duplicate_email",
      "lead_duplicate_name_phone"
    );

    const postalCode = trimOptional(row.data.postalCode);

    if (!postalCode) {
      appendDiagnostic(rows, row.rowNumber, {
        category: "relationship",
        code: "lead_postal_missing",
        fieldKey: "postalCode",
        message: "No postal code is present, so area coverage cannot be checked.",
        relatedRecord: null
      });
      continue;
    }

    const matchedArea = resolveAreaForLead({ postalCode }, areas);

    if (!matchedArea) {
      appendDiagnostic(rows, row.rowNumber, {
        category: "relationship",
        code: "lead_area_not_found",
        fieldKey: "postalCode",
        message: `No routing area currently covers postal code ${postalCode}.`,
        relatedRecord: null
      });
    }
  }
}

export async function previewCsvImportWithPreflightDiagnostics(
  entity: CsvImportPreviewEntity,
  input: string,
  options: CsvImportPreviewOptions = {}
): Promise<CsvImportPreflightResult> {
  const preview = previewCsvImport(entity, input, options);
  const rows = clonePreviewRows(preview);

  switch (entity) {
    case "contacts":
      await addContactDiagnostics(rows);
      break;
    case "leads":
      await addLeadDiagnostics(rows);
      break;
  }

  const globalReadinessReasons = buildGlobalReadinessReasons(preview);
  applyReadiness(rows, globalReadinessReasons);
  const diagnostics = rows.flatMap((row) => row.diagnostics);

  return {
    ...preview,
    rows,
    diagnostics,
    warningRows: rows.filter((row) => row.diagnostics.length > 0).length,
    readinessSummary: summarizeReadiness(rows, globalReadinessReasons.length),
    issueSummary: summarizeCsvImportIssues({
      headerErrors: preview.headerErrors,
      parseErrors: preview.parseErrors,
      rows,
      diagnostics
    })
  };
}
