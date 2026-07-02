# Connection Flow (shared module — for connection-enabled skills ONLY)

This module governs the **brand→creator outreach** tools. It is referenced
**only by the Wave 2 connection-enabled skills** (cast-and-connect,
connection-pipeline-tracker, reply-triage, conflict-safe-connect,
outreach-spend-forecaster, and their followers). The read-only catalog
(brief-to-shortlist, conflict-check, fair-price-brief, …) does **NOT** reference
this file and must never call these tools — outreach is an additive layer, not a
change to the advice catalog.

## The three connection tools (ground truth — match exactly)

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

### `get_connection_status` — free (0 credits)
`{ "conn_ref": "<ref>" }` → lifecycle status, touches sent (of 3), latest reply
classification if any, next scheduled touch. Scoped to your account. No contact details.

### `list_connections` — free (0 credits)
`{ "status"?: "queued|sending|delivered|replied_interested|replied_declined|replied_question|accepted_inapp|opted_out|expired", "limit"?: 1–100 }`
→ this brand's outreaches newest-first: each carries `conn_ref`, status, campaign
type, next scheduled touch. Scoped to your account. No contact details ever returned.

## Entitlement + graceful degradation (NON-NEGOTIABLE)

`request_creator_connection` is entitlement-gated behind **`creator_connections`**
(pro + pilot plans). A plan without it gets a **SUCCESSFUL refused envelope, not
an error.** Every connection-enabled skill MUST:

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
- Convention 7's "no contact info in any deliverable" still holds in full. The
  outreach affordance is "Creatorland will reach them for you" — not "here's their
  email."

## Honesty rules specific to outreach

- Never promise a reply or a yes. The tool runs a sequence; outcomes are the
  creator's. Frame as "we'll reach them and run a 3-touch sequence that stops on
  reply," not "this will get you a booking."
- A clean suppression pre-screen is "none of these are already in an active
  sequence or opted out **in our records**" — never an absolute guarantee.
- Always show the credit cost of reaching before reaching; always show the actual
  tally after.
