# Synthetic A/B Lab

This folder is self-contained. It includes the dashboard UI, synthetic-user
runner UI, local server, copied runner script, browser observation layer,
normalizer, sample JSON, and stored run artifacts.

## Run Locally

From the repository root:

```bash
python3 "AB experiment/server.py" --port 8765
```

Open either page:

```text
http://127.0.0.1:8765/AB%20experiment/
http://127.0.0.1:8765/AB%20experiment/synthetic_user/
```

Both pages load `AB experiment/data/latest_ab_run.json` by default, so reviewers
can inspect the committed sample immediately. A completed run can also be opened
directly with `?run=<job_id>`.

## Committed Sample

The committed sample uses the same Airbnb URL for A and B while real A/B URLs
are still being prepared:

```text
https://www.airbnb.com
```

The fixture is a 10-profile, 5-run browser-observed LM trace sample. It is stored
in:

```text
AB experiment/data/latest_ab_run.json
AB experiment/data/runs/sample-airbnb-ab.json
```

## Run Fresh A/B URLs

Use the Synthetic User Runner page and enter:

```text
A URL: https://www.airbnb.com
B URL: https://www.airbnb.com
Profiles: 20
Runs: 5
Model: auto
Timeout: 240s
```

Start Run does one staged local job:

1. Observe A and B URLs in parallel with Playwright Chromium.
2. Generate one shared synthetic profile cohort with the copied runner script
   logic, falling back to deterministic profiles if Codex CLI is unavailable.
3. Generate A and B behavior traces in parallel through batch LM calls.
4. Normalize stdout-compatible JSON into the shared UI schema.
5. Write latest and per-run artifacts.

The server writes:

```text
AB experiment/data/runs/<job_id>_A.out
AB experiment/data/runs/<job_id>_B.out
AB experiment/data/runs/<job_id>.json
AB experiment/data/latest_ab_run.json
```

## CLI Reproduction

You can run the copied script directly for each variant:

```bash
python3 "AB experiment/scripts/airbnb_synth_demo.py" \
  --url https://www.airbnb.com \
  --variant A \
  --profiles 20 \
  --runs 5 \
  --profile-mode lm \
  --trace-mode lm \
  --summary-mode rule \
  --codex-timeout 240

python3 "AB experiment/scripts/airbnb_synth_demo.py" \
  --url https://www.airbnb.com \
  --variant B \
  --profiles 20 \
  --runs 5 \
  --profile-mode lm \
  --trace-mode lm \
  --summary-mode rule \
  --codex-timeout 240
```

Normalize cached stdout into the UI schema:

```bash
python3 "AB experiment/scripts/normalize_ab_run.py" \
  --a-output /tmp/airbnb_ab_A.out \
  --b-output /tmp/airbnb_ab_B.out \
  --a-url https://www.airbnb.com \
  --b-url https://www.airbnb.com \
  --profiles 20 \
  --runs 5 \
  --run-id sample-airbnb-ab \
  --out "AB experiment/data/latest_ab_run.json"
```

## Browser Observation

Before generating traces, the runner calls:

```bash
node "AB experiment/scripts/observe_page.mjs" --url <URL>
```

It extracts page title, visible text, headings, buttons, links, inputs, forms,
CTA candidates, pricing text, trust signals, and clickable elements. Those
observations are passed into the LM trace prompt so steps are grounded in the
actual A/B page instead of persona templates.

If Playwright Chromium is missing or a URL cannot be reached, the runner falls
back to an HTML snapshot and then to the built-in Airbnb page model. Install the
browser when needed:

```bash
npx playwright install chromium
```

## Validation

```bash
python3 -m py_compile "AB experiment/server.py"
python3 -m py_compile "AB experiment/scripts/airbnb_synth_demo.py"
python3 -m py_compile "AB experiment/scripts/normalize_ab_run.py"
node --check "AB experiment/scripts/observe_page.mjs"
node --check "AB experiment/app.js"
node --check "AB experiment/synthetic_user/app.js"
python3 -m json.tool "AB experiment/data/latest_ab_run.json" >/dev/null
python3 -m json.tool "AB experiment/data/runs/sample-airbnb-ab.json" >/dev/null
```

Real-user logs are not required yet. The JSON keeps placeholder metadata so
future fields such as `variant`, `event`, `converted`, `task_seconds`,
`dropoff`, and `satisfaction` can replace generated real-user rows later.
