Start a new polish round. This is the entry point for each session.

1. **Read context** — read these files in order:
   - `docs/working/plan.md` (Session Handoff section first)
   - `docs/upcoming/FULL-IMPLEMENTATION-PLAN.md` (find the current round)
   - `CLAUDE.md` (Section 8b for polish protocol)
   - `lessons-learned.md`

2. **Set up branch** — follow the branch chaining protocol:
   - Find the previous round's branch from Session Handoff
   - `git fetch origin && git checkout <previous-branch> && git pull`
   - `git checkout -b polish/round-<N>-<name>`

3. **Create plan.md** — write `docs/working/plan.md` with:
   - Round title and feature list
   - Batch breakdown (one batch per 2-3 features)
   - Progress table with ⬜ status
   - Session Handoff section

4. **Begin auditing** — for each feature in the round:
   - Run `/polish-feature <number> "<description>"`
   - After fixes, run `/commit-push`
   - Run `/review-batch`
   - Update progress table

5. **Check context** — after each batch, use `/context` command (NOT an estimate)
   - Under 60% actual: continue to next batch
   - Over 60% actual: finish current batch, push, update Session Handoff, exit
