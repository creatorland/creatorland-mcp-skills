---
name: one-number-rate
description: Instant fair-rate answer — one number, the band, done in 30 seconds. Use when the user says "what should I pay [creator/for X]", "quick rate check", "ballpark rate", "going rate for an IG reel in beauty", or wants a fast number without a memo. Returns the corpus median, the p25–p75 band, one provenance line, and one scope line. For a full negotiation memo with counter range and talking points, use fair-price-brief instead.
---

# One-Number Rate

"What should I pay this creator for an IG reel in beauty?" — answered with
literally one number (the corpus median), the p25–p75 band, and two footer
lines. Speed-to-answer is the product: no memo, no fan-out, no comp set. If
the user wants more than the number, hand off to `fair-price-brief`.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the seven conventions). This skill is thrifty by design and honors
Refusal Recovery (${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md) with a
capped ladder.

## Inputs to collect

- **Vertical** — from the question itself if named ("…in beauty"), otherwise
  inferred from the creator's profile (step 1). Never ask if either source
  has it.
- **Deal type** (optional) — map "an IG reel" / "a sponsored post" / "an
  affiliate deal" to the closest `deal_type`. Omit if the user didn't
  specify one; the vertical-level band is the answer.
- **Creator identifier** (optional) — only needed when the vertical/tier
  isn't already in the question. Handle/URL → `social_handle`, email →
  `email`.
- **Quoted rate** (optional) — if the user mentions a number on the table,
  pass it through as `quoted_rate` so the response positions it; the output
  gains one line ("your $X sits at ~pXX").

Ask nothing if the question already contains a vertical. Ask at most one
clarifying question ever.

## Flow

1. **Profile — SKIPPABLE.** If the user already named the vertical (and tier
   context, if any), skip this entirely: **0 credits**. Otherwise
   `get_creator_profile`
   `{ identifier: { type: "social_handle", platform: <platform>, handle: <handle> } }`
   (exactly one identifier type) → infer primary vertical from interests/
   affiliations, note follower tier and freshness. 1 credit.

2. **Rate benchmark** — `query_market_intelligence`
   `{ mode: "rate", vertical: <vertical>, deal_type: <if specified>, quoted_rate: <if supplied> }`.
   Rate mode floor: 10 brands / 50 deals. On refusal, run the Refusal
   Recovery ladder in **thrifty form: max 2 rungs** (typically drop
   `deal_type`, then vertical-only), stop, and disclose the clearance level
   in the scope line. 5 credits per call including each retry.

3. **Answer.** Four to six lines, then stop. No memo. No Freshness Gate list
   (nothing client-facing is being built); if step 1 ran and the profile was
   stale, fold one clause into the scope line.

## Deliverable

The answer, verbatim format:

```markdown
**$<median>** — median for <vertical><, deal type> deals.
Band: $<p25>–$<p75> (p25–p75).
<If quoted_rate supplied: "Your $<quote> sits at ~p<XX> of the band.">
Provenance: <provenance line from the rate response, verbatim> · <recency window>
Scope: <clearance level — e.g. "Beauty vertical overall; the reel-specific
slice was below the 10-brand/50-deal privacy floor, so scope was widened">.
Corpus band for the vertical/tier — not this creator's personal rate.
Credits used: ~N.

Want the full negotiation memo (counter range, talking points, comp set)?
Say "fair-price brief" — that's the fair-price-brief skill, ~8–13 credits.
```

The hand-off line is part of the deliverable: this skill is the on-ramp to
`fair-price-brief`, not a lesser substitute for it.

## Honesty rules

- **Median of the corpus, not the creator's price.** Always end the scope
  line with the corpus-band disclaimer; per-creator rate history doesn't
  exist.
- **Disclose the rung.** If the ladder broadened the query, the scope line
  says at which level the floor cleared. If 2 rungs didn't clear it, report
  the refusal honestly ("this slice is too thin to benchmark — try the
  vertical-level question or the full fair-price-brief in thorough mode")
  rather than guessing a number.
- **One number means one number.** Resist padding the answer into analysis;
  if the user's follow-up needs analysis, that's the hand-off.
- **No contact info**, ever (convention 7).

## Credit footprint

Target 5–8 credits: **5** (rate call only — user named the vertical, profile
skipped) · **6** (profile + rate) · worst case **10–11** (one ladder retry on
top, at the 2-rung cap). Always end with the actual tally
(`Credits used: ~N`).
