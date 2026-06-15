---
name: connection-pipeline-tracker
description: Live pipeline board of every creator outreach this brand has running — grouped by lifecycle stage (queued → delivered → replied → accepted → opted-out/expired), with action-needed buckets surfaced and touches-sent + next-touch per outreach. Use when the user says "show my outreach pipeline", "status of my connections", "outreach board", "who replied / who's pending", or "track my creator outreaches". Read-only and free — reads the connection tools, never reaches anyone. Deliverable is a scannable markdown board.
---

# Connection Pipeline Tracker

Once a brand has outreaches in flight, the question stops being "who do I reach?"
and becomes "where does everything stand right now, and what needs me today?"
This skill answers that: it reads the brand's live outreaches and lays them out
as a pipeline board grouped by lifecycle stage, with the action-needed buckets
(interested, question, stalled) pulled to the top. It is strictly **read-only** —
it calls only the two free connection-read tools and never reaches anyone, never
charges, and never shows or infers contact info. For any brand operator running
an active outreach program who wants a status-at-a-glance view.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions) and ${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md
(THE connection contract — tool schemas, entitlement/graceful-degradation, and
the privacy invariants this board lives inside).

> This is the **board**, not the action. It does not draft replies, does not
> reach creators, does not price. If a reply needs answering, point to
> `reply-triage`; if a stalled outreach needs a follow-up nudge, that's the
> follow-up flow / `cast-and-connect`; to reach NEW creators, use the
> connection-enabled casting skills. This skill only reads `list_connections`
> (free) and `get_connection_status` (free) and renders the state.

## Inputs to collect

- **Status filter** *(optional)* — if the user only wants one stage ("just
  show me who replied", "what's still pending"), pass it through as the
  `list_connections` `status` filter. Default: pull everything (no filter) so
  the full board renders.
- **Campaign focus** *(optional)* — if the user names a campaign type ("just my
  spring-launch outreaches"), filter the rendered board to that `campaign_type`
  client-side (the list tool filters on status, not campaign — so fetch all,
  then narrow in the board).
- **Detail depth** *(optional)* — by default, call `get_connection_status` only
  on the outreaches worth detail (everything in an action-needed bucket, plus
  anything mid-sequence where the next touch matters). The user can ask for
  "full detail" to expand `get_connection_status` to every row. Both are free,
  so this is about output density, not cost.

Never re-ask anything the list already tells you. No credit mode applies — the
whole skill is free.

## Flow

**Step 0 — Entitlement / empty-state pre-check (graceful, never an error).**
The brand's plan may not include `creator_connections`, or may simply have no
outreaches yet. Either way this skill **degrades gracefully and never errors**:

- If `list_connections` comes back as the **refused/non-entitled envelope**
  (per connection-flow.md), say plainly: *"Connections aren't on your plan, so
  there's no outreach pipeline to show — here's how to upgrade."* Stop there;
  do not fabricate a board.
- If the plan is entitled but `list_connections` returns **empty**, say:
  *"No outreaches found — you haven't reached any creators yet. When you do
  (via a connection-enabled casting skill), they'll show up here as a board."*

**Step 1 — Pull the outreaches (free).** One call, newest-first:

```json
list_connections { "limit": 100 }
```

If the user asked for a single stage, scope the call:

```json
list_connections { "status": "replied_question", "limit": 100 }
```

Each row returns `conn_ref`, `status`, `campaign_type`, and `next scheduled
touch` (no contact info — none is returned, by design). If a campaign focus was
given, drop rows whose `campaign_type` doesn't match before rendering.

**Step 2 — Detail the ones worth detailing (free).** For every outreach in an
action-needed bucket (interested / question / stalled), and any mid-sequence
row where touch progress matters, call:

```json
get_connection_status { "conn_ref": "<ref from step 1>" }
```

→ lifecycle status, touches sent (of 3), latest reply classification if any,
next scheduled touch. Still no contact details, still free. (In "full detail"
mode, run this for every row.) These calls are free, so detail liberally — but
don't call it on rows where the list already told you everything (e.g. a fresh
`queued` row with nothing to expand).

**Step 3 — Bucket by lifecycle stage and compute age.** Group every outreach
into its stage and, within each, sort by what the operator should act on first.
The lifecycle order:

```
queued → sending → delivered →
  replied_interested · replied_question · replied_declined →
  accepted_inapp →
  opted_out · expired
```

For each outreach capture: `conn_ref`, campaign type, **touches sent (of 3)**,
**next scheduled touch**, and **age** (time since the outreach was created /
first sent — derive from the timestamps the tools return; if a precise created
timestamp isn't returned, say "age unknown" rather than guessing).

**Step 4 — Lift the action-needed buckets to the top.** Three buckets are where
the operator's attention belongs, so they lead the board:

- **Interested — awaiting your move** (`replied_interested`): the creator said
  yes-ish; the brand needs to advance it. The double-opt-in intro is the
  matchmaker's to make on a confirmed yes — frame these as "ready for you to
  take forward," not "here's their email."
- **Question — needs a reply** (`replied_question`): the creator asked
  something; a reply is owed. → point to **`reply-triage`** to draft it.
- **Stalled — delivered, no reply, Day-7 approaching** (`delivered` with no
  reply classification and the next/last touch nearing the Day-7 end of the
  3-touch sequence): the sequence is about to lapse. → point to the
  **follow-up flow** if the brand wants one more nudge before it expires.

Everything else (queued, sending, mid-sequence delivered, accepted, declined,
opted-out, expired) renders below as the steady-state pipeline.

## Deliverable

A clean, scannable markdown board (mirrors talent-scout's what's-changed style —
lead with what needs action, steady state below):

```markdown
# Outreach Pipeline — <brand / engagement>
_Creatorland Data · live board as of <date> · <campaign focus, if any>_

## Needs you now (<A>)

### Interested — awaiting your move (<i>)
| conn_ref | Campaign | Touches | Replied | Age |
|---|---|---|---|---|
| <ref> | <campaign_type> | <n>/3 | interested | <age> |
> Ready to take forward — Creatorland makes the double-opt-in intro on a confirmed yes.

### Question — needs a reply (<q>)
| conn_ref | Campaign | Touches | Asked at | Age |
|---|---|---|---|---|
| <ref> | <campaign_type> | <n>/3 | <when> | <age> |
> → Draft replies with **reply-triage**.

### Stalled — delivered, no reply, Day-7 approaching (<s>)
| conn_ref | Campaign | Touches | Next touch | Age |
|---|---|---|---|---|
| <ref> | <campaign_type> | <n>/3 | <date or "sequence ending"> | <age> |
> → One more nudge before it expires? Use the follow-up flow.

## Pipeline (steady state)

| Stage | Count | conn_refs |
|---|---|---|
| queued | <n> | <refs> |
| sending | <n> | <refs> |
| delivered (mid-sequence) | <n> | <refs> |
| accepted (in-app) | <n> | <refs> |
| declined | <n> | <refs> |
| opted out | <n> | <refs> |
| expired | <n> | <refs> |

## At a glance
- **<T> outreaches total** · <A> need action · <live> live · <closed> closed.
- Reply rate so far: <r>/<delivered> delivered have replied (a count, not a promise).

---
Status is brand-safe; contact is not — this board shows where each outreach
stands, never a creator's contact details (none are ever returned by these
tools). On a confirmed yes, Creatorland makes the double-opt-in intro.
Provenance: Creatorland Data MCP · list_connections + get_connection_status
(read-only) · <date>.
Credits used this run: 0 (both connection-read tools are free).

> Live-artifact tip: in a harness with live artifacts (e.g. Cowork), this board
> is a strong auto-refresh candidate — pin it as an artifact and re-run the read
> to keep the pipeline current without re-asking. (Honest constraint: there's no
> server-side push/change-feed; "refresh" means re-reading the free tools on
> demand or on a schedule, not a live socket.)
```

If the entitlement or empty-state branch fired, the deliverable is just that one
honest line (plus the upgrade pointer for the non-entitled case) — never a fake
board.

## Honesty rules

- **Read-only, always.** This skill calls only `list_connections` and
  `get_connection_status`. It never calls `request_creator_connection`, never
  reaches a creator, never advances a sequence — it renders state. If the user
  wants to act, it points to the skill that acts.
- **Status is brand-safe; contact is not.** A connection's existence + lifecycle
  status is safe to show; a creator's contact details are never returned by
  these tools and never appear or are inferred in this board (convention 7 +
  connection-flow privacy invariants). The "interested" affordance is "ready to
  take forward via Creatorland's double-opt-in intro," never an address.
- **Never promise a reply or a yes.** Counts and stages are facts; outcomes are
  the creator's. "Reply rate so far" is a tally of what's happened, not a
  forecast. "Stalled" describes the sequence state, not a verdict on the creator.
- **Graceful degradation, never an error.** No `creator_connections` entitlement
  → "not on your plan, here's how to upgrade." No outreaches → "no outreaches
  found yet." Empty stage filter → "nothing in that stage right now." Always a
  clean, honest line — never a thrown error or an invented row.
- **Free means free.** Both read tools cost 0 credits; say so. Don't imply this
  skill spends anything, and don't let "full detail" mode read as a paid upsell —
  `get_connection_status` is free at any volume.

## Credit footprint

thorough: 0 credits · thrifty: 0 credits — `list_connections` and
`get_connection_status` are both free, so this skill is free at any size and in
any mode. It reaches no one and runs no market-intel or profile calls.
