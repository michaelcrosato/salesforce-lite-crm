# CRM Contract

Version: v2.1
Last audited: 2026-05-19

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
- Prisma model: `Task`.
- Route: `/tasks`; detail route: `/tasks?task=<id>`.
- Status values: `open`, `in_progress`, `done`, `cancelled`.
- Priority values: `low`, `normal`, `high`, `urgent`.
- Optional relations: `Account`, `Contact`, `Opportunity`, `Lead`, owner `User`.

### Case
- Prisma model: `Case`.
- Route: `/cases`; detail route: `/cases?case=<id>`.
- Status values: `new`, `in_progress`, `waiting`, `resolved`, `closed`.
- Priority values: `low`, `normal`, `high`, `urgent`.
- Optional relations: `Account`, `Contact`, owner `User`.

### KnowledgeArticle
- Prisma model: `KnowledgeArticle`.
- Route: no standalone product route. Articles are local service-workflow records consumed by case assist surfaces on `/cases`; detail flows must stay inside the existing `/cases?case=<id>` case drawer unless a later prompt and contract update promote article routes.
- Status values: `draft`, `published`, `archived`.
- Audience values: `internal`, `customer`.
- Optional metadata: `category`, comma-separated `keywords`, `caseQueueKey`, owner `User`, and `publishedAt`.
- Audit entity type: `knowledge_article`.

### Campaign
- Prisma model: `Campaign`.
- Route: `/campaigns`; detail route: `/campaigns?campaign=<id>`.
- Status values: `planned`, `active`, `completed`, `cancelled`.
- Optional relations: owner `User`, related `Lead` rows, related `Contact` rows.

## Registries

- `lib/crm/registry.ts` exports entity model types, status arrays, `ENTITY_REGISTRY`, and `ROUTE_REGISTRY`.
- `Opportunity` is the exported type alias for the existing `Deal` model.
- `Note` is the exported type alias for an `Activity` with `type = "note"`.
- `KnowledgeArticle` is exported from the registry with `KNOWLEDGE_ARTICLE_STATUSES` and `KNOWLEDGE_ARTICLE_AUDIENCES`, but it is not added to `ENTITY_REGISTRY` or `ROUTE_REGISTRY` while it has no standalone product route.
- Existing UI routes are preserved. `/tasks`, `/cases`, `/campaigns`, and `/reports` are live routes with UI and E2E coverage, so they are not in `EXCLUDED_ROUTES`.

## Status Constants

Status and stage values in this contract mirror `lib/crm-constants.ts` and `lib/crm/registry.ts`:

- Account: `ACCOUNT_STATUSES`
- Contact: `CONTACT_STATUSES`
- Opportunity/Deal: `DEAL_STAGES`
- Activity: `ACTIVITY_TYPES`
- Lead: `LEAD_STATUSES`
- DealerOrder: `DEALER_ORDER_STATUSES`
- Task: `TASK_STATUSES`
- Case: `CASE_STATUSES`
- KnowledgeArticle: `KNOWLEDGE_ARTICLE_STATUSES`, `KNOWLEDGE_ARTICLE_AUDIENCES`
- Campaign: `CAMPAIGN_STATUSES`

## Feature Flags And Excluded Routes

`lib/featureFlags.ts` exports `FEATURE_FLAGS`, `EXCLUDED_ROUTES`, and `isEnabled(flag)`.
Remaining excluded-route flags default to `false` until a later prompt and contract update explicitly promote them.

| Flag | Purpose | Excluded route(s) | Authority |
|---|---|---|---|
| `dealDetailRoute` | Deal detail stays in the drawer flow. | `/deals/[id]` | PLAN.md Sprint 4 non-goals. |
| `globalSearchUi` | The header search form remains contacts-only; no dedicated search page ships. | `/search` | The global Ctrl/Cmd+K command palette is the implemented cross-entity search surface. |
| `commandPalette` | The command palette mounts globally and has no dedicated app-router page. | `/command-palette` | The route is intentionally a placeholder even though the shortcut UI exists. |
| `dealerOrderEdit` | Dealer orders are seeded and browsable only; create/edit flows are excluded. | `/orders/new`, `/orders/[id]/edit` | PLAN.md Sprint 4 non-goals. |
| `areaEdit` | Routing areas are seeded and browsable only; create/edit flows are excluded. | `/areas/new`, `/areas/[id]/edit` | PLAN.md Sprint 4 non-goals. |

`EXCLUDED_ROUTES` is the source of truth for routes without live demo pages that should either 404 or render the demo placeholder.

## Postal Validation

`lib/postal.ts` exports:

- `normalizePostalCode(input: string, country: "CA" | "US"): string | null`
- `extractPostalPrefix(normalized: string, country: "CA" | "US"): string`
- `validatePostalCode(input: string, country: "CA" | "US"): { ok: true; normalized: string; prefix: string } | { ok: false; reason: string }`
- `postalCodeSchema`, a Zod schema used by lead creation validation for the Canadian dealer routing form.

Canadian codes normalize to `A1A 1A1`. US ZIP values normalize to `12345` or `12345-6789`.

## Report Query Services

`lib/services/reports.ts` exports these report query shapes:

- `pipelineByStage(): Promise<Array<{ stage: string; count: number; value: number; weightedValue: number }>>`
  - Includes all `DEAL_STAGES`, even when a stage has zero deals.
  - `weightedValue` is `value * probability`.
- `leadsBySource(): Promise<Array<{ source: string; count: number; rate: number }>>`
  - `rate` is routed leads divided by total leads for that source.
  - A routed lead means `assignmentReason = "routed"` and at least one persisted `routing_event` Activity.
- `activityVolumeByDay(now?: Date, days = 30): Promise<Array<{ day: string; count: number }>>`
  - Returns one row per UTC day in the requested window.
- `topAccountsByOpportunityValue(limit = 5): Promise<Array<{ accountId: string; accountName: string; opportunityCount: number; totalValue: number; route: string }>>`
  - `totalValue` sums all opportunities for the account.
  - `route` points to the account detail route.
- `topAccountsByDealValue(limit = 10): Promise<Array<{ accountId: string; accountName: string; totalValue: number; openDealCount: number }>>`
  - `totalValue` sums open deal values only.
  - `openDealCount` counts deals in open pipeline stages.
- `staleOpportunities(now?: Date): Promise<Array<{ id: string; name: string; stage: string; value: number; lastActivityAt: Date | null; route: string }>>`
  - Uses the same stale/open-stage rules as dashboard focus logic.
- `overdueTasks(now?: Date): Promise<Array<{ id: string; title: string; status: string; priority: string; dueDate: Date; route: string }>>`
  - Excludes `done` and `cancelled` tasks.

## Search Surfaces

- Header search in `components/app-shell.tsx` submits to `/contacts` and is contacts-only.
- The global command palette in `components/command-palette.tsx` opens with Ctrl/Cmd+K and calls `globalSearch()` through `components/command-palette-action.ts`.
- `globalSearch()` returns accounts, contacts, opportunities, leads, tasks, cases, and campaigns with routes from `ROUTE_REGISTRY`.
- Knowledge articles are not included in header search, command-palette search, or a dedicated search route during Sprint 33.
- `/search` and `/command-palette` remain excluded route placeholders; they are not product pages.

## Case Knowledge Suggestions

`lib/services/caseKnowledgeSuggestions.ts` exports deterministic, read-only
helpers for the existing case workflow:

- `getCaseKnowledgeSuggestionPacket(caseId: string, options?: CaseKnowledgeSuggestionOptions): Promise<CaseKnowledgeSuggestionPacket | null>`
- `buildCaseKnowledgeSuggestionPacket(crmCase, articles, options?: CaseKnowledgeSuggestionOptions): CaseKnowledgeSuggestionPacket`

Suggestion packets use existing `Case` fields and published
`KnowledgeArticle` metadata only. They return source
`local_case_article_metadata`, a default limit of 3, a maximum limit of 5,
ranked article suggestions, score/reason metadata, matched keywords/terms, and
empty reasons of `no_published_articles` or `no_relevant_articles`.

The suggestion helpers do not mutate cases, articles, audit rows, routing,
queues, SLA state, search indexes, or CSV/import/export state. They do not call
external AI providers, RAG/vector search, web services, or external knowledge
providers.

## crmClient Adapter Signatures

All adapter functions live in `lib/crm/crmClient.ts`, validate inputs with Zod schemas from `lib/validation.ts`, and access Prisma internally.
List adapter options use `{ page, pageSize, sortBy, sortOrder, filters }` and are translated to Prisma `where`, `orderBy`, `skip`, and `take` clauses by `lib/services/listQuery.ts`.
Supported list filter keys are documented in JSDoc above each `list*` adapter in `lib/crm/crmClient.ts`.
Task, Case, and Campaign service modules also retain legacy flat `skip` / `take` inputs for existing callers, but their exported crmClient list option types use the standard list shape.

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
- `getOpportunityStageHistory(dealId: string): Promise<OpportunityStageHistory[]>`
- Object adapter: `crmClient.deals.getStageHistory(dealId): Promise<OpportunityStageHistory[]>`

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
New routing events write the structured JSON payload to `Activity.rawText` and keep `Activity.summary` human-readable for existing activity surfaces. The payload has `version`, `input`, `steps`, and `summary` fields; `steps` includes `normalize`, `extract_prefix`, `match_area`, `filter_orders`, `rank_pace_gap`, and `select`.

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

### KnowledgeArticle
- `listKnowledgeArticles(opts?: KnowledgeArticleListOptions): Promise<KnowledgeArticle[]>`
- `getKnowledgeArticle(id: string): Promise<KnowledgeArticle | null>`
- `createKnowledgeArticle(input: KnowledgeArticleCreateInput): Promise<KnowledgeArticle>`
- `updateKnowledgeArticle(id: string, input: KnowledgeArticleUpdateInput): Promise<KnowledgeArticle>`
- `publishKnowledgeArticle(id: string, publishedAt?: Date): Promise<KnowledgeArticle>`
- `archiveKnowledgeArticle(id: string): Promise<KnowledgeArticle>`
- Object adapter: `crmClient.knowledgeArticles.list/get/create/update/publish/archive`.

### Campaign
- `listCampaigns(opts?: CampaignListOptions): Promise<Campaign[]>`
- `getCampaign(id: string): Promise<Campaign | null>`
- `createCampaign(input: CampaignCreateInput): Promise<Campaign>`
- `updateCampaign(id: string, input: CampaignUpdateInput): Promise<Campaign>`
- `completeCampaign(id: string): Promise<Campaign>`
- `deleteCampaign(id: string): Promise<Campaign>`
