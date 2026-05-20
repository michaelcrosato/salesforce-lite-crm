import type { Prisma } from "@prisma/client";
import { ROUTE_REGISTRY } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";

export type SearchResultItem = {
  id: string;
  label: string;
  route: string;
};

export type GlobalSearchResults = {
  accounts: SearchResultItem[];
  contacts: SearchResultItem[];
  opportunities: SearchResultItem[];
  leads: SearchResultItem[];
  tasks: SearchResultItem[];
  cases: SearchResultItem[];
  campaigns: SearchResultItem[];
};

const emptyResults = (): GlobalSearchResults => ({
  accounts: [],
  contacts: [],
  opportunities: [],
  leads: [],
  tasks: [],
  cases: [],
  campaigns: []
});

const contains = (query: string): Prisma.StringFilter => ({
  contains: query
});

export async function globalSearch(
  query: string
): Promise<GlobalSearchResults> {
  const term = query.trim();

  if (term.length === 0) {
    return emptyResults();
  }

  const [accounts, contacts, opportunities, leads, tasks, cases, campaigns] =
    await Promise.all([
      prisma.account.findMany({
        where: {
          OR: [
            { name: contains(term) },
            { domain: contains(term) },
            { industry: contains(term) },
            { city: contains(term) },
            { region: contains(term) }
          ]
        },
        orderBy: { name: "asc" },
        take: 10
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: contains(term) },
            { lastName: contains(term) },
            { email: contains(term) },
            { title: contains(term) }
          ]
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 10
      }),
      prisma.deal.findMany({
        where: {
          name: contains(term)
        },
        orderBy: { name: "asc" },
        take: 10
      }),
      prisma.lead.findMany({
        where: {
          OR: [
            { firstName: contains(term) },
            { lastName: contains(term) },
            { email: contains(term) },
            { phone: contains(term) },
            { postalCode: contains(term) },
            { source: contains(term) }
          ]
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 10
      }),
      prisma.task.findMany({
        where: {
          OR: [{ title: contains(term) }, { description: contains(term) }]
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 10
      }),
      prisma.case.findMany({
        where: {
          OR: [{ subject: contains(term) }, { description: contains(term) }]
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 10
      }),
      prisma.campaign.findMany({
        where: {
          OR: [{ name: contains(term) }, { description: contains(term) }]
        },
        orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
        take: 10
      })
    ]);

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      label: account.name,
      route: ROUTE_REGISTRY.accountDetail(account.id)
    })),
    contacts: contacts.map((contact) => ({
      id: contact.id,
      label: `${contact.firstName} ${contact.lastName}`,
      route: ROUTE_REGISTRY.contactDetail(contact.id)
    })),
    opportunities: opportunities.map((opportunity) => ({
      id: opportunity.id,
      label: opportunity.name,
      route: ROUTE_REGISTRY.opportunityDetail(opportunity.id)
    })),
    leads: leads.map((lead) => ({
      id: lead.id,
      label: `${lead.firstName} ${lead.lastName}`,
      route: ROUTE_REGISTRY.leadDetail(lead.id)
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      label: task.title,
      route: ROUTE_REGISTRY.taskDetail(task.id)
    })),
    cases: cases.map((crmCase) => ({
      id: crmCase.id,
      label: crmCase.subject,
      route: ROUTE_REGISTRY.caseDetail(crmCase.id)
    })),
    campaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      label: campaign.name,
      route: ROUTE_REGISTRY.campaignDetail(campaign.id)
    }))
  };
}
