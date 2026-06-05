---
name: talent-scout
description: Standing discovery profile re-run on demand — save your recurring search criteria (briefs, lookalike seeds, filters) once as a scout profile, then say "run my scout" anytime to get a diff report of NEW creators who entered your search space since last run. Use when the user says "set up a talent scout", "watch this space for new creators", "run my scout", "any new creators since last time", or wants recurring discovery without re-explaining the brief. Deliverable is a what's-new diff report.
---

# Always-On Talent Scout

Turns one-shot discovery into a standing subscription habit. The user defines
a **scout profile** once — one or more saved searches (brief-mode briefs,
lookalike seeds, filter sets) — and this skill re-runs it on demand, diffs the
results against the snapshot from the previous run (stored as a local state
file in the workspace), and reports only what changed: new creators in the
search space, creators who dropped out, and freshness movements. For agency
casting leads running always-on programs and talent teams watching a niche.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> Honest scoping: there is no server-side saved-search or change-feed API.
> The scout is client-side — this skill stores result snapshots in the
> workspace and computes diffs locally. That also means the scout only "runs"
> when invoked. In harnesses with scheduled tasks (e.g. Cowork scheduled
> tasks), the user can schedule "run my talent scout" weekly and this skill
> pairs with that naturally — mention it when setting up a profile, but never
> depend on scheduling existing; on-demand runs are the baseline.

> If the user has a one-off brief in hand, this is the wrong skill — use
> `brief-to-shortlist`. If they're watching competitor BRANDS rather than a
> creator search space, use `competitor-watch`.

## Inputs to collect

**Setup (first run only):**
- **Scout profile name** — e.g. "LATAM beauty mid-tiers". One workspace can
  hold several profiles; each gets its own state file.
- **The saved searches** (1–4 per profile) — each is either a brief-mode
  search (brief text + optional filters) or a lookalike search (seed creator
  or seed content). Capture them in exact `search_creators` argument form and
  show them back for confirmation; these arguments are frozen into the
  profile so every run is comparable.
- **Result depth** — `limit` per search, default 25 (thrifty: 15).
- **Profile fan-out policy** — default: profile only NEW creators each run
  (the diff is the product; profiling the whole result set every time wastes
  credits).

**Re-run (every subsequent run):**
- **Which profile** — only if more than one exists; never re-ask the saved
  criteria. The state file is the memory.
- **Credit mode** — default `thorough`; thrifty on the usual trigger phrases.

## Flow

**Step 0 — Load or create state.** State lives at
`talent-scout/<profile-slug>.json` in the workspace (create the directory if
absent). Schema:

```json
{
  "profile_name": "LATAM beauty mid-tiers",
  "created": "<ISO date>",
  "last_run": "<ISO date>",
  "searches": [ { "label": "...", "args": { /* frozen search_creators args */ } } ],
  "seen": { "<creator identifier>": { "first_seen": "<ISO date>", "last_seen": "<ISO date>", "label": "<which search>" } }
}
```

If no state file exists, this is a setup run: collect inputs, write the file,
run the baseline (below), and tell the user the next run will produce diffs.
On a baseline run the deliverable is the full result list labeled as
**baseline, not a diff** — never fake a "new creators" framing on run one.

**Step 1 — Re-run every saved search with its frozen arguments.** One
`search_creators` call per saved search, arguments verbatim from the state
file, e.g.:

```json
search_creators {
  "mode": "brief",
  "brief": "<frozen brief text>",
  "filters": { "country": "MX", "min_followers": 50000, "max_followers": 500000 },
  "limit": 25,
  "precision": "balanced"
}
```

or

```json
search_creators {
  "mode": "lookalike",
  "seed_creator": { "type": "social_handle", "platform": "instagram", "handle": "<frozen seed>" },
  "limit": 25,
  "precision": "balanced"
}
```

**Step 2 — Diff against `seen`.** Classify each returned creator:
- **NEW** — not in `seen` → the headline of the report.
- **Returning** — in `seen` and returned again → update `last_seen`.
- **Dropped out** — in `seen`, was returned last run, absent this run →
  list briefly ("left the result set — ranking shift, not a verdict on the
  creator").

**Step 3 — Profile fan-out on NEW creators only.**
`get_creator_profile { "identifier": { "type": "<type from search result>", ... } }`
per new creator (exactly one identifier type per call). Thorough: all new
creators. Thrifty: top 5 new per search by search-result signal; list the
rest as "unprofiled — names only."

**Credit estimate fires here** if searches + expected new-creator profiles
exceed ~30 credits (likely on baseline runs with 3–4 searches at limit 25 —
state the estimate, offer thrifty, proceed).

**Step 4 — Freshness Gate** on every profiled creator per the shared module.
Stale new arrivals go to "re-verify before pitch", never the headline list.

**Step 5 — Update state and write the deliverable.** Merge this run's results
into `seen`, stamp `last_run`, save the file, then write the diff report.

## Deliverable

```markdown
# Talent Scout — <profile name>
_Run <date> · previous run <date or "baseline run — no diff yet"> · Creatorland Data_

## New in your search space since last run (<N>)

### <Name> — @<handle> (<platform>, <follower count>)
- **Entered via:** <which saved search matched>
- **Why they fit:** <1–2 sentences tied to the saved brief's language / seed similarity>
- **Audience-geo:** <top geos from profile>
- **Freshness:** fresh | aging (note)
<repeat per new creator; if zero: "No new creators this run — your saved space is stable. (That's signal too.)">

## Dropped out of the result set (<K>)
<names + which search; "ranking shift, not a verdict">

## Returning (stable presence)
<count only, e.g. "19 creators returned again across your 3 searches" — names on request>

## Re-verify before pitch
<stale new arrivals; or "None — all new arrivals cleared the freshness gate.">

## Scout profile on file
<the saved searches, labels + one-line summaries, so the user can ask to edit them>
> Tip: in a harness with scheduled tasks (e.g. Cowork), schedule "run my
> talent scout '<profile name>'" weekly to make this a true standing watch.

---
Data freshness: <N>/<M> profiled creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · <S> saved searches re-run + <P> profiles · diff computed locally against <prior run date> snapshot · <date>.
Credits used this run: ~<N> (<S> searches ×2 + <P> profiles ×1).
```

## Honesty rules

- The diff is **client-side**: "new" means new to the locally stored result
  snapshot, not "new to the platform" or "newly active." Say so in the report
  the first few runs.
- A baseline run is labeled baseline — never dress a first run up as a diff.
- "Dropped out" means left the ranked result set, nothing more — no churn or
  decline narrative.
- Thin-niche honesty (convention 8): if a saved search returns very few
  results, disclose and offer ONE labeled broadening step for the profile —
  never silently loosen frozen search arguments.
- Stale new arrivals never headline (Freshness Gate).
- No contact info anywhere in the report (convention 7); the affordance is
  the Creatorland Member flag / public profiles.

## Credit footprint

thorough re-run: ~10–22 credits (2–4 searches ×2 + ~5–15 new-creator
profiles ×1; quiet weeks cost as little as 4–8) · thrifty re-run: ~7–14
(same searches, ≤5 profiles per search) · baseline/setup run: ~25–55 if the
full result set is profiled — the estimate fires and thrifty (names-only
baseline, profile later) is offered. No market-intel calls in this skill.
