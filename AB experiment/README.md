# Synthetic A/B Lab

This folder is self-contained. It includes the synthetic-user runner script,
a local server, data normalization, the matrix dashboard, and the A/B synthetic
user runner page.

## Run Locally

From the repository root:

```bash
python3 "AB experiment/server.py" --port 8765
```

Open the empty starting screens:

```text
http://127.0.0.1:8765/AB%20experiment/
http://127.0.0.1:8765/AB%20experiment/synthetic_user/
```

Open the committed sample replay:

```text
http://127.0.0.1:8765/AB%20experiment/?run=sample-airbnb-ab
http://127.0.0.1:8765/AB%20experiment/synthetic_user/?run=sample-airbnb-ab
```

## Reproduce the Sample Data

The committed sample uses the local A/B pages from the app:

```text
http://127.0.0.1:3000/versionA
http://127.0.0.1:3000/versionB
```

The committed sample is a 20-profile, 5-run fixture so reviewers can open the
UI immediately.

If you already have cached stdout from the runner, normalize it into the UI
schema:

```bash
python3 "AB experiment/scripts/normalize_ab_run.py" \
  --a-output /tmp/airbnb_synth_demo_full.out \
  --b-output /tmp/airbnb_synth_demo_full.out \
  --a-url http://127.0.0.1:3000/versionA \
  --b-url http://127.0.0.1:3000/versionB \
  --profiles 20 \
  --runs 5 \
  --run-id sample-airbnb-ab \
  --out "AB experiment/data/latest_ab_run.json"
```

## Run Fresh A/B URLs

The CLI runner is deterministic by default:

```bash
python3 "AB experiment/scripts/airbnb_synth_demo.py" --url <A URL> --variant A --profile-mode rule --trace-mode rule --summary-mode rule --profiles 20 --runs 5
python3 "AB experiment/scripts/airbnb_synth_demo.py" --url <B URL> --variant B --profile-mode rule --trace-mode rule --summary-mode rule --profiles 20 --runs 5
```

`server.py` runs one staged job: observe both URLs, generate one shared cohort
of profiles, run A and B trajectories concurrently against that same cohort,
compute UI interaction metrics, then write an agent-style summary. The UI polls
one shared job id and only renders results after generation starts.

Before generating behavior traces, the runner uses
`AB experiment/scripts/observe_page.mjs` to open each URL with Playwright
Chromium and extract browser-observed page context: visible text, headings,
buttons, links, inputs, forms, CTAs, pricing text, trust signals, and clickable
elements. That context is passed into the deterministic profile and
UI-specific trace generators so steps are grounded in the A/B pages.

If Playwright/Chrome is unavailable or the URL cannot be observed, the runner
falls back to an HTML snapshot and then to the built-in Airbnb page model.
`--profile-mode rule`, `--trace-mode rule`, and `--summary-mode rule` are the
defaults for reproducible local demos. Pass an `lm` mode only when you want to
experiment with Codex-generated profiles, traces, or summaries.

The normalized UI metrics focus on interaction behavior: click rate,
like/save intent rate, dwell time, completion, primary CTA rate, detail opens,
clicks per user, and friction rate.

The server writes run artifacts here:

```text
AB experiment/data/runs/<job_id>_A.out
AB experiment/data/runs/<job_id>_B.out
AB experiment/data/runs/<job_id>.json
AB experiment/data/latest_ab_run.json
```

## Notes

- `Generate` requires the local `server.py`; `python3 -m http.server` can serve
  the static sample but cannot execute the runner.
- Codex CLI is optional for LM profile/trace/summary experiments. The default
  server and CLI paths are local and deterministic.
- Browser observation uses the repo Playwright dependency. Run `npm install`
  from the repository root first if `node_modules` is missing, and run
  `npx playwright install chromium` if Playwright reports a missing browser.
- Real-user data is not required yet. The UI keeps real-user rows as generated
  placeholders and stores that status in JSON metadata.
