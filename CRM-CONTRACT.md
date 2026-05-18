# CRM Contract

This file is the source of truth for CRM entity names, routes, status values, and server-side data access.

## Entity Model

### Account
- Existing Prisma model: `Account`.
- Route: `/accounts`; detail route: `/accounts/<id>`.
- Status values: `active`, `paused`, `churned`.

### Contact
- Existing Prisma model: `Contact`.
- Route: `/contacts`; detail route: `/contacts/<id>`.
- Status values: `active`, `inactive`.

### Opportunity
- Canonical CRM term: `Opportunity`.
- Existing database table and Prisma model: `Deal`.
- TypeScript alias: `Opportunity = Deal`.
- Route: `/deals`; detail route uses the existing `/deals?deal=<id>` drawer flow, not a bracketed dynamic deal detail segment.
- Stage values: `new`, `qualified`, `proposal`, `negotiation`, `won`, `lost`.
- Stage changes are recorded in `OpportunityStageHistory` with `dealId`, `fromStage`, `toStage`, `changedAt`, and optional `changedByUserId`.

### Lead
- Existing Prisma model: `Lead`.
- Route: `/leads`; detail route: `/leads/<id>`.
- Status values: `new`, `assigned`, `contacted`, `closed`, `dead`.
- This vertical uses consumer leads routed to `DealerOrder`, not B2B sales leads. R4-#16 and R4-#44, the B2B "Lead -> Account + Contact + Opportunity" conversion flow, are skipped because conversion would conflict with the dealer-order routing model.

### Activity
- Existing Prisma model: `Activity`.
- Route: `/activities`.
- Type values: `note`, `call`, `email`, `meeting`, `status_change`, `routing_event`.
- Optional relations: `Account`, `Contact`, `Opportunity`, `Lead`, `Task`, `Case`, owner `User`.

### Note
- Derived entity: `Activity` rows with `type = "note"`.
- Route: `/activities?type=note`.
- No separate table.

### DealerOrder
- Existing Prisma model: `DealerOrder`.
- Route: `/orders`; detail route: `/orders/<id>`.
- Status values: `active`, `paused`, `complete`.

### Area
- Existing Prisma model: `Area`.
- Route: `/areas`.
- No lifecycle status enum.

### Task
- New Prisma model: `Task`.
- Route: `/tasks`; detail route: `/tasks?task=<id>`.
- Status values: `open`, `in_progress`, `done`, `cancelled`.
- Priority values: `low`, `normal`, `high`, `urgent`.
- Optional relations: `Account`, `Contact`, `Opportunity`, `Lead`, owner `User`.

### Case
- New Prisma model: `Case`.
- Route: `/cases`; detail route: `/cases?case=<id>`.
- Status values: `new`, `in_progress`, `waiting`, `resolved`, `closed`.
- Priority values: `low`, `normal`, `high`, `urgent`.
- Optional relations: `Account`, `Contact`, owner `User`.

### Campaign
- New Prisma model: `Campaign`.
- Route: `/campaigns`; detail route: `/campaigns?campaign=<id>`.
- Status values: `planned`, `active`, `completed`, `cancelled`.
- Optional relations: owner `User`, related `Lead` rows, related `Contact` rows.

## Registries

- `lib/crm/registry.ts` exports entity model types, status arrays, `ENTITY_REGISTRY`, and `ROUTE_REGISTRY`.
- `Opportunity` is the exported type alias for the existing `Deal` model.
- `Note` is the exported type alias for an `Activity` with `type = "note"`.
- Existing UI routes are preserved. New `/tasks`, `/cases`, and `/campaigns` routes are contract routes for the UI owner to implement.

## Feature Flags And Excluded Routes

`lib/featureFlags.ts` exports `FEATURE_FLAGS`, `EXCLUDED_ROUTES`, and `isEnabled(flag)`.
All flags default to `false` during Sprint 4B demo polish.

| Flag | Purpose | Excluded route(s) | Authority |
|---|---|---|---|
| `tasksUi` | Backend Task support exists, but the Task UI is excluded from this demo slice. | `/tasks` | Sprint 4B Item 54; PLAN.md section 4 line 119 forbids bundling extra S4 UI work without an explicit prompt. |
| `casesUi` | Backend Case support exists, but the Case UI is excluded from this demo slice. | `/cases` | Sprint 4B Item 54; PLAN.md section 4 line 119 forbids bundling extra S4 UI work without an explicit prompt. |
| `campaignsUi` | Backend Campaign support exists, but the Campaign UI is excluded from this demo slice. | `/campaigns` | Sprint 4B Item 54; PLAN.md section 4 line 119 forbids bundling extra S4 UI work without an explicit prompt. |
| `dealDetailRoute` | Deal detail stays in the drawer flow. | `/deals/[id]` | PLAN.md section 4 line 137. |
| `globalSearchUi` | Top search remains contacts-only; no expanded search route ships. | `/search` | PLAN.md section 4 line 139. |
| `commandPalette` | No command palette route ships in Sprint 4B. | `/command-palette` | PLAN.md section 4 line 119 forbids bundling extra S4 UI work without an explicit prompt. |
| `dealerOrderEdit` | Dealer orders are seeded and browsable only; create/edit flows are excluded. | `/orders/new`, `/orders/[id]/edit` | PLAN.md section 4 line 135. |
| `areaEdit` | Routing areas are seeded and browsable only; create/edit flows are excluded. | `/areas/new`, `/areas/[id]/edit` | PLAN.md section 4 line 135. |

`EXCLUDED_ROUTES` is the source of truth for routes that should either 404 or render the demo placeholder.

## Postal Validation

`lib/postal.ts` exports:

- `normalizePostalCode(input: string, country: "CA" | "US"): string | null`
- `extractPostalPrefix(normalized: string, country: "CA" | "US"): string`
- `validatePostalCode(input: string, country: "CA" | "US"): { ok: true; normalized: string; prefix: string } | { ok: false; reason: string }`
- `postalCodeSchema`, a Zod schema used by lead creation validation for the Canadian dealer routing form.

Canadian codes normalize to `A1A 1A1`. US ZIP values normalize to `12345` or `12345-6789`.

## crmClient Adapter Signatures

All adapter functions live in `lib/crm/crmClient.ts`, validate inputs with Zod schemas from `lib/validation.ts`, and access Prisma internally.
List adapter options use `{ page, pageSize, sortBy, sortOrder, filters }` and are translated to Prisma `where`, `orderBy`, `skip`, and `take` clauses by `lib/services/listQuery.ts`.

### Account
- `listAccounts(opts?: AccountListOptions): Promise<Account[]>`
- `getAccount(id: string): Promise<Account | null>`
- `createAccount(input: AccountCreateInput): Promise<Account>`
- `updateAccount(id: string, input: AccountUpdateInput): Promise<Account>`
- `deleteAccount(id: string): Promise<Account>`

### Contact
- `listContacts(opts?: ContactListOptions): Promise<Contact[]>`
- `getContact(id: string): Promise<Contact | null>`
- `createContact(input: ContactCreateInput): Promise<Contact>`
- `updateContact(id: string, input: ContactUpdateInput): Promise<Contact>`
- `deleteContact(id: string): Promise<Contact>`

### Opportunity
- `listOpportunities(opts?: OpportunityListOptions): Promise<Opportunity[]>`
- `getOpportunity(id: string): Promise<Opportunity | null>`
- `createOpportunity(input: OpportunityCreateInput): Promise<Opportunity>`
- `updateOpportunity(id: string, input: OpportunityUpdateInput): Promise<Opportunity>`
- `deleteOpportunity(id: string): Promise<Opportunity>`

### Lead
- `listLeads(opts?: LeadListOptions): Promise<Lead[]>`
- `getLead(id: string): Promise<Lead | null>`
- `createLead(input: LeadCreateInput): Promise<Lead>`
- `updateLead(id: string, input: LeadUpdateInput): Promise<Lead>`
- `deleteLead(id: string): Promise<Lead>`
- `getRoutingDecisionForLead(leadId: string): Promise<RoutingDecision | null>`
- Object adapter: `crmClient.leads.getRoutingDecision(id): Promise<RoutingDecision | null>`

`RoutingDecision` is exported from `lib/services/leads.ts` and re-exported by `lib/crm/crmClient.ts`:

```
type RoutingDecision = {
  leadId: string;
  normalizedPostal: string;
  prefix: string;
  matchedAreaId: string | null;
  matchedAreaName: string | null;
  candidateOrders: Array<{ id: string; dealerName: string; paceGap: number; rank: number }>;
  selectedOrderId: string | null;
  decidedAt: Date;
  reason: string;
  summary: string;
  steps: Array<{ step: string; result: RoutingDecisionJson }>;
};
```

The getter reads the latest existing `routing_event` Activity for the lead and does not re-run routing. Legacy human-readable routing summaries are surfaced through `reason`, `summary`, and a single `legacy_summary` step.

### Activity
- `listActivities(opts?: ActivityListOptions): Promise<Activity[]>`
- `getActivity(id: string): Promise<Activity | null>`
- `createActivity(input: ActivityCreateInput): Promise<Activity>`
- `updateActivity(id: string, input: ActivityUpdateInput): Promise<Activity>`
- `deleteActivity(id: string): Promise<Activity>`
- `addActivityToTask(taskId: string, input: ActivityCreateInput): Promise<Activity>`
- `addActivityToCase(caseId: string, input: ActivityCreateInput): Promise<Activity>`

### Note
- `listNotes(opts?: ActivityListOptions): Promise<Note[]>`
- `getNote(id: string): Promise<Note | null>`
- `createNote(input: NoteCreateInput): Promise<Note>`
- `updateNote(id: string, input: NoteUpdateInput): Promise<Note | null>`
- `deleteNote(id: string): Promise<Note | null>`

### DealerOrder
- `listDealerOrders(opts?: DealerOrderListOptions): Promise<DealerOrder[]>`
- `getDealerOrder(id: string): Promise<DealerOrder | null>`
- `createDealerOrder(input: DealerOrderCreateInput): Promise<DealerOrder>`
- `updateDealerOrder(id: string, input: DealerOrderUpdateInput): Promise<DealerOrder>`
- `deleteDealerOrder(id: string): Promise<DealerOrder>`

### Area
- `listAreas(opts?: AreaListOptions): Promise<Area[]>`
- `getArea(id: string): Promise<Area | null>`
- `createArea(input: AreaCreateInput): Promise<Area>`
- `updateArea(id: string, input: AreaUpdateInput): Promise<Area>`
- `deleteArea(id: string): Promise<Area>`

### Task
- `listTasks(opts?: TaskListOptions): Promise<Task[]>`
- `getTask(id: string): Promise<Task | null>`
- `createTask(input: TaskCreateInput): Promise<Task>`
- `updateTask(id: string, input: TaskUpdateInput): Promise<Task>`
- `completeTask(id: string): Promise<Task>`
- `deleteTask(id: string): Promise<Task>`

### Case
- `listCases(opts?: CaseListOptions): Promise<Case[]>`
- `getCase(id: string): Promise<Case | null>`
- `createCase(input: CaseCreateInput): Promise<Case>`
- `updateCase(id: string, input: CaseUpdateInput): Promise<Case>`
- `resolveCase(id: string): Promise<Case>`
- `deleteCase(id: string): Promise<Case>`

### Campaign
- `listCampaigns(opts?: CampaignListOptions): Promise<Campaign[]>`
- `getCampaign(id: string): Promise<Campaign | null>`
- `createCampaign(input: CampaignCreateInput): Promise<Campaign>`
- `updateCampaign(id: string, input: CampaignUpdateInput): Promise<Campaign>`
- `completeCampaign(id: string): Promise<Campaign>`
- `deleteCampaign(id: string): Promise<Campaign>`
