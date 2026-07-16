---
name: rate-anchored-opportunity
description: Build a market-credible outreach offer — assemble a reusable `opportunity` object whose `budget_band` is anchored to the corpus rate band (p25–p75) for the vertical/tier, so your pitch isn't a lowball. Use when the user says "build a market-credible offer", "what budget band should I pitch", "anchor my outreach offer to market rates", or "rate-anchored opportunity". Hands the offer to cast-and-connect / conflict-safe-connect / waterfall-casting. Distinct from fair-price-brief (a negotiation memo) — this produces a reusable outreach offer.
---

# Rate-Anchored Opportunity

Brands lowball because they guess a number. This skill stops that: given a
vertical (or a brief to infer one) and a deal type, it pulls the Creatorland
corpus rate band for that vertical/tier and assembles a complete, market-credible
`opportunity` object — the exact shape `request_creator_connection` consumes — with
a `budget_band` expressed as the market range, never a single number and never a
per-creator quote. The deliverable is a reusable offer block plus a one-line "why
this band is credible" provenance note, ready to hand to a reach skill or paste
into the connection-flow opportunity field. It does NOT reach anyone itself.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the nine conventions — esp. convention 10: a stated spend is a PRICE, not
a follower filter; convention 2 honest rate framing) and
${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md (the `opportunity` shape and the
`budget_band` field this skill fills — for reference only; this skill does not call
the connection tools). This skill honors thrifty/thorough credit modes
(${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md) and Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md).

> **Boundary — this skill composes the rate skills by reference and stops at the
> offer.** It mirrors the honest rate framing of `one-number-rate` /
> `fair-price-brief` to source the band, then builds an `opportunity` object. It
> does **not** call `request_creator_connection` and never edits a shared file.
> To actually reach creators with this offer, hand the block to **cast-and-connect**,
> **conflict-safe-connect**, or **waterfall-casting**. For a negotiation memo about a
> live quote, use **fair-price-brief**; for one quick number, use **one-number-rate**.

## Inputs to collect

- **Vertical** (required, but inferable) — e.g. "Beauty". If the user only gives a
  brief or a brand, infer the vertical from it; only ask if it's genuinely
  ambiguous (multi-vertical brand). Never ask if the brief names or implies it.
- **Deal type** (required) — what the campaign is, mapped to the closest corpus
  `deal_type` (e.g. "sponsored_post", "affiliate"). Drives both the rate slice and
  the `campaign_type` field.
- **Tier** (optional) — macro / mid / micro framing if the user has a follower band
  in mind. When given, it is passed as `creator_tier` on the rate call so the
  `budget_band` scopes to same-size creators (a tier too thin for the privacy
  floor broadens, disclosed, to the vertical band); it also labels the band and
  feeds `comp_tags`.
- **Campaign basics** (collect what's offered, default the rest) — `deliverables`
  (e.g. "1 Reel + 3 Stories"), `timeline`, `comp_tags` (e.g. usage rights,
  exclusivity, whitelisting), and a one-line `brief_context`. Anything the user
  doesn't give is left empty in the object, not invented.
- **`personal_message`** — **brand-authored only.** Never write one for the brand;
  leave it out and label it as the brand's to fill. (connection-flow honesty rule.)
- **Credit mode** — default `thorough`; `thrifty` on the credit-modes triggers
  (caps the refusal ladder at 2 rungs).

Never ask twice for anything the brief already states — quote it back instead.

## Flow

1. **Resolve vertical + deal type** (no tool call). From the inputs/brief, fix the
   `vertical` and the corpus `deal_type`. If the user named a creator instead of a
   vertical and the vertical isn't obvious, this is the one place a single
   `get_creator_profile` `{ identifier: { type: "social_handle", platform: <p>, handle: <h> } }`
   (1 credit) is allowed to infer the vertical — but prefer the brief; skip the
   profile whenever the vertical is already known (0 credits).

2. **Pull the corpus rate band — one call, Refusal-Recovery-wrapped.**
   ```json
   query_market_intelligence {
     "mode": "rate",
     "vertical": "<resolved vertical>",
     "deal_type": "<resolved deal_type, only if the campaign specifies one>",
     "creator_tier": "<the offer's tier — macro/mid/micro — when the user gave a follower band>"
   }
   ```
   Rate mode enforces a privacy floor of **10 brands / 50 deals**. On a refusal (or
   a server-side disclosed broaden), walk the Refusal Recovery ladder one rung at a
   time — drop `deal_type` → drop `sub_category` → drop `active_since` → drop
   `company_type` → vertical only — and **stop at the first rung that clears the
   floor.** Record the clearance level for disclosure. Thrifty mode: at most 2
   rungs, then report what you have. 5 credits per call, including each ladder retry.
   When the offer targets a known tier, pass `creator_tier` (emerging <1k / nano 1k-10k / micro 10k-100k / mid 100k-500k / macro 500k-1M / mega 1M+)
   so the `budget_band` is a same-size band rather than the whole-vertical spread;
   a tier too thin to clear the floor broadens (disclosed) to the vertical band —
   surface that in the credibility line.
   No `quoted_rate` is passed — this skill builds a band for an offer, it is not
   positioning a number against the band (that's fair-price-brief).

3. **Assemble the `opportunity` object** (no tool call). Map the inputs onto the
   connection-flow `opportunity` shape, with `budget_band` set to the corpus band as
   a **market range string** (p25–p75), labeled with the vertical and tier framing —
   never a single number, never "this creator's rate". Leave unstated fields empty;
   leave `personal_message` for the brand. When the offer is a promo/gifting/event/collab
   rather than a plain casting, carry the **structured brief** into the same object —
   `archetype` (`casting|product_gift|partner_promo|event_invite|paid_collab`), an
   `offer` (`{what, value, expiry, redemption}`), and the on-behalf-of `brand`
   (`{name, represented_by}`) — following the schema and required-field rules in
   `connection-flow.md` (the new archetypes require `brand` + `offer.what`); this
   skill still only fills `budget_band`, it doesn't invent offer terms. The credit estimate fires only if a deep
   refusal ladder would push the run past ~30 credits (rare — it would take a 5-rung
   ladder).

## Deliverable

A ready-to-use opportunity block plus its credibility line, paste-ready:

```markdown
# Rate-anchored opportunity — <vertical><, deal type>

```json
{
  "campaign_type": "<deal type / campaign, required>",
  "deliverables": "<if stated, else omitted>",
  "comp_tags": ["<if stated — usage, exclusivity, whitelisting, tier>"],
  "budget_band": "$<p25>–$<p75> (market p25–p75, <vertical><, tier> — framing, not a per-creator quote)",
  "timeline": "<if stated, else omitted>",
  "brief_context": "<one-line context, no contact info>"
  // personal_message: leave for the brand to author — never invented
}
```

**Why this band is credible:** the `budget_band` is the Creatorland corpus rate
range (p25–p75) for **<clearance-level scope>**, so the offer sits inside what this
vertical/tier is actually transacting at — not a guessed lowball.

## Fire it
Hand this `opportunity` to a reach skill to actually contact creators:
- **cast-and-connect** — cast a brief into a shortlist, then reach the top-N.
- **conflict-safe-connect** — same, with a competitor-conflict screen first.
- **waterfall-casting** — tier-by-tier sequential outreach.
Or paste the block straight into the connection-flow `opportunity` field. This
skill does not reach anyone; reaching costs 10 credits/creator and is the reach
skill's pre-flight (estimate + confirm + suppression pre-screen).

---
**Benchmark basis:** <vertical / scope at which the privacy floor cleared, with the
floor-disclosure note if broadened — "the narrower '<vertical> × <deal_type>' slice
was below the 10-brand/50-deal privacy floor, so the scope was widened; this is a
privacy feature of the data source, not missing data">
**Provenance:** <the provenance line the rate response returned, verbatim> ·
recency window: <window>
**Honesty note:** `budget_band` is the corpus-level market range for this
vertical/tier — NOT any creator's personal rate (that data does not exist), and a
stated spend is a price for the work, never a follower filter.
Credits used this run: ~N (breakdown: <0–1 profile> + 5×<rate calls incl. ladder rungs>).
```

Never strip the provenance or benchmark-basis footers to make the block prettier —
they are what makes the `budget_band` defensible when the offer goes out.

## Honesty rules

- **`budget_band` is a market band, never a per-creator quote** (convention 2 +
  connection-flow). Express it as p25–p75 for the vertical/tier; never as a single
  number, never as "what this creator charges". Per-creator rate history does not
  exist in the product.
- **A stated spend is a PRICE, not a follower filter** (convention 10). The
  `budget_band` describes what the brand is willing to pay for the work — it is not a
  threshold that screens creators by size. Never frame it as a filter.
- **Disclose every broaden.** If Refusal Recovery widened the slice, the
  benchmark-basis line states the level at which the floor cleared. Never present a
  broadened band as if it answered the narrow vertical/deal-type question.
- **`personal_message` is the brand's to write.** Never invent a quote, tone, or
  promise on the brand's behalf — leave the field for them.
- **This skill does not reach.** It emits an offer; it never calls
  `request_creator_connection`. The reach skills own the credit estimate, confirm,
  and suppression pre-screen before anyone is contacted.
- **No contact info**, ever (convention 7) — `brief_context` carries campaign
  context only, never a creator's address or contact link.

## Credit footprint

thorough: ~5 credits (1 rate call) — +1 if a profile was needed to infer the
vertical; +5 per refusal-ladder rung if the narrow slice was below the privacy
floor · thrifty: ~5 credits (1 rate call, max 2 ladder rungs, vertical given so no
profile). Always end with the actual tally (`Credits used this run: ~N`).
