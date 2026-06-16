# Skill-trigger eval (CRE-584)

Measures whether the right skill fires per user message across the catalog.
`trigger-eval-set.json` is the labeled set; `run_trigger_eval.py` runs it via
`claude -p` (auth required) and scores hit / miss / specificity / mis-fire.
See REPORT.md for the baseline run + findings. Regenerate the catalog with the
extractor in REPORT.md before a run so it matches the live skills.
