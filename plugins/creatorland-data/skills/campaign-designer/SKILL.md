---
name: campaign-designer
description: Design an outreach campaign as a guided interview — collect the structured brief (archetype, on-behalf-of identity, offer, ask, exclusions, proof domains), preview the exact email the matchmaker will send, and only then launch. Use when the user says "set up an outreach campaign", "design my campaign", "I want to reach creators about [offer/perk/event/collab]", "preview the outreach email", or arrives with a promo/gifting/event/collab idea that is not yet a runnable brief. Ends with an approved preview handed to request_creator_connection (or cast-and-connect for discovery + reach).
---

# Campaign Designer

The setup skill for Creatorland outreach. It turns a rough intent ("we want to
gift creators early access", "invite podcasters to our LA event") into a
complete, validated campaign brief through a short interview, shows the sender
a preview of the exact touch-1 email the matchmaker will send, and launches
only after explicit approval. For anyone running their first campaign, or any
campaign on a new archetype.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md and
${CLAUDE_PLUGIN_ROOT}/shared/connection-flow.md (THE connection contract — the
structured brief schema, archetypes, the first-campaign review gate, and the
privacy invariants). This skill honors Refusal Recovery
(${CLAUDE_PLUGIN_ROOT}/shared/refusal-recovery.md).

## What the matchmaker is (say this up front, once)

Creatorland's matchmaker is a **neutral middleman**. It reaches out to creators
ON BEHALF OF the sender, never as them, in Creatorland's own voice. The agent
(not the sender) writes the subject line and body from the brief, under fixed
rules. The sender controls the FACTS (who, what, the ask); Creatorland controls
the words. Do not offer to let the user write the subject line or email copy;
if they paste copy, capture it as source material in `brief_context`.

## The interview (ask ONLY for what is missing)

Work through these in order, skipping anything the user already gave you:

1. **Archetype** — which shape is this?
   - `casting` — hire creators for a campaign (paid work, deliverables)
   - `product_gift` — gift a product/access for feedback or seeding
   - `partner_promo` — a partner perk or voucher for creators
   - `event_invite` — invite creators to an event or program
   - `paid_collab` — affiliate / ambassador / UGC structures beyond casting
2. **On behalf of** — the real person AND organization the outreach represents
   (`brand.name` + `brand.represented_by`). Required for the new archetypes;
   the matchmaker names them honestly in every email.
3. **The offer** (`opportunity.offer`) — `what` (plain words), and any of
   `value`, `expiry`, `redemption` (where/how they claim it).
4. **The ask** (`opportunity.ask`) — what the creator is being asked to DO.
   Required for gifting and promo archetypes.
5. **Exclusions** (`opportunity.exclusions`) — what this campaign is NOT
   (optional, keeps the composer honest).
6. **Proof/voucher domains** (`opportunity.proof_links`) — any URLs the
   campaign will reference. These are registered to THIS campaign; links to
   unregistered domains are rejected at send time, so collect them now.
7. **Targeting** — who they want to reach. If they need discovery, hand off to
   `brief-to-shortlist` or `cast-and-connect` and come back with the picks.

If a required field is missing at launch, the tool itself returns a
question-shaped validation error — relay it verbatim and continue the
interview. Never invent a value to fill a gap.

## The preview (mandatory before any send)

Before calling `request_creator_connection`, render the touch-1 email via the
preview endpoint and show the user the subject and body:

```
POST {MCP_BASE}/outreach/preview
{ "creator_display_name": "<a real example recipient or omit>",
  "opportunity": { ...the brief... },
  "brand": { "name": "...", "represented_by": "..." } }
```

- `source: "composed"` — this is the composed copy the sequence will send.
- `source: "vetted_template"` — the static template floor (composition is off
  or fell back); still exactly what would send in that case.

Nothing is queued, sent, or charged by a preview. Iterate the brief with the
user until they approve. **Never call `request_creator_connection` without the
user's explicit approval of a preview.**

## First-campaign expectations (tell new senders)

A sender's first campaign is held for a quick Creatorland review before
anything sends (status `pending_first_campaign_review`, usually cleared
same-day). Frame it as a feature: nothing goes out under the Creatorland
banner unreviewed. Subsequent campaigns send without the gate.

## Launch

On approval, call `request_creator_connection` once per chosen creator with
the full brief (see connection-flow.md for the schema and the mandatory
pre-flight). Then hand the user to `connection-pipeline-tracker` for status
and `reply-triage` for what comes back.

## Guardrails

- Facts only: never let enthusiasm add offer terms, dollar values, or claims
  the user did not state. The send-time validator rejects invented numbers.
- Reaching costs 10 credits/creator (the whole sequence); say so before launch.
- Outcomes are the creator's. Never promise a yes.
