---
name: brief-builder
description: Turn a call transcript into a formal creator brief DOCUMENT (not a shortlist) — objectives, target audience, creator spec, deliverables, compensation, timeline, exclusions — ready for internal sign-off and to feed casting later. Use when the user says "write the brief from this call", "turn this transcript into a brief", "draft the creator brief", or wants the brief artifact itself. Zero tool calls by default (0 credits); optional market-norms enrichment for the budget section.
---

# Brief Builder

Takes a call transcript (client call, internal kickoff, voice-memo dump) and
produces the artifact agencies circulate for sign-off: a **formal creator
brief document** — polished markdown a casting lead can send to the client or
the internal team as-is. The output is deliberately shaped to feed
`brief-to-shortlist` afterward, but the brief itself is the deliverable here.

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the seven conventions). This skill honors thrifty/thorough credit
modes and Refusal Recovery (relevant only to the optional enrichment call).

> Trigger discrimination: the user wants a brief **document** out of a
> transcript. If they want **creators found** from a transcript, use
> `transcript-to-shortlist`. If they already have a written brief and want a
> shortlist, use `brief-to-shortlist`.

## Inputs to collect

- **The transcript** (required).
- **Whether to enrich the budget section with market norms** — only offer
  this if a vertical is identifiable and the user is on pro; phrase it with
  its cost: "I can ground the budget section in market norms for <vertical>
  with one market-intelligence call (5 credits) — want that, or keep this run
  at 0 credits?"
- **Anything the gap questions surface** — one batched round, max 4.

## Flow

**Step 1 — Transcript Intake (0 credits).** Run
${CLAUDE_PLUGIN_ROOT}/shared/transcript-intake.md in full: extract the schema
(brand/client, objective, audience, creator_spec, vertical, deliverables,
compensation_type, budget, timeline, exclusions), tag every value
**stated / inferred / missing**, then ask gap questions in ONE batched
message, max 4, ordered by impact. For a brief document the high-impact gaps
skew toward **deliverables count/format, compensation type, timeline, and
budget posture** (the search-side four matter less here). Never ask what the
call answered — quote it back. Capture named creators ("someone like @x") as
reference talent for the creator-spec section, and competitor mentions for
the exclusions section.

**Step 2 — Confirm the requirements block.** Show the normalized block with
stated/inferred labels; incorporate corrections.

**Step 3 (optional, pro, +5 credits) — Market-norms enrichment.** Only if the
user accepted in inputs. One call:

```json
query_market_intelligence {
  "mode": "market",
  "vertical": "<the brief's vertical>",
  "deal_type": "<the brief's compensation type mapped to a corpus deal type, e.g. \"affiliate\" — omit if unmapped>"
}
```

Wrapped in Refusal Recovery (market floor: 5 brands / 25 deals; thrifty: max
2 ladder rungs). Use the result ONLY to add a disclosed "market context" note
under the compensation section — counts/distributions for the vertical, with
the tool's provenance line and the clearance level if broadened. Never let it
overwrite what the client actually said about budget.

**Step 4 — Render the brief document** (template below). Stated values are
written as client requirements; inferred values are written normally but
flagged in the Open Questions section; missing-and-unanswered values become
explicit placeholders, never invented content.

**Step 5 — Offer the next step.** End with: "Want me to run this brief
through casting? Say 'build the shortlist' and I'll hand it to
brief-to-shortlist as-is." (That run has its own credit footprint — see that
skill.)

## Deliverable

```markdown
# Creator Brief — <brand/client> · <campaign working name>
_Drafted from the <date> call · for internal sign-off · v1_

## 1. Background & Objectives
<what the campaign is for and what success looks like — awareness / launch /
conversion / UGC volume / event, in the client's own framing>

## 2. Target Audience
<demographics, geo markets, language, community — bullet per dimension>

## 3. Creator Spec
- **Platforms:** <…>
- **Follower tier(s):** <…>
- **Vibe / content style:** <the call's own words, quoted where strong>
- **Reference talent:** <creators named on the call, e.g. "in the vein of @x"> 
- **Vertical:** <corpus vertical>

## 4. Content Deliverables
<type × count table, e.g. 3 IG reels + 1 dedicated YouTube video + 4 stories;
usage/whitelisting terms if discussed, else a placeholder>

## 5. Compensation
- **Comp type:** <job-suite tag: gifting+paid | affiliate+paid | pure affiliate | flat fee>
- **Budget:** <total and/or per-creator band, or "to be discussed">
<If enriched:>
> Market context (<vertical><, clearance level if broadened>): <counts /
> distributions as returned>. <provenance line exactly as returned.>
> Corpus-level context for the vertical — not a quote or a rate for any
> specific creator.

## 6. Timeline
<launch dates, flight windows, content deadlines — placeholder rows for
anything undiscussed>

## 7. Exclusions & Conflicts
<competitor conflicts named on the call, content restrictions, geo
exclusions; "none raised on the call" if so>

## 8. Approval Workflow
_Placeholder — to be completed at sign-off:_
- Creator approval: <name/role> · Content approval rounds: <n> · Final
  sign-off: <name/role>

## Open Questions
<every inferred value restated as "we inferred X — confirm?", plus any
missing fields the user chose not to answer>

---
Source: call transcript provided <date>; values marked inferred were derived,
not stated — see Open Questions.
<If enriched:> Market context: Creatorland Data MCP, 1 market-intelligence
call (<clearance level>) · <date>.
Credits used this run: 0 <or "~5 (+5 per refusal-ladder rung): 1 market-intel call">.
```

## Honesty rules

- **Never invent client requirements.** Missing = placeholder; inferred =
  flagged in Open Questions. The sign-off artifact must be auditable against
  the call.
- Market enrichment is **vertical-level corpus context, never a rate for any
  creator** and never a substitute for the client's stated budget; always
  disclosed with provenance and clearance level.
- Budget "to be discussed" is a valid, honest value — don't pressure a number
  into existence.
- No creator contact info exists in this surface; reference talent entries
  are names/handles only (PII discipline, convention 7).

## Credit footprint

zero-tool-call mode (default): **0 credits** · with market enrichment: ~5
credits (1 market-intel call; +5 per refusal-ladder rung, thrifty max 2
rungs). The downstream shortlist run, if requested, is billed under
brief-to-shortlist's footprint.
