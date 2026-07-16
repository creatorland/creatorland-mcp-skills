---
name: rate-justifier
description: Talent-manager / creator-side skill — build the case to DEFEND a quote you're sending a brand, using corpus rate bands ("market p75 for this band is $X, here's why our ask sits there"). Use when the user says "justify our rate", "defend this quote", "we're asking $X — back it up", "talent-side rate case", or is the seller, not the buyer. Deliverable is a justification memo positioning the ask within the market band. For the buyer's negotiation memo, use fair-price-brief.
---

# Rate Justifier (talent-side)

The mirror image of `fair-price-brief`: this skill serves the **seller** — a
talent manager or creator defending the rate they're about to quote a brand.
It benchmarks the creator's vertical against the Creatorland corpus and builds
a memo arguing why the ask sits where it does in the band ("market p75 for
this tier in Fitness is $X; here is the case for our number"). Same tools,
opposite chair. Deliverable is a justification memo the manager sends or walks
in with.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

## Inputs to collect

- **Creator identifier** (required) — handle/URL → `social_handle`, email →
  `email`. Never re-ask in a form already given.
- **The ask** (required) — the rate you intend to quote, in USD.
- **Deal composition** (required) — what the ask covers; map to the closest
  `deal_type`. Bundles: benchmark the dominant deliverable and say so.
- **Vertical** (ask only if not inferable from the profile).
- **Justification posture** (optional, default "premium-but-defensible") —
  `premium` (argue toward p75+), `market` (argue at/near median),
  `value-add` (argue the ask buys more than the band's typical scope).
  Shapes which band position the case anchors on.

Never ask twice; never ask for what the conversation already holds.

## Flow

1. **Profile the creator** — `get_creator_profile`
   `{ identifier: { type: "social_handle", platform: <platform>, handle: <handle> } }`
   (exactly one identifier type). Take interests + brand affiliations (pro) →
   primary vertical; follower count → tier framing; audience geo; **data
   freshness**. Freshness Gate: a stale profile means follower tier may have
   drifted — the memo carries a "re-verify tier before sending" flag, because
   a defense built on a stale follower count is a liability. 1 credit.

2. **Benchmark the band** — `query_market_intelligence`
   `{ mode: "rate", vertical: <vertical>, deal_type: <mapped>, quoted_rate: <the ask>, creator_tier: <the creator's follower tier, if known> }`
   — **wrapped in Refusal Recovery** (rate floor 10 brands / 50 deals). The
   `quoted_rate` positions the ask within the band ("your $X sits at ~pYY"). When the
   creator's follower size is known, pass `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+) so the ask
   benchmarks against same-size creators in the vertical — the stronger comp; a
   tier too thin for the privacy floor broadens (disclosed) to the all-tier band.
   On refusal, walk the ladder, stop at first clearance, and disclose the
   level in the memo. Thrifty: max 2 rungs. 5 credits per call incl. retries.

3. **Comparable talent (thorough only)** — `search_creators`
   `{ mode: "lookalike", seed_creator: { type: "social_handle", platform: <platform>, handle: <handle> }, limit: 5 }`
   — names peer creators as "this is the band our talent competes in"
   evidence. Inference-free, 2 credits. Do NOT profile them (names only).
   Skip in thrifty.

4. **Compose the memo** (no tool calls). The case is built FROM the band
   position the posture targets, citing specific numbers. Pre-run estimate
   fires only on a deep refusal ladder (rare).

## Deliverable

```markdown
# Rate justification — @<handle> · <deal composition>

**Our ask:** $<rate> for <composition>
**Market band (<benchmark scope>):** p25 $<x> · median $<y> · p75 $<z>
**Where the ask sits:** ~p<YY> of the band — <and why that's defensible
given posture>.

## The case
1. <Argument anchored to a band number — e.g. "the ask sits at p70; for a
   <tier> creator in <vertical> with <audience-geo strength>, p70 is the
   appropriate band position because…">
2. <Argument from deal-volume / recency signals in the rate response —
   demand context.>
3. <Argument from the creator's specific fit vs the band's typical profile —
   what justifies positioning above/at median.>

## Comparable talent (the competitive band)        [thorough mode]
@<comp1>…@<comp5> — lookalikes; the same vertical band frames all of them.

## If the brand counters
<One line per likely pushback with the band-grounded response — e.g. "if
they cite a lower number, that sits at ~p<XX>, below the typical range for
this tier">.

---
**Benchmark basis:** <clearance level + floor-disclosure note if broadened —
"a privacy feature of the data source, not missing data">
**Provenance:** <provenance line from the rate response, verbatim>
· recency window: <window>
**Profile freshness:** <fresh/aging/stale — if stale: "re-verify follower
tier before sending; the case relies on current tier">
**Honesty note:** the band is the corpus-level market range for this
vertical/tier — it positions WHERE the ask sits in the market, it is NOT a
record of what this creator has previously charged (that data does not exist).
Credits used this run: ~N (breakdown: 1 profile + 5×<rate calls> + 2 comp set)
```

## Honesty rules

- **Market band, never "their proven rate."** The band positions the ask in
  the market; it is not the creator's price history (which doesn't exist).
  The case argues "this position is appropriate," never "this is what they
  always get" (convention 2).
- **Position the ask WITHIN a band — that's the whole job.** The deliverable
  frames a creator's number relative to the corpus band; it does not
  manufacture a creator-specific rate.
- **Disclose every broaden** (Refusal Recovery clearance level).
- **Defend honestly.** If the ask sits above p75 and the band doesn't support
  the posture, say so — a justification memo that overclaims gets the manager
  burned in the room. Offer the defensible position instead.
- **Stale profile = flagged memo** — the case depends on current tier.
- **No contact info** (convention 7).

## Credit footprint

thorough: ~8–13 credits (1 profile + 1–2 rate calls + comp set; deep refusal
ladders add 5/rung) · thrifty: ~6 credits (1 profile + 1 rate call, max 2
ladder rungs, no comp set)
