---
name: draft-day
description: Run a gamified, fantasy-sports-style casting DRAFT — the skill is the draft board, presenting candidate creators round-by-round per roster slot (macro/mid/micro) with scarcity and budget pressure from benchmark data, so a room picks a team interactively. Use when the user wants a live workshop, not a static list — "run a casting draft", "draft our creator team", "draft day for [campaign]", or "workshop our roster round by round". Deliverable is the drafted roster plus a board recap.
---

# Draft Day

Casting as a fantasy-sports draft. The skill runs the board: it presents
candidate creators round by round per roster slot (macro → mid → micro),
surfaces scarcity and budget pressure from benchmark data, takes the room's
pick each round, and ends with a drafted roster and a recap. Built for
workshop-style agency planning sessions and as a memorable, interactive sales
demo.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md), Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md), and the Freshness Gate
(${CLAUDE_PLUGIN_ROOT}/shared/freshness-gate.md).

> This is the interactive, round-by-round format. For a one-shot ranked list
> use `brief-to-shortlist`; for a big working pool use `longlist-machine`.
> Draft Day is the only casting skill that hands picks back to the room each
> round.

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

- **The concept/brief** (required) — what we're casting; any format.
- **The roster shape** (required) — how many slots and of what tier, e.g.
  "1 macro, 3 mid, 6 micro". Default 1 macro / 3 mid / 4 micro if unstated.
- **Budget posture** (optional) — total budget or a per-slot ceiling; powers
  the scarcity/pressure framing. If absent, the benchmark band still drives
  "this tier transacts here" pressure without a hard cap.
- **Market / platform** (optional) — pulled from the brief if present.
- **Credit mode** — default `thorough`; `thrifty` on trigger phrases.

## Flow

**Step 0 — Normalize the brief + build the board (no tool call).** Structured
campaign description; map the roster slots into draft rounds (one round per
slot, ordered macro → micro so scarcity bites early). Show the draft order.

**Step 1 — Stock the board (searches).** Run a brief search per tier so each
round has real candidates. One search per tier band (convention 9 — each tier
is a target):

```json
search_creators {
  "mode": "brief",
  "brief": "<normalized concept, ≤2000 chars, vibe words kept>",
  "filters": {
    "platform": "<if named>",
    "country": "<if scoped>",
    "min_followers": <tier floor for this band>,
    "max_followers": <tier ceiling for this band>
  },
  "limit": <3–4 candidates per slot in this tier>,
  "precision": "balanced"
}
```

Thorough: enough headroom that each round offers ≥3 choices. Thrifty: tighter
limits, fewer alternates per round.

**Step 2 — One rate call for scarcity pressure.** Exactly one
`query_market_intelligence` up front, wrapped in Refusal Recovery — this powers
the "budget pressure" framing for every round:

```json
query_market_intelligence { "mode": "rate", "vertical": "<the concept's vertical>", "creator_tier": "<the roster slot tier you are pressuring — macro/mid/micro — when framing a specific slot>" }
```

Walk the ladder on refusal (thorough: until clearance; thrifty: max 2 rungs);
disclose clearance level. When a roster slot's follower tier is known, `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+)
scopes the band to that tier's same-size creators (a tier too thin for the floor
broadens, disclosed, to the vertical band); without it the band is vertical-level.
Either way it drives tier-pressure framing — never a per-creator price, and the
board says so.

**Step 3 — Profile the board's contenders (Freshness Gate).** Profile the
candidates that will be presented (not every search hit), using the returned
identifier type:

```json
get_creator_profile { "identifier": { "type": "creatorland_user_id", "creatorland_user_id": "<id from search result>" } }
```

Classify fresh / aging / stale. Stale candidates are flagged on the board with
a "re-verify" tag and never presented as a clean pick.

**Credit estimate fires here** (multiple tier searches + a profiled board +
rate call typically >30 credits) — state it before the draft starts and offer
thrifty.

**Step 4 — Run the draft (interactive, no new tool calls per round unless the
room asks).** For each round:
1. Present the slot, the 3–4 contenders for that tier (with one-line vibe fit,
   audience geo, freshness tag, and — on paid plans — the creator's `avatar`
   headshot fronting each contender card, falling back to initials when
   `avatar` is `null`/free), and the tier's budget-pressure note from the
   band ("mid-tier in this vertical transacts ~$<median> — three slots left,
   budget tightening").
2. The room picks. Lock it onto the roster.
3. Mark the picked creator and remove them from later rounds (scarcity).
4. If the room wants a fresh option mid-round, that's one extra
   `get_creator_profile` (or a fresh lookalike off a picked creator) — disclose
   the +credits before running it.

Keep the band framing honest every round: it's tier pressure, not a quote.

## Deliverable

```markdown
# Draft Day Recap — <campaign/brand>
_Casting draft run <date> · <slots> slots filled · Creatorland Data_

## The board (draft order)
Round 1 — Macro · Round 2–4 — Mid · Round 5–N — Micro

## The drafted roster
| Round | Slot | Pick | @handle (platform) | Followers | Audience geo | Freshness |
|---|---|---|---|---|---|---|
| 1 | Macro | <Name> | @<h> | <count> | <geos> | fresh |
| 2 | Mid | <Name> | @<h> | <count> | <geos> | aging (note) |
<one row per filled slot>

## Picks not taken (the bench)
<contenders presented but not drafted, per round — so the team has fallbacks>

## Budget-pressure context (vertical band)
Market band for the **<vertical>** vertical<, broadened per note>:
p25 $<x> · median $<y> · p75 $<z> — <deal volume / recency>.
> <provenance line exactly as the tool returned it>
Used as tier pressure during the draft — **vertical band, not per-creator
quotes.** <If broadened: disclose clearance level.>

## Re-verify before pitch
<stale picks/bench; or "None — all drafted creators cleared the freshness gate.">

## Caveats
- Scarcity/budget pressure is a workshop device driven by the vertical band —
  not real-time availability or per-creator pricing.
- Freshness tags reflect last sync; re-verify aging/stale picks before
  committing.
- No creator contact info is included or available via this tool; route
  outreach through Creatorland connections or the creators' public profiles.

---
Data freshness: <N>/<M> board creators synced within the last sync window; <K> flagged for re-verification.
Provenance: Creatorland Data MCP · <T> tier searches + <M> board profiles + 1 rate benchmark (<clearance level>) · <date>.
Credits used this run: ~<N> (<T> searches ×2 + <M> profiles ×1 + <R> market-intel ×5 + <any mid-draft adds>).
```

## Honesty rules

- Budget/scarcity pressure is an explicitly-labeled workshop device built on
  the vertical band — never presented as live availability or a per-creator
  quote.
- The band is vertical-level; disclose Refusal Recovery broadening at the
  clearance level, always.
- Stale candidates are tagged on the board and never offered as clean picks.
- Mid-draft profile/lookalike pulls disclose their credit cost before running.
- Never imply access to creator contact info (convention 7).

## Credit footprint

thorough: ~38 credits (3 tier searches ×2 + ~26 board profiles + 1 rate call
×5; +1 per mid-draft profile add) · thrifty: ~22 credits (3 tier searches ×2 +
~11 board profiles + 1 rate call ×5, max 2 refusal rungs, fewer alternates per
round)
