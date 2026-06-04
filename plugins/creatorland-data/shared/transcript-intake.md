# Transcript Intake (shared module)

Agencies' real intake artifact is a CALL, not a written brief. This module
turns a pasted/uploaded transcript (client call, internal kickoff, voice-memo
dump) into structured campaign requirements — asking the user targeted
questions ONLY for gaps that matter.

## Extraction schema

Read the whole transcript, then fill:

| Field | What to listen for |
|---|---|
| `brand / client` | who the campaign is for; competitor mentions (→ conflict checks) |
| `objective` | awareness / launch / conversion / UGC volume / event |
| `audience` | demographics, geo markets, language, community |
| `creator_spec` | vibe/aesthetic words, content style, platform(s), follower tier(s), example creators named ("someone like @x" → lookalike seeds) |
| `vertical` | map to corpus verticals (Beauty, Fashion, Health & Fitness, Food & Beverage, Technology, …) |
| `deliverables` | content types + counts (3 reels + 1 dedicated video…) |
| `compensation_type` | job-suite comp tags: gifting+paid, affiliate+paid, pure affiliate, flat fee, … |
| `budget` | total and/or per-creator band; "undisclosed" is a valid value |
| `timeline` | launch dates, flight windows, deadlines |
| `exclusions` | competitor conflicts, content restrictions, geo exclusions |

Tag each extracted value with confidence: **stated** (explicit in transcript),
**inferred** (you derived it), **missing**.

## Gap questions (the interactive part)

Ask the user about gaps in ONE batched message, max 4 questions, ordered by
impact. Only ask when the answer changes the search or the deliverable:
platform + follower tier + markets + budget posture are the high-impact four.
Never ask about something the transcript already answered — quote it back
instead ("I heard mid-tier TikTok, US + UK — locking that in").

## Output

A normalized requirements block (show it to the user for a quick confirm,
labeled stated/inferred), then hand off to the consuming skill:
- → `brief-builder` renders it as a formal creator brief document
- → `brief-to-shortlist` / `transcript-to-shortlist` compresses it into the
  `search_creators` `brief` text + `filters`, with any named creators as
  lookalike seeds
