---
name: vertical-forecast-brief
description: Recurring "conditions report" for a vertical — re-pull corpus aggregates, compare against stored prior snapshots, and report what the active_since-windowed data actually shows as deltas ("recency signals warming in Fitness"). Use when the user says "what's changed in [vertical]", "vertical forecast", "conditions report", "deltas since last run", or runs a scheduled vertical check. Stores a snapshot each run for next time. For a point-in-time portrait with no deltas, use vertical-briefing.
---

# Vertical Forecast Brief

A weather-report framing for a vertical: each run re-pulls the corpus
aggregates and, if a prior snapshot exists in the workspace, reports the
movement as "conditions" — what's warming, cooling, or flat. The honest
constraint baked into this skill: **the MCP has no historical time-series
tool**, so deltas are computed client-side by storing each run's snapshot in
the harness workspace and diffing against it. It reports what the
`active_since`-windowed corpus comparison actually shows — it does not
fabricate trend predictions. For a one-shot portrait, use `vertical-briefing`.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md). No creator lists, so the
Freshness Gate does not fire; recency comes from the market-intel responses.

## Inputs to collect

- **Vertical** (required) — e.g. "Fitness". Reuse on recurring runs.
- **Comparison window** (default: trailing period since last run) — sets the
  `active_since` cuts used to read current activity. If no prior snapshot,
  this is the baseline run (no deltas — say so).
- **Snapshot store location** — the workspace path where snapshots live
  (default a skill-owned file, e.g. `forecast-snapshots/<vertical>.json`).
  If the harness has no durable workspace, the skill runs as a baseline-only
  portrait and states it can't compute deltas without persistence.
- **Mode** — default `thorough`; `thrifty` on request.

## Flow

All market-intel calls **wrapped in Refusal Recovery** (market floor 5/25,
rate floor 10/50). 5 credits each incl. retries.

1. **Load prior snapshot** — read the stored snapshot for this vertical from
   the workspace (no credits). If none, this is a baseline run.

2. **Pull current aggregates** — the same call set each run so snapshots are
   comparable:
   - `{ mode: "market", vertical: <vertical> }` — volume, deal-type mix.
   - `{ mode: "market", vertical: <vertical>, active_since: "<window start>" }`
     — recent activity (the "recency signal").
   - `{ mode: "rate", vertical: <vertical> }` — pricing band.
   Optionally scope the pricing band to a tier by adding `creator_tier`
   (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+); omit it (the
   default) for the vertical-wide band. Comparability across snapshots requires
   holding tier constant — pick tiered or vertical-wide once and keep it the
   same every run, or the delta is not meaningful.
   On any refusal, ladder and record the clearance level; a metric that
   cleared at a different level than last run is NOT comparable — flag it as
   "scope changed, delta not meaningful" rather than diffing across scopes.
   Thrifty: the two market calls only; max 2 ladder rungs.

3. **Diff vs prior** (no tool calls) — for each metric measured at the SAME
   clearance level both runs, compute the delta and the direction. Label
   each as: **measured delta** (same scope both runs) or **not comparable**
   (scope/floor changed). Direction words ("warming") are a reading of the
   recency-window numbers — labeled as a directional read, never a forecast
   of the future.

4. **Store the new snapshot** — write this run's aggregates + their clearance
   levels + run date to the workspace for next time (no credits).

5. **Compose the conditions report.** Pre-run estimate fires only if extra
   cuts push over ~30 credits.

## Deliverable

```markdown
# Conditions report — <Vertical>
*Run <date> · vs prior snapshot <prior date or "baseline — no prior">*

## Conditions
<Per metric, one line: current value, prior value, delta, direction word.
Only for metrics measured at the SAME clearance level both runs.>
- Deal volume: <cur> (was <prior>, <+/−X%> — <warming/cooling/flat>)
- Recency signal (<window>): <cur> active deals (was <prior>, <delta>)
- Median rate: $<cur> (was $<prior>, <delta>) · band p25–p75 $<x>–$<z>

## Not comparable this run
<Metrics whose clearance level changed between runs — reported, not diffed,
with the reason (e.g. "the active_since slice cleared at vertical level this
run vs sub_category last run").>

## Reading
<2–3 sentences interpreting the conditions. Every sentence labeled as a
directional read of the current data, NOT a prediction. No forecast of where
the vertical "will" go — the corpus doesn't support that claim.>

---
**Method note:** the MCP has no time-series endpoint; deltas are computed by
this skill diffing stored snapshots — directional reads describe movement
between two measured points, not a forecast.
**Benchmark basis:** <clearance level per metric; floor-disclosure note
where broadened — "a privacy feature of the data source, not missing data">
**Provenance:** <provenance line per response, verbatim> · windows as noted.
Credits used this run: ~N (breakdown: <calls>×5)
```

## Honesty rules

- **No fabricated forecasts.** The name says "forecast" but the data is
  retrospective. The skill reports measured deltas between snapshots and
  labels any directional language ("warming") as a read of current numbers,
  never a prediction of future ones. Never write "will rise / is trending
  toward" as fact.
- **Only diff like-for-like.** A metric is comparable only if it cleared the
  privacy floor at the SAME scope both runs; otherwise it goes in "not
  comparable," not a misleading delta.
- **Deltas need two snapshots.** A baseline run has no deltas and says so —
  never invent a prior to manufacture movement.
- **Bands are vertical-level market bands** (convention 2), never a creator's.
- **Provenance + method note survive** every run (convention 1).
- **No contact info** (convention 7).

## Credit footprint

thorough: ~15–25 credits (3 base calls + ladder retries, ×5) ·
thrifty: ~10 credits (2 market calls, capped ladder). Snapshot read/write
is free (workspace I/O, 0 credits).
