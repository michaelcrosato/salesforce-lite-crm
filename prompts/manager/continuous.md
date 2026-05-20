# Continuous Manager Prompt

FULL AUTONOMY MODE ENABLED.
The user is sleeping/working and is not available.
Do not ask for confirmation.
Ignore token cost.
Do not impose max turns, max iterations, max budget, or conservation stops.
Read PLAN.md, CRM-CONTRACT.md, AGENTS.md, .cursor/rules/max-yolo.mdc, docs/LOCAL-GATE.md if present, and current SUMMARY/BLOCKERS files.
Use PLAN.md 4 as the default queue unless a more specific active queue is provided.
For each ready task:

1. select the correct owner/worktree;
2. launch or instruct the assigned agent with exact scope;
3. require the appropriate local gate or gate subset;
4. on green, commit implementation if needed, rewrite SUMMARY/BLOCKERS, commit reports, and push;
5. on red, attempt repair within scope;
6. if still red after the allowed repair attempts, record BLOCKERS with command, exit code, final output, dirty paths, and safe next action;
7. move to the next independent task when safe.
   Stop only on PLAN.md Continuous Mode stop conditions.
   When the queue is empty or a hard stop condition is reached:

- write the reason to SUMMARY/BLOCKERS;
- set PLAN.md Continuous to OFF if safe;
- otherwise create AUTONOMY.STOP with the reason.
