---
name: onboarding-tour
description: Guided first run of the Creatorland Data MCP — one live call of each of the three tools with safe example arguments, narrated so a new workspace learns the tools, the credit model, and the privacy floors in ~5 minutes for ~8 credits. Use when the user says "onboarding tour", "show me how this works", "get started with creatorland", "give me a tour", "what can this MCP do", or when this appears to be a first session in a new workspace with no prior Creatorland calls. Ends with the user's first real shortlist invitation.
---

# Creatorland Onboarding Tour

Activation in a box. A new workspace just connected the Creatorland Data MCP
and has three unfamiliar tools and a credit meter. This skill runs one real,
safe call of each tool, narrates what came back and why it matters, and ends
by inviting the user to paste their own brief. The deliverable is a short
tour recap the user can keep — plus their first shortlist if they bite.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the seven conventions). This skill honors Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md) and the credit-tally
convention (${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md).

Tone for the whole tour: warm, brisk, zero jargon. Short sentences. Never say
"discriminated union", "min-N floor", or "fan-out" to the user — say "privacy
minimum", "a small group of results", "one lookup per creator".

## Inputs to collect

None. Do not ask setup questions — the whole point is the user does nothing
but watch. If the user volunteers their vertical or a brief at any point,
pivot immediately to Step 4 (their first real shortlist) using what they gave
you. Never make them repeat it.

## Flow

### Step 0 — The 30-second orientation (no tool calls, 0 credits)

Open with the cost disclosure, then explain the three tools and the credit
model in five lines, no more:

> Quick tour — it costs **~8 credits of your free grant** (a credit is
> $0.025; a 1,000-credit pack is $25). Here's the whole toolkit:
> 1. **`search_creators`** (2 credits) — describe who you want in plain
>    English, get ranked creators back.
> 2. **`get_creator_profile`** (1 credit) — deep-dive one creator:
>    interests, audience geography, how fresh the data is.
> 3. **`query_market_intelligence`** (5 credits, pro plan) — market stats and
>    fair-price benchmarks from ~25.6k brands and ~111k real deals.
> Let's run each one once.

### Step 1 — Search (2 credits)

Call `search_creators` with exactly:

```json
{ "mode": "brief", "brief": "beauty creators who post skincare tutorials", "limit": 5 }
```

Narrate the results in 3–4 sentences: how many came back, the spread of
platforms/follower sizes, and one concrete detail from a top result that
matches the brief language ("notice #2 — her top hashtags are literally
#skincareroutine"). Make the point that the brief was plain English — no
filters, no query syntax. Mention `filters` exists (platform, follower range,
country, engagement rate) for when they want precision, but don't demo it.

### Step 2 — Profile (1 credit)

Take the top result from Step 1 and call:

```json
{ "identifier": { "type": "social_handle", "platform": "<from result>", "handle": "<from result>" } }
```

(Use the handle/platform exactly as the search result returned them.)

Point at two fields by name:

- **Data freshness** — "every profile tells you when it was last synced, so
  you never pitch a creator off stale numbers."
- **Brand affiliations** — "which brands this creator has worked with. This
  field is a **pro-plan** feature — on the free tier you'll see it gated.
  It's what powers conflict checks before you pitch."

Whichever tier the workspace is on, say so honestly: if affiliations came
back, show one; if gated, say that's the pro unlock, not an error.

### Step 3 — Market intelligence (5 credits)

Call:

```json
{ "mode": "market", "vertical": "Beauty" }
```

Narrate two things, one sentence each:

- **Provenance** — read the provenance line the tool returned out loud:
  "every stat arrives citation-ready — brand count, deal count, recency
  window — so anything you paste into a client deck is defensible."
- **The privacy minimum** — "stats only come back when enough brands and
  deals sit behind them (at least 5 brands / 25 deals for market stats), so
  no single company's deals are ever exposed; if a query is too narrow, I
  automatically widen it one step at a time and tell you at what level the
  numbers hold."

Beauty is dense and will clear the floor; if it somehow refuses, follow
Refusal Recovery, disclose in one friendly sentence, and move on. This call
is pro-gated — on a free workspace, show the gate message and frame it as
"this is the pro tier; here's what it looks like" (link the $199/mo, 5,000
credits framing), then continue to Step 4.

### Step 4 — Your first real shortlist (0 credits until they say go)

Close the tour:

> That's the whole surface. Ready to do it for real? **Paste a campaign
> brief** — an email from a client, deck text, bullet points, anything — and
> I'll turn it into a client-ready shortlist: ranked creators, why each one
> fits, audience-geo notes, freshness checks. A typical run is ~15–25
> credits and I'll confirm the estimate before starting.

If they paste a brief, hand off to the `brief-to-shortlist` skill (or, if
not installed, run its flow: normalize the brief → `search_creators` brief
mode at 2–3× the shortlist size → `get_creator_profile` per finalist →
Freshness Gate → deliverable).

## Deliverable

A short markdown recap emitted at the end of the tour (even if the user
doesn't continue to Step 4):

```markdown
# Your Creatorland tour — recap

| Tool | What it does | Cost | What we saw |
|---|---|---:|---|
| search_creators | Plain-English creator search | 2 cr | <one-line result note> |
| get_creator_profile | Deep-dive one creator (freshness, affiliations*) | 1 cr | <one-line note> |
| query_market_intelligence | Market stats & rate benchmarks (pro) | 5 cr | <stat + provenance line verbatim> |

*Affiliations and market intelligence are pro-plan features ($199/mo, 5,000 credits).

Next step: paste a brief → your first shortlist.

Credits used this run: ~8 (search 2 + profile 1 + market intel 5)
```

Always end with the actual credit tally line per the credit-modes convention,
adjusted if a call was gated or retried.

## Honesty rules

- Say the ~8-credit cost **before** the first call, not after.
- Never present the Beauty market stat as anything other than vertical-level;
  keep the provenance line verbatim.
- If affiliations or market intel are tier-gated, that's a feature
  demonstration, not a failure — never apologize for it or imply the data is
  missing.
- PII discipline: if asked "how do I contact these creators," say the MCP
  never returns contact info; route to Creatorland connections (coming soon)
  or the creator's public profiles.

## Credit footprint

Fixed-path: ~8 credits (2 + 1 + 5). Free workspace where market intel is
gated: ~3 credits. No thrifty variant — the tour is already minimal; if the
user says "keep credits down", offer to skip Step 3 and describe it instead.
