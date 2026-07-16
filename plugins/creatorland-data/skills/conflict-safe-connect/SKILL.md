---
name: conflict-safe-connect
description: Safety-first outreach — run a conflict screen across your slate, then reach ONLY the creators with no competitor conflicts in our corpus. Use when the user says "conflict-check then reach the clean ones", "safely connect with non-conflicting creators", "screen and connect", or "reach only creators with no competitor conflicts". Flagged and unscreenable creators are held back for your decision, never reached automatically. Deliverable is a screen table (clean/flagged/unscreenable) plus a Reached section.
---

# Conflict-Safe Connect

You want to reach a slate of creators for a campaign, but only the ones who
aren't already working with the competitor brands you care about. This skill
runs `conflict-check`'s screen across the whole slate, partitions it into
**CLEAN / FLAGGED / UNSCREENABLE**, and then reaches **only the CLEAN set** via
Creatorland's matchmaker — after a mandatory credit-confirmed pre-flight.
FLAGGED and UNSCREENABLE creators are **never reached automatically**; they're
listed for your manual call. For brand-side casting directors and managers who
want the conflict gate and the reach in one safe pass.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions) and ${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md
(THE connection contract — schemas, mandatory pre-flight, graceful degradation,
privacy invariants). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> This skill **composes `conflict-check` by reference**: run that skill's screen
> first (its honesty framing is mandatory — a clean result is "no conflicts
> found in our corpus", never a guarantee), then act on the result. It does NOT
> re-implement the screen or edit `conflict-check`.
>
> Siblings: `conflict-check` screens but never reaches. `cast-and-connect`
> reaches without a conflict gate. This skill is the gated reach — screen, then
> reach only the clean ones.

## Inputs to collect

- **Creator(s) / slate** (required) — one creator or a slate, in any format
  (handles, a sheet, a prior shortlist in-session). Map each to one identifier
  type.
- **Competitor brands** (required) — the brands a conflict would be against.
  If the user hasn't named any, ask once: "Which brands should I screen
  against?" Without them there is nothing to gate on; do not reach blind.
- **Opportunity** — `campaign_type` is **required** (the matchmaker pitch needs
  it). Collect optional `deliverables`, `comp_tags`, `timeline`,
  `brief_context`, and a **brand-authored** `personal_message` if offered —
  never invent quotes. `budget_band` is filled from a corpus rate band in the
  pre-flight (step 4), not asked.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.

## Flow

1. **Screen the slate (compose `conflict-check`).** Run `conflict-check`'s
   screen across every creator: for each, `get_creator_profile`
   `{ "identifier": { "type": "social_handle", "platform": "<platform>", "handle": "<handle>" } }`
   (exactly one identifier type per call). Read **brand affiliations** (pro
   plan) and **data freshness**. Match affiliations against the competitor list
   (no tool call). 1 credit × N. **Credit estimate fires when N > 30.** Apply
   the Freshness Gate — a stale profile's affiliations may have drifted, so a
   "clean" stale row carries a drift caveat. Thrifty: profiles only, cap the
   slate size and report any creators not screened.

2. **Partition the slate** (no tool call) into three sets:
   - **CLEAN** — affiliations present, **no overlap** with the competitor list
     ("no conflict found in our corpus").
   - **FLAGGED** — affiliations present and **overlapping** a competitor
     (conflict found), naming the brand.
   - **UNSCREENABLE** — affiliations **absent**: free plan (pro-gated field) or
     the field simply wasn't returned. Unscreenable ≠ clean — it is a "we could
     not check," reported as such.

3. **Suppression / active-sequence pre-screen** (mandatory, free) — before
   reaching, call `list_connections` `{ "limit": 100 }` and remove from the
   CLEAN set (a) anyone already in an **ACTIVE** sequence for this brand (a
   repeat would be refused, uncharged, and is a harassment risk) and (b) anyone
   who previously **opted out**. Report who was skipped and why. 0 credits.

4. **Build the opportunity + budget_band** — `campaign_type` from input. Fill
   `budget_band` from a corpus rate band via `query_market_intelligence`
   `{ "mode": "rate", "vertical": "<inferred>", "deal_type": "<if known>", "creator_tier": "<the reach set's tier, if it clusters at one>" }` —
   wrapped in Refusal Recovery — so the pitch is market-credible, not a lowball.
   When the clean reach set clusters at a creator tier, pass `creator_tier`
   (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+) for a
   size-scoped band; when tier is mixed or unknown keep the vertical-wide band
   as the fallback (a too-thin tier auto-broadens, disclosed). 5 credits (skip
   in thrifty; reach without `budget_band` and say so). Keep `personal_message`
   brand-authored.

5. **Credit estimate + confirm (mandatory before any reach).** Let K = the
   CLEAN, suppression-cleared set. Reaching K creators = **10×K credits**.
   State it and get an explicit yes:
   _"Screen is done. K creators are clean and reachable; reaching them costs
   ~10×K credits (~$Z). FLAGGED and UNSCREENABLE creators are held back for your
   decision. Proceed with reaching the K clean creators?"_ Never fire without
   confirmation.

6. **Reach ONLY the CLEAN set.** For each clean creator, one call:
   `request_creator_connection`
   `{ "creator": { "type": "social_handle", "platform": "<platform>", "handle": "<handle>", "display_name": "<opt>" }, "opportunity": { "campaign_type": "<required>", "deliverables": "<opt>", "comp_tags": ["<opt>"], "budget_band": "<from step 4>", "timeline": "<opt>", "brief_context": "<opt>", "personal_message": "<brand-authored opt>" }, "send_connection_request": true }`
   10 credits each (one charge per creator, whole 3-touch sequence). Capture each
   `conn_ref`. **Never** call this for a FLAGGED or UNSCREENABLE creator.

   **Graceful degradation:** if `request_creator_connection` returns a
   **refused envelope** (no `creator_connections` entitlement), do **NOT** error.
   Still deliver the full conflict screen (clean/flagged/unscreenable) and add
   one line: _"Connections aren't on your plan — here's the conflict screen and
   the clean set; upgrade to pro/pilot to reach them."_ The screen is the value
   you can still ship.

## Deliverable

```markdown
# Conflict-Safe Connect — <slate / campaign name>
_Screened against: <competitor brands> · Campaign: <campaign_type> · Creatorland Data · <date>_

## Conflict screen
| Creator | Corpus affiliations (relevant) | Verdict | Freshness |
|---|---|---|---|
| @<handle> | <overlapping brands, or "—"> | ✅ CLEAN — no conflict found in our corpus / ⚠ FLAGGED — affiliated with <brand> / ☔ UNSCREENABLE — affiliations not available | fresh / aging / ⚠ stale |
<one row per creator>

## Reached (clean set)
| Creator | conn_ref | Status |
|---|---|---|
| @<handle> | <conn_ref> | queued — 3-touch sequence, auto-stops on reply |
<one row per reached clean creator>
_Reached <K> creators · ~<10×K> credits._
<If skipped by suppression pre-screen: "Skipped (already in an active sequence / opted out in our records): @<handle> — <reason>.">
<If degraded: "Connections aren't on your plan — clean set above is ready to reach; upgrade to pro/pilot.">

## Held back for your decision (NOT reached)
- ⚠ **FLAGGED** — @<handle>: affiliated with <competitor> in our corpus. Decide manually whether to proceed.
- ☔ **UNSCREENABLE** — @<handle>: affiliations not available (free plan / field absent). Unscreenable ≠ clean — we could not check; verify before reaching.

## What this screen does and does not cover
- Affiliations are **derived from the Creatorland corpus** — not an exhaustive
  record of every deal. A clean result means **no conflict found in our
  corpus**, not a guarantee of none. Unreported, in-flight, or just-signed deals
  may not appear, especially on profiles flagged stale.
- **Unscreenable ≠ clean.** A missing affiliations field is "could not check,"
  never an all-clear.
- The outreach runs a 3-touch sequence that auto-stops on reply; outcomes are
  the creator's. We make no promise of a reply or a yes.
- Contact details are never shared with you through these tools — on a creator
  "yes", Creatorland's matchmaker makes a double-opt-in intro.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K2>
flagged — affiliations may have drifted.
Provenance: Creatorland Data MCP · <M> profiles<+ 1 rate band> · <K> connections requested · <date>.
Credits used this run: ~<total> (<M> profiles ×1<+ rate band ×5> + <K> connections ×10).
```

## Honesty rules

- **A clean result is "no conflicts IN OUR CORPUS" — never "no conflicts".**
  Mandatory phrasing everywhere, inherited from `conflict-check`; the corpus is
  not exhaustive.
- **Unscreenable ≠ clean, and is NEVER reached automatically.** Absent
  affiliations (free plan / missing field) mean the screen could not run for
  that creator — report it, never a false all-clear, never auto-reach.
- **FLAGGED is never reached automatically.** A found conflict is held back for
  the user's manual decision; the skill does not override it.
- **Stale profiles get a drift caveat** — a recent competitor deal may post-date
  the sync, so a "clean" stale row is provisional.
- **Never promise a reply or a booking.** Frame outreach as "we'll reach them
  and run a 3-touch sequence that stops on reply," not "this gets you a deal."
- **Always show the reach cost before reaching and the actual tally after.**
- **PII invariant (convention 7 + connection-flow privacy).** No contact info in
  any deliverable, regardless of source; scrub bio snippets. The affordance is
  "Creatorland will reach them for you," never an address. `conn_ref` and status
  are brand-safe; a creator's contact is not.

## Credit footprint

thorough: ~(N + 5 + 10×K) credits for N creators screened, one rate-band call,
and K clean creators reached (e.g. 8 screened + 1 rate band + 5 clean reached =
8 + 5 + 50 = 63) · thrifty: ~(N + 10×K) credits (profiles only, no rate band —
reach without `budget_band`, slate cap reported). The 10×K reach cost applies to
the **clean set only**; FLAGGED and UNSCREENABLE creators cost nothing because
they are never reached. The reach estimate is always stated and confirmed before
firing (step 5); the screen estimate fires when N exceeds ~30.
