---
name: waterfall-casting
description: Self-healing tiered casting — build a premium/mid/value (or macro/mid/micro) shortlist, reach tier-1 only first, then on a decline or Day-7 no-reply release that slot's budget and reach the next-best creator down the tiers until the role is filled or budget runs out. Use when the user says "waterfall casting", "reach tier 1 then fall back", "auto-fallback to the next tier if they pass", or "tiered outreach with backfill". Reaches a wave, advances on report-back; never promises a yes. Deliverable is the tiered plan + the wave's Reached table.
---

# Waterfall Casting

Tiered casting that heals itself. You have N roles to fill and a ranked,
tiered shortlist — premium/mid/value or macro/mid/micro. Instead of reaching
everyone at once and overspending, this skill reaches **tier-1 only** first,
then watches the connection tools: when a tier-1 outreach comes back
`replied_declined` or expires at Day-7 with no reply, it **releases that slot's
budget to tier-2** and reaches the next-best not-yet-contacted creator —
cascading down the tiers until each role is filled or budget is exhausted. For
brand-side managers and agency casting directors filling a fixed number of
slots who want first-choice talent first and an automatic, honest fallback
rather than a single all-in wave. It is **iterative**: it lays out the waterfall
plan + budget up front, reaches the first wave, and on a later invocation (or
when the user reports back) advances the waterfall a wave at a time.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions) and ${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md
(THE connection contract — the 3 tool schemas, the mandatory pre-flight, graceful
degradation, privacy invariants). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> This skill **composes** siblings by reference and never restates their
> internals:
> - It sources the **tiered shortlist** from `brief-to-shortlist` (run that
>   skill's casting flow to build the ranked, enriched, freshness-gated list,
>   then tier it premium/mid/value). If the user already has an in-session
>   tiered shortlist, use it as-is.
> - It reuses the **reach mechanics + mandatory pre-flight** exactly as
>   `cast-and-connect` applies them (entitlement probe, suppression pre-screen,
>   budget_band auto-fill, 10×N estimate + confirm, one `request_creator_connection`
>   per creator). This skill differs only in *which* creators it reaches *when*:
>   tier-1 first, then cascading on decline/no-reply.
> - It reads outreach state via the **same connection-read tools**
>   `connection-pipeline-tracker` reads (`list_connections` /
>   `get_connection_status`) to decide when to fall through. Where that skill
>   *renders* the board, this skill *acts* on it.
>
> If the user wants a single all-in wave (reach everyone now, no cascade), use
> `cast-and-connect`. If they want a read-only board of what's running, use
> `connection-pipeline-tracker`. If they only want the shortlist, use
> `brief-to-shortlist`. This skill is the one that **backfills automatically**.

## Inputs to collect

- **The brief OR an in-session tiered shortlist** (required) — either a written
  brief (any format; passed straight into the `brief-to-shortlist` flow, then
  tiered) or a tiered shortlist already produced this session (use as-is; don't
  re-cast). Don't make the user restructure either.
- **Roles to fill (headcount)** (required) — how many slots the campaign needs
  filled, e.g. "3 creators". This is the *target*, not a reach count; the
  waterfall reaches one creator per open slot per wave, not the whole list.
- **Budget** (required) — total outreach/creator budget. Drives how far the
  cascade can run: each open slot draws from the pooled budget, and a released
  (declined/expired) slot's budget rolls down to the next tier. Express the plan
  against this ceiling.
- **Tiering scheme** *(optional)* — `premium/mid/value` (default) or
  `macro/mid/micro`. If the shortlist already carries tier labels, keep them.
- **Opportunity fields** for outreach — `campaign_type` is **required** (e.g.
  "paid IG Reel + Story", "UGC licensing", "event appearance"); ask if the brief
  doesn't state it. Optional: `deliverables`, `comp_tags`, `timeline`,
  `brief_context`, brand-authored `personal_message`. `budget_band` is
  **auto-filled** from a corpus rate band (see Pre-flight) — don't ask unless
  the user overrides. For a promo/gifting/event/collab (not a plain casting), also collect the **structured brief** — `archetype` (`casting|product_gift|partner_promo|event_invite|paid_collab`), an `offer` (`{what, value, expiry, redemption}`), and the on-behalf-of `brand` (`{name, represented_by}`) — per the schema and required-field rules in `connection-flow.md` (the new archetypes require `brand` + `offer.what`; don't restate the schema here, reference it).
- **Credit mode** — default `thorough`; switch to `thrifty` on the trigger
  phrases in the credit-modes module.

Never ask twice for anything the brief or an existing shortlist already states —
quote it back instead. The waterfall rule itself is fixed and stated up front;
don't ask the user to re-confirm it each wave.

## Flow

This skill runs in **waves**. Wave 1 reaches tier-1. Each later invocation (or
report-back) reads current outreach state and advances the cascade. The flow
below covers both the first wave and an advancement wave — Step 2 detects which.

**Step 0 — Build (or accept) the tiered shortlist.**
- If given a **brief**: run the `brief-to-shortlist` casting flow exactly as that
  skill defines it (normalize → search → profile fan-out → Freshness Gate →
  optional conflict check → one slate-level rate call wrapped in Refusal
  Recovery → rank). Honor the same credit mode. Then **tier** the ranked output
  into premium/mid/value (or macro/mid/micro) — by follower band, rate band, or
  fit-rank as the brief implies. Do not restate or alter `brief-to-shortlist`'s
  internals; it owns the casting contract.
- If given an **in-session tiered shortlist**: use it as-is.

The output of Step 0 is a tiered, ranked, freshness-gated shortlist plus the
slate's inferred **vertical** and **rate band** (reused for `budget_band` below,
so no extra rate call is needed).

**Step 1 — Lay out the waterfall plan + budget (no reach yet, 0 outreach
credits).** Before reaching anyone, show the plan so the user understands the
cascade and the spend ceiling:
- The tiers and who's in each (ranked within tier).
- The fixed **fallback rule**, stated honestly: _"I reach tier-1 first. If a
  tier-1 creator declines or hits Day-7 with no reply, I release that slot and
  reach the next-best not-yet-contacted creator — tier-2, then tier-3 — until
  each role is filled or budget runs out. A no-reply or a decline triggers the
  fall-through; impatience does not."_
- The **budget math**: headcount × budget ceiling, and how a released slot's
  budget rolls down to the next tier. Reaching is 10 credits/creator regardless
  of tier; the *campaign* budget (the dollars paid to talent) is what cascades,
  framed by the corpus rate band per tier.

**Step 2 — Read current outreach state (free) and decide the wave.** Call the
connection-read tools exactly as `connection-pipeline-tracker` does — this is
how the skill knows whether it's Wave 1 or an advancement, and which slots have
fallen through:

```json
list_connections { "limit": 100 }
```

For any outreach this campaign already started, detail it:

```json
get_connection_status { "conn_ref": "<ref>" }
```

→ lifecycle status, touches sent (of 3), latest reply classification, next
scheduled touch. Classify each prior outreach (per connection-pipeline-tracker's
reading):
- **Filled / advancing** — `replied_interested` or `accepted_inapp`: the slot is
  working; do **not** backfill it. (The double-opt-in intro is the matchmaker's
  on a confirmed yes — never an address here.)
- **Released → backfill** — `replied_declined`, **or** `expired`, **or**
  `delivered` with no reply and the sequence already past its **Day-7** end:
  this slot is open again; its budget rolls to the next tier and the next-best
  not-yet-contacted creator is the new reach target.
- **Still live, leave alone** — `queued | sending | delivered` mid-sequence
  (before Day-7), or `replied_question` (a reply is owed, not a decline): do
  **not** fall through yet. A question is not a no. Point the user to
  `reply-triage` for the question; hold the slot.

If `list_connections` returns the **non-entitled refused envelope**, jump to the
graceful-degradation branch (below) — never error.

**Step 3 — Compute this wave's reach set.** For each **open** role (Wave 1: all
roles; advancement: only the released ones), pick the next-best
**not-yet-contacted** creator: stay within the current tier until it's exhausted,
then drop to the next tier down. Skip anyone already reached for this brand
(handled in the pre-screen too). Cap the wave at `min(open roles, budget-allowed
reaches)` — if the remaining budget can't fund another tier-appropriate slot,
stop and say so rather than reaching into talent the budget can't cover.

**Step 4 — Mandatory pre-flight (before any `request_creator_connection`).**
Apply `cast-and-connect`'s pre-flight verbatim, per `connection-flow.md`, in
order:

1. **Entitlement probe + graceful degradation.** Already covered by Step 2's
   `list_connections`; if it returned a **refused / not-entitled envelope**, do
   NOT error — deliver the **full tiered plan + budget + advice** (the read-only
   half: the waterfall plan, the per-tier rate bands, the fallback rule) plus one
   line: _"Connections aren't on your plan — here's the waterfall casting plan
   and budget, and you can reach these creators by upgrading to Creatorland Pro
   (connections)."_ Stop; the run still succeeded.
2. **Suppression / active-sequence pre-screen.** Drop from this wave's reach set
   (a) anyone already in an ACTIVE sequence for this brand (`queued | sending |
   delivered | replied_*` — a repeat is refused + a harassment risk) and (b)
   anyone who opted out. Report who was skipped and why. (The Step 2 read already
   has this data; match by the identifier/campaign each was reached under.)
3. **Auto-fill `budget_band` from the corpus rate band.** Reuse the rate band
   from Step 0. If Step 0 produced none (e.g. thrifty dropped it), make **one**
   `query_market_intelligence` rate call now, wrapped in Refusal Recovery:
   ```json
   query_market_intelligence { "mode": "rate", "vertical": "<slate vertical>", "deal_type": "<only if the campaign specifies one>" }
   ```
   Express `budget_band` per **tier** as a market range (e.g. tier-1
   `"$5k–$12k (market p25–p75, Beauty macro tier)"`), never a single number or a
   per-creator quote. Disclose any Refusal-Recovery broadening at the clearance
   level.
4. **Credit estimate + explicit confirm.** This wave reaches W creators = **10×W
   credits**. State it and get an explicit yes before firing **any**
   `request_creator_connection`:
   > This wave reaches <W> creators (tier-<t>) to fill <W> open slot(s) — costs
   > ~<10×W> credits (~$<0.25×W>). The plan and budget are already yours; this
   > starts a 3-touch sequence per creator that auto-stops on reply, and I'll
   > backfill from the next tier if any decline or hit Day-7 with no reply.
   > Proceed?
   Never fire a wave without confirmation. (Reuse `credit-budget-guardian`
   framing if the user wants a ledger.)

**Step 5 — Reach this wave.** One `request_creator_connection` per confirmed
creator, all sharing the same `opportunity` (tier-specific `budget_band`):

```json
request_creator_connection {
  "creator": { "type": "creatorland_user_id", "creatorland_user_id": "<id from shortlist>", "display_name": "<name>" },
  "opportunity": {
    "campaign_type": "<required, from inputs>",
    "deliverables": "<if stated>",
    "comp_tags": ["<if stated>"],
    "budget_band": "<auto-filled market band for THIS creator's tier, from step 4.3>",
    "timeline": "<if stated>",
    "brief_context": "<one-line slate context, no contact info>",
    "personal_message": "<brand-authored only — never invented; omit if the brand gave none>"
  },
  "send_connection_request": true
}
```

Use whichever `creator` identifier type the shortlist row carries
(`creatorland_user_id` preferred; else `social_handle` with `platform`; `email`
only if the brand supplied the address, with a required `display_name`). Capture
each returned `conn_ref` + status. If a single creator comes back refused
(already-active, not charged), note it and continue with the rest — never abort
the wave.

**Step 6 — Write the deliverable.** The tiered plan + budget, this wave's
Reached table (conn_refs), the fallback rule, and **what's pending** (live slots,
released slots backfilled this wave, and what the next advancement wave would do).
Point the user to report back (or re-invoke) to advance the cascade.

> **Advancing the waterfall:** on the next invocation (or when the user reports
> "creator X passed"), re-run from Step 2 — read state, find released slots,
> compute the next wave's reach set (one tier down), pre-flight + confirm, reach,
> re-write the deliverable. The skill never auto-fires a new wave without a fresh
> 10×W estimate + confirm.

## Deliverable

Client-ready markdown — the waterfall plan, the current wave's outreach record,
and the standing fallback rule:

```markdown
# Waterfall Casting — <campaign/brand name>
_Wave <k> · <date> · <R> roles to fill · budget ceiling <budget> · Creatorland Data_

## The waterfall plan
Reach tier-1 first; on a **decline** or **Day-7 no-reply**, release that slot's
budget and reach the next-best not-yet-contacted creator one tier down — until
each role is filled or budget runs out. A no-reply or decline triggers the
fall-through; impatience does not. We never promise a yes.

| Tier | Creators (ranked) | Tier rate band (market p25–p75) |
|---|---|---|
| Tier 1 (premium/macro) | <Name @handle>, <Name @handle> | <$x–$y, vertical/tier> |
| Tier 2 (mid) | <Name @handle>, … | <$x–$y> |
| Tier 3 (value/micro) | <Name @handle>, … | <$x–$y> |
> <rate provenance line(s) exactly as the tool returned them>
Bands are the **market band for the vertical/tier — not any individual creator's
rate** — used to frame budget, not to quote talent. <If broadened: clearance-level note.>

## Slot ledger
| Slot | Status | Reached (conn_ref) | Result so far | Next if it falls through |
|---|---|---|---|---|
| 1 | live (tier-1) | <conn_ref> | queued | → tier-2: <next-best Name> |
| 2 | live (tier-1) | <conn_ref> | delivered, 1/3 | → tier-2: <next-best Name> |
| 3 | backfilled (tier-2) | <conn_ref> | queued | → tier-3: <next-best Name> |
<one row per role; "result so far" from get_connection_status>

## Reached this wave
Outreach started via Creatorland's matchmaker — a 3-touch sequence (day 0 / 3 / 7)
that auto-stops on reply, with a double-opt-in intro only if the creator says yes.
No creator contact details are shared with you through this; the matchmaker holds them.

Opportunity sent: **<campaign_type>**<, deliverables, timeline if set>.

| # | Creator | Tier | conn_ref | Status |
|---|---|---|---|---|
| 1 | <Name> @<handle> | T1 | <conn_ref> | queued |
<one row per creator reached this wave; status as returned>

**Skipped in pre-screen:** <Name — already in an active sequence for this brand>;
<Name — opted out> · or "None — all picks were clear to reach (in our records)."

## Pending — what the next wave would do
- **Live, holding:** <slots still in-sequence before Day-7, or replied_question>
  — no backfill yet. <replied_question → "creator asked a question; reply owed,
  not a decline — draft it with **reply-triage**; the slot stays held.">
- **Released this wave → backfilled:** <slots that declined/expired and were
  reached one tier down>.
- **Next fall-through targets:** <per open slot, the next-best not-yet-contacted
  creator one tier down>, fundable within remaining budget <or "budget exhausted
  below tier-N — no further backfill without raising the ceiling">.
- Report back (or re-invoke) when a slot declines or lapses and I'll advance the
  waterfall — with a fresh 10×W estimate + confirm before reaching.

---
Data freshness: <N>/<M> shortlisted creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · cast via brief-to-shortlist (search + <M> profiles + 1 rate benchmark, <clearance level>) · waterfall state via list_connections + get_connection_status (free) · <W> connection requests this wave · <date>.
Credits used this run: ~<T> (cast: ~<C> · state reads: 0 · reach this wave: <W> × 10 = <10W>).
```

If the entitlement probe returned not-entitled, the deliverable is the
**waterfall plan + tier rate bands + fallback rule** only (the advice half),
with the Reached / Slot-ledger outreach columns replaced by the single upgrade
line — and a credit tally reflecting the cast only (no reach charges). On an
advancement wave with no released slots, the deliverable is the slot ledger +
"nothing to backfill — all slots live or filled" and a 0-reach-credit tally.

## Honesty rules

- **Never promise a reply or a yes.** Frame every reach as "we'll reach them and
  run a 3-touch sequence that stops on reply" — outcomes are the creator's. A
  `queued`/`delivered` status is contact made, not a booking. "Backfill" replaces
  a *released slot*, not a rejected creator's worth.
- **Fall-through triggers on decline or Day-7 no-reply — never impatience.** A
  `replied_question` is a reply owed, not a no; a mid-sequence `delivered`
  (before Day-7) is still live. Hold those slots; do not cascade early. State
  this rule up front and apply it literally.
- **Privacy floor (conventions 7 + connection-flow).** No creator contact info
  appears anywhere — not in the plan, the slot ledger, or the Reached table. The
  reveal is the matchmaker's double-opt-in only. `conn_ref` and status are
  brand-safe; a creator's address is not, and is never returned or inferred.
- **`budget_band` is a per-tier market band, never a per-creator quote** —
  auto-filled from the corpus rate band, expressed p25–p75 for the vertical/tier.
  Disclose any Refusal-Recovery broadening at the clearance level.
- **`personal_message` is brand-authored only.** Never invent a quote, tone, or
  promise on the brand's behalf — omit it if the brand gave none.
- **Suppression pre-screen is "in our records,"** never an absolute guarantee the
  creator isn't being contacted elsewhere.
- **Always show the credit cost of a wave before reaching, and the actual tally
  after.** Each wave gets its own 10×W estimate + explicit confirm — the skill
  never auto-fires the next wave. The plan + budget are delivered regardless of
  whether any outreach runs.
- **Budget is honest about its ceiling.** When the remaining budget can't fund a
  tier-appropriate backfill, say "budget exhausted below tier-N" and stop — never
  reach into talent the budget can't cover just to fill a slot.
- All `brief-to-shortlist` honesty rules (vertical-level rate framing, provenance
  never stripped, stale data never silently mixed) carry through the composed
  shortlist unchanged.

## Credit footprint

Per wave: cast happens once (Wave 1 only); reaching is **10 × (creators reached
this wave)**; all state reads (`list_connections` / `get_connection_status`) are
**free**.

thorough: ~31 cast credits on Wave 1 (brief-to-shortlist: 1 search ×2 + ~24
profiles + 1 rate call ×5; +5 per refusal-ladder rung) **+ 10 × (creators
reached this wave)**. Filling 3 tier-1 slots in Wave 1 ≈ 31 + 30 = ~61 credits
(~$1.53); a later backfill wave reaching 2 ≈ 0 cast + 20 = ~20 credits. ·
thrifty: ~17 cast credits on Wave 1 (1 search ×2 + ~10 profiles + 1 rate call
×5, max 2 ladder rungs) **+ 10 × (creators reached this wave)**; reach only the
open slots this wave, never the whole list. Not-entitled plans incur cast credits
only (no reach charges); advancement waves with no released slots incur 0.
