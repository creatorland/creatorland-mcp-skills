---
name: data-storyline-miner
description: Internal content skill — sweep query_market_intelligence across verticals and deal types for headline-worthy contrasts ("Beauty deal volume up, median value down"), then draft newsletter and LinkedIn posts with provenance baked in. Use when the user says "find a data story", "mine the corpus for content", "storyline miner", "what's a LinkedIn post from our data", or wants top-of-funnel content sourced from the corpus itself. Deliverable is a ranked story list plus ready-to-publish drafts, each carrying its citation. For a single vertical's leadership memo use vertical-briefing; for tracked deltas use vertical-forecast-brief.
---

# Data Storyline Miner

The corpus is the content engine. This internal marketing skill sweeps the
market-intelligence surface across verticals, deal types, and recency windows
looking for contrasts a reader would stop scrolling for — "Beauty deal volume
is up but median value is down", "Affiliate is eating flat-fee in Fitness" —
and drafts publishable newsletter and LinkedIn copy from them, every claim
shipping with its provenance line so the post is defensible the moment it goes
out. It is top-of-funnel sourced from our own data; the artifact is a ranked
shortlist of candidate stories plus ready-to-paste drafts. For a single
vertical's leadership memo use `vertical-briefing`; for movement-over-time use
`vertical-forecast-brief`.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md). No creator lists are
produced, so the Freshness Gate does not fire; recency comes from the
market-intel responses themselves.

## The "trend" constraint (read this before drafting)

There is **no historical time-series tool**. A genuine "up / down / rising"
story therefore needs two measured points. This skill gets them one of two ways
only:

- **Cross-sectional contrast** (default, no persistence needed): the contrast
  is between two slices measured in the SAME run — vertical A vs vertical B,
  deal type X vs deal type Y, or a recency window vs the all-time slice of the
  same vertical. This is an honest "as of now" comparison, never a claim about
  change over time.
- **Snapshot delta** (only if a prior snapshot exists): if the workspace holds
  a prior storyline snapshot for the same slice, a true over-time delta can be
  computed and stated as such. With no prior snapshot, over-time language is
  banned — the story is framed cross-sectionally or not at all.

Never write "up since last quarter / trending / on the rise" unless a stored
prior snapshot backs it. A within-run contrast is phrased as a contrast
("Beauty's median sits below Fitness's", "this window is quieter than the
vertical's all-time rate"), not as motion.

## Inputs to collect

- **Verticals to sweep** (default: a standard set of the densest corpus
  verticals, e.g. Beauty, Fitness, Fashion, Food, Tech/Gaming — confirm once).
  More verticals = more calls; warn on cost in thorough mode.
- **Angle** (optional) — "pricing", "deal-type mix", "where's the momentum".
  Shapes which cuts to pull; default is a broad sweep across all three.
- **Channel** (default: both) — `newsletter`, `linkedin`, or both. Sets draft
  length and voice, not the data.
- **Snapshot store location** (optional) — workspace path where storyline
  snapshots live (default `storyline-snapshots/<slice>.json`). Only needed if
  the user wants over-time deltas; absent it, the skill runs cross-sectional.
- **Mode** — default `thorough`; `thrifty` on request.

If this is a recurring content run, reuse prior inputs without re-asking and
offer to schedule it via the harness's scheduling facility if one exists.

## Flow

All market-intel calls are **wrapped in Refusal Recovery** (market floor
5 brands / 25 deals; rate floor 10 brands / 50 deals). 5 credits each,
including each ladder retry. A thin slice that refuses is itself a finding
("we don't yet have floor-clearing volume in <slice>") — it never becomes a
fabricated number, and a refused slice is simply not eligible to anchor a story.

1. **Per-vertical landscape** — for each vertical in the sweep:
   `query_market_intelligence` `{ mode: "market", vertical: <v> }`
   -> deal counts, deal-type mix, company-type spread.

2. **Per-vertical pricing** — for each vertical:
   `{ mode: "rate", vertical: <v> }` -> p25 / median / p75 band. Optionally add
   `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+) to mine
   a tier-specific contrast (e.g. "micro Beauty median up, macro flat"); omit
   it (the default) for the vertical-wide band, and never diff a tiered band
   against a vertical-wide one in the same story.

3. **Recency slice (thorough)** — for each vertical:
   `{ mode: "market", vertical: <v>, active_since: "<recent window start>" }`
   -> how active the vertical has been lately, for "where's the momentum"
   angles. Ladder by widening the window if it refuses; label the section with
   the window that actually cleared.

4. **Snapshot I/O (only if over-time deltas requested)** — read any prior
   snapshot for each slice before drafting; write this run's aggregates +
   clearance levels + run date after. Free (workspace I/O, 0 credits). A metric
   that cleared at a different level than last run is **not comparable** — flag
   it, don't diff across scopes.

5. **Mine contrasts** (no tool calls) — scan the assembled aggregates for the
   sharpest legitimate contrasts: volume vs value divergence, deal-type shift,
   one vertical against another, a recency window against the all-time slice.
   Rank candidate stories by how surprising AND how floor-clean they are.

6. **Draft** (no tool calls) — write the top stories into channel-appropriate
   copy with provenance attached.

Pre-run estimate fires before step 1 when the sweep's planned calls exceed
~30 credits (e.g. 5 verticals x 3 calls x 5 = 75 credits -> say so first).

Thrifty: steps 1 + 2 only, fewer verticals, no recency slice, max 2 ladder
rungs anywhere — cross-sectional stories only.

## Deliverable

```markdown
# Data storylines — <date>
*Source: Creatorland deal corpus · sweep: <verticals / cuts covered>*

## Ranked story candidates
1. **<headline contrast>** — <one line: the two slices and the gap>.
   Strength: <surprising + floor-clean>. Framing: <cross-sectional / over-time>.
2. ...
<Each candidate names the exact slices compared and whether it is a within-run
contrast or a snapshot-backed delta.>

## Drafts

### Newsletter — "<working title>"
<2-4 short paragraphs. Every stat inline-cited: stat + the provenance line the
tool returned + the recency window. No over-time verb unless snapshot-backed.>

### LinkedIn — "<hook>"
<Hook line + 3-5 short lines + soft CTA. Same citation discipline; provenance
can sit in a closing "source" line rather than inline, but never omitted.>

---
**Benchmark basis:** <clearance level per slice used; floor-disclosure note
where any query was broadened — "a privacy feature of the data source, not
missing data">. Slices that refused are listed here as "below floor — not used
as a story anchor".
**Provenance:** <provenance lines from each response used, verbatim>
· recency windows as noted.
**Framing note:** <if any draft uses over-time language, the prior-snapshot date
that backs it; otherwise "all contrasts are point-in-time / cross-sectional">.
Credits used this run: ~N (breakdown: <calls>x5)
```

## Honesty rules

- **Contrast, not motion, by default.** With no prior snapshot the story is a
  within-run comparison; never dress a cross-sectional gap as a trend. "Up /
  rising / since last quarter" requires a stored prior snapshot and says which.
- **Refused slices are findings, never anchors.** A slice below the privacy
  floor is reportable as such; it cannot anchor a story and is never padded to
  a number. Disclose it in the benchmark basis.
- **Bands are vertical-level market bands** (convention 2) — never attached to
  a creator, and never implied to be one creator's rate even in a punchy hook.
- **Provenance ships with the post.** The whole point is defensible content:
  every published stat carries its citation, even in LinkedIn copy. Never strip
  it for polish (convention 1).
- **Clearance level is part of the claim.** If a contrast only holds at vertical
  level (not sub-category), the copy says so rather than implying sub-category
  precision (convention 2).
- **No contact info** anywhere in drafts (convention 7).
- **Interpretation is labeled.** A "what this might mean" line is opinion and is
  marked as such; the data carries the headline, the read carries the asterisk.

## Credit footprint

thorough: ~45-75 credits for a 5-vertical sweep (3 calls/vertical x 5; ladder
retries add 5 each) — pre-run estimate fires · thrifty: ~20 credits (2 calls x
fewer verticals, capped ladder). Snapshot read/write is free (0 credits).
