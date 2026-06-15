---
name: suppression-aware-prescreen
description: Before you reach out, pre-screen a creator list against this brand's suppression ledger (opted-out) and anyone already in an ACTIVE sequence for this brand — partition into reachable / skip-opted-out / skip-already-active so you don't waste credits or harass anyone. Use when the user says "pre-screen this list before I reach out", "who on this list opted out or is already being contacted", "dedupe against suppression", or "check before outreach". Read-only and free; deliverable is a partition table + the clean reachable set.
---

# Suppression-Aware Pre-Screen

Before a brand commits a list to a campaign, two kinds of names should never make
it to the matchmaker: creators who already **opted out** of this brand's outreach,
and creators already in an **ACTIVE sequence** for this brand (a repeat would be
**refused, uncharged, and is a harassment / sender-reputation risk**). This skill
takes the list you're about to reach, reads the brand's connection records, and
partitions it into **REACHABLE / SKIP — OPTED OUT / SKIP — ALREADY ACTIVE** —
telling you who and why for every skip, and handing back a clean set ready for
`cast-and-connect` or `conflict-safe-connect`. It is strictly **read-only**: it
calls only the free `list_connections`, never `request_creator_connection`, never
reaches anyone, never charges. For any brand operator about to commit to a reach.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions) and ${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md
(THE connection contract — the suppression / active-sequence pre-screen, graceful
degradation, and the privacy invariants this screen lives inside).

> This is the **standalone** version of the suppression / active-sequence
> pre-flight that the reach skills embed. Run it before you commit a list to a
> campaign, so you size the real reach (and its cost) on the clean set. Siblings:
> `connection-pipeline-tracker` is the FULL board of everything in flight (not a
> list-screen); `reply-triage` handles replies you've received. This skill takes
> a candidate list IN and returns the reachable subset OUT — it does not reach,
> does not draft, does not price the reach. Hand its clean set to
> `cast-and-connect` / `conflict-safe-connect` to actually reach.

## Inputs to collect

- **The list to screen** (required) — the creators you're about to reach, in any
  format: handles, an uploaded sheet, or an in-session shortlist (e.g. the output
  of `brief-to-shortlist`). Map each to one identifier so it can be matched
  against the connection records. If no list is given there is nothing to screen;
  ask once for it.
- **Brand / campaign scope** *(optional)* — the connection records are already
  scoped to the brand's account, so no brand id is needed. If the user names a
  **campaign** ("just for the spring launch"), the active-sequence check is
  narrowed to outreaches whose `campaign_type` matches; otherwise an active
  sequence for ANY campaign of this brand counts as already-active for the
  reach-refusal purpose.

Never re-ask anything the list or the connection records already tell you. No
credit mode applies — the whole skill is free (`list_connections` is free).

## Flow

**Step 0 — Entitlement / empty-state pre-check (graceful, never an error).**
The brand's plan may not include `creator_connections`, or may simply have no
outreaches yet. Either way this skill **degrades gracefully and never errors**:

- If `list_connections` comes back as the **refused / non-entitled envelope**
  (per connection-flow.md), say plainly: *"Connections aren't on your plan, so
  there's nothing to pre-screen against yet — every name on your list is
  reachable as far as our records go. Here's how to upgrade to start reaching."*
  Treat the whole list as REACHABLE (there is no suppression ledger or active
  sequence to subtract) and stop — do not fabricate skips.
- If the plan is entitled but `list_connections` returns **empty**, say:
  *"No prior outreaches on record — nothing to pre-screen against, so the full
  list is clear to reach."* Again, treat the whole list as REACHABLE.

**Step 1 — Pull the brand's outreaches (free).** One call, newest-first:

```json
list_connections { "limit": 100 }
```

Each row returns `conn_ref`, `status`, `campaign_type`, and the next scheduled
touch — **no contact info** (none is ever returned, by design). If more than 100
outreaches exist, page by the lifecycle statuses that matter to this screen so
nothing is missed:

```json
list_connections { "status": "opted_out", "limit": 100 }
```
```json
list_connections { "status": "queued", "limit": 100 }
```

(repeat for the other ACTIVE statuses below). If a campaign scope was given, keep
only rows whose `campaign_type` matches for the active-sequence test; opt-outs
count brand-wide regardless of campaign.

**Step 2 — Classify the connection records (no tool call).** From the rows:

- **OPTED-OUT set** = every outreach with status `opted_out`. These creators
  asked this brand to stop — the suppression ledger. Brand-wide.
- **ACTIVE set** = every outreach in a live, mid-sequence state where a repeat
  request would be **refused and not charged**: `queued`, `sending`,
  `delivered`, `replied_question`, and `replied_interested` (the sequence /
  conversation is still open). Treat `accepted_inapp` as active too — they're
  already engaged; re-reaching is noise. **Not** active for this purpose:
  `replied_declined` and `expired` (the sequence is closed — re-reaching is a
  judgement call, not an automatic refusal; surface them as a note, not a skip).

**Step 3 — Partition the input list against those sets (no tool call).** For each
creator on the list to screen, match against the OPTED-OUT and ACTIVE sets:

- In OPTED-OUT → **SKIP — OPTED OUT** (cite the `conn_ref`).
- Else in ACTIVE → **SKIP — ALREADY ACTIVE** (cite the `conn_ref`, status, and
  campaign — "a repeat would be refused and uncharged").
- Else → **REACHABLE** (clear of suppression and active sequences in our
  records).

Compute the **credit savings**: each avoided reach = **10 credits not wasted**
(`request_creator_connection` is 10 credits and an already-active repeat would be
refused-but-still-a-mistake; an opt-out reach is a reputation cost). Savings =
10 × (count of SKIP rows).

## Deliverable

A pre-screen partition in markdown:

```markdown
# Outreach Pre-Screen — <list / campaign name>
_Creatorland Data · screened against this brand's connection records · <date>
<· campaign scope, if any>_

## Partition
| Creator | Verdict | Why | conn_ref |
|---|---|---|---|
| @<handle> | ✅ REACHABLE | clear in our records | — |
| @<handle> | 🚫 SKIP — OPTED OUT | this creator opted out of your outreach | <conn_ref> |
| @<handle> | ⏳ SKIP — ALREADY ACTIVE | already in a live <campaign_type> sequence (<status>) — a repeat would be refused & uncharged | <conn_ref> |
<one row per creator on the list>

## Reachable set (clear to hand off)
@<handle>, @<handle>, … &nbsp;(<R> of <T>)
> Ready for **cast-and-connect** or **conflict-safe-connect** to actually reach.
> (This skill does not reach — it returns the clean list.)

## Skipped (and why)
- 🚫 **Opted out (<o>):** @<handle> — asked your brand to stop; do not re-reach.
- ⏳ **Already active (<a>):** @<handle> — live <campaign_type> sequence, <status>; track it in `connection-pipeline-tracker`, don't re-reach.
<If none: "Nothing skipped — the whole list is clear in our records.">

## Worth a look (not skipped)
<Any list creators matching a CLOSED outreach — replied_declined / expired —
listed as a judgement call, not an automatic skip; or "None.">

## Credit savings
Pre-screening held back <S> reach(es) you'd otherwise have committed —
**~<10×S> credits (~$<0.25×S>) not wasted**, plus the sender-reputation cost of
re-contacting an opted-out or already-active creator avoided.

---
A clean screen means **none of these are suppressed or in an active sequence in
our records** — not an absolute guarantee. This is a read-only pre-flight; it
reaches no one. Contact details are never returned by these tools and never
appear here.
Provenance: Creatorland Data MCP · list_connections (read-only, free) · <date>.
Credits used this run: 0 (`list_connections` is free; nothing was reached).
```

If the entitlement or empty-state branch fired, the deliverable is the honest
one-liner plus the full list marked REACHABLE — never a fabricated skip.

## Honesty rules

- **A clean screen is "none are suppressed / active IN OUR RECORDS" — never an
  absolute guarantee.** The connection records are this brand's outreach history,
  not every interaction a creator has ever had; phrase it that way everywhere.
- **Read-only, always.** This skill calls only `list_connections`. It **never**
  calls `request_creator_connection`, never reaches a creator, never advances a
  sequence, never charges. If the user wants to act on the clean set, it points
  to the skill that reaches — it does not reach itself.
- **A skip is a protection, not a verdict on the creator.** "Opted out" and
  "already active" describe the record, not the creator's worth — frame them as
  "don't re-reach right now," and route already-active ones to the pipeline
  tracker rather than dropping them silently.
- **Closed ≠ active.** `replied_declined` and `expired` are surfaced as a
  judgement call ("worth a look"), never auto-skipped — re-reaching a lapsed
  sequence is the operator's decision.
- **Graceful degradation, never an error.** No `creator_connections` entitlement
  or no outreaches on record → "nothing to pre-screen, the list is clear," with
  the whole list marked REACHABLE — never a thrown error, never an invented skip.
- **Credit savings are avoided waste, stated honestly.** Each skip saves the
  ~10 credits an avoided reach would cost (an already-active repeat is refused
  anyway; an opt-out reach is a reputation cost) — a real saving, not a discount.
- **PII invariant (convention 7 + connection-flow privacy).** The screen returns
  counts, `conn_ref`s, and status only — **no contact info**, regardless of
  source. A connection's existence + status is brand-safe; a creator's address is
  not, and never appears or is inferred here.

## Credit footprint

thorough: 0 credits · thrifty: 0 credits — `list_connections` is free, so this
skill is free at any list size and in any mode. It reaches no one, runs no
profile or market-intel calls, and exists precisely to **save** the 10×S credits
a list of S already-suppressed / already-active names would otherwise waste.
