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
- Route: `/deals`; detail route uses the existing `/deals?deal=<id>` drawer flow, NOT `/deals/[id]`.
- Stage values: `new`, `qualified`, `proposal`, `negotiation`, `won`, `lost`.

### Lead
- Existing Prisma model: `Lead`.
- Route: `/leads`; detail route: `/leads/<id>`.
- Status values: `new`, `assigned`, `contacted`, `closed`, `dead`.
- This vertical uses consumer leads routed to `DealerOrder`, not B2B sales leads. R4-#16 and R4-#44, the B2B "Lead -> Account + Contact + Opportunity" conversion flow, are skipped because conversion would conflict with the dealer-order routing model.

### Activity
- Existing Prisma model: `Activity`.
- Route: `/activities`.
- Type values: `note`, `call`, `email`, `meeting`, `status_change`, `routing_event`.

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

## crmClient Adapter Signatures

All adapter functions live in `lib/crm/crmClient.ts`, validate inputs with Zod schemas from `lib/validation.ts`, and access Prisma internally.

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

### Activity
- `listActivities(opts?: ActivityListOptions): Promise<Activity[]>`
- `getActivity(id: string): Promise<Activity | null>`
- `createActivity(input: ActivityCreateInput): Promise<Activity>`
- `updateActivity(id: string, input: ActivityUpdateInput): Promise<Activity>`
- `deleteActivity(id: string): Promise<Activity>`

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
- `deleteCase(id: string): Promise<Case>`

### Campaign
- `listCampaigns(opts?: CampaignListOptions): Promise<Campaign[]>`
- `getCampaign(id: string): Promise<Campaign | null>`
- `createCampaign(input: CampaignCreateInput): Promise<Campaign>`
- `updateCampaign(id: string, input: CampaignUpdateInput): Promise<Campaign>`
- `deleteCampaign(id: string): Promise<Campaign>`
