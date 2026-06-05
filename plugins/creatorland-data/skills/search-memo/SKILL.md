---
name: search-memo
description: Keep a running log of searches run and creators already reviewed this engagement so repeat searches (and repeat credits) are avoided — before a new search, diff it against prior runs and report what's new. Use when the user says "have I searched this before", "what have we searched", "show the search log", "dedupe this against earlier", or wants to avoid paying twice for the same query. Produces/updates a session search memo; near-zero credits.
---

# Search Memo / Dedupe Cache

Engagements run many overlapping searches; paying credits twice for the same
query is pure waste. This skill maintains a session-local log of every search
run and every creator already reviewed, and before a new search it diffs the
request against the log — telling the user when they're about to repeat
something and what's genuinely new since last time. Near-zero credits: it's
bookkeeping, with at most one fresh search to compute a diff. For any operator
running a multi-search engagement.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md) when it does run a diff search.

> This is the credit-saving bookkeeping layer other skills lean on. It does
> not cast or price — it tracks what's been run so casting/pricing skills
> don't repeat work. Point it at a planned search to dedupe, or ask it to
> show the log.

## Inputs to collect

- **Mode** — `log` (record/show what's been run), `dedupe` (compare a planned
  search against the log before it runs), or `diff` (re-run a prior search and
  report only what changed). Infer from the user's phrasing; ask only if
  ambiguous.
- **The planned/prior search** — for `dedupe`/`diff`: the brief text +
  filters about to be (or previously) run.
- **Where to persist** — by default the log lives in this session's context;
  if the harness exposes a workspace file, offer to persist it there so the
  memo survives across sessions for the same engagement (honest constraint:
  the MCP has no server-side saved-search API, so persistence is harness-local
  only).
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.

## Flow

**The session log structure** (maintained in context / workspace file). One
entry per search ever run this engagement:

```
- ran_at: <timestamp> · mode: brief|lookalike
  brief/seed: <text or seed identifier>
  filters: <the filters object>
  limit / precision: <…>
  result_ids: [<creator identifiers returned>]
  reviewed: [<which were profiled / shortlisted>]
```

**Mode `log`** (0 credits) — append the most recent search(es) from session
context to the log, or render the current log as a table. No tool calls.

**Mode `dedupe`** (0 credits) — BEFORE a planned search runs, compare its
brief text + filters to every logged entry. Report overlap:
- **Near-duplicate** (same filters, ≥~80% brief overlap) → warn: "You ran
  almost this exact search <when> — it returned <N> creators, <K> already
  reviewed. Re-running costs 2 credits for likely the same set. Run anyway, or
  reuse the logged results?"
- **Partial overlap** → note which prior searches cover part of this space and
  which creators would be re-surfaced.
- **Novel** → "No prior search covers this; clear to run."
This is the credit-saving move — it spends nothing to prevent a wasted call.

**Mode `diff`** (2 credits, one search) — when the user explicitly wants to
see what's NEW since a prior run, re-run the logged search:
`search_creators { "mode": "brief", "brief": "<logged brief>", "filters": { <logged filters> }, "limit": <logged limit>, "precision": "<logged precision>" }`
then diff result_ids against the logged set → report **entered** (new since
last run) and **dropped** (no longer surfacing). Apply the Freshness Gate to
any new creators before they'd go client-facing. Update the log entry with the
new timestamp + result set. (Lookalike diffs use `mode: "lookalike"` with the
logged seed.)

## Deliverable

A search memo in markdown:

```markdown
# Search Memo — <engagement name>
_Creatorland Data · session log as of <date>_

## Searches run this engagement
| # | When | Mode | Brief / seed (short) | Key filters | Returned | Reviewed |
|---|---|---|---|---|---|---|
| 1 | <ts> | brief | <short> | <filters> | <N> | <K> |
<one row per logged search>

## Dedupe verdict (for the planned search)        [dedupe mode]
<near-duplicate warning / partial-overlap note / "novel — clear to run">
<if near-duplicate: the reuse-vs-rerun choice, with the 2-credit cost stated>

## Diff since last run                            [diff mode]
**Entered (<E> new):** @<h>, @<h> … <freshness-gated before client use>
**Dropped (<D>):** @<h>, @<h> …
"You searched almost this exact brief <when> — here's the delta."

## Creators already reviewed this engagement
<rolling de-duplicated list, so no creator is profiled/pitched twice>

---
Provenance: session-local log (no server-side saved-search API exists — this
memo is harness-local; persisted to workspace if available).
Credits used this run: ~<N> (0 for log/dedupe; 2 per diff search).
```

## Honesty rules

- **Dedupe saves credits by spending none** — log/dedupe modes make zero tool
  calls; only `diff` spends 2 credits, and only when the user wants the delta.
- **Be honest about persistence limits.** The MCP has no server-side
  saved-search/diff API; the memo is harness-local (session context, or a
  workspace file if the harness has one). Never imply a durable server-side
  saved search.
- **Near-duplicate ≠ identical.** Flag overlap, but let the user decide to
  re-run — sync changes mean even an identical search can return new creators
  (that's exactly what `diff` is for).
- **Freshness-gate new entrants.** Creators newly surfaced by a diff still pass
  the Freshness Gate before any client-facing use.
- **PII invariant (convention 7).** The log stores identifiers and search
  params only — no contact info, regardless of source.

## Credit footprint

thorough: 0 credits for `log`/`dedupe`; 2 credits per `diff` search ·
thrifty: identical — this skill exists to REDUCE spend, so both modes favor
reuse over re-running; thrifty additionally suppresses optional diff searches
unless explicitly requested.
