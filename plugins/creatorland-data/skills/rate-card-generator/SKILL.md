---
name: rate-card-generator
description: Take a LIST of creators and emit a formatted internal rate card — a benchmark band per creator (by deal type where the corpus supports it) with provenance, a "Zestimate" for creator rates. Use when the user says "build a rate card", "rate card for these creators", "benchmark this roster's rates", or hands over multiple creators needing band context each. Deliverable is a per-creator rate-card table. For one deal's memo use fair-price-brief; for a single quick number use one-number-rate.
---

# Rate Card Generator

The "Zestimate" skill: hand it a list of creators and it returns an internal
rate card — each creator positioned within the corpus rate band for their
vertical/tier, by deal type where the corpus supports it. It is a roster-wide
benchmarking artifact (the multi-creator analogue of `one-number-rate`), not a
negotiation memo for one deal and not a single quick answer. The familiar
mental model — every creator gets an estimated band — is the point.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

## Inputs to collect

- **Creator list** (required) — handles, URLs, emails, or a pasted roster.
  Map each to one identifier type. De-dupe before running.
- **Deal types to band** (optional) — the deal types the card should cover
  (e.g. sponsored_post, affiliate). Default: one column at the vertical level
  per creator. Each extra deal type multiplies market-intel calls per
  distinct vertical — warn on cost.
- **Grouping** (optional, default by vertical) — the card groups creators by
  inferred vertical so one band lookup serves a whole group (the key credit
  saving — see Flow).
- **Mode** — default `thorough`; `thrifty` on request.

Never re-ask for identifiers already given in another form.

## Flow

The credit-smart move: **profile every creator, but benchmark per vertical
group, not per creator** — the band is corpus-level, so creators sharing a
vertical/deal-type share one market-intel call.

1. **Profile each creator** — `get_creator_profile`
   `{ identifier: { type: "social_handle", platform: <platform>, handle: <handle> } }`
   (or the matching identifier type), one per creator. Take: vertical
   (interests/affiliations), follower tier, audience geo, **data freshness**.
   1 credit each. This drives the Freshness Gate.
   Thrifty: still profile (vertical inference needs it) but you may cap the
   list to the user's stated priority creators and say how many were deferred.

2. **Group + benchmark once per group** — bucket creators by inferred
   vertical (× deal type if requested). For each distinct bucket:
   `query_market_intelligence` `{ mode: "rate", vertical: <vertical>, deal_type: <if requested>, creator_tier: <derive from each creator's follower count when known> }`
   For each creator whose follower count you know (from the input list or a
   profile lookup), derive `creator_tier` (emerging <1k / nano 1k-10k / micro
   10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+) so each row is banded
   against same-size creators in its vertical. `creator_tier` requires a
   vertical; a tier too thin for the distinct-creator privacy floor broadens
   (disclosed) to the all-tier band — show the band level in that row's
   provenance.
   — **wrapped in Refusal Recovery** (rate floor 10 brands / 50 deals).
   On refusal, walk the ladder, stop at first clearance, and record the
   clearance level for every creator in that bucket. 5 credits per bucket call
   incl. each retry. Thrifty: max 2 ladder rungs per bucket; collapse
   deal-type columns to the vertical band only.

3. **Position each creator in its bucket band** — no tool calls. Each
   creator's card cell is a BAND (p25–p75 with median), with a note on where
   their tier likely sits within it (macro → upper band, micro → lower) —
   framed as a band position, never a point rate for that person.

4. **Freshness Gate** — fresh/aging rows on the card normally; stale rows go
   to a "re-verify before use" section. Thrifty may drop stale rows and say
   how many.

5. **Pre-run estimate** fires before step 1 if the roster + buckets exceed
   ~30 credits.

## Deliverable

```markdown
# Rate card — <roster name / date>
*Bands are corpus-level market ranges for each creator's vertical/tier —
internal benchmarking context, NOT any creator's quoted or historical rate.*

## <Vertical group A>  (band basis: <clearance level>)
| Creator | Tier | <Deal type 1> band | <Deal type 2> band | Freshness |
|---|---|---|---|---|
| @h1 | Macro | $x–$z (med $y), ~upper band | … | fresh |
| @h2 | Micro | $x–$z (med $y), ~lower band | … | aging |

## <Vertical group B> (band basis: …)
| … |

## Re-verify before use
@h7 (stale profile — follower tier may have drifted) …
— or "none".

---
**Benchmark basis (per group):** <clearance level + floor-disclosure note
where any bucket was broadened — "a privacy feature of the data source, not
missing data">
**Provenance:** <provenance line per bucket response, verbatim>
· recency window: <window>
**Data freshness:** N/M creators synced within the last sync window; K
flagged for re-verification before use.
**Honesty note:** every cell is the corpus market band for that creator's
vertical/tier with their likely position in it — it is NOT a personal rate.
Per-creator rate history does not exist in the product. Confirm actual quotes
before relying on any cell.
Credits used this run: ~N (breakdown: <profiles>×1 + <buckets>×5)
```

## Honesty rules

- **Every cell is a band, never a number for that person.** The card
  positions each creator WITHIN their vertical/tier band; it never asserts a
  specific creator's rate (convention 2). The header and footer both say so.
- **Band basis is disclosed per group**, including any Refusal Recovery
  broaden — a thin vertical's group says it cleared at a wider level.
- **Tier position is a likelihood, labeled.** "Macro → upper band" is a
  framing of where in the band that tier tends to sit, not a precise rate.
- **Freshness Gate is mandatory** — a rate card pasted into a planning doc
  with stale tiers misleads; stale rows are quarantined.
- **No contact info** anywhere on the card, regardless of source
  (convention 7) — scrub any bio snippets.

## Credit footprint

thorough: ~15–40 credits (1 profile/creator + 1 rate call per vertical-group
× deal-type; e.g. 20 creators in 3 verticals × 2 deal types = 20 + 30 = 50,
pre-run estimate fires) · thrifty: profiles + 1 vertical-only band call per
group, capped ladder (e.g. 12 creators / 3 verticals ≈ 12 + 15 = 27)
