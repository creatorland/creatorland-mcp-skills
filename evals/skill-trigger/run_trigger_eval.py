#!/usr/bin/env python3
"""CRE-584 — skill-trigger router eval for the creatorland-data catalog.

For each labeled user message, present the full skill catalog (name + description)
to the model and ask which ONE skill should fire (or 'none'). Compare to the
expected label and report trigger accuracy + misses + mis-fires.

Run where `claude -p` is authenticated (CI or a logged-in dev box):
    python run_trigger_eval.py --catalog catalog.json --eval trigger-eval-set.json \
        --model <model-id> --reps 3 --out results.json

Metrics:
  - hit_rate        : positive cases where the expected skill was the top pick
  - miss_rate       : positive cases where NO skill (or wrong) fired (under-trigger)
  - specificity     : 'none' cases correctly predicted 'none'
  - misfire_rate    : 'none' cases that wrongly triggered some skill (over-trigger)
  - confusions      : list of (message, expected, predicted) for every wrong call
"""
import argparse, json, os, re, subprocess, sys, collections
from pathlib import Path

ROUTER_TEMPLATE = """You are the skill router for an agent. Below is the catalog of available skills,\
 each with a name and a description that says when it should fire.

A user sends a message. Decide which SINGLE skill should activate, or "none" if no skill\
 in the catalog is the right fit (the agent would just answer directly).

Reply with ONLY the skill name (exactly as listed) or the word none. No explanation.

== SKILL CATALOG ==
{catalog}

== USER MESSAGE ==
{message}

Which one skill should fire? Answer with the skill name or "none":"""

def call_claude(prompt, model, timeout=120):
    cmd = ["claude", "-p", "--output-format", "text"]
    if model: cmd += ["--model", model]
    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    r = subprocess.run(cmd, input=prompt, capture_output=True, text=True, env=env, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError(f"claude -p exited {r.returncode}: {r.stderr[:200]}")
    return r.stdout.strip()

def normalize(pred, names):
    p = pred.strip().lower().strip('."`\' ')
    if p in ("none", "no skill", "n/a"): return "none"
    for n in names:
        if n.lower() == p: return n
    for n in names:                       # loose contains match
        if n.lower() in p: return n
    return "none"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", required=True)
    ap.add_argument("--eval", required=True)
    ap.add_argument("--model", default=None)
    ap.add_argument("--reps", type=int, default=3)
    ap.add_argument("--out", default="results.json")
    a = ap.parse_args()

    catalog = json.load(open(a.catalog))
    names = [s["name"] for s in catalog]
    catalog_str = "\n".join(f"- {s['name']}: {s['description']}" for s in catalog)
    cases = json.load(open(a.eval))["cases"]

    rows = []
    for c in cases:
        prompt = ROUTER_TEMPLATE.format(catalog=catalog_str, message=c["message"])
        votes = []
        for _ in range(a.reps):
            try:
                votes.append(normalize(call_claude(prompt, a.model), names))
            except Exception as e:
                votes.append(f"ERROR:{e}")
        pred = collections.Counter(votes).most_common(1)[0][0]  # majority vote
        rows.append({**c, "votes": votes, "predicted": pred, "correct": pred == c["expected"]})
        print(f"{c['id']:>4}  exp={c['expected']:<28} pred={pred:<28} {'OK' if pred==c['expected'] else 'X'}")

    pos = [r for r in rows if r["expected"] != "none"]
    neg = [r for r in rows if r["expected"] == "none"]
    summary = {
        "n": len(rows),
        "overall_accuracy": round(sum(r["correct"] for r in rows)/len(rows), 3),
        "hit_rate": round(sum(r["correct"] for r in pos)/len(pos), 3) if pos else None,
        "miss_rate": round(sum(not r["correct"] for r in pos)/len(pos), 3) if pos else None,
        "specificity": round(sum(r["correct"] for r in neg)/len(neg), 3) if neg else None,
        "misfire_rate": round(sum(not r["correct"] for r in neg)/len(neg), 3) if neg else None,
        "confusions": [{"message": r["message"], "expected": r["expected"], "predicted": r["predicted"]}
                       for r in rows if not r["correct"]],
    }
    json.dump({"summary": summary, "rows": rows}, open(a.out, "w"), indent=2)
    print("\nSUMMARY:", json.dumps(summary, indent=2))

if __name__ == "__main__":
    main()
