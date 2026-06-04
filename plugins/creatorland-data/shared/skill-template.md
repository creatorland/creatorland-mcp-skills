# SKILL.md template (for new catalog skills)

```markdown
---
name: <skill-id>
description: <One sentence of what it does>. Use when the user says "<trigger 1>", "<trigger 2>", or <situation>. <One sentence on the deliverable it produces.>
---

# <Skill name>

<2-3 sentences: the job-to-be-done, who it's for, the artifact it ends in.>

Read first: ${CLAUDE_PLUGIN_ROOT}/shared/conventions.md (tool schemas, credit
prices, the seven conventions). This skill honors thrifty/thorough credit
modes, Refusal Recovery, and the Freshness Gate.

## Inputs to collect
<What to ask the user for, what to default, what to never ask twice.>

## Flow
<Numbered tool orchestration with exact argument shapes, e.g.:>
1. `search_creators` `{ mode: "brief", brief: <text>, filters: {...}, limit: N, precision: "balanced" }`
2. For each finalist: `get_creator_profile` `{ identifier: { type: "social_handle", ... } }`
3. `query_market_intelligence` `{ mode: "rate", vertical: <inferred>, quoted_rate: <if any> }` — wrapped in Refusal Recovery
<State where the Freshness Gate and credit estimate fire.>

## Deliverable
<The exact output template/structure, including the provenance + freshness
footers and the credit tally line.>

## Honesty rules
<Skill-specific framing constraints (e.g. "market band, never 'their rate'").>

## Credit footprint
thorough: ~N credits · thrifty: ~M credits
```

Authoring checklist before a skill ships: triggers don't collide with sibling
skills; every tool call's arguments validate against the schemas in
conventions.md; deliverable ends with provenance/freshness/credit footers;
thrifty path defined; description ≤ ~500 chars and trigger-rich.
