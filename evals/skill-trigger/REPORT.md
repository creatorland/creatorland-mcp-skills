# CRE-584 — Skill-trigger eval set + miss measurement

**What this is.** A reusable, labeled eval that measures whether the *right*
creatorland-data skill fires for a given user message, across the whole 45-skill
catalog. It's the gate the ticket calls for: run the catalog against it, see the
under-triggers (a skill should fire and doesn't) and the mis-fires (the wrong
skill fires, or one fires on a message that should get a plain answer).

## Deliverables (in this folder)
- `trigger-eval-set.json` — 40 labeled cases (the core IP). Positives across every
  skill cluster, a **confusable** cluster (adjacent skills that compete), and
  **negatives** (hard + near-miss "should fire nothing").
- `catalog.json` — the 45 skill name+description pairs, auto-extracted from the
  plugin repo (the actual trigger surface).
- `run_trigger_eval.py` — the harness. Presents the catalog + a message to the
  model via `claude -p`, majority-votes over N reps, scores against the labels,
  writes `results.json`. Run it anywhere `claude -p` is authenticated (CI or a
  logged-in box).
- `results.json` — the measured run (see methodology note below).

## Methodology note (read this)
`claude -p` is not authenticated inside the Cowork sandbox, so this run was scored
by an **expert router pass over the real catalog descriptions** rather than a live
`claude -p` batch. The harness reproduces the same scoring automatically once auth
is present (e.g. a CI job). Treat the numbers as a directional baseline, not a
sealed benchmark — the value is the dataset + the two concrete findings.

A second caveat that *deflates* the headline number: the v1 positives are somewhat
keyword-aligned with the skill descriptions (they read close to the "use when…"
phrasing). That makes the positive hit-rate an **optimistic ceiling**. The skill-
creator guidance is explicit that good trigger evals need *paraphrased / oblique*
positives to stress under-triggering — that's the top v2 item below.

## Results (baseline)
| Metric | Value | Meaning |
|---|---|---|
| Overall accuracy | 95% (38/40) | right call (incl. correct "none") |
| Hit rate (positives) | 93.8% (30/32) | expected skill fired |
| Miss rate (positives) | 6.2% (2/32) | under-trigger or wrong skill |
| Specificity (negatives) | 100% (8/8) | "none" correctly stayed "none" |
| Mis-fire rate (negatives) | 0% (0/8) | no skill fired on a no-skill message |

Both failures are in the **confusable** cluster — exactly where this eval earns
its keep. Clean positives and (encouragingly) clean negatives, including the
near-misses ("going rate for a freelance graphic designer", "review this contract
clause"), which did *not* over-trigger the pricing/diligence skills.

## The two misses (actionable)
1. **c01 — pricing vs discovery collision.**
   *"What's the going rate to hire creators for our campaign? And who are good ones
   in fitness?"* → expected `one-number-rate`, predicted `brief-to-shortlist`.
   A message carrying *both* a rate ask and a "who's good" ask routes to discovery;
   the pricing intent is lost. **Fix options:** (a) accept it — discovery is a
   defensible read of a mixed message; or (b) add a disambiguation line to
   `one-number-rate`'s description ("…fire even when a discovery ask is also present,
   if the user asks what to pay / the going rate"). Low stakes; document the
   intended precedence either way.

2. **c03 — buyer (fair-price) vs seller (rate-justifier) collision.**
   *"Is $5k a fair rate, and can you also build me the case to send the brand
   defending it?"* → expected `rate-justifier`, predicted `fair-price-brief`.
   The "is this fair" opener captures `fair-price-brief`; the seller-side "defend it
   to the brand" intent is the real job. **Fix:** sharpen the *first line* of each
   description to lead with the actor — `fair-price-brief` = "**buyer**-side, you're
   evaluating a quote you received"; `rate-justifier` = "**seller/talent**-side,
   you're defending a quote you're sending". Actor-first descriptions are the single
   highest-leverage disambiguation for this whole pricing cluster (5 skills).

## Recommended v2 (next iteration of the set)
- Add **paraphrased / oblique positives** (3–4 per major skill) that *don't* echo the
  description wording — the real test of under-triggering.
- Expand the **confusable** cluster: the full pricing five (one-number-rate /
  fair-price-brief / rate-card-generator / rate-justifier / budget-allocator) and the
  discovery family (brief-to-shortlist / transcript-to-shortlist / longlist-machine /
  triangulated-casting / lookalike-ladder) pairwise.
- Add **connection/outreach** confusables (cast-and-connect vs conflict-safe-connect
  vs connection-pipeline-tracker vs reply-triage) — four adjacent skills, high
  collision risk.
- Wire `run_trigger_eval.py` into CI as a **non-blocking trend** (same pattern as the
  relevance eval) so description edits are measured over time.

## How to run (when authed)
```
python run_trigger_eval.py --catalog catalog.json --eval trigger-eval-set.json \
    --model <session-model-id> --reps 3 --out results.json
```
