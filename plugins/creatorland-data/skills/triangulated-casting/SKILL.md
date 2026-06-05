---
name: triangulated-casting
description: Highest-confidence casting — run a written brief AND a lookalike off a known-good past performer, then intersect so creators in BOTH rank first. Use when the user has a brief AND names a creator who already worked well — "cast this brief and find more like @X", "intersect the brief with lookalikes of our best performer", or "triangulate off [creator] and this brief". Deliverable is a confidence-tiered shortlist. Needs BOTH; brief alone use brief-to-shortlist, seed alone use lookalike-ladder.
---

# Triangulated Casting

The highest-confidence casting move on the surface: combine both
`search_creators` modes. Run brief mode on the campaign requirements AND
lookalike mode seeded from a creator who already performed well, then intersect.
Creators that appear in BOTH searches are the strongest picks — they match the
stated brief and resemble proven talent. For casting directors who have a past
winner and want "more of that, but on-brief."

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> This skill requires BOTH a brief and a seed creator. Brief only →
> `brief-to-shortlist`. Seed only, tiered by price → `lookalike-ladder`. The
> intersection is the whole point here.

## Inputs to collect

- **The brief** (required) — any written format; normalization is your job.
- **The seed performer** (required) — one creator who already worked well
  (handle/URL), or one standout post URL. Exactly one seed (lookalike takes
  one of `seed_creator` or `seed_content`). Multiple proven performers → run
  the skill once per seed and present as a slate (convention 9), or pick the
  single best with the user.
- **Shortlist size** — default 8.
- **Competitor brands to conflict-check** (optional) — ask once if unstated
  and conflicts plausibly matter.
- **Credit mode** — default `thorough`; `thrifty` on trigger phrases.

## Flow

**Step 0 — Normalize the brief (no tool call).** Structured campaign
description: audience, vertical, vibe words, platform, geo, tier, exclusions.
Show it back; proceed unless corrected. Keep the client's language.

**Step 1 — Brief search.** One call:

```json
search_creators {
  "mode": "brief",
  "brief": "<normalized brief text, ≤2000 chars, vibe words kept>",
  "filters": {
    "platform": "<if named>",
    "country": "<primary market if stated>",
    "niche": "<if clean>",
    "min_followers": <tier floor if set>,
    "max_followers": <tier ceiling if set>
  },
  "limit": <3× shortlist size (thorough) | 2× (thrifty)>,
  "precision": "balanced"
}
```

**Step 2 — Lookalike search.** One inference-free call — exactly ONE of
`seed_creator` or `seed_content`, never both, no filters argument:

```json
search_creators {
  "mode": "lookalike",
  "seed_creator": { "type": "social_handle", "platform": "<platform>", "handle": "<seed handle>" },
  "limit": <3× shortlist size (thorough) | 2× (thrifty)>,
  "precision": "balanced"
}
```

or `"seed_content": { "url": "<standout post URL>" }`.

**Step 3 — Intersect (no tool call).** Match the two result sets on creator
identity. Bucket: **in-both** (the high-confidence core), **brief-only**,
**lookalike-only**. The in-both set is the headline; the singles are depth.
If the intersection is empty or tiny, say so plainly — it's a real signal that
the brief and the proven performer point in different directions, and the user
should choose which to trust. Never manufacture overlap.

**Step 4 — Profile fan-out.** `get_creator_profile` by returned identifier:

```json
get_creator_profile { "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id from search result>" } }
```

Thorough: profile the full in-both set plus enough of each single bucket to
fill the shortlist. Thrifty: profile the in-both set plus the top singles only,
up to `shortlist size + 2`.

**Credit estimate fires here.** Thorough is two searches plus a sizable
fan-out — typically ~35–45 credits — over the threshold, so state the estimate
and offer thrifty before fanning out (don't block).

**Step 5 — Freshness Gate.** Classify fresh / aging / stale; stale go to
"re-verify before pitch" (thrifty: may drop, noting counts).

**Step 6 — Conflict check (if competitor brands supplied).** Compare each
profile's brand affiliations (pro field) to the list; flag overlaps naming the
brand and that it came from affiliations. Free plan / affiliations absent →
say conflict checking was unavailable and why; never silently skip.

**Step 7 — One rate call for the vertical.** Exactly one
`query_market_intelligence`, wrapped in Refusal Recovery:

```json
query_market_intelligence { "mode": "rate", "vertical": "<the slate's vertical>" }
```

Walk the ladder on refusal (thorough: until clearance; thrifty: max 2 rungs);
disclose clearance level.

**Step 8 — Rank.** In-both creators rank above singles by construction; within
each bucket, rank on brief-fit and freshness, penalizing conflicts.

## Deliverable

```markdown
# Triangulated Shortlist — <campaign/brand name>
_Brief × lookalikes of @<seed>, <date> · <N> creators · Creatorland Data_

## The brief, as I read it
<normalized block, 3–5 lines> · **Proven seed:** @<seed> (<why they worked,
if the user said>).

## High-confidence core — in BOTH searches
### 1. <Name> — @<handle> (<platform>, <follower count>) — ★ in both
- **Why high-confidence:** matched the brief AND resembles @<seed>
  (embedding-based, inference-free) — <2–3 sentences tying to brief language>
- **Audience-geo:** <top geos> · **Freshness:** fresh | aging (note)
- **Conflicts:** none | ⚠ affiliated with <brand> (per profile affiliations)
<repeat for the in-both set; if empty: "No creator surfaced in both searches —
the brief and @<seed> point in different directions. Pick which signal leads;
the single-source picks below show each direction.">

## Brief-matched (brief search only)
<rows, same format, ranked>

## Lookalikes of @<seed> (lookalike only)
<rows, same format; vibe match is embedding-based, inference-free>

## Indicative rate context (slate-level)
Market band for the **<vertical>** vertical<, broadened per note>:
p25 $<x> · median $<y> · p75 $<z> — <deal volume / recency>.
> <provenance line exactly as the tool returned it>
Market band for the vertical/tier — **not any individual creator's rate.**
<If broadened: disclose clearance level.>

## Re-verify before pitch
<stale creators; or "None.">

## Caveats
- "High-confidence" = appears in both searches; it is not a performance
  guarantee. Lookalike similarity is embedding-based (the data's read of
  @<seed>), inference-free.
- Conflict checks cover Creatorland-known affiliations only.
- Rate band is vertical-level; no per-creator rate data exists.
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or the creators' public profiles.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · 1 brief search + 1 lookalike search + <M> profiles + 1 rate benchmark (<clearance level>) · <date>.
Credits used this run: ~<N> (2 searches ×2 + <M> profiles ×1 + <R> market-intel ×5).
```

## Honesty rules

- An empty/tiny intersection is reported honestly as divergence between brief
  and seed — never papered over by loosening the match.
- "High-confidence" means in-both, not guaranteed performance; lookalike
  similarity is embedding-based and inference-free.
- Disclose Refusal Recovery broadening at the clearance level, always.
- The rate band is vertical-level, never per-creator.
- Stale data never silently mixes into a bucket.
- Never imply access to creator contact info (convention 7).

## Credit footprint

thorough: ~42 credits (2 searches ×2 + ~33 profiles + 1 rate call ×5; +5 per
refusal rung) · thrifty: ~21 credits (2 searches ×2 + ~12 profiles + 1 rate
call ×5, max 2 rungs)
