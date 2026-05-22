import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CSV_EXPORT_CONTENT_TYPE,
  CSV_EXPORT_DEFAULT_LIMIT,
  CSV_EXPORT_ENTITIES,
  CSV_EXPORT_MAX_LIMIT
} from "@/lib/server/csvExport";
import {
  getCsvExportDeliveryPacket,
  getCsvExportDeliveryPacketDefinition,
  isCsvExportDeliveryPacketEntity,
  listCsvExportDeliveryPacketDefinitions,
  listCsvExportDeliveryPackets
} from "@/lib/server/csvExportDeliveryPackets";
import { getCsvExportReviewBundleDefinition } from "@/lib/server/csvExportReviewBundles";
import { prisma } from "@/lib/prisma";

const accountId = "test-csv-export-delivery-account";
const contactId = "test-csv-export-delivery-contact";
const secondContactId = "test-csv-export-delivery-contact-2";

describe("server CSV export delivery packets", () => {
  beforeEach(async () => {
    await cleanupCsvExportDeliveryFixtures();
    await createCsvExportDeliveryFixtures();
  });

  afterEach(async () => {
    await cleanupCsvExportDeliveryFixtures();
  });

  it("publishes a delivery packet definition for every export entity", () => {
    const definitions = listCsvExportDeliveryPacketDefinitions();
    const contactDefinition = getCsvExportDeliveryPacketDefinition("contacts");
    const reviewDefinition = getCsvExportReviewBundleDefinition("contacts");

    expect(definitions.map((definition) => definition.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(definitions.every((definition) => definition.columns.length > 0)).toBe(true);
    expect(contactDefinition).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      filename: "contacts.csv",
      contentType: CSV_EXPORT_CONTENT_TYPE,
      defaultExportLimit: CSV_EXPORT_DEFAULT_LIMIT,
      maxExportLimit: CSV_EXPORT_MAX_LIMIT
    });
    expect(contactDefinition).toEqual(reviewDefinition);
  });

  it("detects supported export delivery packet entity ids", () => {
    expect(isCsvExportDeliveryPacketEntity("contacts")).toBe(true);
    expect(isCsvExportDeliveryPacketEntity("dealer-orders")).toBe(true);
    expect(isCsvExportDeliveryPacketEntity("import-receipts")).toBe(false);
  });

  it("combines generated CSV, row counts, limits, review notes, and no-write flags", async () => {
    const contactRowCountBefore = await prisma.contact.count();
    const packet = await getCsvExportDeliveryPacket("contacts", { limit: 1 });
    const contactRowCountAfter = await prisma.contact.count();

    expect(contactRowCountAfter).toBe(contactRowCountBefore);
    expect(packet).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      filename: "contacts.csv",
      contentType: CSV_EXPORT_CONTENT_TYPE,
      rowCount: 1,
      totalAvailableRows: contactRowCountBefore,
      limits: {
        requestedLimit: 1,
        appliedLimit: 1,
        defaultLimit: CSV_EXPORT_DEFAULT_LIMIT,
        maxLimit: CSV_EXPORT_MAX_LIMIT,
        truncatedByLimit: contactRowCountBefore > 1
      },
      write: {
        database: false,
        files: false,
        externalServices: false,
        exportHistory: false,
        scheduledDelivery: false,
        backgroundJobs: false
      }
    });
    expect(packet.csv).toContain(
      "Contact ID,First Name,Last Name,Email,Phone,Title,Status,Account ID,Account Name,Created At,Updated At"
    );
    expect(packet.csv).toContain(
      `${contactId},Csv,000 Delivery,csv.export.delivery@example.test,,Buyer,active,${accountId},CSV Export Delivery Account`
    );
    expect(packet.review.preflight.rowCount).toBe(contactRowCountBefore);
    expect(packet.review.preview.previewLimit).toBe(1);
    expect(packet.notes).toBe(packet.review.notes);
    expect(packet.notes.map((note) => note.code)).toContain("preview-truncated");
  });

  it("can produce a header-only packet without writing rows", async () => {
    const packet = await getCsvExportDeliveryPacket("accounts", { limit: 0 });

    expect(packet.rowCount).toBe(0);
    expect(packet.limits).toMatchObject({
      requestedLimit: 0,
      appliedLimit: 0,
      truncatedByLimit: packet.totalAvailableRows > 0
    });
    expect(packet.csv).toBe(
      "Account ID,Name,Domain,Industry,City,Region,Status,Health Score,Owner ID,Owner Name,Owner Email,Created At,Updated At\n"
    );
    expect(packet.write.files).toBe(false);
  });

  it("lists bounded delivery packets for all export entities", async () => {
    const packets = await listCsvExportDeliveryPackets({ limit: 999_999 });

    expect(packets.map((packet) => packet.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(packets.every((packet) => packet.limits.requestedLimit === 999_999)).toBe(true);
    expect(packets.every((packet) => packet.limits.appliedLimit === CSV_EXPORT_MAX_LIMIT)).toBe(
      true
    );
    expect(packets.every((packet) => packet.rowCount <= packet.limits.appliedLimit)).toBe(true);
    expect(
      packets.every(
        (packet) =>
          packet.write.database === false &&
          packet.write.files === false &&
          packet.write.externalServices === false &&
          packet.write.exportHistory === false &&
          packet.write.scheduledDelivery === false &&
          packet.write.backgroundJobs === false
      )
    ).toBe(true);
  });
});

async function createCsvExportDeliveryFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "CSV Export Delivery Account",
      status: "active",
      healthScore: 93,
      createdAt: new Date("2026-05-05T10:00:00Z"),
      updatedAt: new Date("2026-05-05T10:00:00Z")
    }
  });
  await prisma.contact.createMany({
    data: [
      {
        id: contactId,
        accountId,
        firstName: "Csv",
        lastName: "000 Delivery",
        email: "csv.export.delivery@example.test",
        title: "Buyer",
        status: "active",
        createdAt: new Date("2026-05-06T10:00:00Z"),
        updatedAt: new Date("2026-05-06T10:00:00Z")
      },
      {
        id: secondContactId,
        accountId,
        firstName: "Csv",
        lastName: "001 Delivery",
        email: "csv.export.delivery.2@example.test",
        title: "Buyer",
        status: "active",
        createdAt: new Date("2026-05-06T11:00:00Z"),
        updatedAt: new Date("2026-05-06T11:00:00Z")
      }
    ]
  });
}

async function cleanupCsvExportDeliveryFixtures() {
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { id: contactId },
        { id: secondContactId },
        { email: "csv.export.delivery@example.test" },
        { email: "csv.export.delivery.2@example.test" }
      ]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: accountId
    }
  });
}
