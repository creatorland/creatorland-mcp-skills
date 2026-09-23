# Connection Flow (shared module — for connection-enabled skills ONLY)

This module governs the **outreach / connection** tools in **both
directions**: **brand→creator outreach** (`request_creator_connection`) and the
**creator→brand pitch** (`request_brand_connection`). It is referenced **only by
the connection-enabled skills** (cast-and-connect, pitch-a-brand,
connection-pipeline-tracker, reply-triage, conflict-safe-connect,
outreach-spend-forecaster, and their followers). The read-only catalog
(brief-to-shortlist, conflict-check, fair-price-brief, …) does **NOT** reference
this file and must never call these tools — outreach is an additive layer, not a
change to the advice catalog.

## The connection tools (ground truth — match exactly)

### `request_creator_connection` — 10 credits (ONE charge per creator, whole sequence)
Asks Creatorland's matchmaker (`matchmaker@creatorland.com`) to reach a creator
on the brand's behalf, run a polite 3-touch sequence (day 0 / 3 / 7 that
auto-stops on reply), and — on a "yes" — make a **double-opt-in** joint intro.
The creator's contact details are NEVER shared with the brand unless the creator
agrees; the brand never sees an email address through this tool.

```json
request_creator_connection {
  "creator": <exactly one of:
     { "type": "creatorland_user_id", "creatorland_user_id": "<id>", "display_name": "<opt>" }
   | { "type": "social_handle", "platform": "instagram|tiktok|youtube|twitter|twitch", "handle": "<h>", "display_name": "<opt>" }
   | { "type": "email", "email": "<brand-supplied addr>", "display_name": "<required>" }>,
  "opportunity": {
    "campaign_type": "<required>",
    "archetype": "<opt: casting|product_gift|partner_promo|event_invite|paid_collab>",
    "offer": { "what": "<required with new archetypes>", "value": "<opt>", "expiry": "<opt>", "redemption": "<opt>" },
    "ask": "<what the creator is asked to do; required for gift/promo archetypes>",
    "exclusions": "<opt: what this campaign is NOT>",
    "proof_links": ["<opt: voucher/proof URLs — registered to THIS campaign's link allowlist>"],
    "deliverables": "<opt>", "comp_tags": ["<opt>"], "budget_band": "<opt>",
    "timeline": "<opt>", "brief_context": "<opt: sender-supplied copy, used as source material only>",
    "personal_message": "<opt>"
  },
  "brand": { "name": "<org>", "represented_by": "<person>" },
  "send_connection_request": true
}
```

**The structured brief (archetypes).** Three archetypes beyond casting and
product gifting: `partner_promo` (a partner perk/voucher), `event_invite`, and
`paid_collab` (affiliate/ambassador/UGC). New archetypes REQUIRE the
on-behalf-of identity (`brand.name` + `brand.represented_by`) and a structured
`offer.what`; missing fields come back as question-shaped validation errors —
relay them to the user verbatim. The matchmaker composes the subject and body
from the brief under fixed rules (neutral middleman, no masquerade, no
invented claims); sender-supplied copy is source material, never sent verbatim.

**Preview before launch.** `POST {MCP_BASE}/outreach/preview` with
`{creator_display_name?, opportunity, brand}` renders the exact touch-1 email
(composed, or the vetted template floor) with zero side effects — nothing
queued, sent, or charged. Use `campaign-designer` for the full guided setup.

**First-campaign review gate.** A sender's first campaign holds in
`pending_first_campaign_review` until Creatorland clears it (usually same-day);
later campaigns send without the gate. Tell first-time senders up front.
- A repeat request to a creator **already in an ACTIVE sequence for this brand**
  is refused and **NOT charged** — track the existing one via `get_connection_status`.
- 10 credits cover the whole sequence + reply monitoring + the intro. Never per-email.

### `request_brand_connection` — creator→brand pitch (enqueue FREE; 10 credits ONLY on an approved send)
The mirror of `request_creator_connection`, in the other direction: it lets a
**creator pitch a brand**. The creator NAMES a brand as free text; Creatorland
resolves the brand contact **server-side** — the creator never sees, picks, or
supplies a contact, and the tool never reveals whether a given brand is
reachable. **Enqueuing is free.** The 10-credit charge lands **only when an
approved pitch actually sends** — never on enqueue, never if the pitch is held
or never matched.

```json
request_brand_connection {
  "brand": "<required: the brand name, free text — the creator names it; the contact is resolved SERVER-SIDE>",
  "pitch": {
    "campaign_type": "<required>",
    "message": "<required: the creator's pitch message>"
  }
}
```

- **Oracle-safe acknowledgement.** The acknowledgement is **byte-identical**
  whether or not a contact exists for the named brand — enqueuing a pitch NEVER
  confirms (or denies) that the brand is reachable. Frame it as "your pitch is
  queued," never "we found/have a contact at <brand>."
- **First pitch is human-reviewed** before it sends (same spirit as the
  first-campaign gate above); later pitches send without the hold. Tell
  first-time pitchers this up front.
- **Never promises a yes.** Creatorland reaches the brand on the creator's
  behalf; the outcome is the brand's. A queued pitch is a pitch sent, not a deal.
- Entitlement-gated behind **`brand_connections`** (pro) — a plan without it
  gets a **SUCCESSFUL refused envelope, not an error** (degrade per the
  entitlement section below).
- Track the pitch lifecycle with the free read tools below
  (`get_connection_status` by `conn_ref`, `list_connections`) — they cover
  connections in **both** directions.

### `get_connection_status` — free (0 credits)
`{ "conn_ref": "<ref>" }` (a `conn_ref` from either direction) → lifecycle
status, touches sent (of 3), latest reply
classification if any, next scheduled touch, and the per-connection `engagement`
block (below). Scoped to your account. No contact details.

### `list_connections` — free (0 credits)
`{ "status"?: "queued|sending|delivered|replied_interested|replied_declined|replied_question|accepted_inapp|opted_out|expired", "limit"?: 1–100 }`
→ your account's connections newest-first (brand→creator outreaches AND
creator→brand pitches): each carries `conn_ref`, status, campaign
type, next scheduled touch, and the per-connection `engagement` block (below).
Scoped to your account. No contact details ever returned.

### The `engagement` block (both read tools, free)

Every connection row carries email-engagement signals rolled up across its sends:

```json
"engagement": {
  "delivered": true,          // any send confirmed delivered
  "opened_at": "<ISO>|null",  // earliest open across the sends
  "clicked_at": "<ISO>|null", // earliest click across the sends
  "open_count": 3,            // total opens (MPP-inflated; directional)
  "click_count": 1,           // total clicks (reliable intent)
  "tracking_enabled": true    // false = sends predate tracking (or none sent)
}
```

How every skill must frame these (NON-NEGOTIABLE):

- **Clicks are the headline signal.** A click is a deliberate act — treat
  `clicked_at` / `click_count` as reliable intent.
- **Opens are directional only.** Open counts include automated privacy
  prefetches (e.g. Apple Mail's Mail Privacy Protection), so opens overcount.
  Never present an open rate as accurate; label it directional.
- **Tracking since 2026-08-18 — no backfill.** Sends before the tracking epoch
  report `tracking_enabled: false` and null/zero fields. Present those as
  "sent before tracking was enabled", NEVER as "0 opens / 0 clicks" — a
  pre-tracking outreach with no signal is unmeasured, not unengaged.

## Entitlement + graceful degradation (NON-NEGOTIABLE)

`request_creator_connection` is entitlement-gated behind **`creator_connections`**
(pro + pilot plans); `request_brand_connection` behind **`brand_connections`**
(pro). A plan without the relevant entitlement gets a **SUCCESSFUL refused
envelope, not an error.** Every connection-enabled skill MUST:

- Detect the refused envelope and **still deliver its read-only half** — the
  shortlist, the rate band, the pipeline view it could produce without reaching —
  plus a one-line "Connections aren't on your plan; here's the analysis and how
  to upgrade." A connection-enabled skill never dead-ends or errors on a
  non-entitled plan; it degrades to the underlying advice skill's output.

## The mandatory pre-flight (before any `request_creator_connection` call)

1. **Credit estimate + confirm.** Reaching N creators = **10×N credits**. State
   it and get an explicit yes before firing: _"Reaching these 8 creators costs
   ~80 credits (~$2.00). Proceed?"_ Never fire a batch without confirmation.
   (Reuse `credit-budget-guardian` framing where the user wants a ledger.)
2. **Suppression / active-sequence pre-screen.** Before reaching a list, call
   `list_connections` and drop (a) anyone already in an ACTIVE sequence for this
   brand (would be refused + is harassment risk) and (b) anyone the brand has
   already reached who opted out. Report who was skipped and why. This protects
   the creator and the brand's sender reputation.
3. **Opportunity completeness.** `campaign_type` is required; fill `budget_band`
   from a corpus rate band where possible so the pitch is market-credible, not a
   lowball. Keep `personal_message` brand-authored — never invent quotes.

## Privacy invariants (carry over from convention 7, reinforced here)

- The creator's contact is revealed to the brand ONLY after the creator says
  yes, via the matchmaker's double-opt-in intro — never by these tools, never in
  any deliverable a skill produces.
- `list_connections` / `get_connection_status` return no contact info; neither
  may a skill infer or display one. A connection's existence + status is brand-safe;
  a creator's address is not.
- Convention 7's "no contact info in any deliverable" still holds in full for
  every outreach skill. The outreach affordance is "Creatorland will reach them
  for you" — not "here's their email." (A user who explicitly wants creators'
  business emails to contact them directly is a different job: route to
  `creator-email-lookup` / `get_creator_email`, never to these tools.)

## Honesty rules specific to outreach

- Never promise a reply or a yes. The tool runs a sequence; outcomes are the
  creator's. Frame as "we'll reach them and run a 3-touch sequence that stops on
  reply," not "this will get you a booking."
- A clean suppression pre-screen is "none of these are already in an active
  sequence or opted out **in our records**" — never an absolute guarantee.
- Always show the credit cost of reaching before reaching; always show the actual
  tally after.
- Creator→brand pitches are **oracle-safe**: enqueuing never reveals whether the
  named brand is reachable — the acknowledgement is identical either way. Never
  imply a contact was found or that a brand is/ isn't on the platform.
- A creator→brand pitch is **free to enqueue**; the 10-credit charge lands only
  when an approved pitch actually sends. Say that before enqueue; report the
  actual tally after.
