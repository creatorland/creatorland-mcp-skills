---
name: brief-to-shortlist
description: Turn a written client brief you already have (pasted email, deck text, bullets, RFP excerpt) into a client-ready ranked creator shortlist with per-creator rationale, audience-geo fit, freshness status, conflict flags, and a vertical rate band. Use when the user says "build a shortlist for this brief", "find creators for this campaign", "cast this brief", or "who should we use for [brand/campaign]" with a brief in hand. Deliverable is a paste-into-deck markdown shortlist.
---

# Brief-to-Shortlist

The flagship casting skill. Takes a raw client brief in any written format —
forwarded email, deck text, scattered bullets, an RFP paragraph — and turns it
into a ranked, enriched, client-ready shortlist that a casting director can
paste into a deck without re-checking the data framing. For agency casting
directors and brand-side influencer-marketing managers.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the seven conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> If the input is a call transcript or meeting recording rather than a written
> brief, this is the wrong skill — use `transcript-to-shortlist`. If the user
> wants a brief *document* produced (not creators found), use `brief-builder`.

## Inputs to collect

- **The brief** (required) — any written format. Do not make the user
  restructure it; normalization is your job.
- **Shortlist size** — default **8** if unstated. Don't ask if the brief or
  context implies a size ("top 10", "a handful").
- **Markets / geo priorities** — pull from the brief if present; ask only if
  absent AND geo plausibly matters to the campaign.
- **Competitor brands to conflict-check** (optional) — ask once: "Any
  competitor brands I should conflict-check the slate against?" Skip if the
  user already named them or said no conflicts matter.
- **Credit mode** — default `thorough`; switch to `thrifty` on the trigger
  phrases in the credit-modes module.

Never ask twice for anything the brief already states — quote it back instead.

## Flow

**Step 0 — Normalize the brief (no tool call, 0 credits).** Read the raw brief
and produce a structured campaign description: target audience, corpus
vertical (Beauty, Fashion, Health & Fitness, Food & Beverage, Technology, …),
content style / vibe words, platform(s), geo markets, follower tier, explicit
exclusions. Show it in one compact block; proceed unless the user corrects it.
Keep the brief's own language — it powers the per-creator rationale later.

> Alternative spine: the server ships a maintained prompt,
> `shortlist-from-brief`, that encodes this same flow server-side. Prefer it
> when the harness surfaces server prompts cleanly; otherwise run the steps
> below directly. Either way the deliverable template and honesty rules in
> this file still apply.

**Step 1 — Search.** One call, limit = 2–3× shortlist size (thorough: 3×;
thrifty: 2×). For the default shortlist of 8, thorough:

```json
search_creators {
  "mode": "brief",
  "brief": "<normalized brief text, ≤2000 chars, keeping the client's vibe words>",
  "filters": {
    "platform": "<if the brief names one: instagram|tiktok|youtube|twitter|twitch>",
    "country": "<primary market if stated>",
    "min_followers": <tier floor if stated>,
    "max_followers": <tier ceiling if stated>,
    "niche": "<if cleanly stated>",
    "min_engagement_rate": <0–1, only if the brief sets a bar>
  },
  "limit": 24,
  "precision": "balanced"
}
```

Include only filters the brief actually supports — `brief` text alone is valid;
if you pass `filters` it needs at least one signal. Use `precision: "tight"`
when the brief is highly specific, `"broad"` when it's a vibe sketch.

**Step 2 — Profile fan-out.** `get_creator_profile` per candidate:

```json
get_creator_profile { "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id from search result>" } }
```

(Use whichever identifier type the search result returns — `social_handle`,
`creatorland_user_id`, or `source_user` — exactly one type per call.)
Thorough: profile every candidate from step 1. Thrifty: rank candidates on
search-result signal first, profile only the top `shortlist size + 2`.

**Credit estimate fires here.** Thorough at default size is 2 + 24 + 5 ≈ 31
credits — over the ~30 threshold, so state the estimate before fanning out and
offer thrifty (do not block; proceed after stating it).

**Step 3 — Freshness Gate.** Classify every profiled creator fresh / aging /
stale per the freshness-gate module. Stale creators go only in the "re-verify
before pitch" section (thrifty: may drop them, saying how many were dropped).

**Step 4 — Conflict check.** If the user supplied competitor brands, compare
each profile's **brand affiliations** (pro-plan field) against that list.
Overlap → a conflict flag on the row, naming the brand and that it came from
the profile's affiliations. If affiliations are absent (free plan), say
conflict checking was unavailable and why — never silently skip it.

**Step 5 — One rate call for the slate.** Exactly one
`query_market_intelligence` for the whole slate's vertical — shared band
context, not per-creator pricing:

```json
query_market_intelligence {
  "mode": "rate",
  "vertical": "<the slate's inferred vertical>",
  "deal_type": "<only if the brief specifies one>"
}
```

Wrapped in Refusal Recovery: if refused (rate floor: 10 brands / 50 deals),
walk the ladder (thorough: until clearance; thrifty: max 2 rungs) and disclose
the clearance level in the deliverable. Each rung is a fresh 5-credit call.

**Step 6 — Rank and write the deliverable.** Rank on brief-fit (audience,
vibe, geo, tier), penalizing aging freshness and conflicts. Tie rationale to
the brief's own language.

## Deliverable

Client-ready markdown (paste-into-deck quality):

```markdown
# Creator Shortlist — <campaign/brand name>
_Built from your brief, <date> · <N> creators · Creatorland Data_

## The brief, as I read it
<the normalized block from step 0, 3–5 lines>

## Shortlist (ranked)

### 1. <Name> — @<handle> (<platform>, <follower count>)
- **Why for this brief:** <2–3 sentences quoting the brief's language — "you asked for 'lo-fi kitchen energy'; her last-90-day grid is exactly that">
- **Audience-geo fit:** <top geos vs. the brief's markets, e.g. "62% US / 14% UK — matches your US-first ask">
- **Freshness:** fresh | aging (note) — stale creators never appear here
- **Conflicts:** none found | ⚠ affiliated with <brand> (per profile brand affiliations) — review before pitch
<repeat per creator>

## Indicative rate context (slate-level)
Market band for the **<vertical>** vertical<, broadened per note below>:
p25 $<x> · median $<y> · p75 $<z> — <deal volume / recency from the tool>.
> <provenance line exactly as the tool returned it>
This is the **market band for the vertical/tier — not any individual
creator's rate.** Use it to frame budget conversations, not to quote talent.
<If broadened: "Benchmark basis: <level> — the narrower slice was below the
privacy floor (10 brands / 50 deals), so scope was widened; a privacy feature
of the data source, not missing data.">

## Re-verify before pitch
<stale creators with what's stale; or "None — all candidates cleared the freshness gate."
Thrifty + drops: "K stale candidates were dropped in thrifty mode.">

## Caveats
- Rate band is vertical-level; no per-creator rate data exists in this corpus.
- Conflict checks cover Creatorland-known brand affiliations only — not
  unreported or in-flight deals.
- <conflict checking unavailable on free plan, if applicable>
- <any filters the corpus couldn't honor — report gaps, don't paper over them>
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or the creator's public profiles.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · search + <M> profiles + 1 rate benchmark (<clearance level>) · <date>.
Credits used this run: ~<N> (1 search ×2 + <M> profiles ×1 + <R> market-intel ×5).
```

## Honesty rules

- The rate band is **vertical-level, never "this creator's rate."** Write
  "market band for this vertical/tier" — no per-creator pricing exists.
- Disclose Refusal Recovery broadening at the clearance level, always.
- Never strip the provenance line to make the deck prettier.
- Rationale must trace to brief language or profile data — no invented
  audience claims, no engagement numbers the tools didn't return.
- Stale data is never silently mixed into the main list.
- Never imply access to creator contact info (PII discipline, convention 7).

## Credit footprint

thorough: ~31 credits (1 search ×2 + ~24 profiles + 1 rate call ×5; +5 per
refusal-ladder rung) · thrifty: ~17 credits (1 search ×2 + ~10 profiles + 1
rate call ×5, max 2 ladder rungs)
