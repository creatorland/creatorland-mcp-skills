---
name: transcript-to-shortlist
description: Turn a call transcript or meeting recording (client call, internal kickoff, voice-memo dump) into a ranked creator shortlist — extract campaign requirements from the call, ask for what's missing, confirm, then run the full brief-to-shortlist casting flow. Use when the user pastes/uploads a transcript and wants creators found — "find creators from this call", "shortlist from this transcript", "we discussed casting on this call". Named creators in the call become lookalike seeds.
---

# Transcript-to-Shortlist

Agencies' real intake artifact isn't a written brief — it's a call. This skill
takes a transcript (pasted, uploaded, or pulled from a meetings connector),
extracts the campaign requirements, fills the gaps interactively, gets a quick
confirm, then executes the full casting flow. The deliverable is the same
client-ready ranked shortlist Brief-to-Shortlist produces.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the conventions — including 10 budget-is-a-price, 11 brand filters, 12
relax the binding constraint, 13 auto-chain profile lookups). This skill honors
thrifty/thorough credit modes, Refusal Recovery, and the Freshness Gate via the
brief-to-shortlist flow it delegates to.

> Trigger discrimination: input is a **call/transcript/recording** and the
> user wants **creators found**. If they already have a written brief, use
> `brief-to-shortlist`. If they want a formal brief *document* from the call
> (not a shortlist), use `brief-builder`.

## Inputs to collect

- **The transcript** (required) — any length/format; speaker labels optional.
- **Shortlist size** — default 8; only ask if the call implies nothing.
- **Anything the gap questions surface** (below) — never more than one
  batched round.

## Flow

**Step 1 — Transcript Intake (no tool calls, 0 credits).** Run
${CLAUDE_PLUGIN_ROOT}/shared/transcript-intake.md in full:

1. Extract the schema fields (brand/client, objective, audience, creator_spec,
   vertical, deliverables, compensation_type, budget, timeline, exclusions),
   tagging each value **stated / inferred / missing**.
2. Capture every creator named on the call ("someone like @x", "that girl who
   does the GRWM videos — @y") as **lookalike seed candidates**. For brands,
   split them by intent: brands the user wants creators to have worked with /
   resemble ("creators who've done deals with brands like ours") become a
   positive **comp set** carried into the search as a `brand_affinities`
   filter; brands to avoid overlap with become **conflict-check candidates**.
   When the caller names their own employer as the comp anchor ("I'm at
   Fenty"), expand it to its peer set (Fenty → Rare Beauty, Pat McGrath,
   Glossier, …) for the comp set.
   Record any **budget** as a rate band to benchmark, NEVER as a follower
   filter — money is a price, not an audience size (convention 10). Follower
   filters come only from an explicit tier/size ask on the call.
3. Ask gap questions in ONE batched message, **max 4**, ordered by impact
   (platform + follower tier + markets + budget posture are the high-impact
   four). Never ask about something the call answered — quote it back
   ("I heard mid-tier TikTok, US + UK — locking that in").
4. Present the normalized requirements block, each line labeled
   stated/inferred, and **wait for the user's confirm** (or corrections)
   before spending any credits.

**Step 2 — Seed the searches.** Compress the confirmed requirements into the
`search_creators` brief text + filters (preserving the call's vibe words —
they drive rationale quality). Then:

- **Brief-mode search** — exactly as Brief-to-Shortlist step 1, limit =
  2–3× shortlist size. If the call produced a positive comp set, pass it as
  the `brand_affinities` filter; do not turn the call's budget into
  `min_followers`/`max_followers`. Apply the GA hard-gated filters when the
  call implies them (advisory, not mandatory): `content_format`
  (`personality_led|faceless_clip`) if the call describes on-camera vs
  faceless/clip content, `audience_country` (+ `min_audience_country_share`) if
  the ask is audience-*in-market*, and `data_freshness_days` if someone stressed
  recency ("who's been active lately").
- **Lookalike search per named creator** (2 credits each), unioned with the
  brief-mode results before the profile fan-out:

```json
search_creators {
  "mode": "lookalike",
  "seed_creator": { "type": "social_handle", "platform": "<platform>", "handle": "<handle from the call>" },
  "limit": 10,
  "precision": "balanced"
}
```

(Exactly one of `seed_creator` or `seed_content` per lookalike call;
lookalike mode is inference-free — stored embeddings.) Thorough: seed every
named creator. Thrifty: seed at most the 2 most-emphasized names. Dedupe the
union by creator identity before fanning out; note in the deliverable which
finalists came in via a lookalike seed ("similar to @x, whom you named on the
call").

**Step 3 onward — execute the casting flow.** Then follow
${CLAUDE_PLUGIN_ROOT}/skills/brief-to-shortlist/SKILL.md **from step 2 (profile
fan-out) onward** — profile fan-out on the unioned candidate set, Freshness
Gate, conflict check (using the competitor brands extracted from the call plus
any the user added), the single slate-level `query_market_intelligence` rate
call with Refusal Recovery, ranking, and that skill's full deliverable
template, honesty rules, and footers. Do not re-specify or alter its
deliverable here — it is the single source of truth for the output artifact.

The credit estimate fires before the fan-out as usual; the unioned candidate
set is larger than a pure brief run when lookalike seeds exist, so state the
estimate whenever the plan exceeds ~30 credits.

## Deliverable

Brief-to-Shortlist's deliverable, with two transcript-specific additions:

- The "**The brief, as I read it**" section is replaced by "**What I heard on
  the call**" — the confirmed requirements block with stated/inferred labels
  preserved.
- Lookalike-sourced finalists carry a one-line origin note: "entered the
  slate as a lookalike of @<seed>, named on the call."

All provenance/freshness/credit footers per the brief-to-shortlist template,
with the credit breakdown including the lookalike searches (×2 each). Paid-plan
creator avatars (`avatar { url, source }`, `null` on free/demo) flow through the
delegated flow — show the headshot on each card when present, initials when not.

## Honesty rules

All of brief-to-shortlist's honesty rules apply, plus:

- Never present an **inferred** requirement as if the client stated it — the
  stated/inferred labels survive into the deliverable.
- Lookalike results are similarity by stored embeddings, not endorsements —
  don't claim the named creator "recommends" or "is like" anyone beyond what
  similarity search supports.
- If the call named a creator the corpus can't resolve, say so in caveats
  rather than silently dropping the seed.
- A budget heard on the call is spend, not an audience size — it sets the rate
  band, never the follower filter (convention 10). When results are thin, relax
  per convention 12: broaden geo at the level the call used (don't offer
  sub-regions already inside a stated region) and keep the requested platform
  fixed.

## Credit footprint

thorough: ~33–39 credits (1 brief search ×2 + 1–3 lookalike searches ×2 +
~24 profiles + 1 rate call ×5) · thrifty: ~19–23 credits (1 brief search ×2 +
≤2 lookalike searches ×2 + ~10 profiles + 1 rate call ×5, max 2 ladder rungs).
Intake itself (steps 1–2 before searching) costs 0 credits.
