---
name: cast-from-a-vibe
description: Cast from a VISUAL or mood reference instead of a written brief — a screenshot, mood board, Pinterest grid, or aesthetic description. The harness reads the imagery into a creative direction, then finds creators matching that vibe. Use when the user shares an image/mood board and says "find creators with this vibe", "cast from this mood board", "who shoots like this", or "creators matching this aesthetic". Deliverable is a vibe-matched shortlist with the interpreted direction shown back.
---

# Cast-from-a-Vibe

The intake an agency actually has is often a picture, not a paragraph: a
screenshot of an ad they love, a mood board, a reference grid. This skill has
the harness interpret that imagery into a structured creative direction, shows
it back for confirmation, then casts against it — so the visual reference
becomes a defensible, client-ready shortlist.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> If the reference is a specific creator's post and the user wants people *like
> that creator*, prefer `lookalike-ladder` (it seeds the search on the content
> embedding directly). This skill is for mood/aesthetic references where no
> single seed creator is the target — the harness extracts the direction and
> runs a brief search.

> **Precision & filters for outreach (convention 14).** When this list will
> feed an outreach step, default to precision over raw recall: search
> `precision: "tight"` with the hard-gate filters the brief supports
> (`platform`, `niche`, `data_freshness_days`, `content_format`,
> `audience_country`), and reserve `broad` plus heavy `lookalike` unioning for
> market sizing. Do not fan out dozens of `lookalike` calls to hit a volume
> target (each hop drifts from the seed), and trim the weak tail by each
> result row `relative_fit` (within-set fit, `1.0` = strongest) rather than
> padding to a round number. Canon:
> `${CLAUDE_PLUGIN_ROOT}/shared/conventions.md` convention 14.

## Inputs to collect

- **The visual reference** (required) — image(s), screenshot, mood board, or a
  written description of an aesthetic. Multiple images welcome.
- **Anything the image can't carry** (ask only if the image leaves it
  genuinely ambiguous) — platform, market, follower tier. Don't ask for what
  the reference already implies.
- **Shortlist size** — default 8.
- **Credit mode** — default `thorough`; `thrifty` on trigger phrases.

## Flow

**Step 0 — Interpret the vibe (no tool call, 0 credits).** The harness reads
the reference image(s)/description and produces a structured creative
direction: aesthetic/vibe words, likely vertical, content style, color/energy,
implied audience, platform if evident. **Show it back and confirm before
spending credits** — "Here's the direction I read from your reference; correct
anything before I search." Vision interpretation is a judgment call, so this
confirmation gate is mandatory (it also protects against casting off a
misread).

> Scrub the reference for PII before processing: if a screenshot contains a
> creator's contact details, those never enter the direction or deliverable
> (convention 7 — the invariant holds for uploaded sources too).

**Step 1 — Search on the extracted direction.** One `search_creators` brief
call using the confirmed direction as the brief text:

```json
search_creators {
  "mode": "brief",
  "brief": "<the confirmed creative direction as brief text, ≤2000 chars — vibe words, content style, aesthetic>",
  "filters": {
    "platform": "<if the reference/intake implies one>",
    "country": "<if a market was set>",
    "niche": "<if the vertical is clean>",
    "min_followers": <if a tier was set>,
    "max_followers": <if a tier was set>
  },
  "limit": <2–3× shortlist size>,
  "precision": "broad"
}
```

Use `precision: "broad"` by default — a vibe reference is inherently fuzzy;
tighten to `"balanced"` only if the user gave hard constraints. Pass `filters`
only when the reference/intake actually supports a signal.

**Step 2 — Profile fan-out.** `get_creator_profile` per candidate, by the
returned identifier type:

```json
get_creator_profile { "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id from search result>" } }
```

Thorough: profile every candidate. Thrifty: limit 2× size and profile the top
`size + 2`.

**Credit estimate fires here** if the fan-out plus rate call exceeds ~30
credits (thorough at default ≈ 31) — state it and offer thrifty.

**Step 3 — Freshness Gate.** Classify fresh / aging / stale; stale go to
"re-verify before pitch" (thrifty: may drop, noting counts).

**Step 4 — Thin-vibe honesty (convention 8).** If the niche the vibe implies is
thin in-corpus, disclose and broaden exactly one labeled step (exact niche →
adjacent → vertical); mark each pick exact vs adjacent. Downgrade fit-confidence
labels accordingly. Never pad a fuzzy match list silently.

**Step 5 — One rate call for the vertical.** Exactly one
`query_market_intelligence`, wrapped in Refusal Recovery:

```json
query_market_intelligence { "mode": "rate", "vertical": "<the interpreted vertical>", "creator_tier": "<the vibe's target tier, if the candidates cluster at one>" }
```

Walk the ladder on refusal (thorough: until clearance; thrifty: max 2 rungs);
disclose clearance level. When the matched candidates cluster at a creator
tier, pass `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+)
for a size-scoped band; when tier is mixed or unknown keep the vertical-wide
band as the fallback and say so (a too-thin tier auto-broadens, disclosed, to
the all-tier band).

## Deliverable

```markdown
# Cast from a Vibe — <short name for the reference>
_Cast from your visual reference, <date> · <N> creators · Creatorland Data_

## The vibe, as I read it
<the confirmed creative direction from step 0: aesthetic/vibe words, vertical,
content style, platform, implied audience — 4–6 lines. Note: "interpreted from
your reference image(s); confirmed by you before searching.">

## Shortlist (ranked on vibe fit)
### 1. <Name> — @<handle> (<platform>, <follower count>)
- **Why this vibe:** <how the profile's content style / interests / hashtags
  match the interpreted direction — tied to the vibe words, not invented>
- **Audience-geo:** <top geos>
- **Fit:** exact fit | adjacent fit (<broadening step>)
- **Freshness:** fresh | aging (note)
<repeat per creator>

## Indicative rate context (vertical band)
Market band for the **<vertical>** vertical<, broadened per note>:
p25 $<x> · median $<y> · p75 $<z> — <deal volume / recency>.
> <provenance line exactly as the tool returned it>
Market band for the vertical/tier — **not any individual creator's rate.**
<If broadened: disclose clearance level.>

## Re-verify before pitch
<stale creators; or "None.">

## Caveats
- The creative direction is the harness's read of your reference — a judgment
  call you confirmed; revisit it if the picks feel off.
- <if broadened: which adjacent niches, and why exact was thin>
- Rate band is vertical-level; no per-creator rate data exists.
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or the creators' public profiles.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · 1 brief search (vision-derived) + <M> profiles + 1 rate benchmark (<clearance level>) · <date>.
Credits used this run: ~<N> (1 search ×2 + <M> profiles ×1 + <R> market-intel ×5).
```

## Honesty rules

- The interpreted direction is the harness's read of an image — always shown
  back and confirmed before any credit is spent, and labeled as interpretation
  in the deliverable.
- Thin niches broaden one disclosed step at a time; picks labeled exact vs
  adjacent (convention 8).
- Rationale traces to the confirmed vibe words and profile data — no invented
  aesthetic claims about creators the tool didn't support.
- The rate band is vertical-level, never per-creator.
- Disclose Refusal Recovery broadening at the clearance level, always.
- Scrub any PII visible in the reference image; never include or imply contact
  info (convention 7).

## Credit footprint

thorough: ~31 credits (1 search ×2 + ~24 profiles + 1 rate call ×5; +5 per
refusal rung) · thrifty: ~17 credits (1 search ×2 + ~10 profiles + 1 rate call
×5, max 2 rungs). Vision interpretation in step 0 is harness work — 0 credits.
