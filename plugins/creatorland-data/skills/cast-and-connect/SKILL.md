---
name: cast-and-connect
description: Cast a brief into a ranked shortlist AND reach the top-N creators in one move — find creators, you pick who to reach, then Creatorland's matchmaker runs a 3-touch sequence that stops on reply. Use when the user says "cast and reach", "find creators and connect", "shortlist then reach out", or "cast this brief and connect with the top N". Deliverable is the shortlist PLUS a "Reached" section (conn_ref + status). Reaching costs 10 credits/creator; outcomes are the creator's — never a promised yes.
---

# Cast-and-Connect

The casting-to-outreach skill. It runs the full `brief-to-shortlist` casting
flow to produce a ranked, enriched shortlist, lets the user pick the top-N to
reach, then asks Creatorland's matchmaker to reach each chosen creator on the
brand's behalf and run a polite 3-touch sequence (day 0 / 3 / 7, auto-stops on
reply, double-opt-in intro on a yes). For brand-side managers and agency
casting directors who want discovery and first contact in one move. The
deliverable is the shortlist plus a "Reached" section — a launchpad into
`connection-pipeline-tracker` and `reply-triage`.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions) and ${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md
(THE connection contract — the 3 tool schemas, the mandatory pre-flight, graceful
degradation, privacy invariants). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> This skill **composes** `brief-to-shortlist` by reference — it runs that
> skill's casting flow verbatim to build the shortlist, then acts on it. It
> never restates or modifies that skill's internals. If the user only wants the
> shortlist (no outreach), use `brief-to-shortlist`. If outreach has already
> happened and they want to track it, use `connection-pipeline-tracker`; to
> triage replies, `reply-triage`.

## Inputs to collect

- **The brief** (required) — any written format. Passed straight into the
  `brief-to-shortlist` flow; do not make the user restructure it.
- **How many to reach** — default: **ask** after the shortlist is on screen
  ("Which of these should I reach — top 3, top 5, all 8, or named picks?").
  Don't pre-commit a count before the user sees the ranking.
- **Opportunity fields** for the outreach — `campaign_type` is **required**
  (e.g. "paid IG Reel + Story", "UGC licensing", "event appearance"); ask for
  it if the brief doesn't state it. Optional: `deliverables`, `comp_tags`,
  `timeline`, `brief_context`, and a brand-authored `personal_message`.
  `budget_band` is **auto-filled** from a corpus rate band (step 5 below) — do
  not ask the user for it unless they want to override. For a promo/gifting/event/collab (not a plain casting), also collect the **structured brief** — `archetype` (`casting|product_gift|partner_promo|event_invite|paid_collab`), an `offer` (`{what, value, expiry, redemption}`), and the on-behalf-of `brand` (`{name, represented_by}`) — per the schema and required-field rules in `connection-flow.md` (the new archetypes require `brand` + `offer.what`; don't restate the schema here, reference it).
- **Credit mode** — default `thorough`; switch to `thrifty` on the trigger
  phrases in the credit-modes module.

Never ask twice for anything the brief already states — quote it back instead.

## Flow

**Step A — Build the shortlist via `brief-to-shortlist` (compose by reference).**
Run the `brief-to-shortlist` casting flow exactly as that skill defines it —
normalize the brief, search, profile fan-out, Freshness Gate, optional conflict
check, one slate-level rate call (Refusal-Recovery-wrapped), rank, and produce
its client-ready shortlist deliverable. Honor the same credit mode. Do not
restate or alter its steps here; that skill owns the casting contract. The
output of Step A is the ranked shortlist plus the slate's inferred **vertical**
and **rate band** — both of which this skill reuses below (so no extra rate call
is needed for the budget band).

**Step B — Show the shortlist and ask who to reach.** Present the full
`brief-to-shortlist` deliverable first. Then ask which creators to reach
(default: ask — top-N or named picks). The shortlist is the floor of this
skill's value: even if outreach never happens, the user keeps it.

**Step C — Entitlement probe + graceful degradation.** Before any pre-flight,
do a single cheap entitlement check via `list_connections` `{ "limit": 1 }`
(free). If the connection layer returns a **refused / not-entitled envelope**
(non-pro, or no `creator_connections` entitlement), do NOT error: deliver the
**full shortlist** plus one line — _"Connections aren't on your plan — here's
the casting, and you can reach these creators by upgrading to Creatorland Pro
(connections)."_ Stop here; the run still succeeded. Only continue to the
pre-flight when the connection layer is live.

**Step D — Mandatory pre-flight (before any `request_creator_connection`).**
Per `connection-flow.md`, all three gates, in order:

1. **Suppression / active-sequence pre-screen.** Call `list_connections` and
   drop from the reach set (a) anyone already in an ACTIVE sequence for this
   brand (a repeat would be refused + is a harassment risk) and (b) anyone who
   previously opted out. Report who was skipped and why.
   ```json
   list_connections { "limit": 100 }
   ```
   (Free. Match each shortlist pick against returned `conn_ref` entries by the
   identifier/campaign you reached them under; treat
   `queued|sending|delivered|replied_*` as active, `opted_out` as suppressed.)
2. **Auto-fill `budget_band` from the corpus rate band.** Reuse the rate band
   `brief-to-shortlist` already produced in Step A so the pitch is
   market-credible, not a lowball. If Step A had no rate call (e.g. thrifty
   dropped it), make **one** `query_market_intelligence` rate call now, wrapped
   in Refusal Recovery:
   ```json
   query_market_intelligence { "mode": "rate", "vertical": "<slate vertical>", "deal_type": "<only if the campaign specifies one>" }
   ```
   Express `budget_band` as a market range (e.g. `"$2k–$5k (market p25–p75, Beauty vertical)"`),
   never as a single number or a per-creator quote. Disclose any Refusal-Recovery
   broadening at the clearance level.
3. **Credit estimate + explicit confirm.** Reaching N creators = **10×N
   credits**. State it and get an explicit yes before firing **any**
   `request_creator_connection`:
   > Reaching these <N> creators costs ~<10×N> credits (~$<0.25×N>). The
   > shortlist is already yours; this starts a 3-touch sequence per creator
   > that auto-stops on reply. Proceed?
   Never fire a batch without confirmation. (Reuse `credit-budget-guardian`
   framing if the user wants a ledger.)

**Step E — Reach each chosen creator.** One `request_creator_connection` per
confirmed creator, all sharing the same `opportunity`:
```json
request_creator_connection {
  "creator": { "type": "creatorland_user_id", "creatorland_user_id": "<id from shortlist>", "display_name": "<name>" },
  "opportunity": {
    "campaign_type": "<required, from inputs>",
    "deliverables": "<if stated>",
    "comp_tags": ["<if stated>"],
    "budget_band": "<auto-filled market band from step D.2>",
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
the batch.

**Step F — Write the deliverable.** The shortlist (from Step A) PLUS a
"Reached" section (each `conn_ref` + status) PLUS a "Next" pointer into the
tracker / triage skills.

## Deliverable

Client-ready markdown — the shortlist, then the outreach record:

```markdown
# Cast & Reach — <campaign/brand name>
_Cast from your brief, <date> · <N> creators shortlisted · <R> reached · Creatorland Data_

## Shortlist (ranked)
<the full brief-to-shortlist deliverable, verbatim from Step A — ranked rows
with Why-for-this-brief, Audience-geo fit, Freshness, Conflicts; the slate-level
Indicative rate context block with its provenance line; the Re-verify-before-pitch
section; the Caveats block including "no creator contact info is included or
available via this tool.">

## Reached
Outreach started via Creatorland's matchmaker — a 3-touch sequence (day 0 / 3 / 7)
that auto-stops on reply, with a double-opt-in intro only if the creator says yes.
No creator contact details are shared with you through this; the matchmaker holds them.

Opportunity sent: **<campaign_type>**<, deliverables, timeline if set> ·
budget band **<auto-filled market band>** (market p25–p75, <vertical>; framing only, not a per-creator quote).

| # | Creator | conn_ref | Status |
|---|---|---|---|
| 1 | <Name> @<handle> | <conn_ref> | queued |
| 2 | <Name> @<handle> | <conn_ref> | queued |
<one row per reached creator; status as returned>

**Skipped in pre-screen:** <Name — already in an active sequence for this brand>;
<Name — opted out> · or "None — all picks were clear to reach (in our records)."

## Next: track + triage
- Track the sequence (touches sent, replies) with **connection-pipeline-tracker**
  — it reads `get_connection_status` / `list_connections` (free).
- When replies land, sort interested / question / declined with **reply-triage**.
- A status here is the start of a sequence, **not** a booking — outcomes are
  the creator's.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · cast via brief-to-shortlist (search + <M> profiles + 1 rate benchmark, <clearance level>) + <R> connection requests · <date>.
Credits used this run: ~<T> (cast: ~<C> · reach: <R> × 10 = <10R>).
```

If the entitlement probe (Step C) returned not-entitled, the deliverable is the
**Shortlist** section + Caveats only, with the "Reached" and pre-screen sections
replaced by the single upgrade line — and a credit tally that reflects the cast
only (no reach charges).

## Honesty rules

- **Never promise a reply or a yes.** Frame every reach as "we'll reach them and
  run a 3-touch sequence that stops on reply" — outcomes are the creator's. A
  `queued`/`delivered` status is contact made, not a booking.
- **Privacy floor (conventions 7 + connection-flow).** No creator contact info
  appears anywhere — not in the shortlist, not in the Reached table. The reveal
  is the matchmaker's double-opt-in only. `conn_ref` and status are brand-safe; a
  creator's address is not, and is never returned or inferred.
- **`budget_band` is a market band, never a per-creator quote** — auto-filled
  from the corpus rate band, expressed as p25–p75 for the vertical/tier. Disclose
  any Refusal-Recovery broadening at the clearance level.
- **`personal_message` is brand-authored only.** Never invent a quote, a tone,
  or a promise on the brand's behalf — omit it if the brand gave none.
- **Suppression pre-screen is "in our records,"** never an absolute guarantee
  the creator isn't being contacted elsewhere.
- **Always show the credit cost of reaching before reaching, and the actual
  tally after.** The shortlist is delivered regardless of whether outreach runs.
- All `brief-to-shortlist` honesty rules (vertical-level rate framing,
  provenance never stripped, stale data never silently mixed) carry through the
  composed shortlist unchanged.

## Credit footprint

thorough: ~31 cast credits (brief-to-shortlist: 1 search ×2 + ~24 profiles + 1
rate call ×5; +5 per refusal-ladder rung) **+ 10 × (creators reached)**;
`list_connections` pre-screen is free. Reaching 5 ≈ 31 + 50 = ~81 credits
(~$2.03). · thrifty: ~17 cast credits (1 search ×2 + ~10 profiles + 1 rate call
×5, max 2 ladder rungs) **+ 10 × (creators reached)**; reach only the count the
user confirms. Not-entitled plans incur cast credits only (no reach charges).
