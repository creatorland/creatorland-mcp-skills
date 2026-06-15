---
name: outreach-standup
description: A terse recurring standup digest of what MOVED in your creator outreach since last run — new replies (interested/question/declined), new yeses, stalls approaching Day-7, new opt-outs, and the single most important "do this next." Use when the user says "outreach standup", "what moved in my outreach since yesterday", "daily outreach digest", or "any new replies/yeses today". Read-only, free, schedulable. For the full board, use connection-pipeline-tracker.
---

# Outreach Standup

A brand running active outreach doesn't need the whole board every morning — it
needs the **delta**: what changed since yesterday and the one thing to do about
it. This skill reads the brand's live outreaches and emits a tight, scannable
standup digest of MOVEMENT — new replies, new yeses, new stalls, new opt-outs —
plus a single "do this next." It is strictly **read-only** and **free**: it
calls only the two free connection-read tools, never reaches anyone, never
charges, never shows or infers contact info. Built to be brief and schedulable —
a great fit for a daily or weekly scheduled task that pings you a morning recap.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions) and ${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md
(THE connection contract — tool schemas, entitlement/graceful-degradation, and
the privacy invariants this digest lives inside).

> This is the **terse recurring delta**, not the full board. It reports counts +
> conn_refs + the next action and stops. If the user wants the full
> stage-grouped pipeline (every queued/sending/delivered row laid out), point
> them to **`connection-pipeline-tracker`** — same read mechanics, fuller view.
> It does not draft replies (→ `reply-triage`), does not reach creators, does
> not price. It only reads `list_connections` (free) and `get_connection_status`
> (free) and renders the movement.

## Inputs to collect

- **Window** *(optional)* — how far back "moved" reaches: `since yesterday`
  (default for a daily digest) or `this week` (default for a weekly run). Used
  to scope what counts as "new" movement against the last-run snapshot. If the
  user gives neither and there's no prior snapshot, treat the whole current
  state as the baseline and say so (never fake "since yesterday" on run one).
- **Campaign focus** *(optional)* — if the user names a campaign type ("just my
  spring-launch outreaches"), fetch all then narrow the digest to that
  `campaign_type` client-side (the list tool filters on status, not campaign).

Never re-ask anything the list already tells you. No credit mode applies — the
whole skill is free.

## Flow

**Step 0 — Entitlement / empty-state pre-check (graceful, never an error).**
The plan may not include `creator_connections`, or may have no outreaches yet.
Either way this skill **degrades to one honest line and never errors**:

- If `list_connections` returns the **refused/non-entitled envelope** (per
  connection-flow.md): *"Connections aren't on your plan — nothing moving to
  report. Here's how to upgrade."* Stop; do not fabricate a digest.
- If entitled but `list_connections` returns **empty**: *"Nothing moving —
  you have no outreaches yet. Once you reach creators (via a connection-enabled
  casting skill), this digest will track what changes day to day."*

**Step 1 — Load the last-run snapshot (local, free).** The "since last run"
diff is client-side — there is no server-side change-feed. Read the snapshot
from `outreach-standup/state.json` in the workspace (create the directory on
first run). Schema:

```json
{
  "last_run": "<ISO date>",
  "seen": { "<conn_ref>": { "status": "<last status>", "touches": "<n>/3", "last_seen": "<ISO date>" } }
}
```

If no snapshot exists, this is a **baseline** run: render current state labeled
as baseline (counts only, no "new since" framing) and tell the user tomorrow's
run produces the real delta.

**Step 2 — Pull the outreaches (free).** One call, newest-first:

```json
list_connections { "limit": 100 }
```

Each row returns `conn_ref`, `status`, `campaign_type`, and next scheduled
touch (no contact info — none is returned, by design). Drop rows whose
`campaign_type` doesn't match a given campaign focus before diffing.

**Step 3 — Detail only what's worth detailing (free).** For rows whose status
is in an action bucket (interested / question / declined / opted-out) or that
look like a stall (`delivered`, no reply, late in the sequence), call:

```json
get_connection_status { "conn_ref": "<ref from step 2>" }
```

→ status, touches sent (of 3), latest reply classification, next scheduled
touch. Still free, still no contact details. Don't call it on rows the list
already fully describes (e.g. a fresh `queued` row).

**Step 4 — Diff against the snapshot → the movement.** Compare each current
`conn_ref`'s status against `seen`. Bucket the CHANGES (a row whose status is
unchanged since last run is steady-state, not movement, and does not appear):

- **New replies** — moved into `replied_interested` / `replied_question` /
  `replied_declined` since last run. Count each class.
- **New yeses** — newly `replied_interested` (broken out — these are the
  intro-brokering moments).
- **New stalls** — `delivered`, no reply, Day-7 of the 3-touch sequence now
  approaching (wasn't flagged stalling last run).
- **New opt-outs** — newly `opted_out` since last run.

**Step 5 — Pick the single "do this next."** One action item, highest-leverage
first: open questions needing answers (→ `reply-triage`) usually outrank new
yeses to broker, which outrank stalls to nudge. State it as one line with a
count and a pointer (e.g. *"3 questions need answers → reply-triage"*).

**Step 6 — Write the digest and update state.** Merge this run's statuses into
`seen`, stamp `last_run`, save, then emit the standup block.

## Deliverable

A tight, scannable standup block — counts and conn_refs and the next action,
nothing more. Mirror talent-scout's "what's changed since last time" terseness:

```markdown
# Outreach Standup — <brand / engagement>
_<window, e.g. "since yesterday"> · <date> · Creatorland Data_

**Moved since last run (<M>):**
- New replies: <i> interested · <q> questions · <d> declined
- New yeses: <i> → ready to broker (<conn_refs>)
- New stalls: <s> delivered, Day-7 approaching (<conn_refs>)
- New opt-outs: <o> (<conn_refs>)

**Do this next:** <single highest-leverage action + count> → <pointer skill>
_e.g. "3 questions need answers → reply-triage"_

_Quiet run? "Nothing moved since <last run> — pipeline is steady. (That's signal too.)"_

---
Counts are facts, not forecasts — this is what changed, never a promise of a yes.
Status is brand-safe; contact is not — no contact details are shown or inferred
(none are returned by these tools). On a confirmed yes, Creatorland makes the
double-opt-in intro. Full board → connection-pipeline-tracker.
Provenance: Creatorland Data MCP · list_connections + get_connection_status
(read-only) · diff vs <last run date> snapshot · <date>.
Credits used this run: 0 (both connection-read tools are free).

> Scheduled-task fit: in a harness with scheduled tasks (e.g. Cowork), schedule
> "run my outreach standup" daily (morning) or weekly — this digest is built for
> it. Honest constraint: no server-side push/change-feed; "since last run" is a
> local snapshot diff, so it only updates when the task actually runs.
```

If the entitlement or empty-state branch fired, the deliverable is just that one
honest line (plus the upgrade pointer for the non-entitled case) — never a fake
digest. If it's a baseline run, label it baseline and report counts only.

## Honesty rules

- **Read-only, always.** Calls only `list_connections` and
  `get_connection_status`. Never `request_creator_connection` — never reaches a
  creator, never advances a sequence, never charges. If the user wants to act,
  point to the skill that acts (`reply-triage` for replies; a
  connection-enabled casting skill to reach new creators).
- **Delta, not the board.** This is the terse recurring movement digest. The
  full stage-grouped view is `connection-pipeline-tracker`; always point there
  for "show me everything," and never duplicate the full board here.
- **Counts are facts, not forecasts.** "3 new yeses" is what happened, not a
  forecast of bookings; "stalled" is the sequence state, not a verdict on the
  creator. Never promise a reply or a yes.
- **Status is brand-safe; contact is not.** A connection's existence + status +
  conn_ref is safe to show; a creator's contact details are never returned by
  these tools and never appear or are inferred (convention 7 + connection-flow
  privacy invariants). A new yes is "ready to broker via Creatorland's
  double-opt-in intro," never an address.
- **The diff is client-side.** "Moved since last run" is computed against a
  local snapshot, not a server change-feed — so it only reflects movement since
  the last time this skill actually ran. Say so on the first few runs and label
  baseline runs as baseline.
- **Graceful degradation, never an error.** No entitlement → "not on your plan,
  here's how to upgrade." No outreaches → "nothing moving yet." A quiet window →
  "nothing moved — pipeline is steady." Always one honest line, never a thrown
  error or an invented row.

## Credit footprint

thorough: 0 credits · thrifty: 0 credits — `list_connections` and
`get_connection_status` are both free, so this skill is free at any size and in
any mode. It reaches no one and runs no market-intel or profile calls.
