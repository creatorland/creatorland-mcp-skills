---
name: creator-diligence-audience-report
description: 'Premium, audience-verified creator diligence one-pager. Use when the user wants a procurement/legal-grade vetting doc that INCLUDES real audience demographics, geo, and a fake-follower (credibility) score — e.g. "deep diligence on @creator", "audience-verified diligence", "is this creator''s audience real and on-brand", "vetting one-pager with audience data". This is the PAID/token tier — it pulls a full audience report. For the cheaper profile-only version use creator-diligence-report.'
---

# Creator Diligence Report — Audience-Verified (premium)

The premium tier of the diligence dossier: everything the cheap
`creator-diligence-report` gives PLUS a verified third-party **audience report** —
real audience demographics, geography, interests, audience brand-affinity, and a
**fake-follower / credibility score**. For procurement, legal, and brand-side
teams who need to prove a creator's audience is *real and on-brand* before a
contract, not just vibe it.

This is the PAID tier: it pulls a full audience report via `get_audience_report`
(**25 credits**, or $0 on a cache hit within 30 days — but still billed 25).
That is ~10× the cheap profile-only report, so it must be a **deliberate,
confirmed choice** — never a silent upgrade.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the credit-estimate
discipline (${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md).

> Profile-only, no paid audience pull → `creator-diligence-report`.
> A live quoted fee to evaluate → `fair-price-brief`.
> Competitor-relationship screening only → `conflict-check`.
> A whole roster of audience reports → `roster-microsite-builder`.

## Inputs to collect

- **Creator identifier** (required) — handle, profile URL, Creatorland ID, or
  email. Map to one of the five identifier types. Also capture the **platform**
  (instagram / tiktok / youtube) and, if known, the **stable source_user_id**
  (it guarantees a cache hit and avoids a re-pull).
- **Engagement context** (optional) — the brand/campaign this is for; powers
  the on-brand "fit" framing.
- **Competitor brands to screen** (optional) — ask once.

## Flow

1. **Cost preflight (MANDATORY — this is a paid pull).** Run
   `check_audience_coverage` `{ creators: [{ platform, handle|source_user_id }] }`
   (free) first. State the result to the human and get an explicit go-ahead:

   > This pulls a full **audience report** — premium, **25 credits** (~$0.63),
   > or **free if cached** within 30 days. Coverage shows: `<cached (free) |
   > fresh ≈25 credits>`. Continue?

   Do NOT pull until the human confirms. If they decline, **fall back to the
   free profile-only `creator-diligence-report`** and say so explicitly.

2. **Resolve the creator** — `get_creator_profile`
   `{ identifier: { type, ... } }` (1 credit). Capture identity, platforms,
   follower count/tier, audience geo, **data freshness**, and brand
   affiliations. Halt cleanly if the identifier does not resolve.

3. **Pull the audience report** — `get_audience_report`
   `{ platform, source_user_id | handle }` (cache-first). Capture
   `as_of {profile_updated}` for the freshness stamp and the `coverage` block.
   If the report cannot be built (no audience data), say so and fall back to
   the profile-only dossier.

4. **Compose the one-pager** (no tool calls). Fixed section order; every
   section present even when a platform doesn't supply it (labeled, never
   blank). **Lead with audience authenticity.**

## Deliverable

```markdown
# Audience-Verified Diligence — @<handle>
_Creatorland Data · <date> · audience report as of <profile_updated>_
**Data freshness: <FRESH | AGING | STALE — re-verify before contracting>**
**Audience coverage: <Instagram: full | TikTok/YouTube: demographics + geo only>**

## 1. Audience authenticity  ← lead with this
**~<X>% of audience suspected fake** · credibility score <0–1> · class <normal/…>
Audience-type split: real <%> / suspicious <%> / mass-followers <%> / influencers <%>.
**Verdict vs floor:** 🟢 real audience / 🔴 below credibility floor — <one line>.
> Credibility & fake-follower % are **vendor-derived** (the audience-data
> provider's score), surfaced here — not a Creatorland computation.
> Instagram-only today; for TikTok/YouTube this section reads "not available".

## 2. Identity & reach
Handle / platform(s) / followers & tier / verified gender & age / location /
real engagement rate (provider-measured).

## 3. Audience fit
Top geographies with shares (US / target-market weight called out) · age &
gender split · top interests · top audience brand-affinities (IG).
<If engagement context given: one line on on-brand fit.>

## 4. Brand history & conflicts
Paid-partnership brands (from the report's commercial posts, IG) + Creatorland
corpus affiliations. <If competitors named: per-brand verdict — "no overlap
found IN OUR CORPUS" / "⚠ affiliation with <brand>".>
Note: affiliations are corpus-derived + report-derived — not an exhaustive
deal history; absence ≠ no relationship.

## 5. Market position (vertical band context)
`query_market_intelligence` rate band for the creator's inferred vertical —
p25 $<x> · median $<y> · p75 $<z>. The creator's <tier> sits <framing>.
> <provenance line verbatim> · recency window: <window>
Corpus-level band for the vertical/tier — NOT this creator's rate history.

## 6. Provenance & freshness
Audience data **as of <profile_updated>**; deal data derived from the
Creatorland corpus. Credibility score is vendor-derived (labeled). PII excluded
by design — no contact info in this report.

---
**Provenance:** Creatorland Data MCP · 1 profile + 1 audience report
(<cached / fresh>) <+ 1 rate benchmark> · <date>
**Credits used:** ~<N> (1 profile + 25 audience report <+ 5 rate>)
```

5. **Offer the artifacts.** Default deliverable is the clean markdown
   one-pager. Then offer: (a) the report's **whitelabeled PDF** (the
   `pdf_url` the tool returned, when present), and/or (b) a `.docx` / `.pdf`
   render of the full one-pager for procurement filing.

## Honesty rules

- **Cost is confirmed, never silent.** The 25-credit pull happens only after
  the human says yes to the preflight; declining falls back to the free
  profile-only diligence.
- **Lead with fake-follower %.** Section 1 is first and carries the verdict.
- **Credibility is vendor-derived — labeled.** Never present the score as a
  Creatorland computation (it is the audience-data provider's).
- **Instagram-first honesty.** For TikTok/YouTube, the credibility and audience
  brand-affinity sections read "not available for this platform today" — never
  fabricated.
- **Band ≠ their rate.** Section 5 framing is fixed.
- **PII invariant (convention 7).** No contact info appears, regardless of
  source — including the report's own `contacts` field (which the MCP already
  strips). Scrub bio snippets.
- **Stale leads.** Freshness + `as_of` are in the header, not buried.

## Credit footprint

~26–31 credits per creator: 1 profile + 25 audience report (or 1 + free on a
cache hit, billed 25) + optional 5 rate benchmark. Always run the free
`check_audience_coverage` preflight first; a cached creator is the same 25 but
$0 vendor cost. State the estimate before pulling.
