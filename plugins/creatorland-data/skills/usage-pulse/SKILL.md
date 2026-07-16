---
name: usage-pulse
description: Internal CS skill — for one customer account, map what skills/workflows they COULD be running against their plan tier, then write a short "3 things to try this week" email with paste-ready prompts to drive activation and beat churn. Use when the user says "usage pulse for <account>", "CS health check", "what should this account be using", "write an activation nudge", or a CSM is prepping an account review. Deliverable is a per-account health read plus a ready-to-send email. v1 reads the billing/usage dashboard manually — no account-telemetry tool exists yet (wishlist item 5).
---

# Usage Pulse / CS Health Check (internal)

The anti-churn nudge. For a single customer account, this internal CS skill
reads where the account is — its plan tier, what it's actually been running,
where it's leaving value on the table — and produces a short, warm "3 things to
try this week" email with copy-paste prompts, so a CSM can send activation in
five minutes instead of writing it cold. The job-to-be-done: turn a quiet
account into an active one before it lapses. The artifact is a per-account
health read plus a ready-to-send email.

**v1 capability note.** There is **no account-usage telemetry tool** on the MCP
yet (it's wishlist item 5, `get_account_usage`, tracked in CRE-543). Until it
lands, this skill takes the account's current usage as an **operator-supplied
input** — pasted from the billing/admin dashboard, an export, or the CSM's
notes — and does not fabricate usage it cannot see. When the telemetry tool
ships, step 1 below becomes a tool call and the rest is unchanged.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the conventions). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md). It is near-zero-credit: it
reasons over the skill catalog and the account's profile, and makes at most one
optional market-intel call to season a prompt with a live number.

## Inputs to collect

- **Account** (required) — name/segment (agency, brand, talent manager) and
  **plan tier** (free / pro / pilot). Tier gates which skills are even
  available, so it shapes every recommendation.
- **Current usage** (required for v1, operator-supplied) — what the account has
  run recently: which skills/workflows, rough call volume, credits consumed vs
  granted. Paste from the billing/admin dashboard. If the user can't supply it,
  say plainly that v1 can't read usage itself and proceed on tier + segment
  alone, clearly labeling the read as "tier-based, not usage-based".
- **Their vertical / who they cast for** (optional) — lets prompts be
  pre-filled with the account's real vertical instead of a placeholder.
- **Known goals or friction** (optional) — anything the CSM knows (e.g. "they
  only ever run shortlists, never pricing"). Sharpens the gap analysis.
- **Mode** — default `thorough`; `thrifty` skips the optional live-number call.

## Flow

This skill is mostly reasoning, not tool calls.

1. **Read the account** (v1: from the operator-supplied usage; future: a
   `get_account_usage` call). Establish tier, what's been used, what's been
   granted vs consumed. No credits in v1.

2. **Map the opportunity** (no tool calls) — diff the account's actual usage
   against the catalog of skills its **tier unlocks** but it isn't using. Weight
   by fit to the account's segment and vertical:
   - Agencies idle on `brief-to-shortlist`/`cross-market-slate` -> casting depth.
   - Brands not touching `vertical-briefing`/`competitor-watch` -> market intel.
   - Anyone on pro never running pricing -> `fair-price-brief`/`rate-card-generator`.
   Pick the **3 highest-leverage unused workflows** for this account — concrete,
   not the whole menu.

3. **Season one prompt with a live number (thorough only, optional)** — at most
   one `query_market_intelligence` `{ mode: "rate" | "market", vertical: <their
   vertical> }` (5 credits, **wrapped in Refusal Recovery**) — in rate mode you
   may optionally add `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+)
   for a tier-specific hook, or omit it (the default) for the vertical-wide
   band — so a recommendation
   can carry a real "median rate in your vertical is $X — here's the skill that
   uses it" hook. Skip in thrifty. Never imply this number is account-specific;
   it's a vertical market band (convention 2).

4. **Write the email** (no tool calls) — warm, short, 3 concrete suggestions,
   each with a one-line "why it helps you" and a **paste-ready prompt** the
   account can drop straight into their session. Respect tier: never recommend a
   workflow their tier doesn't unlock — instead, if the highest-value next step
   is gated, frame it as the upgrade reason, honestly.

Credit footprint is ~0–5 credits total (one optional market call). No pre-run
estimate needed.

## Deliverable

```markdown
# Usage pulse — <Account> (<tier>, <segment>)
*Prepared <date> · read basis: <"usage dashboard, <date>" / "tier-based only —
usage not supplied">*

## Health read
- Using well: <skills/workflows they already run>
- Leaving on the table: <tier-unlocked workflows they aren't using>
- Risk note: <e.g. "low credit consumption vs grant — activation risk"; only if
  usage was supplied>

## The 3 to try this week
1. **<Skill / workflow>** — <one line why it fits this account>.
2. **<Skill / workflow>** — ...
3. **<Skill / workflow>** — ...

## Ready-to-send email
> Subject: 3 quick wins in Creatorland this week
>
> Hi <name>,
> <2-3 warm sentences.>
>
> 1. **<Win>** — <why>. Try this:
>    `<paste-ready prompt, pre-filled with their vertical>`
> 2. ...
> 3. ...
>
> <Soft close + offer to walk through one live.>

---
**Read basis:** <usage source + date, or the honest "tier-based, usage not
read in v1 — no account-telemetry tool yet (CRE-543 wishlist item 5)">.
**Provenance (if a live number was used):** <the market-intel provenance line,
verbatim, + recency window — and it is a vertical market band, not this
account's data>.
Credits used this run: ~N (0 if thrifty / no live number; 5 if one market call)
```

## Honesty rules

- **Don't invent usage.** v1 has no telemetry tool. If usage wasn't supplied,
  the read is explicitly "tier-based, not usage-based" — never a fabricated
  "you've run X searches". Say what you can and can't see.
- **Respect the tier.** Never recommend a workflow the account's tier doesn't
  unlock as if it were available; if it's the best next step, frame it as an
  honest upgrade reason, not a bait.
- **Live numbers are vertical market bands** (convention 2) — a "$X median in
  your vertical" hook is corpus-level context, never the account's own rate or
  a creator's rate.
- **Provenance survives into the email** when a live number is used (convention
  1) — the paste-ready prompt or a footer carries the citation.
- **No contact info** in the deliverable (convention 7); the email is to the
  account, but creator/brand contact data never appears in it.
- **Internal artifact, honest framing.** This is a CS tool; the activation
  suggestions are genuine fit reads, not upsell padding — recommend what
  actually helps the account, in priority order.

## Credit footprint

thorough: ~0-5 credits (catalog reasoning is free; one optional market-intel
call is 5, +5 per ladder retry) · thrifty: 0 credits (no live number).
