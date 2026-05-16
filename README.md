# Salesforce Lite CRM

Salesforce Lite CRM is a local proof-of-concept CRM built with Next.js, Prisma, SQLite, Tailwind CSS, and deterministic AI-style note summarization. It proves the daily sales loop: manage accounts and contacts, move deals through a pipeline, record activities, and generate simple next steps from rough notes.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Database

The app uses SQLite through Prisma. The default local database is `prisma/dev.db`.

Useful commands:

```bash
npx prisma generate
npx prisma db push
npm run seed
```

The seed creates 3 users, 10 accounts, 25 contacts, 18 deals, and 45 activities.

## Scripts

```bash
npm run dev
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
```

## Five-Minute Demo Script

1. Open `/dashboard` and review KPI cards, pipeline charts, stale deals, and Today's Focus.
2. Go to `/contacts`, search for a contact, then open Maya Singh.
3. Add a rough note such as `Follow up next week with pricing and decision maker details.`
4. Confirm the activity timeline shows the raw note summary and deterministic next step.
5. Go to `/deals`, drag a deal from New to Qualified or use the card stage selector, then confirm the card moves with an updated probability and status-change activity.
6. Open `/activities` and filter by Note or Status Change to see the cross-object timeline.
7. Open `/accounts` and review account health, related contacts, related deals, and recent activities.

## Tests

Vitest covers:

- weighted forecast calculation
- stale deal detection
- today's focus ranking
- activity summarization
- stage-to-probability mapping

Playwright covers one smoke test:

- dashboard load
- contact detail navigation
- note creation and summarization
- deal board drag-and-drop stage update

## Known Limitations

- No authentication, permissions, or multi-tenant separation.
- The summarizer is deterministic and local; it is intentionally not an LLM integration.
- Deals can be moved, but this first build does not include deal creation or deal detail pages.
- Accounts are seeded and browsable, but account creation/editing is outside this first scope.
- The top search routes to contacts only.
- SQLite is used for local proof-of-concept data, not production operations.

## Next Recommended Build Step

Add deal creation/editing and a deal detail page, then reuse the existing activity timeline and deterministic summarizer for deal-specific notes.
