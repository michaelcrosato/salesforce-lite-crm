import {
  CSV_DEDUPE_CANDIDATE_PACKET_ENTITIES,
  CSV_DEDUPE_CANDIDATE_PACKET_VERSION,
  getCsvDedupeCandidatePacket,
  getCsvDedupeCandidatePacketDefinition,
  isCsvDedupeCandidatePacketEntity,
  listCsvDedupeCandidatePacketDefinitions,
  type CsvDedupeCandidate,
  type CsvDedupeCandidatePacket,
  type CsvDedupeCandidatePacketDefinition,
  type CsvDedupeCandidatePacketEntity,
  type CsvDedupeCandidatePacketOptions,
  type CsvDedupeCandidateReadFlags,
  type CsvDedupeCandidateSummary,
  type CsvDedupeCandidateWriteFlags
} from "@/lib/server/csvDedupeCandidatePackets";
import {
  getCsvImportDryRunReceipt,
  type CsvImportDryRunReceipt,
  type CsvImportDryRunSourceMetadata,
  type CsvImportDryRunWriteFlags
} from "@/lib/server/csvImportDryRunReceipts";
import {
  CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
  CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT,
  type CsvImportReviewBundle,
  type CsvImportReviewRowSample
} from "@/lib/server/csvImportReviewBundles";
import {
  type CsvImportActionSummary,
  type CsvImportReadinessSummary
} from "@/lib/server/csvImportPreflight";
import type { CsvImportIssueSummary } from "@/lib/server/csvImportPreview";

export const CSV_DEDUPE_REVIEW_BUNDLE_ENTITIES =
  CSV_DEDUPE_CANDIDATE_PACKET_ENTITIES;
export const CSV_DEDUPE_REVIEW_BUNDLE_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;
export const CSV_DEDUPE_REVIEW_BUNDLE_VERSION = "2026-05-22.s23-f2";

export type CsvDedupeReviewBundleEntity = CsvDedupeCandidatePacketEntity;
export type CsvDedupeReviewStatus = "safe" | "watch" | "block";

export type CsvDedupeReviewBundleOptions = CsvDedupeCandidatePacketOptions & {
  sampleLimit?: number;
};

export type CsvDedupeReviewBundleDefinition =
  CsvDedupeCandidatePacketDefinition & {
    contentType: typeof CSV_DEDUPE_REVIEW_BUNDLE_CONTENT_TYPE;
    bundleVersion: typeof CSV_DEDUPE_REVIEW_BUNDLE_VERSION;
    candidatePacketVersion: typeof CSV_DEDUPE_CANDIDATE_PACKET_VERSION;
    dryRunMode: "dry_run";
    defaultSampleLimit: typeof CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT;
    maxSampleLimit: typeof CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT;
  };

export type CsvDedupeReviewOperatorSummary = {
  status: CsvDedupeReviewStatus;
  totalRows: number;
  previewedRows: number;
  safeRows: number;
  watchRows: number;
  blockRows: number;
  importableRows: number;
  dedupeCandidateRows: number;
  dedupeCandidateCount: number;
  matchedRecordCount: number;
  diagnosticCount: number;
  warningCount: number;
  errorCount: number;
};

export type CsvDedupeReviewReadFlags = CsvDedupeCandidateReadFlags & {
  dryRun: true;
  review: true;
  rowSample: true;
};

export type CsvDedupeReviewWriteFlags =
  CsvDedupeCandidateWriteFlags &
    CsvImportDryRunWriteFlags & {
      headerRemapping: false;
      userUploadParsing: false;
      approvalWorkflow: false;
      persistentHistory: false;
    };

export type CsvDedupeReviewBundle = CsvDedupeReviewBundleDefinition & {
  mode: "dedupe_review";
  candidatePacket: CsvDedupeCandidatePacket;
  dryRun: CsvImportDryRunReceipt;
  review: CsvImportReviewBundle;
  source: CsvImportDryRunSourceMetadata;
  issueSummary: CsvImportIssueSummary;
  readinessSummary: CsvImportReadinessSummary;
  actionSummary: CsvImportActionSummary;
  dedupeSummary: CsvDedupeCandidateSummary;
  candidates: readonly CsvDedupeCandidate[];
  rowSample: CsvImportReviewRowSample;
  operatorSummary: CsvDedupeReviewOperatorSummary;
  read: CsvDedupeReviewReadFlags;
  write: CsvDedupeReviewWriteFlags;
};

function readFlags(): CsvDedupeReviewReadFlags {
  return {
    metadata: true,
    csvInput: true,
    database: true,
    preflightDiagnostics: true,
    dryRun: true,
    review: true,
    rowSample: true
  };
}

function noWrites(): CsvDedupeReviewWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    routingAssignments: false,
    importApply: false,
    duplicateMerge: false,
    bulkMutations: false,
    backgroundJobs: false,
    headerRemapping: false,
    userUploadParsing: false,
    approvalWorkflow: false,
    persistentHistory: false
  };
}

function buildDefinition(
  definition: CsvDedupeCandidatePacketDefinition
): CsvDedupeReviewBundleDefinition {
  return {
    ...definition,
    contentType: CSV_DEDUPE_REVIEW_BUNDLE_CONTENT_TYPE,
    bundleVersion: CSV_DEDUPE_REVIEW_BUNDLE_VERSION,
    candidatePacketVersion: CSV_DEDUPE_CANDIDATE_PACKET_VERSION,
    dryRunMode: "dry_run",
    defaultSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
    maxSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
  };
}

function bundleStatus(
  dryRun: CsvImportDryRunReceipt,
  candidatePacket: CsvDedupeCandidatePacket
): CsvDedupeReviewStatus {
  if (
    dryRun.readinessSummary.blockedRows > 0 ||
    dryRun.issueSummary.errorCount > 0
  ) {
    return "block";
  }

  if (
    candidatePacket.summary.candidateCount > 0 ||
    dryRun.actionSummary.reviewCandidateRows > 0 ||
    dryRun.issueSummary.warningCount > 0
  ) {
    return "watch";
  }

  return "safe";
}

function summarizeOperatorReview(
  dryRun: CsvImportDryRunReceipt,
  candidatePacket: CsvDedupeCandidatePacket
): CsvDedupeReviewOperatorSummary {
  return {
    status: bundleStatus(dryRun, candidatePacket),
    totalRows: dryRun.source.rowCount,
    previewedRows: dryRun.source.previewedRows,
    safeRows: dryRun.actionSummary.createCandidateRows,
    watchRows: dryRun.actionSummary.reviewCandidateRows,
    blockRows: dryRun.actionSummary.blockedRows,
    importableRows: dryRun.actionSummary.importableRows,
    dedupeCandidateRows: candidatePacket.summary.affectedRows,
    dedupeCandidateCount: candidatePacket.summary.candidateCount,
    matchedRecordCount: candidatePacket.summary.matchedRecordCount,
    diagnosticCount: dryRun.diagnostics.length,
    warningCount: dryRun.issueSummary.warningCount,
    errorCount: dryRun.issueSummary.errorCount
  };
}

export function isCsvDedupeReviewBundleEntity(
  value: string
): value is CsvDedupeReviewBundleEntity {
  return isCsvDedupeCandidatePacketEntity(value);
}

export function listCsvDedupeReviewBundleDefinitions(): CsvDedupeReviewBundleDefinition[] {
  return listCsvDedupeCandidatePacketDefinitions().map(buildDefinition);
}

export function getCsvDedupeReviewBundleDefinition(
  entity: CsvDedupeReviewBundleEntity
): CsvDedupeReviewBundleDefinition {
  return buildDefinition(getCsvDedupeCandidatePacketDefinition(entity));
}

export async function getCsvDedupeReviewBundle(
  entity: CsvDedupeReviewBundleEntity,
  input: string,
  options: CsvDedupeReviewBundleOptions = {}
): Promise<CsvDedupeReviewBundle> {
  const [candidatePacket, dryRun] = await Promise.all([
    getCsvDedupeCandidatePacket(entity, input, {
      limit: options.limit
    }),
    getCsvImportDryRunReceipt(entity, input, options)
  ]);

  return {
    ...getCsvDedupeReviewBundleDefinition(entity),
    mode: "dedupe_review",
    candidatePacket,
    dryRun,
    review: dryRun.review,
    source: dryRun.source,
    issueSummary: dryRun.issueSummary,
    readinessSummary: dryRun.readinessSummary,
    actionSummary: dryRun.actionSummary,
    dedupeSummary: candidatePacket.summary,
    candidates: candidatePacket.candidates,
    rowSample: dryRun.rowSample,
    operatorSummary: summarizeOperatorReview(dryRun, candidatePacket),
    read: readFlags(),
    write: noWrites()
  };
}

export async function listCsvDedupeReviewBundles(
  inputs: Record<CsvDedupeReviewBundleEntity, string>,
  options: CsvDedupeReviewBundleOptions = {}
): Promise<CsvDedupeReviewBundle[]> {
  return Promise.all(
    CSV_DEDUPE_REVIEW_BUNDLE_ENTITIES.map((entity) =>
      getCsvDedupeReviewBundle(entity, inputs[entity], options)
    )
  );
}
