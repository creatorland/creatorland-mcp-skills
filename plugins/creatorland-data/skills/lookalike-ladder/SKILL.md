---
name: lookalike-ladder
description: Find creators with the same vibe as a named seed creator, tiered into price bands — the "we love her but she's booked/too expensive" answer. Use when the user names ONE creator they love and wants similar-but-cheaper or similar-but-available options, says "who's like @X but more affordable", "lookalikes for [creator] at different price points", or "same energy, smaller budget". Deliverable is a three-rung ladder (premium/mid/value) with a vertical rate band per rung.
---

# Lookalike Ladder

Takes one beloved-but-unavailable seed creator and produces "same vibe, three
price points": lookalike candidates profiled, sorted into follower-tier rungs,
each rung framed against the vertical's market rate band. For casting directors
whose client fell in love with talent the budget (or calendar) can't have.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> If the user has a written brief AND a seed creator and wants the
> intersection, that's `triangulated-casting`. If they have only a brief, use
> `brief-to-shortlist`. This skill is seed-only: one creator in, a price-tiered
> ladder out.

## Inputs to collect

- **The seed** (required) — a creator handle/URL, or a specific post URL if
  the client loved one piece of content rather than the creator overall.
  Exactly one seed; if the user names several loved creators, that's a
  multi-seed job — offer `triangulated-casting` per seed or run this skill
  once per seed as a slate (convention 9).
- **Why the seed is out** (optional, one question max) — "booked", "too
  expensive", or "just want options". Shapes the ladder emphasis (price-led
  vs availability-led framing); default to price-led.
- **Ladder size** — default 9 (3 per rung). Don't ask if context implies one.
- **Geo / platform constraints** (optional) — only if the user volunteers
  them; lookalike mode itself takes no filters, so these apply as a
  post-filter on profiled results, disclosed if they thin the ladder.
- **Credit mode** — default `thorough`; `thrifty` on trigger phrases.

## Flow

**Step 1 — Anchor profile.** Profile the seed to learn its vertical, follower
tier, audience geo, and interests — this anchors rung boundaries and the rate
call:

```json
get_creator_profile { "identifier": { "type": "social_handle", "platform": "<platform>", "handle": "<seed handle>" } }
```

(Use whichever identifier type the user gave — exactly one type per call.)
Skip this step if the seed is a content URL with no known creator; infer
vertical from the lookalike results instead, and say so.

**Step 2 — Lookalike search.** One inference-free call. Exactly ONE of
`seed_creator` or `seed_content` — never both:

```json
search_creators {
  "mode": "lookalike",
  "seed_creator": { "type": "social_handle", "platform": "<platform>", "handle": "<seed handle>" },
  "limit": 27,
  "precision": "balanced"
}
```

or, when the client loved a specific post:

```json
search_creators {
  "mode": "lookalike",
  "seed_content": { "url": "<post URL>" },
  "limit": 27,
  "precision": "balanced"
}
```

Thorough: limit = 3× ladder size. Thrifty: limit = 2× ladder size, precision
`"tight"` to cut noise early. Lookalike mode is embedding-based — no filters
argument; any geo/platform constraints from intake are applied after
profiling, with a note if they shrank a rung.

**Step 3 — Profile fan-out.** `get_creator_profile` per candidate, using the
identifier type the search result returns:

```json
get_creator_profile { "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id from search result>" } }
```

Thorough: profile every candidate. Thrifty: profile the top `ladder size + 3`
by lookalike similarity.

**Credit estimate fires here.** Thorough at default size: 1 seed profile + 2
search + 27 profiles + 5 rate = ~35 credits — over the ~30 threshold, so state
the estimate and offer thrifty before fanning out (don't block).

**Step 4 — Freshness Gate.** Classify every profiled candidate fresh / aging /
stale. Stale candidates go only in "re-verify before pitch" (thrifty: may drop
them, saying how many).

**Step 5 — Build the rungs.** Sort candidates into three follower-tier rungs
relative to the seed: **Premium** (seed's tier or above), **Mid** (one tier
down), **Value** (two tiers down / micro). Rungs are follower tiers, not
prices — pricing context comes from step 6 and is band-level only.

**Step 6 — One rate call for the ladder's vertical.** Exactly one
`query_market_intelligence`, wrapped in Refusal Recovery:

```json
query_market_intelligence {
  "mode": "rate",
  "vertical": "<seed's vertical from step 1>"
}
```

If refused (rate floor: 10 brands / 50 deals), walk the ladder per the module
(thorough: until clearance; thrifty: max 2 rungs) and disclose the clearance
level. The band frames the WHOLE vertical — rung-level price differences are
follower-tier inference, never per-creator rates, and the deliverable says so.

## Deliverable

```markdown
# Lookalike Ladder — same vibe as @<seed>
_Seeded from <@handle | post URL>, <date> · <N> creators across 3 rungs · Creatorland Data_

## The seed, as the data sees it
<2–3 lines: vertical, tier, audience geo, the interest/vibe signals driving
the match — from the step-1 profile. If seed was a content URL: "matched on
the post's content embedding; vertical inferred from results.">

## Rung 1 — Premium (closest to @<seed>'s tier)
### <Name> — @<handle> (<platform>, <follower count>)
- **Vibe match:** <what the profile shares with the seed — interests,
  hashtags, audience shape; similarity is embedding-based, inference-free>
- **Audience-geo:** <top geos>
- **Freshness:** fresh | aging (note)
<repeat per creator; then Rung 2 — Mid, Rung 3 — Value, same row format>

## Price context (vertical band, not per-creator)
Market band for the **<vertical>** vertical<, broadened per note below>:
p25 $<x> · median $<y> · p75 $<z> — <deal volume / recency from the tool>.
> <provenance line exactly as the tool returned it>
Rung pricing logic: lower follower tiers typically transact lower in this
band — but the corpus has **no per-creator rates**; treat rungs as budget
directionality, not quotes. <If broadened: disclose clearance level per the
refusal-recovery module.>

## Re-verify before pitch
<stale candidates; or "None — all candidates cleared the freshness gate.">

## Caveats
- Similarity comes from stored content/profile embeddings — inference-free,
  but "vibe" is the model's read; sanity-check the grids before pitching.
- <any post-filters (geo/platform) applied and how many candidates they cut>
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or the creator's public profiles.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · 1 lookalike search + <M> profiles + 1 rate benchmark (<clearance level>) · <date>.
Credits used this run: ~<N> (<1 seed profile ×1 +> 1 search ×2 + <M> profiles ×1 + <R> market-intel ×5).
```

## Honesty rules

- **Rungs are follower tiers; the band is vertical-level.** Never write "Rung
  3 costs $X" — write "value-tier creators typically transact lower within the
  vertical band". No per-creator rates exist.
- Lookalike similarity is embedding-based and inference-free — present it as
  "the data's vibe match", not a human editorial judgment.
- Disclose Refusal Recovery broadening at the clearance level, always.
- If post-filters (geo/platform) emptied a rung, say so — never quietly
  promote weaker matches up a rung (convention 8 spirit).
- Stale data never silently mixes into the rungs.
- Never imply access to creator contact info (convention 7).

## Credit footprint

thorough: ~35 credits (1 seed profile + 1 search ×2 + ~27 profiles + 1 rate
call ×5; +5 per refusal-ladder rung) · thrifty: ~22 credits (1 seed profile +
1 search ×2 + ~12 profiles + 1 rate call ×5, max 2 ladder rungs)
