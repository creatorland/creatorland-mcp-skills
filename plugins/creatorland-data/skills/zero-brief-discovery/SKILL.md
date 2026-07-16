---
name: zero-brief-discovery
description: Cast with NO brief — start from just a brand name. Profile the brand's existing affiliated creators (pro affiliation data), lookalike off the best, and propose a "based on who already works with you" slate. Use when the user has only a brand, no brief or seed — "who should [brand] work with", "find creators, we have no brief", "build a slate from scratch for [brand]", or "discover talent from our existing partners". Deliverable is an affiliation-grounded discovery slate. Pro plan required.
---

# Zero-Brief Discovery

No brief, no seed creator, just a brand. This skill bootstraps a slate from the
brand's own footprint: it reads the creators already affiliated with the brand
(pro affiliation data), picks the best-fitting ones as seeds, runs lookalikes
off them, and proposes "more creators like the ones who already work with you."
For brand-side managers staring at a blank page.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> If the user has a written brief, use `brief-to-shortlist`. If they name a
> single creator they love, use `lookalike-ladder`. This skill is for the
> blank-page case: the brand is the only input, and its existing affiliations
> are the bootstrap.

## Inputs to collect

- **The brand** (required) — name, and its vertical if not obvious.
- **How they know existing partners** (one path-choosing question) — the brand
  may already know a few creators who've worked with them. If they name some,
  those become the seeds directly (skip the affiliation-discovery step). If
  they don't, you discover affiliated creators via the corpus.
- **Slate size** — default 8.
- **Plan check** — affiliation data is **pro-gated**. If the workspace is free
  tier, affiliation discovery is unavailable; say so and offer the fallback
  (user names a seed → effectively `lookalike-ladder`, or provides a brief →
  `brief-to-shortlist`).
- **Credit mode** — default `thorough`; `thrifty` on trigger phrases.

## Flow

**Step 1 — Find the brand's affiliated creators.** There is no brand-keyed
search tool, so discover affiliations via the corpus: run a brief search scoped
to the brand's vertical and use `get_creator_profile`'s **brand affiliations**
field (pro) to identify creators already tied to the brand. Practically:

```json
search_creators {
  "mode": "brief",
  "brief": "<the brand's vertical and category, e.g. 'clean beauty / skincare creators'>",
  "filters": { "niche": "<brand vertical>", "country": "<home market if known>" },
  "limit": 25,
  "precision": "balanced"
}
```

Then profile candidates and keep those whose affiliations include the brand:

```json
get_creator_profile { "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id>" } }
```

If the user already named existing partners, skip the discovery search and
profile those named creators directly. If NO affiliated creators surface (or
free plan), disclose it plainly — "the corpus shows no creators affiliated with
<brand>" — and offer to proceed from the vertical alone (labeled as a vertical
slate, not an affiliation-grounded one) or to take a seed/brief from the user.

**Step 2 — Pick the best seeds (no tool call).** From the confirmed affiliated
creators, choose the 1–3 best-fitting as lookalike seeds (strongest audience
fit, freshest data, on-vertical). Show which seeds you picked and why.

**Step 3 — Lookalike off each seed.** One inference-free lookalike call per
seed — exactly ONE of `seed_creator` / `seed_content`, never both, no filters:

```json
search_creators {
  "mode": "lookalike",
  "seed_creator": { "type": "social_handle", "platform": "<platform>", "handle": "<seed handle>" },
  "limit": <2× slate size>,
  "precision": "balanced"
}
```

Multiple seeds = multiple lookalike calls; pool and dedupe the results. A
creator surfacing across several seeds is a stronger pick — record the hit
count as a ranking signal.

**Step 4 — Profile the pooled candidates.** `get_creator_profile` by returned
identifier. Thorough: profile the deduped pool. Thrifty: profile the top
`slate size + 2`.

**Credit estimate fires here.** Discovery search + affiliation profiling +
lookalikes + candidate profiling typically exceeds ~30 credits — state the
estimate and offer thrifty before fanning out (don't block).

**Step 5 — Freshness Gate.** Classify fresh / aging / stale; stale go to
"re-verify before pitch" (thrifty: may drop, noting counts).

**Step 6 — Conflict check (automatic here).** Because the slate is built off
the brand's own affiliations, flag any candidate ALSO affiliated with a
competitor in the same vertical (from their profile affiliations), naming the
competitor and the source. This is the whitespace-vs-conflict read the
zero-brief approach makes natural.

**Step 7 — One rate call for the vertical.** Exactly one
`query_market_intelligence`, wrapped in Refusal Recovery:

```json
query_market_intelligence { "mode": "rate", "vertical": "<the brand's vertical>", "creator_tier": "<the candidate slate's tier, if it clusters at one>" }
```

Walk the ladder on refusal (thorough: until clearance; thrifty: max 2 rungs);
disclose clearance level. When the discovered slate clusters at a creator tier,
pass `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+) for a
size-scoped band; when tier is mixed or unknown keep the vertical-wide band as
the fallback and say so (a too-thin tier auto-broadens, disclosed, to the
all-tier band).

## Deliverable

```markdown
# Discovery Slate — <brand>
_Built from who already works with you, <date> · <N> creators · Creatorland Data_

## Your existing partners, as the corpus sees them
<the affiliated creators used as seeds: @handle, why chosen — audience fit,
freshness. If none found: "No creators affiliated with <brand> appear in the
corpus; this slate is built from the <vertical> vertical instead — labeled
accordingly.">

## Discovery slate (ranked on resemblance to your partners)
### 1. <Name> — @<handle> (<platform>, <follower count>)
- **Why for you:** resembles <which of your partners> (embedding-based,
  inference-free) — <what they share: audience, content style, interests>
- **Seed hits:** <e.g. 2/3 of your seeds> · **Audience-geo:** <top geos>
- **Freshness:** fresh | aging (note)
- **Conflicts:** none | ⚠ also affiliated with <competitor> (per profile
  affiliations) — review before outreach
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
- The slate is grounded in your *known* affiliations in the corpus — partners
  not captured in Creatorland's data won't have seeded it.
- Resemblance is embedding-based (the data's read of your partners),
  inference-free — sanity-check the grids.
- Affiliation data is pro-gated; on free plan this skill can't run the
  affiliation bootstrap.
- Rate band is vertical-level; no per-creator rate data exists.
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or the creators' public profiles.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · 1 discovery search + <S> seed lookalikes + <M> profiles + 1 rate benchmark (<clearance level>) · <date>.
Credits used this run: ~<N> (<1+S> searches ×2 + <M> profiles ×1 + <R> market-intel ×5).
```

## Honesty rules

- The slate is grounded only in affiliations the corpus knows — disclose that
  partners outside the corpus didn't seed it; never imply complete coverage of
  the brand's real partner set.
- If no affiliations are found (or free plan), say so and relabel the output as
  a vertical slate — never present a vertical search as "based on who works
  with you."
- Resemblance is embedding-based and inference-free.
- Conflict flags name the competitor and cite the profile affiliation source.
- The rate band is vertical-level, never per-creator.
- Disclose Refusal Recovery broadening at the clearance level, always.
- Never imply access to creator contact info (convention 7).

## Credit footprint

thorough: ~45 credits (1 discovery search ×2 + ~18 profiles ×1 scanned for
affiliations + ~2 seed lookalikes ×2 + ~16 candidate profiles ×1 + 1 rate call
×5; +5 per refusal rung) · thrifty: ~24 credits (1 discovery search ×2 + ~10
profiles ×1 scanned + 1 seed lookalike ×2 + ~5 candidate profiles ×1 + 1 rate
call ×5, max 2 rungs)
