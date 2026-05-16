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

async function main() {
  await prisma.activity.deleteMany();
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

  await prisma.activity.createMany({
    data: activityData
  });
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
