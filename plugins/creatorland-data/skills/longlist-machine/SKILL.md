---
name: longlist-machine
description: Generate a large deduplicated LONGLIST (50–150 creators) for always-on programs — run brief mode at high count across several phrasings, merge, dedupe, and tier-tag so a casting team works it down. Use when the user wants volume, not a curated cut — "build a longlist of 100 creators", "give me a big pool to work down", "always-on talent pool", or "cast wide for [program]". Deliverable is a tiered, deduplicated longlist table. For a curated client-ready 8–12, use brief-to-shortlist.
---

# Longlist Machine

Volume casting for always-on programs. Instead of one tight search, it runs the
same brief through several phrasings, pools the results, dedupes, and tier-tags
a 50–150-creator longlist the casting team works down themselves. Breadth and
recall are the product here — curation happens downstream.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> Want a curated, client-ready cut of 8–12 with full per-creator rationale?
> That's `brief-to-shortlist`. This skill optimizes for recall and volume —
> a working pool, not a finished deck.

## Inputs to collect

- **The brief** (required) — any written format; normalization is your job.
- **Target longlist size** — default 100; cap 150 (the search `limit`
  ceiling per call). Ask only if unstated and the word "longlist" alone
  doesn't imply a number.
- **Phrasing axes** (optional) — if the user knows the program has variants
  (e.g., "skincare vs makeup", "GRWM vs tutorial"), capture them; otherwise
  you generate the phrasing variants yourself in step 0.
- **Tier tags wanted** — default macro/mid/micro by follower band.
- **Credit mode** — default `thorough`; `thrifty` on trigger phrases. Longlist
  runs are inherently credit-heavy — flag this up front.

## Flow

**Step 0 — Generate phrasing variants (no tool call).** From the brief, write
**3–5 distinct brief phrasings** that approach the same program from different
angles (audience framing, content-style framing, niche-adjacent framing). The
point is recall: different phrasings surface different creators. Show the
variants so the user can prune/add.

**Step 1 — Multi-phrasing search.** One `search_creators` per phrasing, each at
high count:

```json
search_creators {
  "mode": "brief",
  "brief": "<phrasing variant N, ≤2000 chars>",
  "filters": {
    "platform": "<if the program names one>",
    "country": "<if scoped>",
    "niche": "<if clean>",
    "min_followers": <if a tier floor applies>,
    "max_followers": <if a tier ceiling applies>
  },
  "limit": 150,
  "precision": "broad"
}
```

Use `precision: "broad"` for maximum recall (this is a longlist, not a
precision cut). Thorough: 4–5 phrasings at limit 150. Thrifty: 2–3 phrasings,
limit ≈ target size, precision `"balanced"`.

**Step 2 — Merge + dedupe (no tool call).** Pool all results; dedupe on creator
identity (same creator from two phrasings = one row). Record **how many
phrasings each creator hit** — a creator surfacing across multiple phrasings is
a stronger, more robust match; that's a free ranking signal at zero extra cost.

**Step 3 — Tier-tag (no tool call).** Tag each creator macro/mid/micro by the
follower band returned in the search result. No profile call needed for the tag
— search results carry follower count.

**Step 4 — Light enrichment (profiles).** A longlist does NOT profile every
row — that would be 100+ credits. Profile only:
- thorough: the top slice (e.g., top 20–30 by multi-phrasing hits) for the
  "verified head" of the longlist, plus enough to run the Freshness Gate on
  the head.
- thrifty: top 10 only, or skip enrichment entirely if the user just wants the
  raw pool — say which.

```json
get_creator_profile { "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id from search result>" } }
```

**Credit estimate fires here — mandatory.** A 5-phrasing thorough run with a
30-profile head is ~5×2 + 30 = ~40 credits; state it and offer thrifty before
the run. Be explicit that the un-enriched tail of the longlist carries
search-result data only (tier, follower count), not full profiles.

**Step 5 — Freshness Gate on the enriched head only.** Classify the profiled
head fresh / aging / stale. The un-profiled tail is labeled
**"unverified — search-result data only"** as a column, never presented as
freshness-checked.

**Step 6 — Thin-program honesty (convention 8).** If even multi-phrasing recall
stays thin for the niche, disclose and broaden one labeled step; mark the
broadened additions as adjacent. Don't pad a longlist to hit a round number
silently.

## Deliverable

```markdown
# Longlist — <program name>
_<L> creators, deduplicated across <P> brief phrasings · <date> · Creatorland Data_

## Phrasings used
1. <variant 1> · 2. <variant 2> · … <so the team can see the recall net cast>

## The longlist
| # | Creator | Tier | Followers | Phrasing hits | Status | Fit |
|---|---|---|---|---|---|---|
| 1 | @<handle> (<platform>) | mid | <count> | 4/5 | verified · fresh | exact |
| 2 | @<handle> (<platform>) | micro | <count> | 2/5 | unverified — search data only | exact |
| … | | | | | | adjacent (<broaden step>) |
<sorted by phrasing-hit count desc, then tier; "verified" rows are the
enriched head, "unverified" rows carry search-result data only>

## Verified head (enriched)
<for the profiled top slice: a compact note per creator — audience geo,
freshness — so the team starts working from the most-vetted rows>

## Re-verify before pitch
<stale creators among the enriched head; or "None among the verified head.">

## Caveats
- This is a working pool optimized for recall, not a curated cut — expect to
  work it down. The tail is search-result data only (tier + follower count),
  not freshness-checked.
- "Phrasing hits" is a robustness signal (more = surfaced across more angles),
  not a quality guarantee.
- <if broadened: which adjacent niches and why exact recall was thin>
- Rate context omitted by default for a longlist — run `brief-to-shortlist` or
  `one-number-rate` on the cut you choose.
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or the creators' public profiles.

---
Data freshness: <N>/<H> enriched-head creators synced within the last sync window; <K> flagged for re-verification. Tail (<L−H>) is search-result data only.
Provenance: Creatorland Data MCP · <P> brief searches + <H> head profiles · <date>.
Credits used this run: ~<N> (<P> searches ×2 + <H> profiles ×1).
```

## Honesty rules

- The un-enriched tail is always labeled "search-result data only" — never
  presented as profile-verified or freshness-checked.
- "Phrasing hits" is a recall-robustness signal, not a quality score.
- Thin niches broaden one disclosed step; broadened rows labeled adjacent
  (convention 8) — no padding to a round number.
- Freshness Gate applies to the enriched head; the tail's freshness is
  explicitly unknown.
- Never imply access to creator contact info (convention 7).

## Credit footprint

thorough: ~40 credits (5 searches ×2 + ~30 head profiles ×1; +5 per refusal
rung if a rate call is added on request) · thrifty: ~16 credits (3 searches ×2
+ ~10 head profiles ×1), or ~6 credits raw-pool-only (3 searches ×2, no
enrichment). Profiling the FULL longlist is deliberately avoided — it would be
100+ credits; the head-enrichment pattern keeps cost bounded.
