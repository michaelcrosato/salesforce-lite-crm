import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_APPLY_CAPABILITY_CONTENT_TYPE,
  CSV_IMPORT_APPLY_CAPABILITY_VERSION,
  CSV_IMPORT_APPLY_ROW_ACTIONS,
  getCsvImportApplyActionCapability,
  getCsvImportApplyCapabilityMatrix,
  getCsvImportApplyEntityCapability,
  type CsvImportApplyActionCapability,
  type CsvImportApplyEntityActionCapability
} from "@/lib/server/csvImportApplyCapabilities";

const readFlags = {
  metadata: true,
  database: false,
  csvInput: false,
  previewContracts: true,
  readinessContracts: true,
  actionSummaryContracts: true
};

const noWriteFlags = {
  database: false,
  contacts: false,
  leads: false,
  auditEvents: false,
  routingAssignments: false,
  files: false,
  externalServices: false,
  backgroundJobs: false,
  importApply: false,
  updates: false,
  upserts: false,
  duplicateMerge: false,
  salesforce: false,
  routes: false,
  productUi: false,
  schema: false,
  crmContract: false
};

describe("server CSV import apply capabilities", () => {
  it("publishes deterministic root metadata for contact import apply planning", () => {
    const matrix = getCsvImportApplyCapabilityMatrix();

    expect(matrix).toMatchObject({
      contentType: CSV_IMPORT_APPLY_CAPABILITY_CONTENT_TYPE,
      matrixType: "csv-import-apply-capability-matrix",
      matrixVersion: CSV_IMPORT_APPLY_CAPABILITY_VERSION,
      entityCount: 2,
      rowActionCount: 3,
      entityActionCount: 6,
      supportedEntityActionCount: 1,
      blockedEntityActionCount: 5,
      supportedRowActionCount: 0,
      blockedRowActionCount: 2,
      manualExecutorPathCount: 1,
      source: {
        previewEntities: CSV_IMPORT_PREVIEW_ENTITIES,
        previewModule: "lib/server/csvImportPreview.ts",
        preflightModule: "lib/server/csvImportPreflight.ts",
        capabilityScope: "csv-contact-import-manual-apply-capability-matrix",
        routeScope: ["/contacts", "/leads"]
      },
      read: readFlags,
      write: noWriteFlags,
      safety: {
        deterministic: true,
        readOnly: true,
        descriptorOnly: true,
        metadataOnly: true,
        currentApply: false,
        operatorApprovalRequiredBeforeWrites: true,
        contactsOnly: true,
        createsOnly: true,
        leadApply: false,
        leadRouting: false,
        updates: false,
        upserts: false,
        duplicateMerge: false,
        fileStorage: false,
        salesforceIntegration: false,
        externalAi: false,
        network: false,
        externalServices: false,
        routeHandlers: false,
        productUi: false,
        crmContractChanges: false,
        schemaChanges: false
      }
    });
    expect(matrix.entities.map((entity) => entity.entity)).toEqual(
      CSV_IMPORT_PREVIEW_ENTITIES
    );
    expect(matrix.actions.map((action) => action.rowAction)).toEqual(
      CSV_IMPORT_APPLY_ROW_ACTIONS
    );
    expect(matrix.nonGoalExclusions.map((reason) => reason.code)).toEqual([
      "lead_import_apply_excluded",
      "lead_routing_excluded",
      "contact_update_upsert_excluded",
      "duplicate_merge_excluded",
      "file_storage_excluded",
      "salesforce_integration_excluded"
    ]);
  });

  it("maps current preflight row actions to manual contact-create eligibility", () => {
    const contactCreate = requireEntityActionCapability(
      "contacts",
      "create_candidate"
    );
    const contactReview = requireEntityActionCapability(
      "contacts",
      "review_candidate"
    );
    const contactBlocked = requireEntityActionCapability("contacts", "blocked");
    const leadCreate = requireEntityActionCapability("leads", "create_candidate");
    const createAction = requireActionCapability("create_candidate");
    const reviewAction = requireActionCapability("review_candidate");

    expect(contactCreate).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      rowAction: "create_candidate",
      status: "supported",
      applyOperation: "create_contact",
      manualExecutorPath: "lib/crm/crmClient.ts#createContact",
      blockedReasons: [],
      currentApplyAllowed: false,
      futureManualApplyEligible: true,
      operatorApprovalRequired: true,
      supportedReadinessStatuses: ["ready"],
      sourceAction: {
        readinessStatus: "ready",
        previewCanProceed: true,
        previewRequiresReview: false
      }
    });
    expect(contactReview).toMatchObject({
      status: "blocked",
      applyOperation: null,
      manualExecutorPath: null,
      futureManualApplyEligible: false,
      sourceAction: {
        readinessStatus: "needs_review",
        previewCanProceed: true,
        previewRequiresReview: true
      }
    });
    expect(contactReview.blockedReasons.map((reason) => reason.code)).toEqual([
      "contact_review_candidate_not_create_safe",
      "contact_update_upsert_excluded",
      "duplicate_merge_excluded"
    ]);
    expect(contactBlocked).toMatchObject({
      status: "blocked",
      sourceAction: {
        readinessStatus: "blocked",
        previewCanProceed: false,
        previewRequiresReview: true
      }
    });
    expect(contactBlocked.blockedReasons.map((reason) => reason.code)).toEqual([
      "contact_row_blocked_by_validation"
    ]);
    expect(leadCreate).toMatchObject({
      entity: "leads",
      route: "/leads",
      status: "blocked",
      applyOperation: null,
      manualExecutorPath: null,
      futureManualApplyEligible: false
    });
    expect(leadCreate.blockedReasons.map((reason) => reason.code)).toEqual([
      "lead_import_apply_excluded",
      "lead_routing_excluded"
    ]);
    expect(createAction).toMatchObject({
      rowAction: "create_candidate",
      status: "partial",
      supportedEntityCount: 1,
      blockedEntityCount: 1,
      manualExecutorPaths: ["lib/crm/crmClient.ts#createContact"]
    });
    expect(createAction.blockedReasons.map((reason) => reason.code)).toEqual([
      "lead_import_apply_excluded",
      "lead_routing_excluded"
    ]);
    expect(reviewAction).toMatchObject({
      rowAction: "review_candidate",
      status: "blocked",
      supportedEntityCount: 0,
      blockedEntityCount: 2,
      manualExecutorPaths: []
    });
  });

  it("stays strict, no-write, and excludes non-goal surfaces", async () => {
    const countsBefore = await currentCounts();
    const matrix = getCsvImportApplyCapabilityMatrix();

    expect(() =>
      getCsvImportApplyCapabilityMatrix({ apply: true })
    ).toThrow("Unrecognized key(s) in object: 'apply'");
    expect(getCsvImportApplyEntityCapability("accounts")).toBeNull();
    expect(getCsvImportApplyEntityCapability("opportunities")).toBeNull();
    expect(
      getCsvImportApplyActionCapability("contacts", "update_candidate")
    ).toBeNull();
    expect(getCsvImportApplyActionCapability("leads", "routing")).toBeNull();
    expect(matrix.source.routeScope).not.toContain("/search");
    expect(matrix.source.routeScope).not.toContain("/command-palette");
    expect(matrix.source.routeScope).not.toContain("/deals/[id]");
    expect(
      matrix.source.routeScope.some((route) => route.includes("/deals/[id]"))
    ).toBe(false);

    for (const entity of matrix.entities) {
      expect(entity.write).toEqual(noWriteFlags);
      expect(entity.safety).toMatchObject({
        readOnly: true,
        descriptorOnly: true,
        metadataOnly: true,
        currentApply: false,
        contactsOnly: true,
        createsOnly: true,
        leadApply: false,
        leadRouting: false,
        updates: false,
        upserts: false,
        duplicateMerge: false,
        fileStorage: false,
        salesforceIntegration: false,
        externalAi: false,
        network: false,
        productUi: false,
        crmContractChanges: false,
        schemaChanges: false
      });
    }
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function requireEntityActionCapability(
  entity: string,
  rowAction: string
): CsvImportApplyEntityActionCapability {
  const capability = getCsvImportApplyActionCapability(entity, rowAction);

  if (capability === null) {
    throw new Error(`Expected ${entity} CSV import apply action ${rowAction}`);
  }

  return capability;
}

function requireActionCapability(
  rowAction: string
): CsvImportApplyActionCapability {
  const capability = getCsvImportApplyCapabilityMatrix().actions.find(
    (candidate) => candidate.rowAction === rowAction
  );

  if (capability === undefined) {
    throw new Error(`Expected CSV import apply action ${rowAction}`);
  }

  return capability;
}

async function currentCounts() {
  const [contacts, leads, auditEvents] = await Promise.all([
    prisma.contact.count(),
    prisma.lead.count(),
    prisma.auditEvent.count()
  ]);

  return {
    contacts,
    leads,
    auditEvents
  };
}
