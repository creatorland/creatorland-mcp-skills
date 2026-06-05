---
name: creator-brand-matchmaker
description: Talent-manager outbound prep — given one of your creators, find which brand categories and verticals are actively dealing with creators like them, as a pitch-target memo. Use when the user says "which brands should we pitch for [creator]", "find pitch targets for my talent", "what verticals are active for creators like [handle]", or "brand matchmaker for [creator]". Deliverable is a pitch-target memo of active brand verticals/categories — never specific brands or contacts.
---

# Creator-to-Brand Matchmaker

The talent-manager side of the corpus. Given a creator, this skill builds a
lookalike cohort (creators like them), reads which brand **verticals and
categories** show the most deal activity around that cohort shape, and writes
a pitch-target memo: which categories to aim outbound at, ranked by corpus
deal activity, with provenance. For talent managers and creator-side reps
prepping outbound, and for Creatorland's own creator-side story.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> **The honesty spine of this skill (read before building):** the corpus
> shows DEAL ACTIVITY PATTERNS — which verticals/categories are transacting
> with creators of this shape — **not brand intent**. "Beauty is an active
> category for creators like yours" is true and useful; "Brand X wants to
> work with you" is NOT something this data can say. The memo targets
> CATEGORIES and VERTICALS, never specific brands as warm leads, and **never
> names a brand contact or any contact info** (convention 7). It's a "where
> to aim" memo, not a lead list.

> If the user wants creators FOR a brand (the buy side), use
> `brief-to-shortlist`. If they want to benchmark a creator's quote, use
> `fair-price-brief` / `one-number-rate`.

## Inputs to collect

- **The creator** (required) — an identifier (`social_handle`,
  `creatorland_user_id`, `source_user`, `email`, or `phone`). This is the
  manager's own talent or a creator they represent.
- **Markets / geo** (optional) — to weight categories by where the creator's
  audience is.
- **Any categories to include/exclude** (optional) — e.g. "we don't do
  alcohol or gambling."
- **Credit mode** — default `thorough`; thrifty on the usual trigger phrases.

## Flow

**Step 1 — Profile the seed creator.**
`get_creator_profile { "identifier": { "type": "<chosen>", ... } }` → the
creator's vertical signals (interests, hashtags), audience geo, follower tier,
freshness, and existing brand affiliations (pro). Run the Freshness Gate on
this profile immediately: if the seed itself is stale, flag that the whole
memo rests on aging data and recommend a re-sync before pitching off it.

**Step 2 — Build the lookalike cohort.** Seed a lookalike search off the
creator to define "creators like them":

```json
search_creators {
  "mode": "lookalike",
  "seed_creator": { "type": "creatorland_user_id", "creatorland_user_id": "<seed>" },
  "limit": 20,
  "precision": "balanced"
}
```

(thorough: limit 20; thrifty: limit 10.) This cohort is the bridge from one
creator to a corpus-sized population whose deal patterns market-intel can read.

**Step 3 — Determine the cohort's vertical(s).** From the seed profile +
cohort signals, identify the 1–3 corpus verticals the creator plausibly sits
in (Beauty, Fashion, Health & Fitness, Food & Beverage, Technology, …). These
drive the market-intel calls; show them back so the manager can correct.

**Step 4 — Market-intel scan per candidate vertical (the core).** One
`query_market_intelligence` market-mode call per candidate vertical to read
deal-activity shape — which company types / sub-categories are most active:

```json
query_market_intelligence {
  "mode": "market",
  "vertical": "<candidate vertical>",
  "active_since": "<ISO date, recent window if weighting toward current activity>"
}
```

Each is wrapped in **Refusal Recovery** (market floor: 5 brands / 25 deals):
if a vertical slice floors, walk the ladder (thorough: to clearance; thrifty:
max 2 rungs) and disclose at what level it cleared. Read the returned
distributions to rank brand **categories/company-types/sub-categories** by
deal activity for this creator shape.

**Credit estimate fires here.** Thorough is ~1 profile + 1 lookalike search +
~10–20 cohort profiles (optional, see thrifty note) + 2–3 market-intel calls.
If cohort profiling is on, the run exceeds ~30 credits — state the estimate,
offer thrifty (which skips cohort profiling and reads categories from the
search + market-intel layer only), proceed.

**Step 5 — Cross-check against the creator's existing affiliations.** From
the seed profile's affiliations (pro), note categories the creator is ALREADY
active in (exclude or de-prioritize as "already covered") vs adjacent
categories that are active for the cohort but not yet for this creator (the
prime whitespace pitch targets). Honest label: "already affiliated" vs
"active for similar creators, not yet for you."

**Step 6 — Write the pitch-target memo.**

## Deliverable

```markdown
# Pitch-Target Memo — <creator name / @handle>
_Prepared <date> · Creatorland Data · deal-activity patterns, NOT brand intent (see how to read this)_

> **How to read this memo:** these are brand CATEGORIES and VERTICALS where
> the corpus shows active deal-making with creators like <name> — ranked by
> deal activity, not by any brand's stated interest. This tells you where to
> AIM outbound, not who is waiting to hear from you. No specific brands are
> named as leads, and no contact information exists in this data or this memo.

## The creator, as the corpus sees them
- **Shape:** <vertical(s), audience geo, follower tier from the profile>
- **Already affiliated in:** <categories from profile affiliations, or "none in corpus">
- **Freshness:** fresh | aging (note) — <if stale: "seed data is stale; re-verify before pitching off this">

## Pitch-target categories (ranked by corpus deal activity)

### 1. <Category / vertical / company-type> — high activity
- **Why it fits:** <tie to creator shape + cohort signal>
- **Activity basis:** <deal volume / company count for this slice + the provenance line exactly as the tool returned it>
- **For you specifically:** active for similar creators · <"and you're already in it" | "whitespace — not yet in your affiliations">
- **Benchmark basis:** <vertical-level / broadened level per Refusal Recovery, if applicable>

<repeat per ranked category, 3–6 entries>

## Whitespace (active for your cohort, not yet for you)
<the adjacent-category shortlist — where outbound is most likely to be net-new>

## Already covered
<categories the creator is already affiliated with — de-prioritized for outbound>

## How to use this
- Aim outbound pitches at the top categories; build the brand list yourself
  from your own network/research — this memo deliberately names none.
- Pair with a fair-price benchmark (`fair-price-brief`) before you quote.

## Caveats
- **Deal-activity patterns, not brand intent.** A hot category is not a
  warm lead. No brand here has expressed interest in this creator.
- Rankings are corpus-level for the vertical/category — not this creator's
  win probability.
- Refusal Recovery broadening disclosed at the clearance level above.
- No brand contacts, no contact information — by design (convention 7).
- <seed staleness / thin cohort caveats, if applicable>

---
Data freshness: seed profile <fresh|aging|stale>; <C>/<D> cohort creators synced within the last sync window (if cohort profiled).
Provenance: Creatorland Data MCP · 1 seed profile + 1 lookalike search<+ <C> cohort profiles> + <V> market-intel calls (<clearance levels>) · <date>.
Credits used this run: ~<N> (1 profile + 1 search ×2 <+ <C> profiles> + <V> market-intel ×5).
```

## Honesty rules

- **Deal-activity patterns, not brand intent** — the load-bearing rule. Never
  imply a brand wants this creator; never convert a hot category into a warm
  lead.
- **Never name specific brand contacts. No contact info, ever** (convention
  7) — the memo targets categories/verticals only and says so explicitly.
- Rankings are corpus-level for the category/vertical — never "this creator's
  odds" or "their rate."
- Disclose Refusal Recovery broadening at the clearance level on every
  market-intel call.
- Distinguish "already affiliated" from "whitespace" honestly; don't sell a
  category the creator already works in as a fresh opportunity.
- If the seed profile is stale, the memo says its whole basis is aging — the
  Freshness Gate applies to the seed, not just a list.
- Never strip the provenance line to make the memo prettier.

## Credit footprint

thorough: ~30–45 credits (1 seed profile + 1 lookalike search ×2 + ~10–20
cohort profiles ×1 + 2–3 market-intel ×5; +5 per refusal-ladder rung) — the
estimate fires when cohort profiling is on · thrifty: ~13–18 credits (1 seed
profile + 1 lookalike search ×2, cohort profiling skipped, 2 market-intel ×5,
max 2 ladder rungs each).
