---
name: budget-allocator
description: Split a total campaign budget into a creator-tier mix (e.g. 2 macro + 8 mid + 20 micro) using corpus rate bands per tier, with named candidate creators per slot. Use when the user says "allocate this budget", "how should I split $50k across creators", "what mix of creators can I afford", or has a total budget + campaign goal and needs a tier plan. Deliverable is a budget allocation plan with per-slot candidates. For pricing one deal, use fair-price-brief or one-number-rate.
---

# Budget Allocator

You have a total campaign budget and a goal ("$50k for a Q3 fitness launch") and
need a defensible plan for how to spend it: how many creators, at which tiers,
at what per-deal cost, and who specifically could fill each slot. This skill
benchmarks tier-level deal values from the Creatorland corpus, proposes a mix
that fits the budget, and names candidate creators per slot. It is a planning
skill for the whole budget — not a price check on a single deal (that's
`fair-price-brief` / `one-number-rate`).

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> **Precision & filters for outreach (convention 14).** When this list will
> feed an outreach step, default to precision over raw recall: search
> `precision: "tight"` with the hard-gate filters the brief supports
> (`platform`, `niche`, `data_freshness_days`, `content_format`,
> `audience_country`), and reserve `broad` plus heavy `lookalike` unioning for
> market sizing. Do not fan out dozens of `lookalike` calls to hit a volume
> target (each hop drifts from the seed), and trim the weak tail by each
> result row `relative_fit` (within-set fit, `1.0` = strongest) rather than
> padding to a round number. Canon:
> `${CLAUDE_PLUGIN_ROOT}/shared/conventions.md` convention 14.

## Inputs to collect

- **Total budget** (required) — in USD; convert and note if quoted otherwise.
- **Vertical** (required) — infer from the campaign goal if stated ("fitness
  launch" → Fitness); ask only if genuinely ambiguous.
- **Campaign goal / shape** (required) — reach-led, conversion-led, or
  awareness/credibility-led. This drives the default mix bias: reach → more
  micro/mid breadth; credibility → fewer, bigger names.
- **Deal type** (optional) — map "sponsored posts" / "affiliate program" to
  the closest `deal_type`. Omit if unspecified; tier bands come from the
  vertical level.
- **Constraints** (optional) — geo, platform, must-include tiers, max
  creators, reserved spend (e.g. "hold $10k for paid amplification" —
  allocate only the remainder and say so).
- **Mode** — default `thorough`; `thrifty` on request or stated budget concern.

Never ask twice; never ask for what the conversation already contains.

## Flow

1. **Benchmark tier economics** — `query_market_intelligence` calls in rate
   mode to establish per-deal value bands for the vertical, **each wrapped in
   Refusal Recovery** (rate-mode floor: 10 brands / 50 deals):
   - `{ mode: "rate", vertical: <vertical>, deal_type: <if specified>, creator_tier: <the tier slot being priced — macro/mid/micro — one call per slot> }`
   - In thorough mode, optionally one `{ mode: "market", vertical: <vertical> }`
     call (floor: 5 brands / 25 deals) for deal-volume/deal-type-mix context
     that informs which deal types are actually active in this vertical.

   Pass `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+) for the
   tier slot you are pricing so each slot benchmarks against same-size creators;
   a slot whose tier is unknown or too thin for the privacy floor broadens
   (disclosed) to the vertical band, and you position within it per the
   constraint below.

   IMPORTANT honesty constraint: where a tier is unknown or too thin to clear
   the floor, the corpus returns **vertical/filter-level bands**, not literal
   per-follower-tier price lists. Those tier slots (macro/mid/
   micro) are constructed by positioning within the returned band — macro
   slots planned near p75+, mid near median, micro near p25 — and the plan
   must label this method explicitly. If a refusal ladder broadened the
   slice, disclose the clearance level. 5 credits per call incl. each retry.
   Thrifty: 1 rate call, max 2 ladder rungs, skip the market-mode call.

2. **Propose the mix** (no tool calls) — solve the allocation: number of
   slots per tier × per-slot planning rate (from band positions) ≤ budget,
   biased by the campaign shape. Present 1 primary mix + 1 alternate (e.g.
   "breadth mix" vs "anchor mix"). Show the arithmetic.

3. **Name candidates per slot** — one `search_creators` per tier slot type
   (convention 9: tiers are distinct targets — never one merged search):
   `{ mode: "brief", brief: <campaign goal text>, filters: { niche: <niche>, min_followers: <tier floor>, max_followers: <tier ceiling>, platform: <if constrained>, country: <if constrained> }, limit: 2×slots-for-tier (cap 15), precision: "balanced" }`
   2 credits each. If a tier's exact niche comes back thin, apply the
   thin-niche honesty ladder (convention 8): disclose, broaden one labeled
   step (exact niche → adjacent → vertical), and tag picks exact/adjacent.
   Thrifty: search only the two largest-spend tiers, `limit` = slots+2.

4. **Freshness Gate on named candidates** — in thorough mode,
   `get_creator_profile` `{ identifier: { type: "creatorland_user_id", creatorland_user_id: <from search result> } }`
   (or `social_handle` form) for each named candidate; classify fresh/aging/
   stale; stale go to "re-verify before pitch", never the main slot list.
   1 credit each. Thrifty: skip profiling; label candidates "unverified —
   search-result freshness only" and say so in the data note.

5. **Pre-run estimate** — fire the credit-modes estimate before step 3/4 if
   the planned total exceeds ~30 credits (typical thorough runs do).

## Deliverable

A budget allocation plan in markdown:

```markdown
# Budget allocation — $<total> · <vertical> · <campaign goal>

## Recommended mix
| Tier | Slots | Planning rate/deal | Subtotal |
|---|---|---|---|
| Macro (<follower range>) | N | $<~p75 of band> | $ |
| Mid (<range>) | N | $<~median> | $ |
| Micro (<range>) | N | $<~p25> | $ |
| **Total** | | | **$<total≤budget>** (<headroom> headroom) |

Method note: planning rates are positions within the corpus rate band for
<vertical><, deal type> (p25/median/p75 = $x/$y/$z) — the corpus benchmarks
the vertical, not follower tiers directly; tier rates are band positions,
labeled as such.

## Alternate mix — <name>
<same table, one-line rationale for when to prefer it>

## Candidate creators per slot
### Macro slots
- @<handle> — <one-line fit rationale> · <fresh/aging> · [exact fit/adjacent fit]
...per tier...

### Re-verify before pitch
<stale-profile candidates, or "none">

---
**Benchmark basis:** <clearance level + floor-disclosure note if broadened>
**Provenance:** <provenance line(s) from market-intel responses, verbatim>
· recency window: <window>
**Data freshness:** N/M candidates synced within the last sync window; K
flagged for re-verification. <thrifty: "candidates unprofiled — verify
before client use">
**Honesty note:** rates are corpus-level market bands for this vertical/
tier-position — not any named creator's personal rate. Confirm actual quotes
per creator before committing budget lines.
Credits used this run: ~N (breakdown: <rate calls>×5 + <searches>×2 + <profiles>×1)
```

## Honesty rules

- **Band positions, not tier price lists.** The corpus doesn't return
  per-tier rates; the plan constructs tier planning rates as positions within
  the vertical band and must say so. Never present a slot rate as "what
  micro creators in fitness charge."
- **Never a named creator's rate.** Candidates are listed with the slot's
  planning rate, framed as the budget line — not their quote. The plan tells
  the user to get actual quotes.
- **Disclose every broaden** (Refusal Recovery clearance level) and every
  thin-niche widening step (convention 8 labels).
- **The arithmetic must close.** Subtotals ≤ budget, headroom shown; if the
  goal can't be met inside the budget at band rates, say so rather than
  shading rates down.
- **No contact info** in the plan, regardless of source (convention 7).

## Credit footprint

thorough: ~25–40 credits (1–2 market-intel ×5 + 3 tier searches ×2 + ~15–25
profiles ×1; refusal rungs add 5 each — pre-run estimate fires) ·
thrifty: ~9–14 credits (1 rate call + 2 searches, no profiling)
