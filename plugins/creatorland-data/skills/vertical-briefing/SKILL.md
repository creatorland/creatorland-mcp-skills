---
name: vertical-briefing
description: Write the quarterly "state of creator pricing in [vertical]" memo for a CMO/leadership audience — deal volume, value bands, deal-type mix, and recency signals from the Creatorland corpus, fully cited. Use when the user says "quarterly briefing for Beauty", "state of creator pricing in [vertical]", "market update memo for the CMO", or wants a recurring vertical market summary. For deltas vs a prior snapshot ("what changed"), use vertical-forecast-brief instead.
---

# Quarterly Vertical Briefing

The recurring leadership artifact: a one-to-two-page "state of creator
pricing in <Vertical>, <Quarter>" memo built from corpus aggregates — deal
volume, value bands, deal-type mix, recency signals — every number carrying
its provenance. Written for a CMO/VP audience that will forward it without
you in the room, so it must be defensible by construction. This is a
point-in-time portrait; if the user wants change-over-time ("what's moved
since last quarter"), that's `vertical-forecast-brief`.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit
modes (${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md). No creator lists are
produced, so the Freshness Gate does not fire; recency comes from the
market-intel responses themselves.

## Inputs to collect

- **Vertical** (required) — e.g. "Beauty". If the user runs this for their
  brand, infer from the brand's category; confirm once, never re-ask on
  recurring runs.
- **Period label** (default: current quarter) — cosmetic header label; also
  sets `active_since` to the quarter start for the recency-focused calls.
- **Sub-categories of interest** (optional, max 3) — e.g. "skincare,
  fragrance". Each adds calls; warn on cost in thorough mode.
- **Audience** (default: CMO/leadership) — shapes tone, not data.
- **Mode** — default `thorough`; `thrifty` on request.

If this is a recurring run (the user has run it before this session or names
a cadence), reuse all prior inputs without asking; offer to set up a schedule
via the harness's scheduling facility if one exists.

## Flow

All market-intel calls are **wrapped in Refusal Recovery** (market-mode
floor: 5 brands / 25 deals; rate-mode floor: 10 brands / 50 deals). 5 credits
each, including each ladder retry.

1. **Vertical landscape** — `query_market_intelligence`
   `{ mode: "market", vertical: <vertical> }`
   → deal counts/distributions, deal-type mix, company-type spread.

2. **Recency slice** — `query_market_intelligence`
   `{ mode: "market", vertical: <vertical>, active_since: "<ISO quarter start>" }`
   → how active the vertical has been this period. If this slice refuses,
   ladder per the protocol (here `active_since` is the narrowest constraint —
   widen the window one step, e.g. quarter → trailing 6 months, and disclose)
   and label the section with the actual window that cleared.

3. **Pricing bands** — `query_market_intelligence`
   `{ mode: "rate", vertical: <vertical> }`
   → p25/median/p75 for the vertical. In thorough mode, add one
   `{ mode: "rate", vertical: <vertical>, deal_type: <dominant type from step 1> }`
   for the headline deal type. Optionally add `creator_tier`
   (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+) to get a
   tier-specific band; omit it (the default) for the vertical-wide band. A
   tier too thin for the privacy floor auto-broadens (disclosed) to the
   all-tier band.

4. **Sub-category cuts (thorough only)** — for each requested sub-category:
   `{ mode: "market", vertical: <vertical>, sub_category: <sub> }`. Expect
   thin slices; on refusal take at most 2 ladder rungs then report the
   sub-category as "below the privacy floor — reported at vertical level"
   rather than walking to numbers that no longer describe the sub-category.

5. **Compose the memo** (no tool calls). Pre-run estimate fires before step 1
   if sub-categories push the plan over ~30 credits.

Thrifty: steps 1 + 3 only (2 calls, ~10 credits), no sub-categories, max 2
ladder rungs anywhere.

## Deliverable

```markdown
# State of creator pricing — <Vertical>, <Period>
*Prepared <date> · source: Creatorland deal corpus*

## Headlines (3 bullets)
- <volume headline with number>
- <pricing headline: median + band>
- <mix/recency headline>

## Market activity
<Deal volume, company-type spread, deal-type mix — each stat as a
citation-ready block: stat + the provenance line the tool returned +
recency window (convention 1).>

## Pricing
Vertical band: p25 $<x> · median $<y> · p75 $<z>
<Headline deal type band if pulled.>
These are corpus-level market bands for the vertical — planning context,
not any individual creator's rate.

## This period's activity
<active_since slice — with the actual window that cleared the floor.>

## Sub-category notes            [thorough, if requested]
<Per sub-category: numbers at the level that cleared, or the honest
"below privacy floor" note.>

## What this means for <brand/team>
<2–3 implications. Label every forward-looking sentence as interpretation,
not data.>

---
**Benchmark basis:** <clearance level per section; floor-disclosure note
where any query was broadened — "a privacy feature of the data source,
not missing data">
**Provenance:** <provenance lines from each response, verbatim>
· recency windows as noted per section
Credits used this run: ~N (breakdown: <calls>×5)
```

## Honesty rules

- **Portrait, not trend.** There is no historical time-series tool; this
  memo describes the corpus now. Never write "up/down since last quarter"
  unless a prior snapshot exists — in which case route to
  `vertical-forecast-brief`.
- **Bands are vertical-level market bands** — never attach them to a
  specific creator (convention 2).
- **Sub-category refusals are findings**, not failures: "skincare is below
  the privacy floor" is itself reportable; never substitute vertical numbers
  under a sub-category heading without the label.
- **Interpretation is labeled.** The "what this means" section is the only
  place opinions live, and it says so.
- **Provenance survives the forward.** Never strip footers for prettiness —
  the memo travels without you (convention 1).
- **No contact info** (convention 7).

## Credit footprint

thorough: ~20–30 credits (4 base calls + up to 3 sub-category calls, ×5;
ladder retries add 5 each) · thrifty: ~10 credits (2 calls, capped ladder)
