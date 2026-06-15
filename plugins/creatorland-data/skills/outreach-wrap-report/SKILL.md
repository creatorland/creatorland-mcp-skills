---
name: outreach-wrap-report
description: Post-campaign wrap report built from a campaign's REAL outreach outcomes — pull the brand's connections for that campaign and compute the funnel (reached → delivered → replied [interested/question/declined] → accepted) with response rate, interested-rate by tier/vertical where derivable, and median time-to-yes. Use when the user says "outreach wrap report", "how did my campaign do", "reply/accept funnel for this campaign", or "post-campaign outreach summary". Read-only and free; deliverable is an exec-readable paste-into-deck report.
---

# Outreach Wrap Report

A campaign ends and someone asks "so — how did it actually go?" This skill
answers from real outreach outcomes, not placeholders: it reads the brand's
connections for a named campaign and computes the funnel — reached → delivered
→ replied (by classification) → accepted — with a response rate, an
interested-rate cut by tier or vertical where the data supports it, and a median
time-to-yes from the timestamps the tools return. It frames the result like a
`wrap-report-skeleton` deck (exec-readable, paste-into-deck) but with **live
connection data** standing in where that skeleton leaves placeholders — and it
keeps an honest wall between what the corpus CAN measure (the reach/reply
funnel) and what it CAN'T (actual booking dollars, deliverable performance),
which stay labeled placeholders for the brand's own analytics. For a brand
operator or account lead doing post-campaign reporting on an outreach program.
It is strictly **read-only and free** — it reads the two free connection tools,
never reaches anyone, never charges, never shows or infers contact info.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions) and ${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md
(THE connection contract — tool schemas, entitlement / graceful-degradation, and
the privacy invariants this report lives inside).

> This is the **retrospective**, not the action and not the live board. It does
> not reach creators, does not draft replies, does not price. For the live
> who-needs-me-today view use `connection-pipeline-tracker`; to answer a reply
> use `reply-triage`; to reach NEW creators use the connection-enabled casting
> skills; for a generic spend-vs-market wrap deck off a paid roster use
> `wrap-report-skeleton`. This skill only reads `list_connections` (free) and
> `get_connection_status` (free) and renders the outcome funnel.

## Inputs to collect

- **Campaign label / scope** (required) — which campaign to report on. The list
  tool filters on status, not campaign, so map this to a `campaign_type` (or a
  set of them) and narrow client-side. If the user just says "my last campaign"
  and only one `campaign_type` appears in the data, use it and say so; if
  several appear, list them and ask which (or offer "all outreaches" as one
  combined report).
- **Breakdown axis** *(optional)* — `tier` or `vertical`, if the user wants the
  interested-rate sliced. Only produce a slice the data actually supports (see
  Honesty rules — derive tier/vertical only from fields the connection rows
  carry or from in-session roster context; never invent a creator's tier).
- **Detail depth** *(optional)* — by default call `get_connection_status` on
  every in-scope row so reply classifications and timestamps are exact. Both
  read tools are free, so this is about completeness, not cost.

No credit mode applies — the whole skill is free. Never re-ask anything the list
already tells you.

## Flow

**Step 0 — Entitlement / empty-state pre-check (graceful, never an error).**
The brand's plan may not include `creator_connections`, or there may simply be
no outreach for this campaign. Either way this skill **degrades gracefully and
never errors** — "nothing to report yet," never a thrown error or a faked funnel:

- If `list_connections` returns the **refused / non-entitled envelope** (per
  connection-flow.md): *"Connections aren't on your plan, so there's no outreach
  to wrap up yet — here's how to upgrade."* Stop; do not fabricate a funnel.
- If the plan is entitled but `list_connections` returns **empty** (no
  outreaches at all, or none matching the campaign): *"Nothing to report yet —
  I don't see any outreach on that campaign. Once you've reached creators (via a
  connection-enabled casting skill), the wrap report will have a funnel to
  compute."*

**Step 1 — Pull the campaign's outreaches (free).** One call, newest-first:

```json
list_connections { "limit": 100 }
```

Each row returns `conn_ref`, `status`, `campaign_type`, and `next scheduled
touch` (no contact info — none is returned, by design). **Filter to the campaign
scope client-side** by `campaign_type` (the list tool can't filter on campaign).
If the campaign spanned more than 100 outreaches, page by status filter to be
exhaustive and note the count covered.

**Step 2 — Detail every in-scope outreach (free).** For each `conn_ref` in
scope, pull the full record so reply classification and timestamps are exact:

```json
get_connection_status { "conn_ref": "<ref from step 1>" }
```

→ lifecycle status, touches sent (of 3), latest reply classification if any,
next scheduled touch, and the timestamps the tool returns (created / first-sent
/ reply / accepted, whatever is present). Still no contact details, still free —
so detail every row; the funnel is only as honest as the per-row classifications.

**Step 3 — Compute the funnel (no tool calls).** Roll the in-scope outreaches up
into the stages, counting each outreach once at the furthest stage it reached:

```
reached (all in scope)
  → delivered (delivered or any later stage)
    → replied (replied_interested · replied_question · replied_declined, or accepted)
      → accepted (accepted_inapp)
```

Derived rates (each a fact about what happened, never a forecast):
- **Response rate** = replied ÷ delivered.
- **Interested-rate** = replied_interested ÷ delivered (the warm signal).
- **Accept-rate** = accepted ÷ delivered.
- **Reply mix** = interested / question / declined as a share of replies.
- **Median time-to-yes** = median(accepted_timestamp − first_sent_timestamp)
  across accepted outreaches. **If the tools didn't return the timestamps needed,
  report it as "unknown" — never estimate it.** State N (how many accepts the
  median is over).

**Step 4 — Slice by tier/vertical only where derivable (no tool calls).** If a
breakdown was requested AND tier/vertical is present on the rows or available
from in-session roster context, compute the response- and interested-rate per
slice. Where it isn't derivable, say so plainly and skip the slice rather than
guessing a creator's tier. Mark any slice with too few outreaches (see below) as
**"n too small to rate."**

**Step 5 — Small-N caveat.** Outreach funnels are tiny by nature. If a rate's
denominator is **under ~8 delivered**, show the raw counts but caveat the
percentage as **"n too small to rate"** — a 1-of-3 reply is "1 of 3," not "33%
response rate." Apply the same floor to every tier/vertical slice independently.

## Deliverable

An exec-readable wrap report in markdown (paste-into-deck), mirroring
`wrap-report-skeleton`'s slide structure — but the funnel slides are filled from
**live connection data**, and only the brand's-own-metrics slides stay labeled
placeholders:

```markdown
# Outreach Wrap — <campaign label / brand>
_Creatorland Data · outreach outcomes as of <date> · <N> outreaches in scope_

## Slide: Headline
Reached **<reached>** creators · **<delivered>** delivered · **<replied>**
replied · **<accepted>** accepted.
Response rate **<r>%** · interested-rate **<i>%** · accept-rate **<a>%**
<"— small sample, read as counts" if any denominator is under the floor>.

## Slide: The outreach funnel
| Stage | Count | Rate vs delivered |
|---|---:|---:|
| Reached | <reached> | — |
| Delivered | <delivered> | <delivered/reached> |
| Replied | <replied> | <r>% |
| — interested | <ri> | <ri/delivered>% |
| — question | <rq> | <rq/delivered>% |
| — declined | <rd> | <rd/delivered>% |
| Accepted (in-app) | <accepted> | <a>% |
<rates under the small-N floor render as raw counts + "n too small to rate">

## Slide: Reply quality & speed
Reply mix: <interested>% interested · <question>% question · <declined>% declined
(of <replied> replies).
Median time-to-yes: **<median> days** (over <n> accepts) — or **unknown**
(timestamps not returned by the tools for these outreaches).

## Slide: By <tier / vertical>            [only where derivable from the data]
| <Tier/Vertical> | Reached | Delivered | Replied | Interested-rate |
|---|---:|---:|---:|---:|
| <slice> | <n> | <n> | <n> | <i>% or "n too small to rate" |
> Slices we couldn't derive (tier/vertical not on the outreach records): <list>.
> Omitted rather than guessed.

## Slide: Bookings & performance        [placeholder — your data]
❏ Deals booked · ❏ booking $ · ❏ deliverables shipped · ❏ impressions /
engagement / EMV — supply from your own CRM and analytics. The Creatorland Data
MCP measures the **outreach funnel** (reach → reply → accept), not booking
dollars or deliverable performance; these slots are deliberately left labeled
rather than estimated. An accept is an in-app yes, **not** a confirmed booking.

## Slide: Learnings & next campaign
❏ What converted (yours to read off the funnel) · suggested follow-ups:
re-run the warmest interested-rate segment for the next flight via the
connection-enabled casting skills; answer open questions with `reply-triage`.

---
Status is brand-safe; contact is not — this report shows funnel counts and
stages only, never a creator's contact details (none are ever returned by these
tools). On a confirmed yes, Creatorland makes the double-opt-in intro.
Funnel basis: <delivered> delivered outreaches in scope; rates under ~8
denominator shown as counts ("n too small to rate").
Provenance: Creatorland Data MCP · list_connections + get_connection_status
(read-only) · <date>.
Credits used this run: 0 (both connection-read tools are free).
```

If the entitlement or empty-state branch fired, the deliverable is just that one
honest "nothing to report yet" line (plus the upgrade pointer for the
non-entitled case) — never a fake funnel.

## Honesty rules

- **Read-only, always.** This skill calls only `list_connections` and
  `get_connection_status`. It never calls `request_creator_connection`, never
  reaches a creator, never advances a sequence — it reports what already
  happened. It points to the acting skill if the user wants to act.
- **Reply ≠ booking; accept ≠ revenue.** The funnel measures outreach outcomes
  (reach / reply / accept), full stop. An accept is an in-app "yes," not a
  signed deal or a dollar. Booking $ and deliverable performance have no corpus
  source — they stay labeled placeholders for the brand's own analytics, never
  estimated, never inferred.
- **Counts are facts; rates are not promises.** "Response rate so far" is a
  tally of what happened, not a forecast of the next campaign. Never imply a
  rate predicts future outreach.
- **Small-N honesty.** Under ~8 delivered in any cut → show raw counts and
  caveat the percentage as "n too small to rate." Don't dress 1-of-3 up as 33%.
- **Median time-to-yes is timestamp-bound.** Compute it only from timestamps the
  tools actually returned; otherwise "unknown." Never estimate a duration.
- **Slice only where derivable.** Compute a tier/vertical breakdown only from
  fields on the records or in-session roster context; never invent a creator's
  tier or vertical to fill a slice — list the omitted slices instead.
- **Status is brand-safe; contact is not.** A connection's existence + lifecycle
  status + reply classification is safe to report; a creator's contact details
  are never returned by these tools and never appear or are inferred here
  (convention 7 + connection-flow privacy invariants). No raw reply text in the
  report — classifications only (interested / question / declined), never the
  creator's words.
- **Graceful degradation, never an error.** No `creator_connections` entitlement
  → "not on your plan, here's how to upgrade." No matching outreach → "nothing
  to report yet." Always a clean, honest line — never a thrown error or an
  invented funnel.
- **Free means free.** Both read tools cost 0 credits; say so. Detailing every
  row is not a paid upsell — `get_connection_status` is free at any volume.

## Credit footprint

thorough: 0 credits · thrifty: 0 credits — `list_connections` and
`get_connection_status` are both free, so this skill is free at any size and in
any mode. It reaches no one and runs no market-intel or profile calls.
