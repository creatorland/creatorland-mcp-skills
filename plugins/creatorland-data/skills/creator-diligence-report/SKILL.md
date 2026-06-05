---
name: creator-diligence-report
description: Produce a standardized, credit-report-style diligence one-pager for a single creator — profile facts, audience geo, brand affiliations, freshness status, and vertical benchmark position — formatted for procurement and legal review. Use when the user says "run diligence on [creator]", "diligence report", "vet this creator", "one-pager on [creator] for legal/procurement", or needs an institutional artifact before contracting. Not for finding creators or pricing a live quote.
---

# Creator Diligence Report

The "credit bureau" artifact: a standardized one-pager per creator that
procurement and legal teams will actually accept — every claim sourced, every
gap labeled, nothing vibes-based. For agency ops leads and brand-side teams
clearing a creator before contract. The deliverable is a fixed-format markdown
one-pager (the same sections every time — standardization IS the feature).

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> If the user has a live quoted fee to evaluate, that's `fair-price-brief`.
> If they only want competitor-relationship screening, that's `conflict-check`.
> This skill is the full standardized dossier.

## Inputs to collect

- **Creator identifier** (required) — handle, profile URL, Creatorland ID, or
  email. Map to exactly one of the five identifier types (`social_handle`,
  `creatorland_user_id`, `source_user`, `email`, `phone`). Never ask for a
  format the user already gave in another form.
- **Engagement context** (optional) — the brand/campaign this diligence is
  for. Powers the "fit" framing and lets `conflict-check`-style screening run
  against named competitors if the user supplies them.
- **Competitor brands to screen** (optional) — ask once; skip if already
  named or the user says it doesn't matter.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.

## Flow

1. **Profile** — `get_creator_profile`
   `{ "identifier": { "type": "social_handle", "platform": "<platform>", "handle": "<handle>" } }`
   (or the matching single identifier type). Extract: interests, hashtags,
   audience geo, follower count/tier, **data freshness** (Freshness Gate
   classification goes in the report header — a stale dossier must say so at
   the top, not the bottom), and **brand affiliations** (pro plan; if absent,
   the affiliations section states "unavailable on this plan" — never blank).
   1 credit.

2. **Benchmark position** — `query_market_intelligence`
   `{ "mode": "rate", "vertical": "<creator's inferred primary vertical>" }`
   — wrapped in Refusal Recovery (rate floor 10 brands / 50 deals; thorough:
   walk the ladder to clearance; thrifty: max 2 rungs). This positions the
   creator's TIER within the vertical's market band — it is corpus context,
   never the creator's rate history. 5 credits per call incl. ladder retries.

3. **Lookalike context (thorough only)** — `search_creators`
   `{ "mode": "lookalike", "seed_creator": { "type": "social_handle", "platform": "<platform>", "handle": "<handle>" }, "limit": 5 }`
   — names the creator's in-corpus comp set ("comparable talent" section).
   Inference-free, 2 credits. Do NOT profile the comp set. Skip in thrifty.

4. **Compose the one-pager** (no tool calls). Fixed section order, every
   section present even when empty (labeled "no data in corpus" / "supply
   from your own tools"). Engagement metrics, per-post performance, and
   sentiment have NO corpus source — those sections are labeled placeholder
   slots for the customer's own analytics, per the diligence concept's honest
   constraint.

Credit estimate: never exceeds ~30 credits for a single creator, so the
pre-run estimate doesn't fire; multi-creator diligence requests should route
through `roster-enricher` or be run as repeated single reports with a stated
N×~13 estimate.

## Deliverable

```markdown
# Creator Diligence Report — @<handle>
_Creatorland Data · <date> · standardized format v1_
**Data freshness status: <FRESH | AGING | STALE — re-verify before contracting>**

## 1. Identity & platform
Handle / platform / follower count & tier / verification status (as returned).

## 2. Content profile
Interests: <from profile> · Hashtags: <from profile> · Inferred primary
vertical: <vertical> (inferred from interests — labeled inference).

## 3. Audience geography
<top geos with shares, exactly as the profile returned them>

## 4. Brand affiliations (corpus-derived)
<list, or "unavailable on this plan", or "none found in corpus">
Note: affiliations are derived from the Creatorland corpus — they are not an
exhaustive deal history. Absence here ≠ absence of relationships.
<If competitor screen requested: per-brand verdict — "no overlap found IN OUR
CORPUS" / "⚠ corpus shows affiliation with <brand>">

## 5. Market position (vertical band context)
Market band for the **<vertical>** vertical<scope note if broadened>:
p25 $<x> · median $<y> · p75 $<z>. The creator's <tier> tier sits <framing>.
> <provenance line verbatim from the tool> · recency window: <window>
This is the corpus-level band for the vertical/tier — NOT this creator's
rate history (no per-creator rate data exists).

## 6. Comparable talent (in-corpus)        [thorough mode]
@<c1>, @<c2>, @<c3>, @<c4>, @<c5> — lookalikes by stored embeddings.

## 7. Performance metrics                  [placeholder — no corpus source]
Engagement rate / per-post metrics / growth: ❏ supply from your own
analytics tools. The Creatorland Data MCP has no per-post metrics endpoint;
this report leaves labeled slots rather than inventing numbers.

## 8. Contact
Creatorland Member: <yes/no if known> — contact via Creatorland (connections
coming soon) or the creator's public profiles. No contact information is
included in this report (by design).

---
**Provenance:** Creatorland Data MCP · 1 profile + 1 rate benchmark
(<clearance level>) <+ 1 lookalike set> · <date>
**Benchmark basis:** <level at which the privacy floor cleared; if broadened:
"a privacy feature of the data source, not missing data">
**Freshness:** profile synced <when>; classification <fresh/aging/stale>
Credits used this run: ~<N> (1 profile + 5×<rate calls> + 2 lookalike)
```

## Honesty rules

- **Affiliations are corpus-derived, never exhaustive.** Section 4's note is
  mandatory; a clean screen is "no overlap found in our corpus".
- **Band ≠ their rate.** Section 5 framing is fixed; never imply rate history.
- **Placeholder slots stay empty.** Never fill section 7 from memory, the
  web, or estimation — labeled slots only.
- **Stale status leads.** Freshness classification is in the header, not
  buried (Freshness Gate).
- **PII invariant (convention 7).** No contact info appears regardless of
  source — including anything pulled from other session data sources. Scrub
  emails/phones/contact links from bio snippets.
- Disclose every Refusal Recovery broaden at the clearance level.

## Credit footprint

thorough: ~8–13 credits (1 profile + 1–2 rate calls + 2 lookalike) ·
thrifty: ~6 credits (1 profile + 1 rate call, max 2 ladder rungs, no comp set)
