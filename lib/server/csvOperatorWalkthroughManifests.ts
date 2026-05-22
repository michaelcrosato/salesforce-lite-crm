import { createHash } from "node:crypto";
import {
  CSV_CAPABILITY_OPERATIONS,
  getCsvCapability,
  listCsvCapabilitiesByOperation,
  type CsvCapability,
  type CsvCapabilityOperation
} from "@/lib/server/csvCapabilities";
import {
  CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
  getCsvHandoffReleaseNotesPacket,
  isCsvHandoffReleaseNotesEntity,
  isCsvHandoffReleaseNotesOperation,
  type CsvHandoffReleaseNotesEntity,
  type CsvHandoffReleaseNotesEntityPacket,
  type CsvHandoffReleaseNotesOperation,
  type CsvHandoffReleaseNotesOperationPacket,
  type CsvHandoffReleaseNotesPacket
} from "@/lib/server/csvHandoffReleaseNotesPackets";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  exportCsvImportTemplateExampleCsv,
  getCsvImportTemplate,
  isCsvImportTemplateEntity,
  type CsvImportTemplate,
  type CsvImportTemplateExampleCsv
} from "@/lib/server/csvImportTemplates";
import {
  CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
  getCsvOperatorAcceptanceChecklist,
  type CsvOperatorAcceptanceChecklist,
  type CsvOperatorAcceptanceChecklistItem,
  type CsvOperatorAcceptanceChecklistOptions,
  type CsvOperatorAcceptanceChecklistStatus,
  type CsvOperatorAcceptanceChecklistStatusCounts,
  type CsvOperatorAcceptanceEntityChecklist,
  type CsvOperatorAcceptanceOperationChecklist
} from "@/lib/server/csvOperatorAcceptanceChecklists";
import {
  CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
  getCsvOperatorFixtureBundle,
  type CsvOperatorFixtureAvailability,
  type CsvOperatorFixtureBundle,
  type CsvOperatorFixtureEntityBundle,
  type CsvOperatorFixtureEntityOperation,
  type CsvOperatorFixtureOperationBundle
} from "@/lib/server/csvOperatorFixtureBundles";

export const CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvOperatorWalkthroughEntity = CsvHandoffReleaseNotesEntity;
export type CsvOperatorWalkthroughOperation = CsvHandoffReleaseNotesOperation;
export type CsvOperatorWalkthroughOptions =
  CsvOperatorAcceptanceChecklistOptions;
export type CsvOperatorWalkthroughStatus =
  CsvOperatorAcceptanceChecklistStatus;
export type CsvOperatorWalkthroughStatusCounts =
  CsvOperatorAcceptanceChecklistStatusCounts;

export type CsvOperatorWalkthroughReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvOperatorWalkthroughWriteFlags = {
  database: false;
  files: false;
  externalServices: false;
  exportHistory: false;
  scheduledDelivery: false;
  backgroundJobs: false;
  routingAssignments: false;
  importApply: false;
  bulkMutations: false;
  headerRemapping: false;
  salesforceSync: false;
};

export type CsvOperatorWalkthroughSourceFingerprint = {
  source:
    | "operator-fixture-bundle"
    | "handoff-release-notes"
    | "operator-acceptance-checklist";
  contentType: string;
  fingerprint: string;
};

export type CsvOperatorWalkthroughSource = {
  capabilityOperationCount: number;
  operatorFixtureContentType: typeof CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE;
  operatorFixtureBundleVersion: 1;
  operatorFixtureFingerprint: string;
  handoffReleaseNotesContentType:
    typeof CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE;
  handoffReleaseNotesPacketVersion: 1;
  handoffReleaseNotesFingerprint: string;
  acceptanceChecklistContentType:
    typeof CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE;
  acceptanceChecklistVersion: 1;
  acceptanceChecklistFingerprint: string;
  contractDriftFingerprint: string;
  sourceFingerprints: readonly CsvOperatorWalkthroughSourceFingerprint[];
};

export type CsvOperatorWalkthroughStepCode =
  | "capability-contract"
  | "template-or-export-contract"
  | "fixture-packet"
  | "release-note"
  | "acceptance-checklist"
  | "no-write-safety";

export type CsvOperatorWalkthroughStepSourceKind =
  | "csv-capability"
  | "import-template-example"
  | "export-contract"
  | "export-delivery-packet"
  | "import-dry-run-receipt"
  | "handoff-release-notes"
  | "operator-acceptance-checklist"
  | "no-write-flags";

export type CsvOperatorWalkthroughStep = {
  order: number;
  code: CsvOperatorWalkthroughStepCode;
  label: string;
  status: CsvOperatorWalkthroughStatus;
  required: true;
  sourceKind: CsvOperatorWalkthroughStepSourceKind;
  sourceFingerprint: string | null;
  sourceContentTypes: readonly string[];
  watchNotes: readonly string[];
  blockingNotes: readonly string[];
  read: CsvOperatorWalkthroughReadFlags;
  write: CsvOperatorWalkthroughWriteFlags;
};

export type CsvOperatorWalkthroughCapabilitySummary = {
  present: boolean;
  operation: CsvOperatorWalkthroughOperation;
  entity: CsvOperatorWalkthroughEntity;
  acceptsCsvInput: boolean;
  returnsCsv: boolean;
  filename: string | null;
  inputContentType: string | null;
  outputContentType: string | null;
  canonicalHeaderCount: number;
  requiredImportHeaderCount: number;
};

export type CsvOperatorWalkthroughTemplateSummary = {
  available: boolean;
  filename: string | null;
  exampleFilename: string | null;
  contentType: string | null;
  headerCount: number;
  requiredHeaderCount: number;
  exampleRowCount: number;
};

export type CsvOperatorWalkthroughItem = {
  id: string;
  entity: CsvOperatorWalkthroughEntity;
  label: string;
  route: string | null;
  operation: CsvOperatorWalkthroughOperation;
  status: CsvOperatorWalkthroughStatus;
  supported: boolean;
  fixture: CsvOperatorFixtureAvailability;
  capability: CsvOperatorWalkthroughCapabilitySummary;
  template: CsvOperatorWalkthroughTemplateSummary | null;
  stepCount: number;
  watchNoteCount: number;
  blockingNoteCount: number;
  steps: readonly CsvOperatorWalkthroughStep[];
  sourceContentTypes: readonly string[];
  read: CsvOperatorWalkthroughReadFlags;
  write: CsvOperatorWalkthroughWriteFlags;
};

export type CsvOperatorWalkthroughEntityManifest = {
  contentType: typeof CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE;
  manifestVersion: 1;
  entity: CsvOperatorWalkthroughEntity;
  label: string;
  route: string | null;
  direction: CsvOperatorAcceptanceEntityChecklist["direction"];
  status: CsvOperatorWalkthroughStatus;
  fingerprint: string;
  operationCount: number;
  supportedOperationCount: number;
  unsupportedOperationCount: number;
  fixtureOperationCount: number;
  walkthroughCount: number;
  stepCount: number;
  watchNoteCount: number;
  blockingNoteCount: number;
  statusCounts: CsvOperatorWalkthroughStatusCounts;
  items: readonly CsvOperatorWalkthroughItem[];
  source: CsvOperatorWalkthroughSource;
  sourceContentTypes: readonly string[];
  read: CsvOperatorWalkthroughReadFlags;
  write: CsvOperatorWalkthroughWriteFlags;
};

export type CsvOperatorWalkthroughOperationManifest = {
  contentType: typeof CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE;
  manifestVersion: 1;
  operation: CsvOperatorWalkthroughOperation;
  status: CsvOperatorWalkthroughStatus;
  fingerprint: string;
  entityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  fixtureEntityCount: number;
  walkthroughCount: number;
  stepCount: number;
  watchNoteCount: number;
  blockingNoteCount: number;
  statusCounts: CsvOperatorWalkthroughStatusCounts;
  items: readonly CsvOperatorWalkthroughItem[];
  source: CsvOperatorWalkthroughSource;
  sourceContentTypes: readonly string[];
  read: CsvOperatorWalkthroughReadFlags;
  write: CsvOperatorWalkthroughWriteFlags;
};

export type CsvOperatorWalkthroughManifest = {
  contentType: typeof CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE;
  manifestVersion: 1;
  status: CsvOperatorWalkthroughStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  walkthroughCount: number;
  supportedWalkthroughCount: number;
  unsupportedWalkthroughCount: number;
  fixtureWalkthroughCount: number;
  stepCount: number;
  watchNoteCount: number;
  blockingNoteCount: number;
  statusCounts: CsvOperatorWalkthroughStatusCounts;
  entityStatusCounts: CsvOperatorWalkthroughStatusCounts;
  operationStatusCounts: CsvOperatorWalkthroughStatusCounts;
  sourceFingerprints: readonly CsvOperatorWalkthroughSourceFingerprint[];
  sourceContentTypes: readonly string[];
  entities: readonly CsvOperatorWalkthroughEntityManifest[];
  operations: readonly CsvOperatorWalkthroughOperationManifest[];
  source: CsvOperatorWalkthroughSource;
  read: CsvOperatorWalkthroughReadFlags;
  write: CsvOperatorWalkthroughWriteFlags;
};

type ReadFlagInput = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput?: boolean;
};

type WriteFlagInput = {
  database: boolean;
  files?: boolean;
  externalServices: boolean;
  exportHistory?: boolean;
  scheduledDelivery?: boolean;
  backgroundJobs?: boolean;
  routingAssignments?: boolean;
  importApply?: boolean;
  bulkMutations?: boolean;
  headerRemapping?: boolean;
  salesforceSync?: boolean;
};

function noWrites(): CsvOperatorWalkthroughWriteFlags {
  return {
    database: false,
    files: false,
    externalServices: false,
    exportHistory: false,
    scheduledDelivery: false,
    backgroundJobs: false,
    routingAssignments: false,
    importApply: false,
    bulkMutations: false,
    headerRemapping: false,
    salesforceSync: false
  };
}

function metadataRead(): CsvOperatorWalkthroughReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function csvOutputRead(): CsvOperatorWalkthroughReadFlags {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: true
  };
}

function combineReads(
  reads: readonly ReadFlagInput[]
): CsvOperatorWalkthroughReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput === true)
  };
}

function hasWriteDrift(write: WriteFlagInput): boolean {
  return (
    write.database ||
    write.files === true ||
    write.externalServices ||
    write.exportHistory === true ||
    write.scheduledDelivery === true ||
    write.backgroundJobs === true ||
    write.routingAssignments === true ||
    write.importApply === true ||
    write.bulkMutations === true ||
    write.headerRemapping === true ||
    write.salesforceSync === true
  );
}

function uniqueStrings(
  values: readonly (string | null | undefined)[]
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (value !== null && value !== undefined && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

function emptyStatusCounts(): CsvOperatorWalkthroughStatusCounts {
  return {
    pass: 0,
    watch: 0,
    block: 0
  };
}

function countStatuses(
  values: readonly { status: CsvOperatorWalkthroughStatus }[]
): CsvOperatorWalkthroughStatusCounts {
  const counts = emptyStatusCounts();

  for (const value of values) {
    counts[value.status] += 1;
  }

  return counts;
}

function statusFromCounts(
  counts: CsvOperatorWalkthroughStatusCounts
): CsvOperatorWalkthroughStatus {
  if (counts.block > 0) {
    return "block";
  }

  return counts.watch > 0 ? "watch" : "pass";
}

function releaseStatusToWalkthroughStatus(
  status: CsvHandoffReleaseNotesEntityPacket["status"]
): CsvOperatorWalkthroughStatus {
  switch (status) {
    case "stable":
      return "pass";
    case "watch":
      return "watch";
    case "blocked":
      return "block";
  }
}

function stableSerialize(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
      return JSON.stringify(value);
    case "object": {
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort();

      return `{${keys
        .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
        .join(",")}}`;
    }
    default:
      return "null";
  }
}

function digestPayload(payload: unknown): string {
  return createHash("sha256").update(stableSerialize(payload)).digest("hex");
}

function buildSource(input: {
  fixture: CsvOperatorFixtureBundle;
  releaseNotes: CsvHandoffReleaseNotesPacket;
  acceptance: CsvOperatorAcceptanceChecklist;
}): CsvOperatorWalkthroughSource {
  const sourceFingerprints: CsvOperatorWalkthroughSourceFingerprint[] = [
    {
      source: "operator-fixture-bundle",
      contentType: input.fixture.contentType,
      fingerprint: input.fixture.fingerprint
    },
    {
      source: "handoff-release-notes",
      contentType: input.releaseNotes.contentType,
      fingerprint: input.releaseNotes.fingerprint
    },
    {
      source: "operator-acceptance-checklist",
      contentType: input.acceptance.contentType,
      fingerprint: input.acceptance.fingerprint
    }
  ];

  return {
    capabilityOperationCount: CSV_CAPABILITY_OPERATIONS.length,
    operatorFixtureContentType: input.fixture.contentType,
    operatorFixtureBundleVersion: input.fixture.bundleVersion,
    operatorFixtureFingerprint: input.fixture.fingerprint,
    handoffReleaseNotesContentType: input.releaseNotes.contentType,
    handoffReleaseNotesPacketVersion: input.releaseNotes.packetVersion,
    handoffReleaseNotesFingerprint: input.releaseNotes.fingerprint,
    acceptanceChecklistContentType: input.acceptance.contentType,
    acceptanceChecklistVersion: input.acceptance.checklistVersion,
    acceptanceChecklistFingerprint: input.acceptance.fingerprint,
    contractDriftFingerprint: input.acceptance.source.contractDriftFingerprint,
    sourceFingerprints
  };
}

function findFixtureEntity(
  fixture: CsvOperatorFixtureBundle,
  entity: CsvOperatorWalkthroughEntity
): CsvOperatorFixtureEntityBundle {
  const bundle = fixture.entities.find((entry) => entry.entity === entity);

  if (bundle === undefined) {
    throw new Error(`Missing CSV walkthrough fixture entity ${entity}`);
  }

  return bundle;
}

function findFixtureOperation(
  fixture: CsvOperatorFixtureBundle,
  operation: CsvOperatorWalkthroughOperation
): CsvOperatorFixtureOperationBundle {
  const bundle = fixture.operations.find(
    (entry) => entry.operation === operation
  );

  if (bundle === undefined) {
    throw new Error(`Missing CSV walkthrough fixture operation ${operation}`);
  }

  return bundle;
}

function findFixtureEntityOperation(input: {
  entity: CsvOperatorFixtureEntityBundle;
  operation: CsvOperatorWalkthroughOperation;
}): CsvOperatorFixtureEntityOperation {
  const operation = input.entity.operations.find(
    (entry) => entry.operation === input.operation
  );

  if (operation === undefined) {
    throw new Error(
      `Missing CSV walkthrough fixture operation ${input.operation} for ${input.entity.entity}`
    );
  }

  return operation;
}

function findReleaseEntity(
  releaseNotes: CsvHandoffReleaseNotesPacket,
  entity: CsvOperatorWalkthroughEntity
): CsvHandoffReleaseNotesEntityPacket {
  const packet = releaseNotes.entities.find((entry) => entry.entity === entity);

  if (packet === undefined) {
    throw new Error(`Missing CSV walkthrough release-note entity ${entity}`);
  }

  return packet;
}

function findReleaseOperation(
  releaseNotes: CsvHandoffReleaseNotesPacket,
  operation: CsvOperatorWalkthroughOperation
): CsvHandoffReleaseNotesOperationPacket {
  const packet = releaseNotes.operations.find(
    (entry) => entry.operation === operation
  );

  if (packet === undefined) {
    throw new Error(
      `Missing CSV walkthrough release-note operation ${operation}`
    );
  }

  return packet;
}

function findReleaseEntityOperation(input: {
  entity: CsvHandoffReleaseNotesEntityPacket;
  operation: CsvOperatorWalkthroughOperation;
}): CsvHandoffReleaseNotesEntityPacket["operations"][number] {
  const operation = input.entity.operations.find(
    (entry) => entry.operation === input.operation
  );

  if (operation === undefined) {
    throw new Error(
      `Missing CSV walkthrough release-note operation ${input.operation} for ${input.entity.entity}`
    );
  }

  return operation;
}

function summarizeCapability(
  capability: CsvCapability | null,
  item: CsvOperatorAcceptanceChecklistItem
): CsvOperatorWalkthroughCapabilitySummary {
  return {
    present: capability !== null,
    operation: item.operation,
    entity: item.entity,
    acceptsCsvInput: capability?.acceptsCsvInput ?? false,
    returnsCsv: capability?.returnsCsv ?? false,
    filename: capability?.filename ?? null,
    inputContentType: capability?.inputContentType ?? null,
    outputContentType: capability?.outputContentType ?? null,
    canonicalHeaderCount: capability?.canonicalHeaders.length ?? 0,
    requiredImportHeaderCount: capability?.requiredImportHeaders.length ?? 0
  };
}

function templateSummary(
  entity: CsvOperatorWalkthroughEntity
): {
  template: CsvImportTemplate;
  example: CsvImportTemplateExampleCsv;
  summary: CsvOperatorWalkthroughTemplateSummary;
} | null {
  if (!isCsvImportTemplateEntity(entity)) {
    return null;
  }

  const template = getCsvImportTemplate(entity);
  const example = exportCsvImportTemplateExampleCsv(entity);

  return {
    template,
    example,
    summary: {
      available: true,
      filename: template.filename,
      exampleFilename: example.filename,
      contentType: template.contentType,
      headerCount: template.headers.length,
      requiredHeaderCount: template.requiredHeaders.length,
      exampleRowCount: example.rowCount
    }
  };
}

function buildStep(input: {
  order: number;
  code: CsvOperatorWalkthroughStepCode;
  label: string;
  status: CsvOperatorWalkthroughStatus;
  sourceKind: CsvOperatorWalkthroughStepSourceKind;
  sourceFingerprint: string | null;
  sourceContentTypes: readonly string[];
  watchNotes?: readonly string[];
  blockingNotes?: readonly string[];
  read: CsvOperatorWalkthroughReadFlags;
}): CsvOperatorWalkthroughStep {
  return {
    order: input.order,
    code: input.code,
    label: input.label,
    status: input.status,
    required: true,
    sourceKind: input.sourceKind,
    sourceFingerprint: input.sourceFingerprint,
    sourceContentTypes: input.sourceContentTypes,
    watchNotes: input.watchNotes ?? [],
    blockingNotes: input.blockingNotes ?? [],
    read: input.read,
    write: noWrites()
  };
}

function capabilityStep(input: {
  item: CsvOperatorAcceptanceChecklistItem;
  capability: CsvCapability | null;
}): CsvOperatorWalkthroughStep {
  const status = input.item.supported && input.capability !== null ? "pass" : "block";

  return buildStep({
    order: 1,
    code: "capability-contract",
    label: "Confirm CSV capability contract",
    status,
    sourceKind: "csv-capability",
    sourceFingerprint: null,
    sourceContentTypes: uniqueStrings([
      input.capability?.inputContentType,
      input.capability?.outputContentType
    ]),
    blockingNotes:
      status === "block"
        ? [
            `${input.item.operation} is not supported for ${input.item.label} in the current CSV capability catalog.`
          ]
        : [],
    read: input.capability === null ? metadataRead() : combineReads([
      input.capability.read
    ])
  });
}

function contractStep(input: {
  item: CsvOperatorAcceptanceChecklistItem;
  capability: CsvCapability | null;
  template: ReturnType<typeof templateSummary>;
}): CsvOperatorWalkthroughStep {
  if (input.item.operation === "export") {
    const status =
      input.capability !== null && input.capability.returnsCsv ? "pass" : "block";

    return buildStep({
      order: 2,
      code: "template-or-export-contract",
      label: "Review export contract headers",
      status,
      sourceKind: "export-contract",
      sourceFingerprint: null,
      sourceContentTypes: uniqueStrings([input.capability?.outputContentType]),
      blockingNotes:
        status === "block"
          ? [`${input.item.label} export does not expose a CSV output contract.`]
          : [],
      read: input.capability === null ? metadataRead() : combineReads([
        input.capability.read
      ])
    });
  }

  const status = input.template === null ? "block" : "pass";

  return buildStep({
    order: 2,
    code: "template-or-export-contract",
    label: "Review import template and example row",
    status,
    sourceKind: "import-template-example",
    sourceFingerprint: null,
    sourceContentTypes:
      status === "pass" ? [CSV_IMPORT_TEMPLATE_CONTENT_TYPE] : [],
    blockingNotes:
      status === "block"
        ? [
            `${input.item.operation} does not have an import template/example for ${input.item.label}.`
          ]
        : [],
    read: status === "pass" ? csvOutputRead() : metadataRead()
  });
}

function fixtureStep(input: {
  item: CsvOperatorAcceptanceChecklistItem;
  fixtureEntity: CsvOperatorFixtureEntityBundle;
  fixtureOperation: CsvOperatorFixtureEntityOperation;
}): CsvOperatorWalkthroughStep {
  const status = input.item.fixture.available ? "pass" : "block";
  const unavailableReason = input.item.fixture.available
    ? null
    : input.item.fixture.reason;
  const sourceKind =
    input.item.fixture.kind === "export-delivery-packet"
      ? "export-delivery-packet"
      : "import-dry-run-receipt";

  return buildStep({
    order: 3,
    code: "fixture-packet",
    label: "Load the bounded operator fixture packet",
    status,
    sourceKind,
    sourceFingerprint: input.fixtureEntity.fingerprint,
    sourceContentTypes: input.fixtureOperation.handoff.sourceContentTypes,
    blockingNotes:
      status === "block"
        ? [
            `${input.item.operation} fixture is unavailable for ${input.item.label}: ${unavailableReason}.`
          ]
        : [],
    read: combineReads([input.fixtureOperation.read])
  });
}

function releaseNoteStep(input: {
  item: CsvOperatorAcceptanceChecklistItem;
  releaseEntity: CsvHandoffReleaseNotesEntityPacket;
  releaseOperation: CsvHandoffReleaseNotesEntityPacket["operations"][number];
}): CsvOperatorWalkthroughStep {
  const status = releaseStatusToWalkthroughStatus(input.releaseOperation.status);
  const notes =
    input.releaseOperation.warningCodes.length === 0 &&
    input.releaseOperation.sourceCodes.length === 0
      ? []
      : [
          `Release-note review carries warnings ${input.releaseOperation.warningCodes.join(", ") || "none"} and source codes ${input.releaseOperation.sourceCodes.join(", ") || "none"}.`
        ];

  return buildStep({
    order: 4,
    code: "release-note",
    label: "Review release-note status and source rollups",
    status,
    sourceKind: "handoff-release-notes",
    sourceFingerprint: input.releaseEntity.fingerprint,
    sourceContentTypes: input.releaseOperation.sourceContentTypes,
    watchNotes: status === "watch" ? notes : [],
    blockingNotes: status === "block" ? notes : [],
    read: combineReads([input.releaseOperation.read])
  });
}

function acceptanceStep(
  item: CsvOperatorAcceptanceChecklistItem
): CsvOperatorWalkthroughStep {
  const notes = [
    `Acceptance checklist has ${item.criteriaCounts.watch} watch criteria and ${item.criteriaCounts.block} block criteria.`
  ];

  return buildStep({
    order: 5,
    code: "acceptance-checklist",
    label: "Complete operator acceptance checklist",
    status: item.status,
    sourceKind: "operator-acceptance-checklist",
    sourceFingerprint: null,
    sourceContentTypes: item.sourceContentTypes,
    watchNotes: item.status === "watch" ? notes : [],
    blockingNotes: item.status === "block" ? notes : [],
    read: combineReads([item.read])
  });
}

function noWriteStep(input: {
  sources: readonly { source: string; write: WriteFlagInput }[];
}): CsvOperatorWalkthroughStep {
  const driftSources = input.sources
    .filter((source) => hasWriteDrift(source.write))
    .map((source) => source.source);

  return buildStep({
    order: 6,
    code: "no-write-safety",
    label: "Confirm no-write safety flags",
    status: driftSources.length === 0 ? "pass" : "block",
    sourceKind: "no-write-flags",
    sourceFingerprint: null,
    sourceContentTypes: [],
    blockingNotes: driftSources.map(
      (source) => `${source} reports a write-capable flag.`
    ),
    read: metadataRead()
  });
}

function buildWalkthroughItem(input: {
  item: CsvOperatorAcceptanceChecklistItem;
  fixtureEntity: CsvOperatorFixtureEntityBundle;
  releaseEntity: CsvHandoffReleaseNotesEntityPacket;
}): CsvOperatorWalkthroughItem {
  const capability = getCsvCapability(
    input.item.operation as CsvCapabilityOperation,
    input.item.entity
  );
  const template =
    input.item.operation === "export" ? null : templateSummary(input.item.entity);
  const fixtureOperation = findFixtureEntityOperation({
    entity: input.fixtureEntity,
    operation: input.item.operation
  });
  const releaseOperation = findReleaseEntityOperation({
    entity: input.releaseEntity,
    operation: input.item.operation
  });
  const steps = [
    capabilityStep({ item: input.item, capability }),
    contractStep({ item: input.item, capability, template }),
    fixtureStep({
      item: input.item,
      fixtureEntity: input.fixtureEntity,
      fixtureOperation
    }),
    releaseNoteStep({
      item: input.item,
      releaseEntity: input.releaseEntity,
      releaseOperation
    }),
    acceptanceStep(input.item),
    noWriteStep({
      sources: [
        {
          source: "csv-capability",
          write: capability?.write ?? noWrites()
        },
        {
          source: "operator-fixture",
          write: fixtureOperation.write
        },
        {
          source: "handoff-release-notes",
          write: releaseOperation.write
        },
        {
          source: "operator-acceptance-checklist",
          write: input.item.write
        }
      ]
    })
  ];
  const watchNoteCount = steps.reduce(
    (count, step) => count + step.watchNotes.length,
    0
  );
  const blockingNoteCount = steps.reduce(
    (count, step) => count + step.blockingNotes.length,
    0
  );

  return {
    id: input.item.id,
    entity: input.item.entity,
    label: input.item.label,
    route: input.item.route,
    operation: input.item.operation,
    status: statusFromCounts(countStatuses(steps)),
    supported: input.item.supported,
    fixture: input.item.fixture,
    capability: summarizeCapability(capability, input.item),
    template: template?.summary ?? null,
    stepCount: steps.length,
    watchNoteCount,
    blockingNoteCount,
    steps,
    sourceContentTypes: uniqueStrings([
      ...steps.flatMap((step) => step.sourceContentTypes),
      template?.template.contentType,
      template?.example.contentType
    ]),
    read: combineReads(steps.map((step) => step.read)),
    write: noWrites()
  };
}

function buildEntityFingerprint(input: {
  source: CsvOperatorWalkthroughSource;
  entity: CsvOperatorWalkthroughEntity;
  status: CsvOperatorWalkthroughStatus;
  items: readonly CsvOperatorWalkthroughItem[];
}): string {
  return digestPayload({
    source: input.source.sourceFingerprints,
    entity: input.entity,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      status: item.status,
      stepCount: item.stepCount,
      watchNoteCount: item.watchNoteCount,
      blockingNoteCount: item.blockingNoteCount,
      fixture: item.fixture
    }))
  });
}

function buildEntityManifest(input: {
  checklist: CsvOperatorAcceptanceEntityChecklist;
  fixture: CsvOperatorFixtureBundle;
  releaseNotes: CsvHandoffReleaseNotesPacket;
  source: CsvOperatorWalkthroughSource;
}): CsvOperatorWalkthroughEntityManifest {
  const fixtureEntity = findFixtureEntity(input.fixture, input.checklist.entity);
  const releaseEntity = findReleaseEntity(
    input.releaseNotes,
    input.checklist.entity
  );
  const items = input.checklist.items.map((item) =>
    buildWalkthroughItem({
      item,
      fixtureEntity,
      releaseEntity
    })
  );
  const statusCounts = countStatuses(items);
  const status = statusFromCounts(statusCounts);
  const stepCount = items.reduce((count, item) => count + item.stepCount, 0);
  const watchNoteCount = items.reduce(
    (count, item) => count + item.watchNoteCount,
    0
  );
  const blockingNoteCount = items.reduce(
    (count, item) => count + item.blockingNoteCount,
    0
  );
  const fingerprint = buildEntityFingerprint({
    source: input.source,
    entity: input.checklist.entity,
    status,
    items
  });

  return {
    contentType: CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
    manifestVersion: 1,
    entity: input.checklist.entity,
    label: input.checklist.label,
    route: input.checklist.route,
    direction: input.checklist.direction,
    status,
    fingerprint,
    operationCount: input.checklist.itemCount,
    supportedOperationCount: input.checklist.supportedItemCount,
    unsupportedOperationCount: input.checklist.unsupportedItemCount,
    fixtureOperationCount: input.checklist.fixtureItemCount,
    walkthroughCount: items.length,
    stepCount,
    watchNoteCount,
    blockingNoteCount,
    statusCounts,
    items,
    source: input.source,
    sourceContentTypes: uniqueStrings([
      input.checklist.contentType,
      releaseEntity.contentType,
      fixtureEntity.contentType,
      ...items.flatMap((item) => item.sourceContentTypes)
    ]),
    read: combineReads([
      input.checklist.read,
      releaseEntity.read,
      fixtureEntity.read,
      ...items.map((item) => item.read)
    ]),
    write: noWrites()
  };
}

function findEntityItem(input: {
  entity: CsvOperatorWalkthroughEntityManifest;
  operation: CsvOperatorWalkthroughOperation;
}): CsvOperatorWalkthroughItem {
  const item = input.entity.items.find(
    (candidate) => candidate.operation === input.operation
  );

  if (item === undefined) {
    throw new Error(
      `Missing CSV walkthrough operation ${input.operation} for ${input.entity.entity}`
    );
  }

  return item;
}

function buildOperationFingerprint(input: {
  source: CsvOperatorWalkthroughSource;
  operation: CsvOperatorWalkthroughOperation;
  status: CsvOperatorWalkthroughStatus;
  items: readonly CsvOperatorWalkthroughItem[];
}): string {
  return digestPayload({
    source: input.source.sourceFingerprints,
    operation: input.operation,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      entity: item.entity,
      status: item.status,
      stepCount: item.stepCount,
      watchNoteCount: item.watchNoteCount,
      blockingNoteCount: item.blockingNoteCount,
      fixture: item.fixture
    }))
  });
}

function buildOperationManifest(input: {
  checklist: CsvOperatorAcceptanceOperationChecklist;
  fixture: CsvOperatorFixtureBundle;
  releaseNotes: CsvHandoffReleaseNotesPacket;
  entityManifests: readonly CsvOperatorWalkthroughEntityManifest[];
  source: CsvOperatorWalkthroughSource;
}): CsvOperatorWalkthroughOperationManifest {
  const fixtureOperation = findFixtureOperation(
    input.fixture,
    input.checklist.operation
  );
  const releaseOperation = findReleaseOperation(
    input.releaseNotes,
    input.checklist.operation
  );
  const items = input.entityManifests.map((entity) =>
    findEntityItem({
      entity,
      operation: input.checklist.operation
    })
  );
  const statusCounts = countStatuses(items);
  const status = statusFromCounts(statusCounts);
  const stepCount = items.reduce((count, item) => count + item.stepCount, 0);
  const watchNoteCount = items.reduce(
    (count, item) => count + item.watchNoteCount,
    0
  );
  const blockingNoteCount = items.reduce(
    (count, item) => count + item.blockingNoteCount,
    0
  );
  const fingerprint = buildOperationFingerprint({
    source: input.source,
    operation: input.checklist.operation,
    status,
    items
  });

  return {
    contentType: CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
    manifestVersion: 1,
    operation: input.checklist.operation,
    status,
    fingerprint,
    entityCount: input.checklist.itemCount,
    supportedEntityCount: input.checklist.supportedItemCount,
    unsupportedEntityCount: input.checklist.unsupportedItemCount,
    fixtureEntityCount: input.checklist.fixtureItemCount,
    walkthroughCount: items.length,
    stepCount,
    watchNoteCount,
    blockingNoteCount,
    statusCounts,
    items,
    source: input.source,
    sourceContentTypes: uniqueStrings([
      input.checklist.contentType,
      releaseOperation.contentType,
      fixtureOperation.contentType,
      ...listCsvCapabilitiesByOperation(
        input.checklist.operation as CsvCapabilityOperation
      ).flatMap((capability) => [
        capability.inputContentType,
        capability.outputContentType
      ]),
      ...items.flatMap((item) => item.sourceContentTypes)
    ]),
    read: combineReads([
      input.checklist.read,
      releaseOperation.read,
      fixtureOperation.read,
      ...items.map((item) => item.read)
    ]),
    write: noWrites()
  };
}

function buildManifestFingerprint(input: {
  source: CsvOperatorWalkthroughSource;
  status: CsvOperatorWalkthroughStatus;
  entities: readonly CsvOperatorWalkthroughEntityManifest[];
  operations: readonly CsvOperatorWalkthroughOperationManifest[];
}): string {
  return digestPayload({
    source: input.source.sourceFingerprints,
    status: input.status,
    entities: input.entities.map((entity) => ({
      entity: entity.entity,
      status: entity.status,
      fingerprint: entity.fingerprint,
      statusCounts: entity.statusCounts,
      stepCount: entity.stepCount
    })),
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      fingerprint: operation.fingerprint,
      statusCounts: operation.statusCounts,
      stepCount: operation.stepCount
    }))
  });
}

export function isCsvOperatorWalkthroughEntity(
  value: string
): value is CsvOperatorWalkthroughEntity {
  return isCsvHandoffReleaseNotesEntity(value);
}

export function isCsvOperatorWalkthroughOperation(
  value: string
): value is CsvOperatorWalkthroughOperation {
  return isCsvHandoffReleaseNotesOperation(value);
}

export async function getCsvOperatorWalkthroughManifest(
  options: CsvOperatorWalkthroughOptions = {}
): Promise<CsvOperatorWalkthroughManifest> {
  const [fixture, releaseNotes, acceptance] = await Promise.all([
    getCsvOperatorFixtureBundle(options),
    getCsvHandoffReleaseNotesPacket(options),
    getCsvOperatorAcceptanceChecklist(options)
  ]);
  const source = buildSource({ fixture, releaseNotes, acceptance });
  const entities = acceptance.entities.map((checklist) =>
    buildEntityManifest({
      checklist,
      fixture,
      releaseNotes,
      source
    })
  );
  const operations = acceptance.operations.map((checklist) =>
    buildOperationManifest({
      checklist,
      fixture,
      releaseNotes,
      entityManifests: entities,
      source
    })
  );
  const allItems = entities.flatMap((entity) => entity.items);
  const statusCounts = countStatuses(allItems);
  const status = statusFromCounts(statusCounts);
  const stepCount = allItems.reduce((count, item) => count + item.stepCount, 0);
  const watchNoteCount = allItems.reduce(
    (count, item) => count + item.watchNoteCount,
    0
  );
  const blockingNoteCount = allItems.reduce(
    (count, item) => count + item.blockingNoteCount,
    0
  );
  const fingerprint = buildManifestFingerprint({
    source,
    status,
    entities,
    operations
  });

  return {
    contentType: CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
    manifestVersion: 1,
    status,
    fingerprint,
    entityCount: entities.length,
    operationCount: operations.length,
    walkthroughCount: allItems.length,
    supportedWalkthroughCount: allItems.filter((item) => item.supported).length,
    unsupportedWalkthroughCount: allItems.filter((item) => !item.supported)
      .length,
    fixtureWalkthroughCount: allItems.filter((item) => item.fixture.available)
      .length,
    stepCount,
    watchNoteCount,
    blockingNoteCount,
    statusCounts,
    entityStatusCounts: countStatuses(entities),
    operationStatusCounts: countStatuses(operations),
    sourceFingerprints: source.sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
      fixture.contentType,
      releaseNotes.contentType,
      acceptance.contentType,
      CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      ...fixture.sourceContentTypes,
      ...releaseNotes.sourceContentTypes,
      ...acceptance.sourceContentTypes,
      ...entities.flatMap((entity) => entity.sourceContentTypes),
      ...operations.flatMap((operation) => operation.sourceContentTypes)
    ]),
    entities,
    operations,
    source,
    read: combineReads([
      fixture.read,
      releaseNotes.read,
      acceptance.read,
      ...entities.map((entity) => entity.read),
      ...operations.map((operation) => operation.read)
    ]),
    write: noWrites()
  };
}

export async function listCsvOperatorWalkthroughEntityManifests(
  options: CsvOperatorWalkthroughOptions = {}
): Promise<CsvOperatorWalkthroughEntityManifest[]> {
  return (await getCsvOperatorWalkthroughManifest(options)).entities.slice();
}

export async function getCsvOperatorWalkthroughEntityManifest(
  entity: string,
  options: CsvOperatorWalkthroughOptions = {}
): Promise<CsvOperatorWalkthroughEntityManifest | null> {
  if (!isCsvOperatorWalkthroughEntity(entity)) {
    return null;
  }

  const manifest = await getCsvOperatorWalkthroughManifest(options);

  return manifest.entities.find((entry) => entry.entity === entity) ?? null;
}

export async function listCsvOperatorWalkthroughOperationManifests(
  options: CsvOperatorWalkthroughOptions = {}
): Promise<CsvOperatorWalkthroughOperationManifest[]> {
  return (await getCsvOperatorWalkthroughManifest(options)).operations.slice();
}

export async function getCsvOperatorWalkthroughOperationManifest(
  operation: string,
  options: CsvOperatorWalkthroughOptions = {}
): Promise<CsvOperatorWalkthroughOperationManifest | null> {
  if (!isCsvOperatorWalkthroughOperation(operation)) {
    return null;
  }

  const manifest = await getCsvOperatorWalkthroughManifest(options);

  return (
    manifest.operations.find((entry) => entry.operation === operation) ?? null
  );
}
