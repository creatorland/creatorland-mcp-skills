---
name: campaign-package-builder
description: Bundle a full client-ready campaign proposal like a travel itinerary — target audience, creator tiers with rate bands, active deal types, and a budget allocation. Use when the user says "build a campaign package", "put together a full proposal", "client-ready campaign deck skeleton", or wants one deliverable spanning audience + talent + pricing + budget. Deliverable is a structured proposal skeleton. For just the budget split use budget-allocator; for just a shortlist use brief-to-shortlist.
---

# Campaign Package Builder

The travel-itinerary framing: one skill assembles a full client-ready proposal
in four sections — destination (target audience/archetypes), accommodation
(creator tiers with rate bands), excursions (the deal types the corpus shows
are active), and price (a budget allocation). It composes the work of several
narrower skills into one paste-into-deck artifact. It is the bundling skill;
when the user wants only one section, route them to `budget-allocator`,
`brief-to-shortlist`, or `vertical-briefing`.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions — especially #9 multi-target slates). This skill
honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

## Inputs to collect

- **Campaign goal + vertical** (required) — the brief in a sentence; infer
  vertical from it.
- **Target audience / archetypes** (required) — one or more target profiles
  (e.g. "LATAM Gen-Z skincare" + "US millennial wellness"). A LIST of targets
  triggers convention 9: one search per target, per-target sections — never
  one merged search.
- **Total budget** (required) — drives the price section's allocation.
- **Tier shape** (optional, default macro/mid/micro mix biased by goal).
- **Deal types** (optional) — else inferred from the market-mode mix.
- **Geo / platform constraints** (optional).
- **Mode** — default `thorough`; `thrifty` on request.

Never ask twice; never ask for what the conversation already holds.

## Flow

This skill composes budget-allocator + per-target discovery + market context.
Convention 9 governs the audience section: **N target archetypes = N searches
and N per-target sections**, plus an overview.

1. **Market context (excursions + bands)** — `query_market_intelligence`,
   **each wrapped in Refusal Recovery**:
   - `{ mode: "market", vertical: <vertical> }` (floor 5/25) → which deal
     types are active (the "excursions") + deal-type mix.
   - `{ mode: "rate", vertical: <vertical>, deal_type: <dominant or requested>, creator_tier: <the accommodation (creator) tier being priced, when known — one call per tier> }`
     (floor 10/50) → the rate band that prices accommodation tiers and feeds
     the budget split.
   When an accommodation tier's follower band is known, pass `creator_tier`
   (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+)
   so each tier benchmarks against same-size creators; a tier too thin for the
   floor broadens (disclosed) to the vertical band.
   Disclose clearance level on any broaden. 5 credits each incl. retries.
   Thrifty: the rate call only, max 2 ladder rungs.

2. **Per-target discovery (destination + candidates)** — for EACH target
   archetype (convention 9), one `search_creators`:
   `{ mode: "brief", brief: <campaign goal + this target's description>, filters: { niche: <niche>, country: <geo>, platform: <if set>, min_followers: <tier floor>, max_followers: <tier ceiling> }, limit: <by tier need, cap 15>, precision: "balanced" }`
   2 credits each. Thin exact niche → thin-niche honesty ladder (convention
   8): disclose, broaden one labeled step, tag picks exact/adjacent.
   Thrifty: smaller `limit`, fewer tiers per target.

3. **Budget allocation (price)** — no new tool calls; reuse the step-1 rate
   band to construct the tier mix exactly as `budget-allocator` does (tier
   planning rates = positions within the corpus band, labeled as such),
   fitted to the total budget, with the arithmetic shown.

4. **Freshness Gate on named candidates** — in thorough mode,
   `get_creator_profile` `{ identifier: { type: "creatorland_user_id", creatorland_user_id: <from search> } }`
   (or `social_handle`) for the candidates that make the proposal; classify
   fresh/aging/stale; stale → "re-verify before pitch". 1 credit each.
   Thrifty: skip; label candidates "unverified — search-result freshness".

5. **Assemble the package.** Pre-run estimate fires before steps 2–4 if the
   plan exceeds ~30 credits (thorough multi-target runs do — say so).

## Deliverable

```markdown
# Campaign package — <campaign name> · <vertical>
## Overview
Brief: <one-line restatement>. Methodology: market context from the
Creatorland corpus; candidates from per-archetype searches; budget split from
corpus rate bands. Per-target caveats noted in each section.

## 1 · Destination (target audience)
<Per archetype — convention 9 sections:>
### Archetype A — <description>
Candidates: @h1 (<fit>, <fresh/aging>, [exact/adjacent fit]) … 
### Archetype B — <description>
…

## 2 · Accommodation (creator tiers + bands)
| Tier | Follower range | Band (corpus, <deal type>) |
|---|---|---|
| Macro | … | $x–$z (med $y), ~upper band |
| Mid / Micro | … | … |
Bands are corpus-level market ranges for the vertical/tier — not any named
creator's rate.

## 3 · Excursions (active deal types)
<Deal-type mix from market mode, each a citation-ready block: stat +
provenance + recency window.>

## 4 · Price (budget allocation)
| Tier | Slots | Planning rate (band position) | Subtotal |
|---|---|---|---|
| … | | | |
| **Total** | | | **$≤budget** (<headroom>) |
Method note: planning rates are positions within the corpus band, not
follower-tier price lists.

## Re-verify before pitch
<stale candidates, or "none">

---
**Benchmark basis:** <clearance level(s) + floor-disclosure note where
broadened — "a privacy feature of the data source, not missing data">
**Provenance:** <provenance lines from each market-intel response, verbatim>
· recency window: <window>
**Data freshness:** N/M named candidates synced within the last sync window;
K flagged for re-verification. <thrifty: "candidates unprofiled — verify
before client use">
**Honesty note:** all rates are corpus-level market bands for the vertical/
tier — not personal rates. Per-target candidate lists disclose any niche
broadening. Confirm quotes before committing budget lines.
Credits used this run: ~N (breakdown: <market-intel>×5 + <searches>×2 + <profiles>×1)
```

## Honesty rules

- **Bands and budget rates are corpus-level** for the vertical/tier — never a
  named creator's rate; the accommodation table and price method note both
  say so (convention 2).
- **Multi-target = sectioned slate** (convention 9): every archetype gets its
  own search and section; never one merged generic search across targets.
- **Thin-niche honesty per target** (convention 8): disclose, broaden one
  labeled step, tag exact vs adjacent fit.
- **Disclose every broaden** (Refusal Recovery clearance level).
- **Budget arithmetic closes** — subtotals ≤ budget, headroom shown; if the
  goal won't fit at band rates, say so.
- **Freshness Gate is mandatory** on named candidates.
- **No contact info** anywhere in the package, regardless of source
  (convention 7) — scrub bio snippets.

## Credit footprint

thorough: ~30–55 credits (2 market-intel ×5 + N target searches ×2 + ~15–25
profiles ×1; refusal rungs add 5 each — pre-run estimate fires) ·
thrifty: ~12–18 credits (1 rate call + N smaller searches, no profiling,
capped ladder)
