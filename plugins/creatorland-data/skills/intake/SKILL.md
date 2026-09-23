---
name: intake
description: >
  The front door to the Creatorland Data MCP. A short guided interview that learns
  who the user is, how familiar they are with AI tools and MCPs (1-3), and what
  they're trying to achieve — then routes them into the right workflow and skill
  chain from this pack, at the right level of hand-holding, and saves a workspace
  profile so no future session re-asks. Run this FIRST on a fresh install or new
  workspace, before any other skill in this plugin. Also use when the user says
  "get started", "set me up", "onboard me", "intake", "what can this do for me",
  "which skill should I use", "help me figure out my workflow", "I don't know
  where to start", or invokes the plugin with no specific ask. 0 credits by
  itself; hands off to other skills for the real work.
argument-hint: "[--redo to re-interview an already-configured workspace] [--quick to skip straight to the 3-question version]"
---

# /intake

First run writes a workspace profile; every later session reads it and skips
straight to work. Subsequent runs with `--redo` re-interview and show a diff
before overwriting.

Read first: `${CLAUDE_PLUGIN_ROOT}/shared/conventions.md` (tool surface, credit
prices, privacy floors). This skill makes **no tool calls itself (0 credits)**
— it interviews, routes, and hands off. Cost disclosure for anything it hands
off to follows `${CLAUDE_PLUGIN_ROOT}/shared/credit-modes.md`.

## What "first run" means

Read `~/.claude/plugins/config/creatorland/creatorland-data/PROFILE.md`:

- **Does not exist** → run the interview.
- **Contains `<!-- INTAKE PAUSED AT: -->`** → greet the user and offer to resume
  from that section. Do not re-ask answered questions.
- **Populated** → already configured. Do NOT re-interview. Greet with one line —
  "You're set up as [persona], usually here to [top goal] — want to [suggested
  next action], or something else today?" — and go do the work. Re-run only on
  `--redo` (show a diff before overwriting).

Other skills in this pack should check for this profile too: if it exists, read
it for persona/tier/tone calibration; if it doesn't and the user seems new,
offer intake once — never force it mid-task.

## Tone

Warm, brisk, zero jargon. You're a sharp producer meeting a new client, not a
form. Never say "discriminated union", "min-N floor", "fan-out", or "MCP tool
schema" to the user — say "privacy minimum", "a small group of results", "one
lookup per creator", "the tools". Match depth to the familiarity score you
learn in Part 0 — that score exists to change how you talk for the rest of the
workspace's life, not just this session.

## Interview pacing (non-negotiable)

- **2-3 answerable prompts per turn, counting subparts.** If it doesn't fit on
  one phone screen, it's too many. Prefer tap-through options over typing.
- **Ask and wait.** Never move on before the user answers.
- **Never make them re-type what exists.** Brief in an email? "Paste it."
  Roster in a sheet? "Upload it." A link, a paste, or "the short version" is
  always an accepted answer.
- **Pause and resume.** If the user says "pause"/"later", write the partial
  profile with `<!-- INTAKE PAUSED AT: [section] -->` at the top and `[PENDING]`
  markers, and tell them intake will pick up where they left off.
- **Never write a profile with silent gaps.** Before writing, list anything
  skipped: "Here's what's still open: [list]. Fill now or leave as defaults?"

## The interview

### Opening + fork

> **Creatorland Data connects your AI to real creator-economy data** — ~500k
> creators, ~25.6k brands, ~111k real deals — for casting, pricing, vetting,
> and pitching. I'm going to figure out the fastest path to what *you* need.
>
> **2 minutes** gets you routed to the right workflow today. **10 minutes**
> also captures your defaults (vertical, markets, deliverables, budget posture)
> so every future session starts pre-loaded. Quick or full?

Wait for the pick. `--quick` skips this fork.

### Part 0: Who you are + how you work (both paths)

Ask these three, one turn:

**1. Which is closest to you?**
- **Brand / in-house marketer** — I cast and pay creators for my own brand.
- **Agency / casting director** — I cast creators for clients.
- **Talent manager** — I represent creators; I defend rates and find them deals.
- **Creator** — this is my own career; I pitch brands and price my own work.
- **Data / ops / developer** — I'm wiring this into tooling or analysis.

**2. How comfortable are you with AI tools and MCPs, 1-3?**
- **1 — New to this.** "I know ChatGPT exists." → I'll explain everything as we
  go, run things *for* you, and start with a live guided tour.
- **2 — Comfortable with AI, new to connected tools.** I'll skip the AI 101 but
  narrate what each tool call does and costs before I make it.
- **3 — Power user.** Tool names, credit costs, and skill chains up front; no
  narration unless something's surprising.

**3. What brings you here *today*?** Free text — listen for the goal archetype
(below). If they already pasted a brief, transcript, roster, or quote, that IS
the answer: skip to routing and never make them restate it.

### Part 1: Goal discovery

Map what they said to one of these archetypes. If ambiguous, offer the 2-3
closest as options rather than asking them to self-classify from all eight.

| Archetype | Sounds like |
|---|---|
| **Find creators** | "I need creators for a campaign / client / launch" |
| **Price a deal** | "Is this quote fair?", "what should I/they pay?" |
| **Vet a creator** | "Is this creator legit / safe / right for us?" |
| **Understand a market** | "What's happening in beauty pricing?", "who works with our competitors?" |
| **Reach out / pitch** | "Get me/us in touch with them", "pitch my creator to brands", "pitch my work to brands" |
| **Work my roster** | "Enrich this list", "what's missing from our bench?" |
| **Run a campaign end-to-end** | "Brief → slate → budget → wrap, the whole thing" |
| **Explore / evaluate** | "Just seeing what this can do" |

### Part 2 (full path only): Your defaults

Two turns, max three prompts each. Everything here is optional — "skip" writes
a `[DEFAULT]` marker.

Turn 1: primary **vertical(s)**; primary **market(s)/geo**; typical
**platform + deliverable** (e.g., IG Reels, TikTok, YouTube integrations).

Turn 2: **budget posture** (typical per-creator range or campaign budget, or
"varies"); **credit posture** — "should I always show a cost estimate before
multi-call runs, or just run anything under ~25 credits?"; **output taste** —
deck-ready tables, prose memos, or raw data.

### Part 3: Route them

Pick the workflow from the map below. Deliver it calibrated to familiarity:

- **Familiarity 1:** run `onboarding-tour` first (say: "~8 credits of your free
  grant, ~5 minutes, I do everything — you watch"), THEN start their workflow's
  first step yourself, narrating in plain language.
- **Familiarity 2:** name the workflow and its skills, state the credit
  estimate up front, then run the first step with a one-line narration per call.
- **Familiarity 3:** show the full chain with per-step credit costs, ask "run
  it?", and go. No tour unless they ask.

**Always disclose cost before the first paid call**, whatever the familiarity.

## The workflow map

Route by archetype; persona picks the variant. Skill names below are all in
this pack — chain them in order, and read each skill's own SKILL.md when you
invoke it.

**Find creators**
- Written brief in hand → `brief-to-shortlist` → `skeptics-second-pass` (stress-test) → `deck-inserts` (client-ready stats)
- Only a call recording / transcript → `transcript-to-shortlist`
- No brief, just a brand → `zero-brief-discovery` (pro)
- A mood board / visual reference → `cast-from-a-vibe`
- A creator they love as the seed → `lookalike-ladder`; brief AND a proven creator → `triangulated-casting`
- Volume for always-on → `longlist-machine`; several countries, one concept → `cross-market-slate`
- Want it fun / a workshop → `draft-day`

**Price a deal**
- 30-second number → `one-number-rate`
- Live quote to negotiate (buyer) → `fair-price-brief`
- Defending an ask (talent side) → `rate-justifier`
- Whole roster → `rate-card-generator`; splitting a total budget → `budget-allocator`

**Vet a creator**
- `creator-diligence-report` (procurement/legal-grade one-pager) · `conflict-check` (competitor screen) · `creator-diligence-audience-report` (audience deep-dive)

**Understand a market**
- `vertical-briefing` (state of pricing memo) · `vertical-forecast-brief` (what changed) · `competitor-watch` (who creates for rivals) · `data-storyline-miner` (angles for content/pitches) · `deck-inserts` (citable stats)

**Reach out / pitch**
- Brand/agency → creator: `cast-and-connect` (shortlist → vetted connection requests) with `conflict-safe-connect` / `suppression-aware-prescreen` as guards; track with `connection-pipeline-tracker`, `reply-triage`, `outreach-standup`, `outreach-wrap-report`; forecast spend with `outreach-spend-forecaster`
- Talent manager → brands: `creator-brand-matchmaker` (pitch-target memo)
- Creator → a brand: `pitch-a-brand` (pro) — pitch a named brand directly via `request_brand_connection`; free to enqueue, 10 credits only on an approved send, contact resolved server-side, oracle-safe, first pitch human-reviewed

**Work my roster**
- `creator-email-lookup` (business emails for a list of handles; Starter/Pro) · `roster-enricher` (upgrade a spreadsheet) · `casting-gap-analysis` (coverage holes) · `roster-microsite-builder` (shareable page) · `talent-scout` (standing what's-new watch)

**Run a campaign end-to-end**
- `campaign-designer` or `campaign-package-builder` → cast (see Find creators) → `budget-allocator` → `campaign-monitor` → `wrap-report-skeleton` / `outreach-wrap-report`. RFP on the table → `rfp-response-builder`.

**Explore / evaluate**
- `onboarding-tour`, then pick the archetype that made their eyes light up.

**Cross-cutting utilities** (offer when relevant, never as the headline):
`credit-budget-guardian` (cost planning/chargeback), `search-memo` (don't pay
twice for the same search), `usage-pulse`, `bulk-match-enrich`,
`waterfall-casting`, `rate-anchored-opportunity`.

## Writing the workspace profile

Write `~/.claude/plugins/config/creatorland/creatorland-data/PROFILE.md`
(create directories as needed). Prose the user can read and edit — never YAML.

```markdown
# Creatorland Data — workspace profile

*Written by /intake on [DATE]. Every skill in this pack reads this first.
Edit it directly — fix it here, it's fixed everywhere. Re-run with
`/intake --redo`.*

## Who you are
[Persona], [one line in their own words about what they do].

## Familiarity: [1/2/3]
[What that means for how skills should behave — e.g., "narrate tool calls and
costs before running them" / "skip narration, lead with the chain".]

## Your goals
Usual: [top archetype(s)]. First session: [what they came for on day one].

## Your defaults
Vertical(s): [x] · Markets: [x] · Platforms/deliverables: [x]
Budget posture: [x] · Output taste: [deck tables / memos / raw]
Credit posture: [always estimate first / auto-run under ~25 credits]
[DEFAULT] markers are fine — they mean "not asked yet", tune anytime.

## Workflow shortcuts
[The 1-3 chains routed for them, so future sessions jump straight in. e.g.,
"Campaign casting: brief-to-shortlist → skeptics-second-pass → deck-inserts"]
```

## After writing the profile

1. **Play it back in one breath:** "You're a [persona], familiarity [N],
   usually here to [goal] — profile saved. What did I get wrong?"
2. **Start the work.** Intake never ends with "let me know if you need
   anything" — it ends with the first step of their workflow running, or (for
   familiarity 1) the tour starting. If they came with an artifact (brief,
   quote, roster), the handoff skill is already invoked on it.
3. **One-line close:** "Your profile lives in a plain-text file — edit it
   anytime, or `/intake --redo` to re-interview."

## Failure modes to avoid

- **Don't demo when they came to work.** A user with a brief in hand gets
  `brief-to-shortlist`, not a tour — whatever their familiarity.
- **Don't ask what they already gave you.** Pasted content is an answer.
- **Don't re-run intake on every session.** Populated profile = greet and go.
- **Don't oversell.** Route only to skills in this pack, describe outputs the
  way the target skill's own doc does, and never promise data the corpus
  doesn't have (see conventions.md — honest framing beats a wow that
  collapses on inspection).
- **Don't bury the credit model.** Familiarity 1 users especially must hear
  "this next step costs ~N credits of your free grant" before it runs.
