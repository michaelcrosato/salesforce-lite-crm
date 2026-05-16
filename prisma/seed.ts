import { deterministicActivitySummarizer } from "../lib/ai/activitySummarizer";
import { probabilityForStage } from "../lib/business/deals";
import { prisma } from "../lib/prisma";

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function daysAgo(days: number) {
  return daysFromNow(-days);
}

const users = [
  {
    id: "user-ava",
    name: "Ava Patel",
    email: "ava.patel@salesforcelite.local",
    role: "sales"
  },
  {
    id: "user-marcus",
    name: "Marcus Chen",
    email: "marcus.chen@salesforcelite.local",
    role: "sales"
  },
  {
    id: "user-elena",
    name: "Elena Ramirez",
    email: "elena.ramirez@salesforcelite.local",
    role: "manager"
  }
];

const accounts = [
  ["acct-northstar", "Northstar Freight", "northstarfreight.example", "Logistics", "Denver", "CO", "active", "user-ava", 82],
  ["acct-luma", "Luma Health Systems", "lumahealth.example", "Healthcare", "Austin", "TX", "active", "user-marcus", 73],
  ["acct-cascade", "Cascade Robotics", "cascaderobotics.example", "Manufacturing", "Portland", "OR", "active", "user-ava", 91],
  ["acct-harbor", "Harborline Finance", "harborline.example", "Financial Services", "Chicago", "IL", "paused", "user-elena", 58],
  ["acct-orbit", "Orbit Retail Group", "orbitretail.example", "Retail", "Seattle", "WA", "active", "user-marcus", 67],
  ["acct-zenith", "Zenith BioWorks", "zenithbioworks.example", "Biotech", "Boston", "MA", "active", "user-elena", 88],
  ["acct-summit", "Summit Grid Energy", "summitgrid.example", "Energy", "Phoenix", "AZ", "active", "user-ava", 49],
  ["acct-evergreen", "Evergreen Studio Network", "evergreenstudio.example", "Media", "Los Angeles", "CA", "churned", "user-marcus", 35],
  ["acct-apex", "Apex Cloud Kitchens", "apexkitchens.example", "Hospitality", "Atlanta", "GA", "active", "user-elena", 77],
  ["acct-riverbend", "Riverbend Analytics", "riverbendanalytics.example", "Software", "Raleigh", "NC", "paused", "user-ava", 54]
] as const;

const contacts = [
  ["contact-1", "acct-northstar", "Maya", "Singh", "maya.singh@northstarfreight.example", "303-555-0101", "VP Operations", "active"],
  ["contact-2", "acct-northstar", "Owen", "Blake", "owen.blake@northstarfreight.example", "303-555-0102", "Logistics Director", "active"],
  ["contact-3", "acct-luma", "Priya", "Nair", "priya.nair@lumahealth.example", "512-555-0103", "Chief Revenue Officer", "active"],
  ["contact-4", "acct-luma", "Ethan", "Cole", "ethan.cole@lumahealth.example", "512-555-0104", "IT Manager", "active"],
  ["contact-5", "acct-cascade", "Grace", "Kim", "grace.kim@cascaderobotics.example", "503-555-0105", "Head of Sales", "active"],
  ["contact-6", "acct-cascade", "Leo", "Morris", "leo.morris@cascaderobotics.example", "503-555-0106", "Sales Operations Lead", "active"],
  ["contact-7", "acct-harbor", "Nadia", "Brooks", "nadia.brooks@harborline.example", "312-555-0107", "Managing Director", "active"],
  ["contact-8", "acct-harbor", "Miles", "Turner", "miles.turner@harborline.example", "312-555-0108", "Procurement Lead", "inactive"],
  ["contact-9", "acct-orbit", "Iris", "Wong", "iris.wong@orbitretail.example", "206-555-0109", "Regional VP", "active"],
  ["contact-10", "acct-orbit", "Caleb", "Stone", "caleb.stone@orbitretail.example", "206-555-0110", "CRM Administrator", "active"],
  ["contact-11", "acct-zenith", "Sofia", "Reed", "sofia.reed@zenithbioworks.example", "617-555-0111", "Commercial Lead", "active"],
  ["contact-12", "acct-zenith", "Jonah", "Price", "jonah.price@zenithbioworks.example", "617-555-0112", "Finance Director", "active"],
  ["contact-13", "acct-summit", "Ari", "Foster", "ari.foster@summitgrid.example", "602-555-0113", "VP Customer Programs", "active"],
  ["contact-14", "acct-summit", "Mina", "Hale", "mina.hale@summitgrid.example", "602-555-0114", "Legal Counsel", "active"],
  ["contact-15", "acct-evergreen", "Theo", "Bennett", "theo.bennett@evergreenstudio.example", "213-555-0115", "Director of Partnerships", "inactive"],
  ["contact-16", "acct-evergreen", "Lena", "Park", "lena.park@evergreenstudio.example", "213-555-0116", "Marketing Operations", "inactive"],
  ["contact-17", "acct-apex", "Hannah", "Voss", "hannah.voss@apexkitchens.example", "404-555-0117", "COO", "active"],
  ["contact-18", "acct-apex", "Nico", "Shaw", "nico.shaw@apexkitchens.example", "404-555-0118", "Expansion Manager", "active"],
  ["contact-19", "acct-riverbend", "Amara", "Scott", "amara.scott@riverbendanalytics.example", "919-555-0119", "Founder", "active"],
  ["contact-20", "acct-riverbend", "Ben", "Yu", "ben.yu@riverbendanalytics.example", "919-555-0120", "RevOps Consultant", "active"],
  ["contact-21", "acct-northstar", "Quinn", "Adams", "quinn.adams@northstarfreight.example", "303-555-0121", "Finance Controller", "active"],
  ["contact-22", "acct-luma", "Tessa", "Grant", "tessa.grant@lumahealth.example", "512-555-0122", "Clinical Operations", "active"],
  ["contact-23", "acct-orbit", "Dev", "Kapoor", "dev.kapoor@orbitretail.example", "206-555-0123", "Store Systems Lead", "active"],
  ["contact-24", "acct-zenith", "Rachel", "Diaz", "rachel.diaz@zenithbioworks.example", "617-555-0124", "Procurement Manager", "active"],
  ["contact-25", "acct-summit", "Sam", "Norton", "sam.norton@summitgrid.example", "602-555-0125", "Program Analyst", "active"]
] as const;

const deals = [
  ["deal-1", "acct-northstar", "contact-1", "user-ava", "Northstar dispatch team rollout", "proposal", 118000, 9, 5],
  ["deal-2", "acct-northstar", "contact-21", "user-ava", "Finance reporting workspace", "qualified", 42000, 16, 18],
  ["deal-3", "acct-luma", "contact-3", "user-marcus", "Luma patient intake CRM", "negotiation", 156000, 3, 2],
  ["deal-4", "acct-luma", "contact-4", "user-marcus", "Support handoff pilot", "new", 28000, 21, 30],
  ["deal-5", "acct-cascade", "contact-5", "user-ava", "Cascade enterprise expansion", "won", 210000, 1, 1],
  ["deal-6", "acct-cascade", "contact-6", "user-ava", "Sales operations analytics", "qualified", 64000, 7, 9],
  ["deal-7", "acct-harbor", "contact-7", "user-elena", "Advisor desk modernization", "proposal", 98000, 22, 12],
  ["deal-8", "acct-harbor", "contact-8", "user-elena", "Compliance workflow pilot", "lost", 36000, 40, 35],
  ["deal-9", "acct-orbit", "contact-9", "user-marcus", "Retail territory planning", "negotiation", 132000, 15, 4],
  ["deal-10", "acct-orbit", "contact-10", "user-marcus", "Store manager mobile CRM", "new", 52000, 0, 20],
  ["deal-11", "acct-zenith", "contact-11", "user-elena", "Biotech commercial launch", "proposal", 175000, 6, 3],
  ["deal-12", "acct-zenith", "contact-12", "user-elena", "Finance approvals automation", "qualified", 73000, 11, 10],
  ["deal-13", "acct-summit", "contact-13", "user-ava", "Energy partner portal", "negotiation", 225000, 31, 8],
  ["deal-14", "acct-summit", "contact-14", "user-ava", "Legal contract workspace", "proposal", 87000, 18, 6],
  ["deal-15", "acct-evergreen", "contact-15", "user-marcus", "Studio advertiser CRM", "lost", 59000, 60, 45],
  ["deal-16", "acct-apex", "contact-17", "user-elena", "Kitchen expansion pipeline", "won", 126000, 2, 1],
  ["deal-17", "acct-apex", "contact-18", "user-elena", "Franchise onboarding workflow", "new", 47000, 13, 24],
  ["deal-18", "acct-riverbend", "contact-19", "user-ava", "Analytics partner co-sell", "qualified", 69000, 27, 14]
] as const;

const noteTemplates = [
  "Customer asked to follow up next week after finance reviews budget. Decision maker wants a concise rollout plan.",
  "Call covered pricing options and support requirements. Send proposal with the implementation timeline by Friday.",
  "Meeting went well but procurement needs contract language before legal review. Follow up with redlines.",
  "Champion said the team likes the workflow but needs budget approval. Call back after leadership review.",
  "Technical buyer asked for security notes and a clearer timeline. Send proposal addendum next week.",
  "Stakeholder wants pricing compared with current CRM spend. Follow up Friday with three-year view.",
  "Decision maker joined late and asked about contract terms. Review and schedule follow-up.",
  "Operations team confirmed pilot scope. Send proposal and confirm success metrics."
];

const dealerAreas = [
  ["area-vancouver", "Vancouver Metro", "BC", "Lower Mainland", "V5,V6"],
  ["area-north-shore", "North Shore", "BC", "Lower Mainland", "V7"],
  ["area-burnaby", "Burnaby Fraser", "BC", "Lower Mainland", "V3"],
  ["area-victoria", "Victoria Island", "BC", "Vancouver Island", "V8"],
  ["area-kelowna", "Kelowna Interior", "BC", "Interior", "V1"],
  ["area-calgary", "Calgary Metro", "AB", "Southern Alberta", "T2,T3"],
  ["area-edmonton", "Edmonton Metro", "AB", "Northern Alberta", "T5,T6"],
  ["area-red-deer", "Red Deer Corridor", "AB", "Central Alberta", "T4"],
  ["area-toronto", "Toronto Core", "ON", "GTA", "M4,M5"],
  ["area-gta-west", "GTA West", "ON", "GTA", "L4,L5"],
  ["area-ottawa", "Ottawa Capital", "ON", "Eastern Ontario", "K1,K2"],
  ["area-london", "London Southwest", "ON", "Southwestern Ontario", "N5,N6"]
] as const;

const dealerOrders = [
  ["dealer-order-vancouver-northstar", "acct-northstar", "Vancouver fleet lead package", 28, "active", -42],
  ["dealer-order-vancouver-cascade", "acct-cascade", "Vancouver robotics dealer program", 18, "active", -30],
  ["dealer-order-burnaby-orbit", "acct-orbit", "Burnaby retail conquest", 12, "active", -26],
  ["dealer-order-victoria-apex", "acct-apex", "Victoria island pilot", 3, "active", -20],
  ["dealer-order-kelowna-riverbend", "acct-riverbend", "Kelowna analytics pod", 8, "active", -18],
  ["dealer-order-calgary-luma", "acct-luma", "Calgary care network", 16, "active", -38],
  ["dealer-order-calgary-summit", "acct-summit", "Calgary energy partners", 10, "active", -14],
  ["dealer-order-edmonton-apex", "acct-apex", "Edmonton expansion desk", 15, "active", -24],
  ["dealer-order-reddeer-harbor", "acct-harbor", "Red Deer finance desk", 6, "active", -21],
  ["dealer-order-toronto-orbit", "acct-orbit", "Toronto retail dealer order", 24, "active", -44],
  ["dealer-order-toronto-zenith", "acct-zenith", "Toronto biotech buyer leads", 12, "active", -34],
  ["dealer-order-gtawest-northstar", "acct-northstar", "GTA West logistics order", 10, "active", -28],
  ["dealer-order-ottawa-cascade", "acct-cascade", "Ottawa automation dealer order", 8, "active", -19],
  ["dealer-order-ottawa-summit", "acct-summit", "Ottawa energy dealer order", 6, "active", -10],
  ["dealer-order-gtawest-zenith", "acct-zenith", "GTA West healthcare order", 9, "active", -12],
  ["dealer-order-london-harbor", "acct-harbor", "London finance paused order", 8, "paused", -33],
  ["dealer-order-london-evergreen", "acct-evergreen", "London media completed order", 5, "complete", -60],
  ["dealer-order-vancouver-evergreen", "acct-evergreen", "Vancouver media paused order", 10, "paused", -22],
  ["dealer-order-toronto-apex", "acct-apex", "Toronto hospitality paused order", 7, "paused", -17],
  ["dealer-order-calgary-riverbend", "acct-riverbend", "Calgary completed analytics order", 6, "complete", -50]
] as const;

const dealerOrderAreaLinks = [
  ["dealer-order-vancouver-northstar", "area-vancouver"],
  ["dealer-order-vancouver-cascade", "area-vancouver"],
  ["dealer-order-vancouver-cascade", "area-north-shore"],
  ["dealer-order-burnaby-orbit", "area-burnaby"],
  ["dealer-order-victoria-apex", "area-victoria"],
  ["dealer-order-kelowna-riverbend", "area-kelowna"],
  ["dealer-order-calgary-luma", "area-calgary"],
  ["dealer-order-calgary-summit", "area-calgary"],
  ["dealer-order-edmonton-apex", "area-edmonton"],
  ["dealer-order-reddeer-harbor", "area-red-deer"],
  ["dealer-order-toronto-orbit", "area-toronto"],
  ["dealer-order-toronto-zenith", "area-toronto"],
  ["dealer-order-gtawest-northstar", "area-gta-west"],
  ["dealer-order-ottawa-cascade", "area-ottawa"],
  ["dealer-order-ottawa-summit", "area-ottawa"],
  ["dealer-order-gtawest-zenith", "area-gta-west"],
  ["dealer-order-london-harbor", "area-london"],
  ["dealer-order-london-evergreen", "area-london"],
  ["dealer-order-vancouver-evergreen", "area-vancouver"],
  ["dealer-order-toronto-apex", "area-toronto"],
  ["dealer-order-calgary-riverbend", "area-calgary"]
] as const;

const currentDeliveryTargets = [
  ["dealer-order-vancouver-northstar", 5],
  ["dealer-order-vancouver-cascade", 10],
  ["dealer-order-burnaby-orbit", 4],
  ["dealer-order-kelowna-riverbend", 2],
  ["dealer-order-calgary-luma", 5],
  ["dealer-order-calgary-summit", 3],
  ["dealer-order-edmonton-apex", 4],
  ["dealer-order-reddeer-harbor", 2],
  ["dealer-order-toronto-orbit", 8],
  ["dealer-order-toronto-zenith", 4],
  ["dealer-order-gtawest-northstar", 3],
  ["dealer-order-ottawa-cascade", 2],
  ["dealer-order-victoria-apex", 3]
] as const;

const priorDeliveryTargets = [
  ["dealer-order-vancouver-northstar", 2],
  ["dealer-order-calgary-luma", 2],
  ["dealer-order-toronto-orbit", 2],
  ["dealer-order-edmonton-apex", 2],
  ["dealer-order-gtawest-zenith", 2]
] as const;

const postalSamples: Record<string, string> = {
  "area-vancouver": "V5K 0A1",
  "area-north-shore": "V7L 1A1",
  "area-burnaby": "V3N 2B2",
  "area-victoria": "V8W 1A1",
  "area-kelowna": "V1Y 6N6",
  "area-calgary": "T2P 1J9",
  "area-edmonton": "T5J 0N3",
  "area-red-deer": "T4N 1S1",
  "area-toronto": "M5V 2T6",
  "area-gta-west": "L5B 3C1",
  "area-ottawa": "K1P 5G4",
  "area-london": "N5Y 1A1"
};

const leadFirstNames = [
  "Sarah",
  "Daniel",
  "Nora",
  "Andre",
  "Mei",
  "Lucas",
  "Aisha",
  "Cole",
  "Rina",
  "Victor",
  "Jules",
  "Mila",
  "Omar",
  "Tara",
  "Eli",
  "Naomi"
] as const;

const leadLastNames = [
  "Walsh",
  "Nguyen",
  "Patel",
  "Roy",
  "Santos",
  "MacDonald",
  "Chen",
  "Fraser",
  "Singh",
  "Morrison",
  "Bell",
  "Khan",
  "Lam",
  "Walker",
  "Young",
  "Reid"
] as const;

const leadSources = ["web", "dealer_site", "phone", "paid_search", "partner"] as const;

type DealerLeadSeed = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  postalCode: string;
  province: string | null;
  source: string;
  status: string;
  areaId: string | null;
  assignedOrderId: string | null;
  assignmentReason: string;
  createdAt: Date;
};

function currentMonthDay(day: number) {
  const now = new Date();
  const safeDay = Math.min(day, now.getDate());
  return new Date(now.getFullYear(), now.getMonth(), safeDay, 10, 0, 0);
}

function priorMonthDay(day: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, day, 10, 0, 0);
}

function provinceForArea(areaId: string | null) {
  const area = dealerAreas.find((candidate) => candidate[0] === areaId);
  return area?.[2] ?? null;
}

function firstAreaForOrder(orderId: string) {
  return dealerOrderAreaLinks.find((link) => link[0] === orderId)?.[1] ?? null;
}

function buildLead(
  index: number,
  input: {
    areaId: string | null;
    assignedOrderId: string | null;
    assignmentReason: string;
    status: string;
    createdAt: Date;
    postalCode?: string;
  }
): DealerLeadSeed {
  const firstName = leadFirstNames[index % leadFirstNames.length];
  const lastName = leadLastNames[index % leadLastNames.length];
  const leadNumber = index + 1;

  return {
    id: `lead-${leadNumber}`,
    firstName,
    lastName,
    phone: `604-555-${String(2000 + leadNumber).slice(-4)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${leadNumber}@dealerlead.example`,
    postalCode: input.postalCode ?? postalSamples[input.areaId ?? ""] ?? "Z9Z 9Z9",
    province: provinceForArea(input.areaId),
    source: leadSources[index % leadSources.length],
    status: input.status,
    areaId: input.areaId,
    assignedOrderId: input.assignedOrderId,
    assignmentReason: input.assignmentReason,
    createdAt: input.createdAt
  };
}

function buildDealerLeads() {
  const leadSeeds: DealerLeadSeed[] = [];

  for (const [orderId, count] of currentDeliveryTargets) {
    const areaId = firstAreaForOrder(orderId);

    for (let index = 0; index < count; index += 1) {
      leadSeeds.push(
        buildLead(leadSeeds.length, {
          areaId,
          assignedOrderId: orderId,
          assignmentReason: "routed",
          status: "assigned",
          createdAt: currentMonthDay((leadSeeds.length % 15) + 1)
        })
      );
    }
  }

  for (const [orderId, count] of priorDeliveryTargets) {
    const areaId = firstAreaForOrder(orderId);

    for (let index = 0; index < count; index += 1) {
      leadSeeds.push(
        buildLead(leadSeeds.length, {
          areaId,
          assignedOrderId: orderId,
          assignmentReason: "routed",
          status: index % 2 === 0 ? "contacted" : "closed",
          createdAt: priorMonthDay((index % 20) + 2)
        })
      );
    }
  }

  for (let index = 0; index < 5; index += 1) {
    leadSeeds.push(
      buildLead(leadSeeds.length, {
        areaId: null,
        assignedOrderId: null,
        assignmentReason: "no_area_match",
        status: "new",
        createdAt: currentMonthDay(12 + index),
        postalCode: "Z9Z 9Z9"
      })
    );
  }

  for (let index = 0; index < 5; index += 1) {
    leadSeeds.push(
      buildLead(leadSeeds.length, {
        areaId: "area-london",
        assignedOrderId: null,
        assignmentReason: "no_matching_active_order",
        status: "new",
        createdAt: currentMonthDay(9 + index),
        postalCode: postalSamples["area-london"]
      })
    );
  }

  for (let index = 0; index < 5; index += 1) {
    leadSeeds.push(
      buildLead(leadSeeds.length, {
        areaId: "area-victoria",
        assignedOrderId: null,
        assignmentReason: "all_orders_at_quota",
        status: "new",
        createdAt: currentMonthDay(6 + index),
        postalCode: postalSamples["area-victoria"]
      })
    );
  }

  return leadSeeds;
}

async function main() {
  await prisma.activity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.dealerOrderArea.deleteMany();
  await prisma.dealerOrder.deleteMany();
  await prisma.area.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: users
  });

  await prisma.account.createMany({
    data: accounts.map((account) => ({
      id: account[0],
      name: account[1],
      domain: account[2],
      industry: account[3],
      city: account[4],
      region: account[5],
      status: account[6],
      ownerId: account[7],
      healthScore: account[8]
    }))
  });

  await prisma.area.createMany({
    data: dealerAreas.map((area) => ({
      id: area[0],
      name: area[1],
      province: area[2],
      region: area[3],
      postalPrefixes: area[4]
    }))
  });

  await prisma.dealerOrder.createMany({
    data: dealerOrders.map((order) => ({
      id: order[0],
      accountId: order[1],
      name: order[2],
      monthlyQuota: order[3],
      status: order[4],
      startDate: daysFromNow(order[5])
    }))
  });

  await prisma.dealerOrderArea.createMany({
    data: dealerOrderAreaLinks.map((link) => ({
      dealerOrderId: link[0],
      areaId: link[1]
    }))
  });

  await prisma.contact.createMany({
    data: contacts.map((contact) => ({
      id: contact[0],
      accountId: contact[1],
      firstName: contact[2],
      lastName: contact[3],
      email: contact[4],
      phone: contact[5],
      title: contact[6],
      status: contact[7]
    }))
  });

  await prisma.deal.createMany({
    data: deals.map((deal) => ({
      id: deal[0],
      accountId: deal[1],
      contactId: deal[2],
      ownerId: deal[3],
      name: deal[4],
      stage: deal[5],
      value: deal[6],
      probability: probabilityForStage(deal[5]),
      expectedCloseDate: daysFromNow(deal[7]),
      lastActivityAt: daysAgo(deal[8]),
      createdAt: daysAgo(deal[8] + 10)
    }))
  });

  const activityData = Array.from({ length: 45 }).map((_, index) => {
    const deal = deals[index % deals.length];
    const contact = contacts.find((candidate) => candidate[0] === deal[2]);
    const accountId = deal[1];
    const rawText = noteTemplates[index % noteTemplates.length];
    const summary = deterministicActivitySummarizer.summarize({ rawText });
    const typeCycle = ["note", "call", "email", "meeting", "status_change"] as const;
    const type = typeCycle[index % typeCycle.length];

    return {
      id: `activity-${index + 1}`,
      accountId,
      contactId: contact?.[0] ?? null,
      dealId: deal[0],
      userId: deal[3],
      type,
      title:
        type === "status_change"
          ? `${deal[4]} stage review`
          : `${type === "note" ? "Note" : type === "call" ? "Call" : type === "email" ? "Email" : "Meeting"} with ${contact?.[2] ?? "stakeholder"}`,
      rawText: type === "status_change" ? null : rawText,
      summary:
        type === "status_change"
          ? `Pipeline reviewed for ${deal[4]} and next stage criteria were updated.`
          : summary.summary,
      nextStep:
        type === "status_change"
          ? "Confirm next action for the current stage."
          : summary.nextStep,
      createdAt: daysAgo(index + 1)
    };
  });

  const leadSeeds = buildDealerLeads();
  const dealerOrderById: Map<string, (typeof dealerOrders)[number]> = new Map(
    dealerOrders.map((order) => [order[0], order])
  );
  const areaById: Map<string, (typeof dealerAreas)[number]> = new Map(
    dealerAreas.map((area) => [area[0], area])
  );

  await prisma.lead.createMany({
    data: leadSeeds.map((lead) => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      email: lead.email,
      postalCode: lead.postalCode,
      province: lead.province,
      source: lead.source,
      status: lead.status,
      areaId: lead.areaId,
      assignedOrderId: lead.assignedOrderId,
      assignmentReason: lead.assignmentReason,
      createdAt: lead.createdAt
    }))
  });

  const routingEvents = leadSeeds.map((lead) => {
    const assignedOrder = lead.assignedOrderId
      ? dealerOrderById.get(lead.assignedOrderId)
      : undefined;
    const area = lead.areaId ? areaById.get(lead.areaId) : undefined;

    return {
      id: `routing-event-${lead.id}`,
      accountId: assignedOrder?.[1] ?? null,
      leadId: lead.id,
      type: "routing_event",
      title:
        lead.assignmentReason === "routed" && assignedOrder
          ? `${lead.firstName} ${lead.lastName} routed to ${assignedOrder[2]}`
          : `${lead.firstName} ${lead.lastName} was not routed`,
      summary:
        lead.assignmentReason === "routed" && assignedOrder && area
          ? `Resolved ${area[1]}; selected ${assignedOrder[2]} for dealer pacing.`
          : routingFailureSummary(lead.assignmentReason),
      nextStep:
        lead.assignmentReason === "routed"
          ? "Dealer should contact the assigned lead."
          : "Review routing coverage and active order capacity.",
      createdAt: lead.createdAt
    };
  });

  await prisma.activity.createMany({
    data: [...activityData, ...routingEvents]
  });
}

function routingFailureSummary(reason: string) {
  const summaries: Record<string, string> = {
    no_area_match: "No area matched the lead postal code.",
    no_matching_active_order: "The resolved area has no active dealer order.",
    all_orders_at_quota: "All active dealer orders in the resolved area are at monthly quota."
  };

  return summaries[reason] ?? "Lead routing did not produce an assignment.";
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
