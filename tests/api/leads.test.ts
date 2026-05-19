import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getRoutingDecisionForLead } from "@/lib/services/leads";
import { prisma } from "@/lib/prisma";

const testLeadId = "test-lead-routing-1";
const testAreaId = "test-area-routing-1";
const testOrderId = "test-order-routing-1";

describe("leads service - getRoutingDecisionForLead", () => {
  beforeEach(async () => {
    await cleanup();
    
    // Create necessary area and dealer order
    await prisma.area.create({
      data: {
        id: testAreaId,
        name: "Test Routing Area",
        postalPrefixes: "V5K"
      }
    });

    // We must create an account for DealerOrder
    await prisma.account.create({
      data: {
        id: "test-account-routing-1",
        name: "Test Account Routing",
        status: "active",
        healthScore: 100
      }
    });

    await prisma.dealerOrder.create({
      data: {
        id: testOrderId,
        name: "Test Dealer Order",
        accountId: "test-account-routing-1",
        monthlyQuota: 10,
        status: "active",
        startDate: new Date()
      }
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  it("returns null if no routing event exists", async () => {
    await createTestLead({ id: testLeadId });
    const decision = await getRoutingDecisionForLead(testLeadId);
    expect(decision).toBeNull();
  });

  it("returns routing decision from fallback summary", async () => {
    await createTestLead({ id: testLeadId, areaId: testAreaId, assignedOrderId: testOrderId, postalCode: "V5K 1A1" });
    
    await prisma.activity.create({
      data: {
        id: "routing-activity-1",
        leadId: testLeadId,
        type: "routing_event",
        title: "Lead Routed",
        summary: "Routed to Test Dealer Order (pace gap 2.5)"
      }
    });

    const decision = await getRoutingDecisionForLead(testLeadId);
    expect(decision).not.toBeNull();
    expect(decision?.leadId).toBe(testLeadId);
    expect(decision?.normalizedPostal).toBe("V5K 1A1");
    expect(decision?.prefix).toBe("V5K");
    expect(decision?.matchedAreaId).toBe(testAreaId);
    expect(decision?.matchedAreaName).toBe("Test Routing Area");
    expect(decision?.selectedOrderId).toBe(testOrderId);
    expect(decision?.candidateOrders).toHaveLength(1);
    expect(decision?.candidateOrders[0].paceGap).toBe(2.5);
    expect(decision?.candidateOrders[0].dealerName).toBe("Test Dealer Order");
  });

  it("parses valid JSON routing payload steps", async () => {
    await createTestLead({ id: testLeadId, areaId: testAreaId, postalCode: "90210" });
    
    const payload = {
      summary: "Routed via explicit JSON",
      steps: [
        {
          step: "rank_pace_gap",
          result: [
            {
              orderId: testOrderId,
              dealerName: "Test JSON Order",
              paceGap: 5.0,
              rank: 1
            }
          ]
        }
      ]
    };

    await prisma.activity.create({
      data: {
        id: "routing-activity-2",
        leadId: testLeadId,
        type: "routing_event",
        title: "Lead Routed JSON",
        summary: "Fallback text",
        rawText: JSON.stringify(payload)
      }
    });

    const decision = await getRoutingDecisionForLead(testLeadId);
    expect(decision).not.toBeNull();
    expect(decision?.summary).toBe("Routed via explicit JSON");
    expect(decision?.normalizedPostal).toBe("90210");
    expect(decision?.prefix).toBe("90210");
    expect(decision?.candidateOrders).toHaveLength(1);
    expect(decision?.candidateOrders[0].dealerName).toBe("Test JSON Order");
    expect(decision?.candidateOrders[0].paceGap).toBe(5);
  });
  
  it("resolves US zip codes correctly", async () => {
    await createTestLead({ id: testLeadId, postalCode: "10001-1234" });
    
    await prisma.activity.create({
      data: {
        id: "routing-activity-3",
        leadId: testLeadId,
        type: "routing_event",
        title: "Lead Routed US",
        summary: "US Zip Code routing"
      }
    });

    const decision = await getRoutingDecisionForLead(testLeadId);
    expect(decision?.prefix).toBe("10001");
  });
});

async function createTestLead(data: any) {
  await prisma.lead.create({
    data: {
      id: data.id,
      firstName: "Routing",
      lastName: "Test",
      status: "new",
      postalCode: data.postalCode || "V5K 0A1",
      areaId: data.areaId || null,
      assignedOrderId: data.assignedOrderId || null
    }
  });
}

async function cleanup() {
  await prisma.activity.deleteMany({
    where: {
      leadId: testLeadId
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: testLeadId
    }
  });
  await prisma.dealerOrder.deleteMany({
    where: {
      id: testOrderId
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: "test-account-routing-1"
    }
  });
  await prisma.area.deleteMany({
    where: {
      id: testAreaId
    }
  });
}
