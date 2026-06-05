---
name: competitor-watch
description: Map which creators are creating around your competitor brands — surface creators with corpus-known affinities to named competitors, plus similar not-yet-affiliated creators as whitespace casting targets. Use when the user says "who's creating for [competitor]", "which creators work with our competitors", "competitor creator watch", "map [brand]'s creator roster", or names rival brands and wants the creator landscape around them. Deliverable is a competitor creator-landscape report.
---

# Competitor Creator Watch

Answers "who is creating around the brands we compete with?" — in two layers:
(1) creators the corpus links to the named competitor brands via brand
affinities/affiliations, and (2) **whitespace**: similar creators the corpus
does NOT link to those competitors, i.e. casting targets a rival hasn't
visibly claimed. For brand-side managers sizing up a rival's creator strategy
and agency strategists pitching whitespace slates.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> Same honesty rule as conflict checking everywhere in this plugin: brand
> links are **corpus-derived, not exhaustive**. "Affiliated with X in the
> Creatorland corpus" ≠ "works with X"; "no affiliation found" ≠ "free of
> X". Unreported, in-flight, and off-platform deals are invisible. The report
> says this prominently, not in fine print.

> If the user wants a one-shot conflict check on a slate they already have,
> that's the conflict step inside `brief-to-shortlist` — this skill is for
> mapping the landscape AROUND competitor brands. For watching a creator
> search space over time, use `talent-scout` (the two compose: a finished
> competitor-watch search can be saved as a scout profile).

## Inputs to collect

- **Competitor brand names** (required, 1–5). Confirm spellings — affinity
  matching is name-based.
- **The user's own brand/vertical context** — needed to define "similar
  creators" for the whitespace layer and to scope the optional market-intel
  context call. Infer from conversation if possible; ask once if not.
- **Geo/platform/tier constraints** (optional) — applied to searches if
  given.
- **Whitespace layer on/off** — default on; skip if the user only wants the
  affiliated map.
- **Credit mode** — default `thorough`; thrifty on the usual trigger phrases.

## Flow

**Step 1 — Affinity search per competitor brand.** One `search_creators`
call per named brand (convention 9: a brand LIST gets per-brand searches and
a per-brand-sectioned deliverable, never one merged search):

```json
search_creators {
  "mode": "brief",
  "brief": "creators creating content around <competitor brand>, <user's vertical> space",
  "filters": {
    "brand_affinities": ["<competitor brand>"],
    "platform": "<if constrained>",
    "country": "<if constrained>",
    "min_followers": <if constrained>
  },
  "limit": 15,
  "precision": "balanced"
}
```

(thorough: limit 15; thrifty: limit 8.) `brand_affinities` is the load-bearing
filter; the brief text reinforces it.

**Step 2 — Profile fan-out for affiliation confirmation.**
`get_creator_profile { "identifier": { "type": "<type from search result>", ... } }`
on candidates. The profile's **brand affiliations** field (pro plan) is the
confirmation layer: classify each creator as **affiliation-confirmed**
(competitor appears in profile affiliations) vs **affinity-signal only**
(surfaced by the affinity search but not in the affiliations field — weaker
evidence, labeled as such). If affiliations are unavailable (free plan), say
so: the whole report downgrades to affinity-signal confidence, disclosed up
top. Thorough: profile every candidate. Thrifty: top 6 per brand.

**Step 3 — Whitespace layer (if on).** For each competitor, seed a lookalike
search off the 1–2 strongest affiliation-confirmed creators:

```json
search_creators {
  "mode": "lookalike",
  "seed_creator": { "type": "creatorland_user_id", "creatorland_user_id": "<strongest affiliated creator>" },
  "limit": 10,
  "precision": "balanced"
}
```

Profile the lookalikes, then keep those whose affiliations do NOT include any
of the named competitors → the whitespace list. Label honestly: "no
competitor link **found in the corpus**" — never "unaffiliated."

**Credit estimate fires here.** Thorough with 3 competitors + whitespace runs
~3 searches + ~45 profiles + 3 lookalike searches + ~30 profiles ≈ 87 credits
— well over the ~30 threshold, so state the estimate before the fan-out and
offer thrifty (proceed after stating; do not block).

**Step 4 — Freshness Gate** on every profiled creator per the shared module.
Affiliations drift; a stale profile's competitor link is exactly the kind of
claim that embarrasses a deck. Stale rows go to "re-verify", always.

**Step 5 — Optional market context (pro, one call).** One
`query_market_intelligence { "mode": "market", "vertical": "<user's vertical>" }`
to frame how active the vertical's deal landscape is overall — context for
the whitespace pitch. Wrapped in Refusal Recovery (market floor: 5 brands /
25 deals); disclose any broadening. Thrifty: skip.

**Step 6 — Write the deliverable.**

## Deliverable

```markdown
# Competitor Creator Watch — <competitor brands>
_Built <date> · Creatorland Data · corpus-derived, not exhaustive (see scope note)_

> **Scope note (read first):** brand links below come from Creatorland's
> corpus of known affinities and affiliations. They are not a complete record
> of who works with these brands — unreported, in-flight, and off-platform
> deals are invisible to this data. Treat "affiliated" as "corpus-confirmed
> link" and "whitespace" as "no link found in the corpus", nothing stronger.

## <Competitor brand 1>

### Corpus-linked creators (<N>)
| Creator | Platform / followers | Evidence | Freshness |
|---|---|---|---|
| @<handle> | <platform>, <count> | affiliation-confirmed (profile affiliations) | fresh |
| @<handle> | <platform>, <count> | affinity-signal only | aging (note) |

### Whitespace — similar creators with no corpus link to <brand 1> (<K>)
| Creator | Platform / followers | Similar to | Freshness |
|---|---|---|---|
| @<handle> | <platform>, <count> | lookalike of @<seed> | fresh |

<repeat per competitor brand>

## Cross-brand observations
<creators linked to MORE THAN ONE named competitor; clusters by tier/geo/platform — only patterns the data actually shows>

## Vertical context (if pulled)
<market-mode stat + the provenance line exactly as the tool returned it; if
broadened: "Context basis: <level> — narrower slice was below the privacy
floor (5 brands / 25 deals); a privacy feature of the data source.">

## Re-verify before pitch
<stale rows with what's stale; or "None — all rows cleared the freshness gate.">

## Caveats
- Corpus-derived, not exhaustive — see scope note. "Whitespace" creators may
  have undisclosed competitor relationships.
- <free plan: "Profile affiliations unavailable on this plan — all evidence
  is affinity-signal level," if applicable>
- <thin results per brand, disclosed per convention 8, if applicable>
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or creators' public profiles.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · <B> affinity searches + <L> lookalike searches + <P> profiles<+ 1 market context (<clearance level>)> · <date>.
Credits used this run: ~<N> (<B+L> searches ×2 + <P> profiles ×1 <+ market intel ×5>).
```

## Honesty rules

- **Corpus-derived, not exhaustive** — the scope note leads the deliverable;
  never present the linked list as a brand's complete roster, never present
  whitespace as "guaranteed conflict-free."
- Distinguish affiliation-confirmed from affinity-signal evidence on every
  row; downgrade the whole report's confidence framing on free plan and say
  why.
- Thin per-brand results: disclose and broaden one labeled step (convention
  8) — never pad a competitor's list with weak fits to look thorough.
- No deal terms, spend figures, or contract claims — the corpus shows
  relationships, not commercial detail.
- Stale affiliation data never silently mixed in (Freshness Gate).
- No contact info anywhere (convention 7).

## Credit footprint

thorough (3 competitors, whitespace on): ~85–95 credits (3 affinity
searches ×2 + ~45 profiles + 3 lookalike searches ×2 + ~30 whitespace
profiles + 1 market intel ×5; +5 per refusal-ladder rung) — the estimate
always fires · thrifty (3 competitors): ~30–35 credits (3 searches ×2 + ~18
profiles + 1 lookalike search ×2 + ~6 profiles, market context skipped) ·
single-competitor thrifty, whitespace off: ~10 credits.
