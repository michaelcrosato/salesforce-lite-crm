import {
  CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_IMPORT_PREVIEW_ENTITIES,
  CSV_IMPORT_PREVIEW_MAX_LIMIT,
  getCsvImportPreviewDefinition,
  isCsvImportPreviewEntity,
  listCsvImportPreviewDefinitions,
  type CsvImportIssueSummary,
  type CsvImportPreviewDefinition,
  type CsvImportPreviewEntity,
  type CsvImportPreviewOptions
} from "@/lib/server/csvImportPreview";
import {
  previewCsvImportWithPreflightDiagnostics,
  type CsvImportActionSummary,
  type CsvImportPreflightDiagnostic,
  type CsvImportPreflightDiagnosticCode,
  type CsvImportPreflightRelatedRecord,
  type CsvImportPreflightResult,
  type CsvImportPreflightRow,
  type CsvImportReadinessSummary,
  type CsvImportReadinessStatus,
  type CsvImportRowActionKind
} from "@/lib/server/csvImportPreflight";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";

export const CSV_DEDUPE_CANDIDATE_PACKET_ENTITIES = CSV_IMPORT_PREVIEW_ENTITIES;
export const CSV_DEDUPE_CANDIDATE_PACKET_VERSION = "2026-05-22.s23-f1";
export const CSV_DEDUPE_CANDIDATE_REASON_CODES = [
  "contact_duplicate_email",
  "contact_duplicate_name_phone",
  "lead_duplicate_email",
  "lead_duplicate_name_phone"
] as const;

export type CsvDedupeCandidatePacketEntity = CsvImportPreviewEntity;
export type CsvDedupeCandidateReasonCode =
  (typeof CSV_DEDUPE_CANDIDATE_REASON_CODES)[number];
export type CsvDedupeCandidateSeverity = "warning";

export type CsvDedupeCandidatePacketOptions = CsvImportPreviewOptions;

export type CsvDedupeCandidatePacketDefinition = CsvImportPreviewDefinition & {
  packetVersion: typeof CSV_DEDUPE_CANDIDATE_PACKET_VERSION;
  inputContentType: typeof CSV_IMPORT_TEMPLATE_CONTENT_TYPE;
  defaultPreviewLimit: typeof CSV_IMPORT_PREVIEW_DEFAULT_LIMIT;
  maxPreviewLimit: typeof CSV_IMPORT_PREVIEW_MAX_LIMIT;
  supportedReasonCodes: readonly CsvDedupeCandidateReasonCode[];
};

export type CsvDedupeCandidateRowAnchor = {
  entity: CsvDedupeCandidatePacketEntity;
  rowNumber: number;
  label: string;
  fieldKey: string;
  fieldLabel: string;
  fieldValue: string | null;
  readinessStatus: CsvImportReadinessStatus;
  action: CsvImportRowActionKind;
};

export type CsvDedupeCandidateMatchedRecordAnchor = CsvImportPreflightRelatedRecord & {
  route: string;
};

export type CsvDedupeCandidate = {
  id: string;
  entity: CsvDedupeCandidatePacketEntity;
  row: CsvDedupeCandidateRowAnchor;
  matchedRecord: CsvDedupeCandidateMatchedRecordAnchor;
  reasonCode: CsvDedupeCandidateReasonCode;
  severity: CsvDedupeCandidateSeverity;
  message: string;
};

export type CsvDedupeCandidateReasonCount = {
  reasonCode: CsvDedupeCandidateReasonCode;
  severity: CsvDedupeCandidateSeverity;
  candidateCount: number;
  affectedRows: number;
  matchedRecordCount: number;
};

export type CsvDedupeCandidateSeverityCounts = {
  warning: number;
};

export type CsvDedupeCandidateSummary = {
  totalRows: number;
  previewedRows: number;
  candidateCount: number;
  affectedRows: number;
  matchedRecordCount: number;
  severityCounts: CsvDedupeCandidateSeverityCounts;
  reasonCounts: CsvDedupeCandidateReasonCount[];
};

export type CsvDedupeCandidatePreflightContext = {
  rowCount: number;
  previewedRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  issueSummary: CsvImportIssueSummary;
  readinessSummary: CsvImportReadinessSummary;
  actionSummary: CsvImportActionSummary;
};

export type CsvDedupeCandidateReadFlags = {
  metadata: true;
  csvInput: true;
  database: true;
  preflightDiagnostics: true;
};

export type CsvDedupeCandidateWriteFlags = {
  database: false;
  files: false;
  externalServices: false;
  routingAssignments: false;
  importApply: false;
  duplicateMerge: false;
  bulkMutations: false;
  backgroundJobs: false;
};

export type CsvDedupeCandidatePacket = CsvDedupeCandidatePacketDefinition & {
  preflight: CsvDedupeCandidatePreflightContext;
  candidates: readonly CsvDedupeCandidate[];
  summary: CsvDedupeCandidateSummary;
  read: CsvDedupeCandidateReadFlags;
  write: CsvDedupeCandidateWriteFlags;
};

type DuplicateDiagnostic = CsvImportPreflightDiagnostic & {
  category: "duplicate";
  code: CsvDedupeCandidateReasonCode;
  fieldKey: string;
  relatedRecord: CsvImportPreflightRelatedRecord;
};

const dedupeReasonCodeSet: ReadonlySet<CsvImportPreflightDiagnosticCode> = new Set(
  CSV_DEDUPE_CANDIDATE_REASON_CODES
);

function readFlags(): CsvDedupeCandidateReadFlags {
  return {
    metadata: true,
    csvInput: true,
    database: true,
    preflightDiagnostics: true
  };
}

function noWrites(): CsvDedupeCandidateWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    routingAssignments: false,
    importApply: false,
    duplicateMerge: false,
    bulkMutations: false,
    backgroundJobs: false
  };
}

function buildDefinition(
  definition: CsvImportPreviewDefinition
): CsvDedupeCandidatePacketDefinition {
  return {
    ...definition,
    packetVersion: CSV_DEDUPE_CANDIDATE_PACKET_VERSION,
    inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
    defaultPreviewLimit: CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
    maxPreviewLimit: CSV_IMPORT_PREVIEW_MAX_LIMIT,
    supportedReasonCodes: CSV_DEDUPE_CANDIDATE_REASON_CODES
  };
}

function isDuplicateDiagnostic(
  diagnostic: CsvImportPreflightDiagnostic
): diagnostic is DuplicateDiagnostic {
  return (
    diagnostic.category === "duplicate" &&
    diagnostic.fieldKey !== null &&
    diagnostic.relatedRecord !== null &&
    dedupeReasonCodeSet.has(diagnostic.code)
  );
}

function relatedRecordRoute(record: CsvImportPreflightRelatedRecord): string {
  switch (record.entity) {
    case "contacts":
      return `/contacts/${record.id}`;
    case "leads":
      return `/leads/${record.id}`;
    case "accounts":
      return `/accounts/${record.id}`;
    case "areas":
      return "/areas";
  }
}

function fieldLabel(
  definition: CsvDedupeCandidatePacketDefinition,
  fieldKey: string
): string {
  return definition.fields.find((field) => field.key === fieldKey)?.label ?? fieldKey;
}

function fieldValue(row: CsvImportPreflightRow, fieldKey: string): string | null {
  const value = row.values[fieldKey]?.trim();

  return value && value.length > 0 ? value : null;
}

function rowLabel(row: CsvImportPreflightRow): string {
  const firstName = row.data?.firstName ?? row.values.firstName ?? "";
  const lastName = row.data?.lastName ?? row.values.lastName ?? "";
  const label = `${firstName} ${lastName}`.trim();

  return label.length > 0 ? label : `Row ${row.rowNumber}`;
}

function candidateId(
  entity: CsvDedupeCandidatePacketEntity,
  row: CsvImportPreflightRow,
  diagnostic: DuplicateDiagnostic
): string {
  return [
    "csv-dedupe-candidate",
    entity,
    `row-${row.rowNumber}`,
    diagnostic.code,
    diagnostic.relatedRecord.id
  ].join(":");
}

function buildCandidate(
  definition: CsvDedupeCandidatePacketDefinition,
  row: CsvImportPreflightRow,
  diagnostic: DuplicateDiagnostic
): CsvDedupeCandidate {
  return {
    id: candidateId(definition.entity, row, diagnostic),
    entity: definition.entity,
    row: {
      entity: definition.entity,
      rowNumber: row.rowNumber,
      label: rowLabel(row),
      fieldKey: diagnostic.fieldKey,
      fieldLabel: fieldLabel(definition, diagnostic.fieldKey),
      fieldValue: fieldValue(row, diagnostic.fieldKey),
      readinessStatus: row.readiness.status,
      action: row.action.action
    },
    matchedRecord: {
      ...diagnostic.relatedRecord,
      route: relatedRecordRoute(diagnostic.relatedRecord)
    },
    reasonCode: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message
  };
}

function buildCandidates(
  definition: CsvDedupeCandidatePacketDefinition,
  rows: readonly CsvImportPreflightRow[]
): CsvDedupeCandidate[] {
  return rows.flatMap((row) =>
    row.diagnostics
      .filter(isDuplicateDiagnostic)
      .map((diagnostic) => buildCandidate(definition, row, diagnostic))
  );
}

function matchedRecordKey(candidate: CsvDedupeCandidate): string {
  return `${candidate.matchedRecord.entity}:${candidate.matchedRecord.id}`;
}

function summarizeCandidates(
  preflight: CsvImportPreflightResult,
  candidates: readonly CsvDedupeCandidate[]
): CsvDedupeCandidateSummary {
  const affectedRows = new Set(candidates.map((candidate) => candidate.row.rowNumber));
  const matchedRecords = new Set(candidates.map(matchedRecordKey));

  return {
    totalRows: preflight.rowCount,
    previewedRows: preflight.previewedRows,
    candidateCount: candidates.length,
    affectedRows: affectedRows.size,
    matchedRecordCount: matchedRecords.size,
    severityCounts: {
      warning: candidates.length
    },
    reasonCounts: CSV_DEDUPE_CANDIDATE_REASON_CODES.map((reasonCode) => {
      const matchingCandidates = candidates.filter(
        (candidate) => candidate.reasonCode === reasonCode
      );

      return {
        reasonCode,
        severity: "warning",
        candidateCount: matchingCandidates.length,
        affectedRows: new Set(
          matchingCandidates.map((candidate) => candidate.row.rowNumber)
        ).size,
        matchedRecordCount: new Set(matchingCandidates.map(matchedRecordKey)).size
      };
    })
  };
}

function summarizePreflight(
  preflight: CsvImportPreflightResult
): CsvDedupeCandidatePreflightContext {
  return {
    rowCount: preflight.rowCount,
    previewedRows: preflight.previewedRows,
    validRows: preflight.validRows,
    invalidRows: preflight.invalidRows,
    warningRows: preflight.warningRows,
    issueSummary: preflight.issueSummary,
    readinessSummary: preflight.readinessSummary,
    actionSummary: preflight.actionSummary
  };
}

export function isCsvDedupeCandidatePacketEntity(
  value: string
): value is CsvDedupeCandidatePacketEntity {
  return isCsvImportPreviewEntity(value);
}

export function listCsvDedupeCandidatePacketDefinitions(): CsvDedupeCandidatePacketDefinition[] {
  return listCsvImportPreviewDefinitions().map(buildDefinition);
}

export function getCsvDedupeCandidatePacketDefinition(
  entity: CsvDedupeCandidatePacketEntity
): CsvDedupeCandidatePacketDefinition {
  return buildDefinition(getCsvImportPreviewDefinition(entity));
}

export async function getCsvDedupeCandidatePacket(
  entity: CsvDedupeCandidatePacketEntity,
  input: string,
  options: CsvDedupeCandidatePacketOptions = {}
): Promise<CsvDedupeCandidatePacket> {
  const definition = getCsvDedupeCandidatePacketDefinition(entity);
  const preflight = await previewCsvImportWithPreflightDiagnostics(
    entity,
    input,
    options
  );
  const candidates = buildCandidates(definition, preflight.rows);

  return {
    ...definition,
    preflight: summarizePreflight(preflight),
    candidates,
    summary: summarizeCandidates(preflight, candidates),
    read: readFlags(),
    write: noWrites()
  };
}

export async function listCsvDedupeCandidatePackets(
  inputs: Record<CsvDedupeCandidatePacketEntity, string>,
  options: CsvDedupeCandidatePacketOptions = {}
): Promise<CsvDedupeCandidatePacket[]> {
  return Promise.all(
    CSV_DEDUPE_CANDIDATE_PACKET_ENTITIES.map((entity) =>
      getCsvDedupeCandidatePacket(entity, inputs[entity], options)
    )
  );
}
