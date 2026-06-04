---
name: fair-price-brief
description: Turn a creator quote into a one-page negotiation memo benchmarked against the Creatorland deal corpus. Use when the user says "is this quote fair", "benchmark this rate", "negotiation prep for [creator/deal]", or has a live quoted fee needing a defensible counter. Memo positions the quote vs p25/median/p75 with counter range, talking points, comp-set names, and provenance. For an instant single number with no memo, use one-number-rate instead.
---

# Fair-Price Negotiator's Brief

You have a live quote from a creator (or their manager) and you need to know:
is it fair, and what do I say back? This skill profiles the creator, benchmarks
the quote against the Creatorland deal corpus for the matching vertical and
deal type, and ends in a one-page negotiation memo a brand-side manager or
agency negotiator can walk into the call with. The clearest ROI in the catalog:
one avoided overpay covers a year of pro.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the seven conventions). This skill honors thrifty/thorough credit
modes (${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

## Inputs to collect

- **Creator identifier** (required) — handle, profile URL, or email. Map to
  one of the five identifier types: a handle/URL → `social_handle`, an email →
  `email`. Never ask for an identifier format the user already gave you in
  another form.
- **Quoted fee** (required) — the number on the table, in USD. If quoted in
  another currency, convert and note the conversion in the memo.
- **Deal composition** (required) — what the fee buys, e.g. "1 IG reel +
  3 stories". Map to the closest `deal_type` the corpus supports (e.g.
  "sponsored_post", "affiliate"); if the composition is a bundle, benchmark
  the dominant deliverable and say so in the memo.
- **Brand / vertical context** (ask only if not inferable) — if the creator's
  profile makes the vertical obvious (a skincare creator quoted by a beauty
  brand), don't ask. Ask when the profile is multi-vertical or the brand's
  category differs from the creator's content.
- **Negotiation posture** (optional, default "find middle") — one of:
  `hold firm` (counter low, anchor hard), `find middle` (counter toward
  median), `walk-away threshold` (user names a ceiling; memo says whether the
  band supports it). Shapes the counter range and the tone of talking points.

Never ask twice; never ask for things the conversation already contains.

## Flow

The server-side `fair-price-check` prompt exists and is maintained with the
server — use it as the analytical spine for step 4's positioning logic where
the harness exposes server prompts.

1. **Profile the creator** — `get_creator_profile`
   `{ identifier: { type: "social_handle", platform: <platform>, handle: <handle> } }`
   (or `{ type: "email", email: ... }` etc., exactly one type). From the
   response take: interests + brand affiliations (pro) → infer the **primary
   vertical**; follower count → tier framing; audience geo; **data
   freshness** (Freshness Gate: if the profile is stale, the memo must carry
   a "re-verify before negotiating" flag — drifted follower counts change the
   tier framing). 1 credit.

2. **Benchmark the quote** — `query_market_intelligence`
   `{ mode: "rate", vertical: <inferred vertical>, deal_type: <mapped deal type>, quoted_rate: <fee in USD> }`
   — **wrapped in Refusal Recovery.** Rate mode enforces a privacy floor of
   10 brands / 50 deals; if the narrow slice refuses, walk the ladder
   (drop `deal_type` → drop `sub_category` → drop `active_since` → drop
   `company_type` → vertical only), stop at the first rung that clears, and
   **disclose the clearance level in the memo** ("benchmark holds at the
   Beauty vertical level — the 'Beauty × sponsored_post' slice was below the
   privacy floor"). Thrifty mode: at most 2 rungs, then report what you have.
   5 credits per call, including each ladder retry.

3. **Comp set (optional — thorough mode only)** — `search_creators`
   `{ mode: "lookalike", seed_creator: { type: "social_handle", platform: <platform>, handle: <handle> }, limit: 5 }`
   — names comparable creators to use as negotiation anchors ("comparable
   talent in this band includes…"). Inference-free, 2 credits. Skip in
   thrifty mode. Do NOT profile the comp set (that's a 5-credit fan-out for
   names that only need to exist); if the user wants comp-set detail, that's
   a follow-up run.

4. **Compose the memo** (no tool calls) — position the quote within the band
   ("the quote sits at ~pXX"), derive the counter range from the posture, and
   write three talking points that each cite a specific number from steps
   1–2. The credit-modes pre-run estimate fires only if a run will exceed ~30
   credits (rare here — only a deep refusal ladder gets close).

## Deliverable

A one-page negotiation memo in markdown, paste-ready:

```markdown
# Negotiation brief — @<handle> · <deal composition>

**Quote on the table:** $<fee> for <composition>
**Market band (<benchmark scope>):** p25 $<x> · median $<y> · p75 $<z>
**Position:** the quote sits at ~p<XX> of the band — <above/within/below
the typical range for this vertical and deal type>.

## Suggested counter
$<low>–$<high> (<posture rationale: e.g. "anchors at median with room to
settle at p60, consistent with 'find middle'">)
<If walk-away threshold supplied: "Your $<ceiling> ceiling sits at ~p<XX>
of the band — the data <supports/does not support> holding it.">

## Talking points
1. <Data-grounded point citing a band number>
2. <Point grounded in deal volume / recency signals from the rate response>
3. <Point grounded in the creator's tier/audience-geo fit vs the band>

## Comparable talent (negotiation anchors)        [thorough mode]
@<comp1>, @<comp2>, @<comp3>, @<comp4>, @<comp5> — lookalikes of the
quoted creator; same vertical band applies.

---
**Benchmark basis:** <vertical / scope at which the privacy floor cleared,
with the floor-disclosure note if the query was broadened — "this is a
privacy feature of the data source, not missing data">
**Provenance:** <the provenance line the rate response returned, verbatim>
· recency window: <window>
**Profile freshness:** <fresh/aging/stale per the Freshness Gate — if stale:
"re-verify follower tier before negotiating">
**Honesty note:** the band is the corpus-level market range for this
vertical/tier — it is NOT this creator's personal rate history (that data
does not exist).
Credits used this run: ~N (breakdown: 1 profile + 5×<rate calls> + 2 comp set)
```

Never strip the provenance or scope footers to make the memo prettier — they
are what makes it defensible when pasted into a client thread.

## Honesty rules

- **Market band, never "their rate."** The benchmark is corpus-level for the
  vertical/tier. Per-creator rate history does not exist in the product; never
  phrase the band as what this creator "usually charges" or "has accepted."
- **Disclose every broaden.** If Refusal Recovery widened the slice, the memo
  states the level at which the floor cleared. Never present a broadened
  number as if it answered the narrow question.
- **Bundles are approximations.** When the deal composition is a multi-asset
  bundle benchmarked against a single deal_type, say so.
- **Stale profile = flagged memo.** A stale profile changes tier framing;
  the Freshness Gate note is not optional.
- **No contact info.** Never imply you can reach the creator; route contact
  questions to Creatorland connections (coming soon) or public profiles.

## Credit footprint

thorough: ~8–13 credits (1 profile + 1–2 rate calls + comp set; deep refusal
ladders add 5/rung) · thrifty: ~6 credits (1 profile + 1 rate call, max 2
ladder rungs, no comp set)
