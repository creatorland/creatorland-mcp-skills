---
name: casting-gap-analysis
description: Audit an EXISTING creator roster (CSV, sheet, or pasted list) for coverage holes — geo, tier, niche, platform — then find creators that fill each gap. Use when the user uploads/pastes a roster and asks "what's missing from our roster", "where are our coverage gaps", "audit our talent bench", or "fill the holes in this list". Deliverable is a gap map plus per-gap fill candidates. Not for building a list from scratch — that's brief-to-shortlist.
---

# Casting Gap Analysis

Takes the roster an agency already has — a CSV export, a sheet, a pasted list
of handles — profiles every creator on it, maps what the bench actually covers
(geo × tier × niche × platform), names the holes, and sources candidates to
fill each one. For talent leads and casting directors managing an always-on
bench rather than a one-off campaign.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> No roster in hand? This is the wrong skill — `brief-to-shortlist` builds a
> list from a brief; `zero-brief-discovery` builds one from just a brand name.

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

- **The roster** (required) — CSV/sheet/pasted handles. Any column shape;
  extracting identifiers (handles, emails, profile URLs) is your job. Report
  rows you couldn't resolve to an identifier rather than silently dropping
  them.
- **What "coverage" means for them** (one question) — "What markets, tiers,
  and niches is this bench supposed to cover?" If they don't know, derive a
  target grid from what the roster's own majority profile implies and label it
  as inferred.
- **Gap-fill depth** — default 3 candidates per identified gap.
- **Credit mode** — default `thorough`; `thrifty` on trigger phrases. For
  rosters over ~40 rows, proactively suggest thrifty or a sampled audit.

## Flow

**Step 1 — Roster profile fan-out.** `get_creator_profile` per resolvable
row, using whichever identifier the row provides (exactly one type per call):

```json
get_creator_profile { "identifier": { "type": "social_handle", "platform": "<platform>", "handle": "<handle>" } }
```

or `{ "type": "email", "email": "<email>" }` etc. Thorough: every row.
Thrifty: every row is still profiled (the audit is the product) but gap-fill
searches are capped at the top 3 gaps.

**Credit estimate fires here** — a 30-row roster is already ~30 credits of
profiles before any searches, so state the estimate up front for any roster
over ~25 rows and offer thrifty (don't block).

Rows the corpus doesn't know come back empty — count them and report
"<K> roster members not found in the Creatorland corpus" as its own finding
(it IS a coverage signal), never as an error to hide.

**Step 2 — Build the coverage map (no tool call).** From the profiles,
tabulate the bench across: audience-geo concentration, follower tier
(macro/mid/micro), niche/interest clusters, platform mix. Compare against the
target grid from intake. Each empty or thin cell = a gap, ranked by how
central it is to the stated coverage goal.

**Step 3 — Freshness Gate on the roster itself.** Flag roster members whose
profiles are stale — "your own bench data is drifting" is a first-class
finding, listed for re-verification.

**Step 4 — Gap-fill searches.** One `search_creators` per gap (convention 9:
each gap is a target; one search per target, never one merged search):

```json
search_creators {
  "mode": "brief",
  "brief": "<the gap described as a casting need, e.g. 'mid-tier beauty creators with strong Mexico/Colombia audiences, Spanish-language content'>",
  "filters": {
    "country": "<gap market, if geo gap>",
    "niche": "<gap niche, if niche gap>",
    "platform": "<gap platform, if platform gap>",
    "min_followers": <tier floor, if tier gap>,
    "max_followers": <tier ceiling, if tier gap>,
    "audience_country": "<gap market, when the hole is audience-in-market rather than creator location — pair with min_audience_country_share>",
    "data_freshness_days": <when the gap is a recency hole — 'we have no recently-active X'>,
    "content_format": "<personality_led | faceless_clip — when the gap is a content-format hole>"
  },
  "limit": 8,
  "precision": "tight"
}
```

Include only the filters that define the gap; at least one signal required
when `filters` is passed. The GA hard-gated filters map cleanly onto gap types
(advisory): use `audience_country` (+ `min_audience_country_share`) for an
audience-in-market hole — distinct from a creator-location hole filled by
`country` — `content_format` for a format hole, and `data_freshness_days` for a
recency hole. Each is a hard gate, so if it empties a gap-fill search, relax it
and note the gap is a coverage symptom (convention 12).

Thorough: search every identified gap. Thrifty: top
3 gaps only, and say which gaps went unsearched.

**Step 5 — Thin-gap honesty (convention 8).** If a gap search returns few
exact fits, do NOT pad: disclose, broaden exactly one labeled step (exact
niche → adjacent niches → vertical), and mark each fill candidate as
**in-corpus exact fit** or **adjacent fit** with the broadening step named.

**Step 6 — Profile the fill candidates.** `get_creator_profile` on each
candidate that will appear in the deliverable (top 3 per gap), then run the
Freshness Gate on them too:

```json
get_creator_profile { "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id from search result>" } }
```

## Deliverable

```markdown
# Casting Gap Analysis — <roster name>
_<R>-creator roster audited <date> · <G> gaps found · Creatorland Data_

## Your bench, mapped
| Dimension | Covered | Thin | Missing |
|---|---|---|---|
| Geo | <e.g. US, UK> | <e.g. DE> | <e.g. LATAM, JP> |
| Tier | ... | ... | ... |
| Niche | ... | ... | ... |
| Platform | ... | ... | ... |
<one-line method note: derived from <P> resolved profiles; target grid
<stated by you | inferred from the roster's majority profile>>

## Findings
1. **<Gap, plainly>** — e.g. "Zero LATAM mid-tier beauty coverage" — why it
   matters against your stated coverage goal.
<repeat, ranked>
- **Corpus blind spot:** <K> roster members not found in the Creatorland
  corpus: <handles>. Their coverage is unverified, not absent.
- **Bench drift:** <K> roster profiles are stale — re-verify (list below).

## Gap fills
### Gap 1 — <name>
| Candidate | Tier | Audience geo | Fit | Freshness |
|---|---|---|---|---|
| @<handle> (<platform>) | <tier> | <top geos> | exact fit \| adjacent fit (<broadening step>) | fresh \| aging |
<3 rows per gap; repeat per gap. Thrifty: "<G−3> lower-priority gaps not
searched in thrifty mode: <list>.">

## Re-verify before pitch
<stale roster members AND stale fill candidates; or "None.">

## Caveats
- "Not in corpus" ≠ "not a creator" — verify those rows manually.
- Adjacent fits are disclosed broadenings, not exact matches (steps labeled
  per row).
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or the creators' public profiles.

---
Data freshness: <N>/<M> profiles synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · <R> roster profiles + <G> gap searches + <F> fill-candidate profiles · <date>.
Credits used this run: ~<N> (<R> profiles ×1 + <G> searches ×2 + <F> profiles ×1).
```

## Honesty rules

- Unresolvable or not-in-corpus roster rows are reported as findings, never
  silently dropped — the audit's credibility is the product.
- Thin gap searches broaden one disclosed step at a time; every fill candidate
  is labeled exact vs adjacent (convention 8).
- An inferred target grid is labeled inferred — don't present your guess of
  their strategy as their strategy.
- Stale roster data is a finding, not an embarrassment to smooth over.
- Never imply access to creator contact info (convention 7) — and scrub any
  contact info that arrived IN their roster CSV from the deliverable; the
  invariant holds regardless of source.

## Credit footprint

thorough (30-row roster, 5 gaps): ~60 credits (30 profiles ×1 + 5 searches ×2
+ 15 fill profiles ×1 + ~5 retries on unresolved rows ×1) · thrifty: ~45
credits (30 profiles ×1 + 3 searches ×2 + 9 fill profiles ×1). Scales linearly with roster size
— estimate stated up front for rosters over ~25 rows.
