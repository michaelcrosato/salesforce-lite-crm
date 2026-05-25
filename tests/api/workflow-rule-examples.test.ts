import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  WORKFLOW_RULE_ACTIONS,
  WORKFLOW_RULE_CATALOG_VERSION,
  WORKFLOW_RULE_SUPPORTED_ENTITIES,
  WORKFLOW_RULE_TRIGGERS,
  getWorkflowRuleCatalog,
  getWorkflowRuleEntityCatalog
} from "@/lib/server/workflowRuleCatalog";
import {
  WORKFLOW_RULE_EXAMPLE_CONTENT_TYPE,
  WORKFLOW_RULE_EXAMPLE_VERSION,
  getWorkflowRuleExampleCatalog,
  getWorkflowRuleExampleContract,
  isWorkflowRuleExampleEntity,
  listWorkflowRuleExampleContracts,
  type WorkflowRuleExampleContract
} from "@/lib/server/workflowRuleExamples";
import { getWorkflowRuleReviewPacket } from "@/lib/server/workflowRuleReviewPackets";

const noWriteFlags = {
  database: false,
  workflowRules: false,
  crmRecords: false,
  auditEvents: false,
  routes: false,
  routeHandlers: false,
  productUi: false,
  schema: false,
  crmContract: false,
  files: false,
  externalServices: false,
  backgroundJobs: false,
  scheduledSweeps: false,
  actionExecution: false
};

describe("server workflow rule example contracts", () => {
  beforeEach(async () => {
    await cleanupWorkflowExampleFixtures();
    await createWorkflowExampleFixtures();
  });

  afterEach(async () => {
    await cleanupWorkflowExampleFixtures();
  });

  it("publishes deterministic example coverage for every supported workflow entity", () => {
    const workflowCatalog = getWorkflowRuleCatalog();
    const exampleCatalog = getWorkflowRuleExampleCatalog();
    const examples = listWorkflowRuleExampleContracts();

    expect(examples.map((example) => example.entity)).toEqual(
      WORKFLOW_RULE_SUPPORTED_ENTITIES
    );
    expect(exampleCatalog).toMatchObject({
      contentType: WORKFLOW_RULE_EXAMPLE_CONTENT_TYPE,
      catalogType: "workflow-rule-example-catalog",
      exampleVersion: WORKFLOW_RULE_EXAMPLE_VERSION,
      exampleCount: WORKFLOW_RULE_SUPPORTED_ENTITIES.length,
      entityCount: WORKFLOW_RULE_SUPPORTED_ENTITIES.length,
      triggerCount: WORKFLOW_RULE_TRIGGERS.length,
      conditionCount: workflowCatalog.conditionCount,
      actionCount: WORKFLOW_RULE_ACTIONS.length,
      read: {
        metadata: true,
        catalog: true,
        database: false,
        crmRecords: false,
        adapterInternals: false,
        runtimeEvaluation: false
      },
      write: noWriteFlags,
      safety: {
        deterministic: true,
        readOnly: true,
        exampleOnly: true,
        descriptorOnly: true,
        previewOnly: true,
        rulePersistence: false,
        scheduledExecution: false,
        actionExecution: false,
        externalAi: false,
        network: false,
        productUi: false,
        schemaChanges: false
      }
    });
    expect(exampleCatalog.coverage).toMatchObject({
      entities: WORKFLOW_RULE_SUPPORTED_ENTITIES,
      triggers: WORKFLOW_RULE_TRIGGERS,
      actions: WORKFLOW_RULE_ACTIONS,
      unsupportedEntitiesExcluded: [
        "dealer-orders",
        "areas",
        "activities",
        "knowledge-articles"
      ],
      unsupportedActionsExcluded: [
        "webhook",
        "external_ai_action",
        "salesforce_sync",
        "csv_import_apply",
        "arbitrary_javascript"
      ],
      excludedRoutes: [
        "/deals/[id]",
        "/search",
        "/command-palette",
        "/orders/new",
        "/orders/[id]/edit",
        "/areas/new",
        "/areas/[id]/edit"
      ]
    });
  });

  it("keeps examples catalog-backed for triggers, conditions, and descriptor actions", () => {
    for (const example of listWorkflowRuleExampleContracts()) {
      const entityCatalog = getWorkflowRuleEntityCatalog(example.entity);

      if (entityCatalog === null) {
        throw new Error(`Missing workflow catalog for ${example.entity}`);
      }

      expect(example.catalog.catalogVersion).toBe(WORKFLOW_RULE_CATALOG_VERSION);
      expect(example.catalog.availableTriggerKeys).toEqual(
        entityCatalog.triggers.map((trigger) => trigger.key)
      );
      expect(example.catalog.availableConditionKeys).toEqual(
        entityCatalog.conditions.map((condition) => condition.key)
      );
      expect(example.catalog.selectedConditionKeys).toEqual(
        example.catalog.availableConditionKeys
      );
      expect(example.catalog.availableActionKeys).toEqual(
        entityCatalog.actions.map((action) => action.action)
      );
      expect(example.catalog.selectedActionKeys).toEqual(
        example.catalog.availableActionKeys
      );
      expect(example.conditions.map((condition) => condition.condition)).toEqual(
        example.catalog.selectedConditionKeys
      );
      expect(example.actions.map((action) => action.action)).toEqual(
        example.catalog.selectedActionKeys
      );
      expect(example.actions.every((action) => action.mode === "descriptor_only"))
        .toBe(true);
      expect(example.actions.every((action) => action.externalDelivery === false))
        .toBe(true);
      expect(example.fixture.matchedConditionKeys).toEqual(
        example.catalog.selectedConditionKeys
      );
    }
  });

  it("validates each example through review packets without CRM, audit, or workflow writes", async () => {
    const countsBefore = await currentCounts();

    for (const example of listWorkflowRuleExampleContracts()) {
      const packet = await getWorkflowRuleReviewPacket(example.rule);

      expect(packet).toMatchObject({
        packetType: "workflow-rule-review-packet",
        generatedAt: example.rule.generatedAt,
        status: "ready",
        warningCount: 2,
        ruleMetadata: {
          entity: example.entity,
          trigger: example.trigger,
          selectedConditionCount: example.rule.conditions.length,
          selectedActionCount: example.rule.actions.length
        },
        affectedObjects: {
          entity: example.entity,
          matchedRecordCount: 1,
          returnedRecordCount: 1,
          returnedRecordIds: [example.fixture.recordId],
          truncated: false,
          scanTruncated: false
        },
        write: noWriteFlags,
        safety: {
          readOnly: true,
          previewOnly: true,
          reviewOnly: true,
          rulePersistence: false,
          scheduledExecution: false,
          actionExecution: false,
          externalAi: false,
          network: false,
          productUi: false,
          schemaChanges: false
        }
      });
      expect(packet.dryRun.matchedRecords).toEqual([
        {
          id: example.fixture.recordId,
          label: example.fixture.label,
          route: example.fixture.route,
          matchedConditionKeys: example.fixture.matchedConditionKeys,
          values: example.fixture.values
        }
      ]);
      expect(packet.dryRun.proposedActions.map((action) => action.action)).toEqual(
        example.catalog.selectedActionKeys
      );
      expect(
        packet.dryRun.proposedActions.every(
          (action) =>
            action.wouldMutate === false &&
            action.wouldCreateRecord === false &&
            action.wouldSendMessage === false &&
            action.wouldRecordAuditEvent === false &&
            action.wouldExecuteAction === false
        )
      ).toBe(true);
    }

    expect(await currentCounts()).toEqual(countsBefore);
  });

  it("excludes unsupported permanent non-goal surfaces from examples", () => {
    const catalog = getWorkflowRuleExampleCatalog();

    expect(isWorkflowRuleExampleEntity("accounts")).toBe(true);
    expect(isWorkflowRuleExampleEntity("dealer-orders")).toBe(false);
    expect(isWorkflowRuleExampleEntity("areas")).toBe(false);
    expect(isWorkflowRuleExampleEntity("knowledge-articles")).toBe(false);
    expect(isWorkflowRuleExampleEntity("activities")).toBe(false);

    expect(getWorkflowRuleExampleContract("dealer-orders")).toBeNull();
    expect(getWorkflowRuleExampleContract("areas")).toBeNull();
    expect(getWorkflowRuleExampleContract("knowledge-articles")).toBeNull();

    for (const route of catalog.coverage.excludedRoutes) {
      expect(catalog.source.routeScope).not.toContain(route);
      expect(catalog.examples.some((example) => example.route === route)).toBe(
        false
      );
      expect(
        catalog.examples.some((example) => example.fixture.route.includes(route))
      ).toBe(false);
    }

    expect(catalog.source.routeScope).not.toContain("/search");
    expect(catalog.source.routeScope).not.toContain("/command-palette");
    expect(catalog.source.routeScope).not.toContain("/deals/[id]");
    expect(catalog.write).toEqual(noWriteFlags);
  });
});

async function createWorkflowExampleFixtures() {
  const account = requireExample("accounts");
  const contact = requireExample("contacts");
  const opportunity = requireExample("opportunities");
  const lead = requireExample("leads");
  const task = requireExample("tasks");
  const crmCase = requireExample("cases");
  const campaign = requireExample("campaigns");

  await prisma.user.create({
    data: {
      id: stringValue(account, "ownerId"),
      name: "Workflow Example Owner",
      email: "workflow.example.owner@example.test"
    }
  });
  await prisma.account.create({
    data: {
      id: account.fixture.recordId,
      name: stringValue(account, "name"),
      domain: stringValue(account, "domain"),
      industry: stringValue(account, "industry"),
      city: stringValue(account, "city"),
      region: stringValue(account, "region"),
      status: stringValue(account, "status"),
      ownerId: stringValue(account, "ownerId"),
      healthScore: numberValue(account, "healthScore")
    }
  });
  await prisma.contact.create({
    data: {
      id: contact.fixture.recordId,
      accountId: stringValue(contact, "accountId"),
      firstName: stringValue(contact, "firstName"),
      lastName: stringValue(contact, "lastName"),
      email: stringValue(contact, "email"),
      phone: stringValue(contact, "phone"),
      title: stringValue(contact, "title"),
      status: stringValue(contact, "status")
    }
  });
  await prisma.deal.create({
    data: {
      id: opportunity.fixture.recordId,
      accountId: stringValue(opportunity, "accountId"),
      contactId: contact.fixture.recordId,
      ownerId: stringValue(opportunity, "ownerId"),
      name: opportunity.fixture.label,
      stage: stringValue(opportunity, "stage"),
      value: numberValue(opportunity, "value"),
      probability: 40,
      expectedCloseDate: new Date(stringValue(opportunity, "expectedCloseDate"))
    }
  });
  await prisma.lead.create({
    data: {
      id: lead.fixture.recordId,
      firstName: stringValue(lead, "firstName"),
      lastName: stringValue(lead, "lastName"),
      email: stringValue(lead, "email"),
      phone: stringValue(lead, "phone"),
      postalCode: stringValue(lead, "postalCode"),
      source: stringValue(lead, "source"),
      status: stringValue(lead, "status"),
      assignmentReason: stringValue(lead, "assignmentReason")
    }
  });
  await prisma.task.create({
    data: {
      id: task.fixture.recordId,
      title: task.fixture.label,
      status: stringValue(task, "status"),
      priority: stringValue(task, "priority"),
      dueDate: new Date(stringValue(task, "dueDate")),
      ownerId: stringValue(task, "ownerId")
    }
  });
  await prisma.case.create({
    data: {
      id: crmCase.fixture.recordId,
      subject: crmCase.fixture.label,
      status: stringValue(crmCase, "status"),
      priority: stringValue(crmCase, "priority"),
      queueKey: stringValue(crmCase, "queueKey"),
      ownerId: stringValue(crmCase, "ownerId"),
      accountId: stringValue(crmCase, "accountId")
    }
  });
  await prisma.campaign.create({
    data: {
      id: campaign.fixture.recordId,
      name: campaign.fixture.label,
      status: stringValue(campaign, "status"),
      startDate: new Date(stringValue(campaign, "startDate")),
      endDate: new Date(stringValue(campaign, "endDate")),
      budget: numberValue(campaign, "budget"),
      ownerId: stringValue(campaign, "ownerId")
    }
  });
}

async function cleanupWorkflowExampleFixtures() {
  const examples = listWorkflowRuleExampleContracts();
  const fixtureIds = examples.map((example) => example.fixture.recordId);
  const ownerIds = examples.flatMap((example) =>
    example.fixture.values
      .filter((value) => value.fieldPath.join(".") === "ownerId")
      .map((value) => value.value)
      .filter((value): value is string => typeof value === "string")
  );

  await prisma.campaign.deleteMany({ where: { id: { in: fixtureIds } } });
  await prisma.case.deleteMany({ where: { id: { in: fixtureIds } } });
  await prisma.task.deleteMany({ where: { id: { in: fixtureIds } } });
  await prisma.lead.deleteMany({ where: { id: { in: fixtureIds } } });
  await prisma.deal.deleteMany({ where: { id: { in: fixtureIds } } });
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { id: { in: fixtureIds } },
        { email: "workflow.example.contact@example.test" }
      ]
    }
  });
  await prisma.account.deleteMany({ where: { id: { in: fixtureIds } } });
  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { in: ownerIds } },
        { email: "workflow.example.owner@example.test" }
      ]
    }
  });
}

async function currentCounts() {
  const [users, accounts, contacts, deals, leads, tasks, cases, campaigns, auditEvents] =
    await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.contact.count(),
      prisma.deal.count(),
      prisma.lead.count(),
      prisma.task.count(),
      prisma.case.count(),
      prisma.campaign.count(),
      prisma.auditEvent.count()
    ]);

  return {
    users,
    accounts,
    contacts,
    deals,
    leads,
    tasks,
    cases,
    campaigns,
    auditEvents
  };
}

function requireExample(entity: string): WorkflowRuleExampleContract {
  const example = getWorkflowRuleExampleContract(entity);

  if (example === null) {
    throw new Error(`Expected workflow example for ${entity}`);
  }

  return example;
}

function fieldValue(
  example: WorkflowRuleExampleContract,
  fieldPath: string
): string | number | null {
  const value = example.fixture.values.find(
    (candidate) => candidate.fieldPath.join(".") === fieldPath
  );

  if (value === undefined) {
    throw new Error(`Expected fixture field ${fieldPath} for ${example.entity}`);
  }

  return value.value;
}

function stringValue(
  example: WorkflowRuleExampleContract,
  fieldPath: string
): string {
  const value = fieldValue(example, fieldPath);

  if (typeof value !== "string") {
    throw new Error(`Expected string fixture field ${fieldPath}`);
  }

  return value;
}

function numberValue(
  example: WorkflowRuleExampleContract,
  fieldPath: string
): number {
  const value = fieldValue(example, fieldPath);

  if (typeof value !== "number") {
    throw new Error(`Expected number fixture field ${fieldPath}`);
  }

  return value;
}
