import { parseCsv } from "@/lib/business/csv-import";
import { contactCreateSchema, leadCreateSchema } from "@/lib/validation";
import type { z } from "zod";

export const CSV_IMPORT_PREVIEW_ENTITIES = ["contacts", "leads"] as const;
export const CSV_IMPORT_PREVIEW_DEFAULT_LIMIT = 100;
export const CSV_IMPORT_PREVIEW_MAX_LIMIT = 1000;

export type CsvImportPreviewEntity = (typeof CSV_IMPORT_PREVIEW_ENTITIES)[number];

export type CsvImportPreviewField = {
  key: string;
  label: string;
  required: boolean;
  aliases: readonly string[];
};

export type CsvImportPreviewDefinition = {
  entity: CsvImportPreviewEntity;
  label: string;
  route: string;
  fields: readonly CsvImportPreviewField[];
};

export type CsvImportPreviewOptions = {
  limit?: number;
};

export type CsvImportIssueSummaryCategory =
  | "header"
  | "parse"
  | "row_validation"
  | "diagnostic_warning";

export type CsvImportIssueSummarySeverity = "error" | "warning";

export type CsvImportIssueSummaryCategoryCount = {
  category: CsvImportIssueSummaryCategory;
  severity: CsvImportIssueSummarySeverity;
  issueCount: number;
  affectedRows: number;
};

export type CsvImportIssueSummary = {
  errorCount: number;
  warningCount: number;
  affectedRows: number;
  categories: CsvImportIssueSummaryCategoryCount[];
};

export type CsvImportPreviewHeaderStatus = "mapped" | "duplicate" | "ignored";

export type CsvImportPreviewHeader = {
  index: number;
  header: string;
  normalized: string;
  fieldKey: string | null;
  status: CsvImportPreviewHeaderStatus;
  message: string | null;
};

export type CsvImportPreviewRowStatus = "valid" | "invalid";

export type CsvImportPreviewData =
  | z.infer<typeof contactCreateSchema>
  | z.infer<typeof leadCreateSchema>;

export type CsvImportPreviewRow = {
  rowNumber: number;
  status: CsvImportPreviewRowStatus;
  values: Record<string, string | undefined>;
  data: CsvImportPreviewData | null;
  errors: string[];
};

export type CsvImportPreviewResult = CsvImportPreviewDefinition & {
  headers: CsvImportPreviewHeader[];
  headerErrors: string[];
  parseErrors: string[];
  rowCount: number;
  previewedRows: number;
  validRows: number;
  invalidRows: number;
  issueSummary: CsvImportIssueSummary;
  rows: CsvImportPreviewRow[];
};

type CsvImportIssueSummaryRow = {
  rowNumber: number;
  errors: readonly string[];
};

type CsvImportIssueSummaryDiagnostic = {
  rowNumber: number;
  severity: "warning";
};

const csvImportPreviewEntitySet: ReadonlySet<string> = new Set(CSV_IMPORT_PREVIEW_ENTITIES);

const contactFields: readonly CsvImportPreviewField[] = [
  {
    key: "firstName",
    label: "First Name",
    required: true,
    aliases: ["first", "first name", "first_name", "firstname", "given name"]
  },
  {
    key: "lastName",
    label: "Last Name",
    required: true,
    aliases: ["last", "last name", "last_name", "lastname", "family name", "surname"]
  },
  {
    key: "email",
    label: "Email",
    required: false,
    aliases: ["email", "email address", "e-mail", "e-mail address"]
  },
  {
    key: "phone",
    label: "Phone",
    required: false,
    aliases: ["phone", "phone number", "mobile", "mobile phone", "telephone"]
  },
  {
    key: "title",
    label: "Title",
    required: false,
    aliases: ["title", "job title", "role"]
  },
  {
    key: "status",
    label: "Status",
    required: true,
    aliases: ["status", "contact status"]
  },
  {
    key: "accountId",
    label: "Account ID",
    required: false,
    aliases: ["account", "account id", "account_id", "accountid"]
  }
];

const leadFields: readonly CsvImportPreviewField[] = [
  {
    key: "firstName",
    label: "First Name",
    required: true,
    aliases: ["first", "first name", "first_name", "firstname", "given name"]
  },
  {
    key: "lastName",
    label: "Last Name",
    required: true,
    aliases: ["last", "last name", "last_name", "lastname", "family name", "surname"]
  },
  {
    key: "phone",
    label: "Phone",
    required: false,
    aliases: ["phone", "phone number", "mobile", "mobile phone", "telephone"]
  },
  {
    key: "email",
    label: "Email",
    required: false,
    aliases: ["email", "email address", "e-mail", "e-mail address"]
  },
  {
    key: "postalCode",
    label: "Postal Code",
    required: false,
    aliases: ["postal", "postal code", "postal_code", "postcode", "zip", "zip code"]
  },
  {
    key: "province",
    label: "Province",
    required: false,
    aliases: ["province", "state", "region"]
  },
  {
    key: "source",
    label: "Source",
    required: false,
    aliases: ["source", "lead source", "lead_source"]
  },
  {
    key: "status",
    label: "Status",
    required: false,
    aliases: ["status", "lead status"]
  }
];

const contactDefinition: CsvImportPreviewDefinition = {
  entity: "contacts",
  label: "Contacts",
  route: "/contacts",
  fields: contactFields
};

const leadDefinition: CsvImportPreviewDefinition = {
  entity: "leads",
  label: "Leads",
  route: "/leads",
  fields: leadFields
};

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return CSV_IMPORT_PREVIEW_DEFAULT_LIMIT;
  }

  const truncated = Math.trunc(limit);

  if (!Number.isFinite(truncated)) {
    return CSV_IMPORT_PREVIEW_DEFAULT_LIMIT;
  }

  return Math.min(Math.max(truncated, 0), CSV_IMPORT_PREVIEW_MAX_LIMIT);
}

function normalizeHeaderToken(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function buildAliasMap(fields: readonly CsvImportPreviewField[]): Map<string, CsvImportPreviewField> {
  const aliases = new Map<string, CsvImportPreviewField>();

  for (const field of fields) {
    for (const alias of [field.key, field.label, ...field.aliases]) {
      aliases.set(normalizeHeaderToken(alias), field);
    }
  }

  return aliases;
}

function getDefinition(entity: CsvImportPreviewEntity): CsvImportPreviewDefinition {
  switch (entity) {
    case "contacts":
      return contactDefinition;
    case "leads":
      return leadDefinition;
  }
}

function toPublicDefinition(definition: CsvImportPreviewDefinition): CsvImportPreviewDefinition {
  return {
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
    fields: definition.fields.map((field) => ({
      key: field.key,
      label: field.label,
      required: field.required,
      aliases: field.aliases
    }))
  };
}

function getFieldLabel(
  definition: CsvImportPreviewDefinition,
  fieldKey: string | undefined
): string {
  if (fieldKey === undefined) {
    return "Row";
  }

  return definition.fields.find((field) => field.key === fieldKey)?.label ?? fieldKey;
}

function mapHeaders(definition: CsvImportPreviewDefinition, rawHeaders: readonly string[]) {
  const aliasMap = buildAliasMap(definition.fields);
  const seenFields = new Set<string>();
  const indexesByField = new Map<string, number>();
  const headerErrors: string[] = [];
  const headers = rawHeaders.map((header, index): CsvImportPreviewHeader => {
    const normalized = normalizeHeaderToken(header);
    const field = aliasMap.get(normalized);

    if (!field) {
      return {
        index,
        header,
        normalized,
        fieldKey: null,
        status: "ignored",
        message: `Unsupported header ignored: ${header || `(column ${index + 1})`}.`
      };
    }

    if (seenFields.has(field.key)) {
      const message = `Duplicate header for ${field.label}: ${header}.`;
      headerErrors.push(message);
      return {
        index,
        header,
        normalized,
        fieldKey: field.key,
        status: "duplicate",
        message
      };
    }

    seenFields.add(field.key);
    indexesByField.set(field.key, index);

    return {
      index,
      header,
      normalized,
      fieldKey: field.key,
      status: "mapped",
      message: null
    };
  });

  for (const field of definition.fields) {
    if (field.required && !indexesByField.has(field.key)) {
      headerErrors.push(`Missing required header: ${field.label}.`);
    }
  }

  return { headers, headerErrors, indexesByField };
}

function valuesForRow(
  definition: CsvImportPreviewDefinition,
  row: readonly string[],
  indexesByField: ReadonlyMap<string, number>
): Record<string, string | undefined> {
  const values: Record<string, string | undefined> = {};

  for (const field of definition.fields) {
    const index = indexesByField.get(field.key);
    if (index !== undefined) {
      values[field.key] = row[index] ?? "";
    }
  }

  return values;
}

function validateMappedValues(
  entity: CsvImportPreviewEntity,
  values: Record<string, string | undefined>
):
  | { success: true; data: CsvImportPreviewData }
  | { success: false; issues: readonly z.ZodIssue[] } {
  switch (entity) {
    case "contacts": {
      const result = contactCreateSchema.safeParse(values);
      return result.success
        ? { success: true, data: result.data }
        : { success: false, issues: result.error.issues };
    }
    case "leads": {
      const result = leadCreateSchema.safeParse(values);
      return result.success
        ? { success: true, data: result.data }
        : { success: false, issues: result.error.issues };
    }
  }
}

function formatIssues(
  definition: CsvImportPreviewDefinition,
  issues: readonly z.ZodIssue[],
  missingRequiredKeys: ReadonlySet<string>
): string[] {
  const errors = new Set<string>();

  for (const issue of issues) {
    const fieldKey = typeof issue.path[0] === "string" ? issue.path[0] : undefined;
    if (fieldKey !== undefined && missingRequiredKeys.has(fieldKey)) {
      continue;
    }

    errors.add(`${getFieldLabel(definition, fieldKey)}: ${issue.message}`);
  }

  return [...errors];
}

function buildMissingRequiredKeys(
  definition: CsvImportPreviewDefinition,
  indexesByField: ReadonlyMap<string, number>
): Set<string> {
  const missingKeys = new Set<string>();

  for (const field of definition.fields) {
    if (field.required && !indexesByField.has(field.key)) {
      missingKeys.add(field.key);
    }
  }

  return missingKeys;
}

function buildRowErrors(
  definition: CsvImportPreviewDefinition,
  rawHeaderCount: number,
  row: readonly string[],
  missingRequiredKeys: ReadonlySet<string>
): string[] {
  const errors = new Set<string>();

  if (row.length !== rawHeaderCount) {
    errors.add(`Expected ${rawHeaderCount} columns but found ${row.length}.`);
  }

  for (const field of definition.fields) {
    if (missingRequiredKeys.has(field.key)) {
      errors.add(`Missing required header: ${field.label}.`);
    }
  }

  return [...errors];
}

export function summarizeCsvImportIssues(input: {
  headerErrors: readonly string[];
  parseErrors: readonly string[];
  rows: readonly CsvImportIssueSummaryRow[];
  diagnostics?: readonly CsvImportIssueSummaryDiagnostic[];
}): CsvImportIssueSummary {
  const diagnosticWarnings = input.diagnostics?.filter(
    (diagnostic) => diagnostic.severity === "warning"
  ) ?? [];
  const rowValidationIssueCount = input.rows.reduce(
    (total, row) => total + row.errors.length,
    0
  );
  const rowValidationRows = input.rows.filter((row) => row.errors.length > 0);
  const affectedRowNumbers = new Set<number>();

  for (const row of rowValidationRows) {
    affectedRowNumbers.add(row.rowNumber);
  }

  for (const diagnostic of diagnosticWarnings) {
    affectedRowNumbers.add(diagnostic.rowNumber);
  }

  const categories: CsvImportIssueSummaryCategoryCount[] = [
    {
      category: "header",
      severity: "error",
      issueCount: input.headerErrors.length,
      affectedRows: 0
    },
    {
      category: "parse",
      severity: "error",
      issueCount: input.parseErrors.length,
      affectedRows: 0
    },
    {
      category: "row_validation",
      severity: "error",
      issueCount: rowValidationIssueCount,
      affectedRows: rowValidationRows.length
    },
    {
      category: "diagnostic_warning",
      severity: "warning",
      issueCount: diagnosticWarnings.length,
      affectedRows: new Set(diagnosticWarnings.map((diagnostic) => diagnostic.rowNumber))
        .size
    }
  ];

  return {
    errorCount: input.headerErrors.length + input.parseErrors.length + rowValidationIssueCount,
    warningCount: diagnosticWarnings.length,
    affectedRows: affectedRowNumbers.size,
    categories
  };
}

export function isCsvImportPreviewEntity(value: string): value is CsvImportPreviewEntity {
  return csvImportPreviewEntitySet.has(value);
}

export function listCsvImportPreviewDefinitions(): CsvImportPreviewDefinition[] {
  return [
    toPublicDefinition(contactDefinition),
    toPublicDefinition(leadDefinition)
  ];
}

export function getCsvImportPreviewDefinition(
  entity: CsvImportPreviewEntity
): CsvImportPreviewDefinition {
  return toPublicDefinition(getDefinition(entity));
}

export function previewCsvImport(
  entity: CsvImportPreviewEntity,
  input: string,
  options: CsvImportPreviewOptions = {}
): CsvImportPreviewResult {
  const definition = getDefinition(entity);
  const parsed = parseCsv(input);
  const { headers, headerErrors, indexesByField } = mapHeaders(definition, parsed.headers);
  const missingRequiredKeys = buildMissingRequiredKeys(definition, indexesByField);
  const limit = normalizeLimit(options.limit);
  const rows = parsed.rows.slice(0, limit).map((row, index): CsvImportPreviewRow => {
    const values = valuesForRow(definition, row, indexesByField);
    const rowErrors = buildRowErrors(
      definition,
      parsed.headers.length,
      row,
      missingRequiredKeys
    );
    const validation = validateMappedValues(entity, values);
    const validationErrors = validation.success
      ? []
      : formatIssues(definition, validation.issues, missingRequiredKeys);
    const errors = [...new Set([...rowErrors, ...validationErrors])];

    return {
      rowNumber: index + 2,
      status: errors.length === 0 ? "valid" : "invalid",
      values,
      data: errors.length === 0 && validation.success ? validation.data : null,
      errors
    };
  });

  const validRows = rows.filter((row) => row.status === "valid").length;

  return {
    ...toPublicDefinition(definition),
    headers,
    headerErrors,
    parseErrors: parsed.errors,
    rowCount: parsed.rows.length,
    previewedRows: rows.length,
    validRows,
    invalidRows: rows.length - validRows,
    issueSummary: summarizeCsvImportIssues({
      headerErrors,
      parseErrors: parsed.errors,
      rows
    }),
    rows
  };
}
