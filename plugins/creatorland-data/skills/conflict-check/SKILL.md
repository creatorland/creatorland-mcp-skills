---
name: conflict-check
description: Screen one or more creators for competitor-brand conflicts before pitching — pull each creator's corpus-derived brand affiliations and flag overlaps with the competitor brands you name. Use when the user says "conflict check", "any conflicts with [creator]", "is [creator] working with competitors", "screen this creator/slate against [brands]", or before sending a pitch. Honestly framed — a clean result is "no conflicts in our corpus", never a guarantee of none.
---

# Conflict Check

Before you pitch a creator to a brand, you need to know whether they're already
working with that brand's competitors. This skill pulls each creator's
corpus-derived brand affiliations and screens them against the competitor list
you supply — and is scrupulously honest that affiliation data is corpus-derived
and not exhaustive, so a clean result is always "no conflicts found in our
corpus", never "no conflicts". For casting directors and brand-side managers.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> For the full standardized dossier on one creator, use `creator-diligence-report`
> (it embeds a conflict screen). This skill is the focused, fast conflict pass
> across one creator or a slate.

## Inputs to collect

- **Creator(s)** (required) — one creator or a slate, in any format (handles,
  a sheet, a prior shortlist in-session). Map each to one identifier type.
- **Competitor brands** (required) — the brands a conflict would be against.
  If the user hasn't named any, ask once: "Which brands should I screen
  against?" Without them there is nothing to check.
- **Discovery option (optional, thorough)** — also surface candidate
  conflicts the corpus suggests, by reading the competitor's affinity cohort
  via `search_creators` `brand_affinities` (see step 3). Off by default.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.

## Flow

1. **Profile each creator for affiliations** — `get_creator_profile`
   `{ "identifier": { "type": "social_handle", "platform": "<platform>", "handle": "<handle>" } }`
   (exactly one identifier type per call). Read the **brand affiliations**
   field (pro plan). If affiliations are absent (free plan), the screen is
   **unavailable** — say so explicitly and stop; never report "no conflicts"
   when the field simply wasn't present. Also read **data freshness**:
   affiliations on a stale profile may have drifted (a new competitor deal
   could post-date the sync) — flag stale rows. 1 credit × N. **Credit
   estimate fires when N > 30** (a large slate): state it before fan-out.
   Thrifty: same calls (profiling is the whole job here) but cap the slate
   size and report any creators not screened.

2. **Match affiliations against the competitor list** (no tool call) — for
   each creator, compare corpus affiliations to the named competitors.
   Overlap → conflict flag naming the brand and that it came from the
   profile's corpus affiliations. No overlap → "no conflict found in our
   corpus" (the honest phrasing — not "no conflict").

3. **Affinity cross-check (optional, thorough only)** — corroborate by
   checking whether the creator sits in a competitor's affinity cohort:
   `search_creators { "mode": "brief", "filters": { "brand_affinities": ["<competitor brand>"] }, "limit": 50, "precision": "tight" }`
   and see whether the screened creator appears. This is a soft corroborating
   signal (affinity ≠ confirmed deal) — report it as such, never as a
   confirmed conflict. 2 credits per competitor checked this way. Skip in
   thrifty.

## Deliverable

A conflict-screen table in markdown:

```markdown
# Conflict Check — <slate / creator name>
_Screened against: <competitor brands> · Creatorland Data · <date>_

| Creator | Corpus affiliations (relevant) | Verdict | Freshness |
|---|---|---|---|
| @<handle> | <brands overlapping the list, or "—"> | ✅ no conflict found in our corpus / ⚠ CONFLICT — affiliated with <brand> / 🔶 soft signal — sits in <competitor> affinity cohort | fresh / aging / ⚠ stale |
<one row per creator>

## Flagged for review
<each ⚠ / 🔶 row with the specifics; or "None found in corpus.">

## What this screen does and does not cover
- Affiliations are **derived from the Creatorland corpus** — they are NOT an
  exhaustive record of every deal a creator has done. A clean result means
  **no conflict found in our corpus**, not a guarantee of none.
- Unreported, in-flight, or just-signed deals may not appear, especially on
  profiles flagged stale above.
- Affinity-cohort signals (🔶) indicate audience/brand affinity, not a
  confirmed commercial relationship.
- Free plan: brand affiliations are pro-gated; on free plan this screen is
  unavailable.

---
Data freshness: <N>/<M> creators synced within the last sync window; <K>
flagged — affiliations may have drifted.
Provenance: Creatorland Data MCP · <M> profiles<+ R affinity searches> · <date>.
Credits used this run: ~<N> (<M> profiles ×1<+ R affinity searches ×2>).
```

## Honesty rules

- **A clean result is "no conflicts IN OUR CORPUS" — never "no conflicts".**
  This phrasing is mandatory everywhere it appears; the corpus is not
  exhaustive.
- **Absent affiliations ≠ clean.** On free plan or when the field is missing,
  the screen is *unavailable*; report that, never a false all-clear.
- **Affinity ≠ deal.** Step 3 signals are corroborating, soft, labeled 🔶 —
  never reported as confirmed conflicts.
- **Stale profiles get a drift caveat** — a recent competitor deal may
  post-date the sync.
- **PII invariant (convention 7).** No contact info appears, regardless of
  source; scrub bio snippets.

## Credit footprint

thorough: ~(N + 2×C) credits for N creators and C optional affinity
cross-checks (e.g. 8 creators + 2 competitors via affinity = 12) · thrifty:
~N credits (profiles only, no affinity cross-check, slate cap reported).
Estimate stated up front when N exceeds ~30.
