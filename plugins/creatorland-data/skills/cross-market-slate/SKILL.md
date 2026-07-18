---
name: cross-market-slate
description: Take ONE campaign concept and cast it across several countries at once — parallel geo-constrained searches normalized into a market × tier matrix, thin markets flagged for local sourcing. Use when the user wants the same campaign in multiple regions — "cast this in the US, UK and Brazil", "same concept, five markets", "build a multi-market slate", or "who covers each region for this brief". Deliverable is a per-market slate matrix. For distinct ARCHETYPES not geos, use brief-to-shortlist.
---

# Cross-Market Slate

One concept, many countries. Runs a separate geo-constrained search per market,
profiles the finds, and normalizes everything into a market × tier matrix so a
holding-company strategist can staff the same campaign idea across regions —
and see, honestly, where the corpus is too thin to staff locally.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions — esp. #9 multi-target slates). This skill honors
thrifty/thorough credit modes (${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md),
Refusal Recovery (${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the
Freshness Gate (${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> The slate axis here is **geography** — one concept, N markets. If the user's
> targets are distinct creator *archetypes* in one market, use
> `brief-to-shortlist` (it slates per archetype per convention 9). If there's
> only one market, that's just `brief-to-shortlist`.

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

- **The concept** (required) — one brief/campaign description, market-agnostic.
- **The markets** (required) — the list of countries (and cities, if they
  matter). If absent, ask once: "Which markets should I staff this in?"
- **Per-market slate size** — default 5 per market. Don't ask if implied.
- **Tier intent** (optional) — macro/mid/micro mix if the concept implies one.
- **Credit mode** — default `thorough`; `thrifty` on trigger phrases. For
  >5 markets, proactively flag the multiplied cost.

## Flow

**Step 0 — Normalize the concept once (no tool call).** Produce one structured,
market-agnostic campaign description (audience, vertical, vibe words, platform,
tier). This single normalized brief feeds every market search — consistency
across markets is the point.

**Step 1 — One search per market (convention 9).** Never one merged search.
For each market:

```json
search_creators {
  "mode": "brief",
  "brief": "<the normalized concept, ≤2000 chars, vibe words kept>",
  "filters": {
    "country": "<this market>",
    "city": "<if specified>",
    "platform": "<if the concept names one>",
    "min_followers": <tier floor if set>,
    "max_followers": <tier ceiling if set>,
    "audience_country": "<this market — use INSTEAD OF/alongside country when the ask is reach-in-market (audience located here), not creator location; pair with min_audience_country_share>",
    "data_freshness_days": <if the slate wants recently-active creators per market>,
    "content_format": "<personality_led | faceless_clip — if the concept implies a format>"
  },
  "limit": <2× per-market slate size>,
  "precision": "balanced"
}
```

`country` (creator location) is the per-market differentiator by default;
when the campaign's real ask is **reach in-market** rather than a locally-based
creator, use `audience_country` (+ `min_audience_country_share`) as the
per-market axis instead — creators whose *audience* skews to that market. Both
are advisory hard gates; everything else is held constant
so markets are comparable. Thorough: limit = 2× slate size per market.
Thrifty: limit = slate size, precision `"tight"`.

**Credit estimate fires here.** Cost multiplies by market count: a 4-market
run at default is 4 searches + ~40 profiles + 1 rate ≈ 53 credits — well over
the threshold, so state it and offer thrifty before fanning out (don't block).

**Step 2 — Thin-market detection (convention 8 applied to geo).** If a market's
search returns few exact in-market fits, do NOT pad with off-geo creators.
Flag the market **"needs local sourcing"** and disclose how thin it was. Offer
exactly one labeled broaden step for that market only (city → country →
region), marking results as exact-market vs broadened. Markets that clear stay
exact; thin ones are honestly flagged, never quietly backfilled.

**Step 3 — Profile fan-out.** `get_creator_profile` per candidate per market,
using the identifier type the search returns:

```json
get_creator_profile { "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id from search result>" } }
```

Thorough: profile every candidate. Thrifty: profile only the per-market final
cut (slate size + 1).

**Step 4 — Freshness Gate per market.** Classify fresh / aging / stale; stale
go to "re-verify before pitch" (thrifty: may drop, noting counts).

**Step 5 — One rate call for the concept's vertical.** Exactly one
`query_market_intelligence` for shared band context across all markets,
wrapped in Refusal Recovery:

```json
query_market_intelligence { "mode": "rate", "vertical": "<the concept's vertical>", "creator_tier": "<the concept's target tier — if the brief names one or the candidate cut clusters at one>" }
```

If refused, walk the ladder (thorough: until clearance; thrifty: max 2 rungs)
and disclose the clearance level. One band, framed as cross-market context —
the corpus has no per-market rate granularity, and the deliverable says so.

When the concept targets a defined creator tier (or the candidate cut clusters
at one), pass `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+) for a
size-scoped band; when tier is mixed or unknown keep the vertical-wide band as
the fallback and say so. A tier too thin for the distinct-creator privacy floor
auto-broadens (disclosed) to the all-tier band.

## Deliverable

```markdown
# Cross-Market Slate — <concept name>
_One concept, <K> markets · <date> · <N> creators · Creatorland Data_

## The concept, as I read it
<the normalized block from step 0, market-agnostic, 3–5 lines>

## Slate matrix (market × tier)
| Market | Macro | Mid | Micro | Status |
|---|---|---|---|---|
| US | @<h> | @<h>, @<h> | @<h> | staffed |
| UK | @<h> | @<h> | — | staffed |
| DE | — | @<h> | — | ⚠ thin — needs local sourcing |
| BR | @<h> (broadened to country) | @<h> | @<h> | broadened |
<cells hold handles; — = no in-corpus fit at that tier>

## Per-market detail
### US — staffed
| Creator | Tier | Audience geo | Fit | Freshness |
|---|---|---|---|---|
| @<handle> (<platform>) | <tier> | <top geos> | exact-market \| broadened (<step>) | fresh \| aging |
<repeat per market>

## Indicative rate context (concept-level)
Market band for the **<vertical>** vertical<, broadened per note>:
p25 $<x> · median $<y> · p75 $<z> — <deal volume / recency>.
> <provenance line exactly as the tool returned it>
This is one vertical band, **not market-specific pricing** — the corpus has no
per-country rate dimension. Local market rates will vary; use as directional
context. <If broadened: disclose clearance level.>

## Markets needing local sourcing
<each thin market, how thin, and what the broaden step surfaced; or "None —
all markets cleared in-corpus.">

## Re-verify before pitch
<stale creators by market; or "None.">

## Caveats
- Rate band is single-vertical and cross-market; per-country pricing isn't in
  the corpus.
- "Thin market" reflects corpus coverage, not the real talent supply in that
  country — flag means source locally, not "no creators exist there".
- Broadened picks are disclosed (step labeled per row), not exact-market fits.
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or the creators' public profiles.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · <K> market searches + <M> profiles + 1 rate benchmark (<clearance level>) · <date>.
Credits used this run: ~<N> (<K> searches ×2 + <M> profiles ×1 + <R> market-intel ×5).
```

## Honesty rules

- Thin markets are flagged "needs local sourcing", never backfilled with
  off-geo creators to make the matrix look full (convention 8).
- Every broadened pick is labeled with its broaden step; markets that cleared
  in-corpus stay marked exact.
- The rate band is one vertical, cross-market — never presented as per-country
  pricing.
- Disclose Refusal Recovery broadening at the clearance level, always.
- Stale data never silently mixes into a market's slate.
- Never imply access to creator contact info (convention 7).

## Credit footprint

thorough (4 markets, slate 5): ~53 credits (4 searches ×2 + ~40 profiles + 1
rate call ×5; +5 per refusal rung) · thrifty: ~31 credits (4 searches ×2 + ~24
final-cut profiles + 1 rate call ×5, max 2 rungs). Scales with market count —
estimate stated up front.
