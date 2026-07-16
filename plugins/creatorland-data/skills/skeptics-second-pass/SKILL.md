---
name: skeptics-second-pass
description: Adversarially stress-test a creator shortlist you already have — re-run the brief under an alternate phrasing for missed talent, audit each pick for audience-geo mismatch, screen for competitor conflicts via affiliations, and write a risks-and-caveats appendix. Use when the user says "second pass", "poke holes in this shortlist", "stress-test this slate", "red-team this casting", or wants a critical review before sending. The anti-yes-man pass; produces a critique appendix.
---

# Skeptic's Second Pass

A shortlist already exists; this skill is the deliberate skeptic that challenges
it before it goes to a client. It re-runs the brief under an alternate phrasing
to surface talent the first pass missed, audits each pick for audience-geo
mismatch against the brief, screens for competitor conflicts via affiliations,
and writes a risks-and-caveats appendix. The anti-yes-man casting pass — for
casting directors who want their own work challenged before the client does.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> This runs AFTER a shortlist exists (e.g. from `brief-to-shortlist`). It does
> not build a shortlist from scratch — point it at one you already have, plus
> the brief it was built from.

## Inputs to collect

- **The existing shortlist** (required) — the creators on it (handles/IDs), in
  any format, ideally from an earlier in-session run.
- **The brief it was built from** (required) — to audit fit against. If it's
  already in session context, reuse it; don't re-ask.
- **Competitor brands** (optional) — for the conflict screen; ask once if not
  already known.
- **Credit mode** — default `thorough`; `thrifty` on the standard triggers.

## Flow

**Step 1 — Alternate-phrasing search (the "what did we miss" check).** Re-run
the brief under a deliberately DIFFERENT phrasing/emphasis than the original:
`search_creators { "mode": "brief", "brief": "<rephrased brief — different angle/vibe words, same intent, ≤2000 chars>", "filters": { <same hard filters: platform, country, follower band> }, "limit": <2× shortlist size>, "precision": "broad" }`
Then diff against the existing shortlist: creators who surface here but were
NOT on the original list are "candidates the first pass may have missed".
2 credits. **Thin-niche honesty (convention 8):** if the rephrase still
returns thin, disclose rather than padding the "missed" list with weak fits.

**Step 2 — Re-profile picks for the fit audit.** For each creator ON the
existing shortlist (and any compelling "missed" candidate):
`get_creator_profile { "identifier": { "type": "social_handle", "platform": "<platform>", "handle": "<handle>" } }`
(one identifier type per call). Audit each for: **audience-geo mismatch**
against the brief's markets (the headline skeptic check), tier drift, and
freshness. 1 credit each. **Credit estimate fires when shortlist size + missed
candidates exceed ~30 profiles.** Thrifty: profile only the shortlist (skip
the missed candidates) and the alternate search becomes advisory-only.

**Step 3 — Freshness Gate** — flag stale picks; a stale creator on a
"finished" shortlist is itself a risk-appendix item.

**Step 4 — Conflict screen.** If competitor brands were supplied, compare each
pick's **brand affiliations** (pro) to them. Overlaps → risk-appendix flags,
honestly framed: **"conflict found in our corpus"**, never "no conflicts" for
clean picks (affiliation data is corpus-derived, not exhaustive). If
affiliations are absent (free plan), the tool returns a machine-readable
`upgrade` envelope — say the conflict screen is **available on Pro / upgrade to
unlock**, never "not available" or that the data is missing.

**Step 5 — Write the critique** (no tool calls) — the appendix below. The
tone is critical by design: surface real risks, don't reassure.

## Deliverable

A critique + risks-and-caveats appendix in markdown, to staple to the shortlist:

```markdown
# Skeptic's Second Pass — <campaign / shortlist name>
_Adversarial review · Creatorland Data · <date>_

## Audience-geo mismatches
<each pick whose audience geo diverges from the brief's markets, with the
numbers — "@x is 48% BR but the brief is US-first"; or "None — all picks
align with the brief's markets.">

## Tier / freshness risks
<picks flagged aging/stale or off the brief's follower band; the re-verify
list; or "None.">

## Conflicts (corpus-derived)
<picks affiliated with named competitors — "⚠ @x shows a <brand> affiliation
in our corpus"; or "No conflicts found in our corpus" (NOT "no conflicts" —
the corpus is not exhaustive). If plan-gated: "Conflict screen available on
Pro — upgrade to unlock" (never "unavailable" or "not available").>

## Talent the first pass may have missed
<creators from the alternate-phrasing search not on the original list, with
why they're plausible; or "Alternate phrasing surfaced no strong additions.">
<Thin-niche note if the rephrase was thin: disclose, don't pad.>

## Net assessment
<honest 2–4 line verdict: which picks are solid, which are shaky and why,
what to fix before sending.>

---
Data freshness: <N>/<M> picks synced within the last sync window; <K> flagged.
Benchmark/affiliation basis: corpus-derived; conflict screen is "in our
corpus", not exhaustive.
Provenance: Creatorland Data MCP · 1 alternate search + <M> profiles · <date>.
Credits used this run: ~<N> (1 search ×2 + <M> profiles ×1).
```

## Honesty rules

- **Be a skeptic, not a yes-man.** Surface real risks; do not reassure to be
  agreeable. An empty risk section is fine ONLY when the data genuinely shows
  no risk.
- **Conflicts are "in our corpus", never "no conflicts" (convention + concept
  4).** Affiliation data is corpus-derived and not exhaustive.
- **Geo-mismatch claims cite the numbers** the profile returned — no invented
  audience splits.
- **Thin alternate search is disclosed, not padded (convention 8).**
- Disclose any Refusal Recovery broaden at the clearance level.
- **PII invariant (convention 7).** No contact info, regardless of source.

## Credit footprint

thorough: ~(2 + M) credits — 1 alternate search + M profiles (shortlist +
missed candidates); e.g. an 8-pick list ≈ 12–16 · thrifty: ~(2 + S) credits —
shortlist-only profiling, alternate search advisory. Estimate stated up front
when profiles exceed ~30.
