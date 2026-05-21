import {
  CSV_EXPORT_DEFAULT_LIMIT,
  CSV_EXPORT_ENTITIES,
  CSV_EXPORT_MAX_LIMIT,
  exportCrmListCsv,
  isCsvExportEntity,
  type CsvExportEntity,
  type CsvExportOptions
} from "@/lib/server/csvExport";
import {
  getCsvExportReviewBundle,
  getCsvExportReviewBundleDefinition,
  listCsvExportReviewBundleDefinitions,
  type CsvExportReviewBundle,
  type CsvExportReviewBundleDefinition,
  type CsvExportReviewNote,
  type CsvExportReviewWriteFlags
} from "@/lib/server/csvExportReviewBundles";

export const CSV_EXPORT_DELIVERY_PACKET_ENTITIES = CSV_EXPORT_ENTITIES;

export type CsvExportDeliveryPacketEntity = CsvExportEntity;
export type CsvExportDeliveryPacketDefinition = CsvExportReviewBundleDefinition;
export type CsvExportDeliveryPacketOptions = CsvExportOptions;

export type CsvExportDeliveryLimitMetadata = {
  requestedLimit: number | null;
  appliedLimit: number;
  defaultLimit: typeof CSV_EXPORT_DEFAULT_LIMIT;
  maxLimit: typeof CSV_EXPORT_MAX_LIMIT;
  truncatedByLimit: boolean;
};

export type CsvExportDeliveryWriteFlags = CsvExportReviewWriteFlags & {
  scheduledDelivery: false;
  backgroundJobs: false;
};

export type CsvExportDeliveryPacket = CsvExportDeliveryPacketDefinition & {
  review: CsvExportReviewBundle;
  csv: string;
  rowCount: number;
  totalAvailableRows: number;
  limits: CsvExportDeliveryLimitMetadata;
  notes: readonly CsvExportReviewNote[];
  write: CsvExportDeliveryWriteFlags;
};

function noWrites(): CsvExportDeliveryWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    exportHistory: false,
    scheduledDelivery: false,
    backgroundJobs: false
  };
}

function normalizeDeliveryLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return CSV_EXPORT_DEFAULT_LIMIT;
  }

  const truncated = Math.trunc(limit);

  if (!Number.isFinite(truncated)) {
    return CSV_EXPORT_DEFAULT_LIMIT;
  }

  return Math.min(Math.max(truncated, 0), CSV_EXPORT_MAX_LIMIT);
}

function normalizeRequestedLimit(limit: number | undefined): number | null {
  if (limit === undefined) {
    return null;
  }

  const truncated = Math.trunc(limit);

  return Number.isFinite(truncated) ? truncated : null;
}

function buildDeliveryLimitMetadata(
  options: CsvExportDeliveryPacketOptions,
  totalAvailableRows: number
): CsvExportDeliveryLimitMetadata {
  const appliedLimit = normalizeDeliveryLimit(options.limit);

  return {
    requestedLimit: normalizeRequestedLimit(options.limit),
    appliedLimit,
    defaultLimit: CSV_EXPORT_DEFAULT_LIMIT,
    maxLimit: CSV_EXPORT_MAX_LIMIT,
    truncatedByLimit: totalAvailableRows > appliedLimit
  };
}

export function isCsvExportDeliveryPacketEntity(
  value: string
): value is CsvExportDeliveryPacketEntity {
  return isCsvExportEntity(value);
}

export function listCsvExportDeliveryPacketDefinitions(): CsvExportDeliveryPacketDefinition[] {
  return listCsvExportReviewBundleDefinitions();
}

export function getCsvExportDeliveryPacketDefinition(
  entity: CsvExportDeliveryPacketEntity
): CsvExportDeliveryPacketDefinition {
  return getCsvExportReviewBundleDefinition(entity);
}

export async function getCsvExportDeliveryPacket(
  entity: CsvExportDeliveryPacketEntity,
  options: CsvExportDeliveryPacketOptions = {}
): Promise<CsvExportDeliveryPacket> {
  const [review, exportResult] = await Promise.all([
    getCsvExportReviewBundle(entity, options),
    exportCrmListCsv(entity, options)
  ]);

  return {
    ...getCsvExportDeliveryPacketDefinition(entity),
    review,
    csv: exportResult.csv,
    rowCount: exportResult.rowCount,
    totalAvailableRows: review.preflight.rowCount,
    limits: buildDeliveryLimitMetadata(options, review.preflight.rowCount),
    notes: review.notes,
    write: noWrites()
  };
}

export async function listCsvExportDeliveryPackets(
  options: CsvExportDeliveryPacketOptions = {}
): Promise<CsvExportDeliveryPacket[]> {
  return Promise.all(
    CSV_EXPORT_DELIVERY_PACKET_ENTITIES.map((entity) =>
      getCsvExportDeliveryPacket(entity, options)
    )
  );
}
