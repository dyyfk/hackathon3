# Synthetic A/B Lab

This folder is self-contained. It includes the synthetic-user runner script,
a local server, data normalization, the matrix dashboard, and the A/B synthetic
user runner page.

## Run Locally

From the repository root:

```bash
python3 "AB experiment/server.py" --port 8765
```

Open:

```text
http://127.0.0.1:8765/AB%20experiment/
http://127.0.0.1:8765/AB%20experiment/synthetic_user/
```

## Reproduce the Sample Data

The committed sample uses the same Airbnb URL for A and B:

```text
https://www.airbnb.com
```

If you already have cached stdout from the runner, normalize it into the UI
schema:

```bash
python3 "AB experiment/scripts/normalize_ab_run.py" \
  --a-output /tmp/airbnb_synth_demo_full.out \
  --b-output /tmp/airbnb_synth_demo_full.out \
  --a-url https://www.airbnb.com \
  --b-url https://www.airbnb.com \
  --profiles 20 \
  --runs 5 \
  --out "AB experiment/data/latest_ab_run.json"
```

## Run Fresh A/B URLs

The second page calls the bundled script twice with the same parameters:

```bash
python3 "AB experiment/scripts/airbnb_synth_demo.py" --url <A URL> --variant A --trace-mode rule --profiles 20 --runs 5
python3 "AB experiment/scripts/airbnb_synth_demo.py" --url <B URL> --variant B --trace-mode rule --profiles 20 --runs 5
```

`server.py` runs the A and B variant processes concurrently inside one job, so
both URLs are observed and summarized in parallel while the UI polls one shared
job id.

Before generating behavior traces, the runner uses
`AB experiment/scripts/observe_page.mjs` to open each URL with Playwright
Chromium and extract browser-observed page context: visible text, headings,
buttons, links, inputs, forms, CTAs, pricing text, trust signals, and clickable
elements. That context is passed into the profile generator and the UI-specific
trace generator so steps are grounded in the A/B pages.

If Playwright/Chrome is unavailable or the URL cannot be observed, the runner
falls back to an HTML snapshot and then to the built-in Airbnb page model.
`--trace-mode rule` is the server default because it produces stable,
page-specific interaction traces. Pass `--trace-mode lm` if you want the LM to
generate every behavior step from the observed page context.

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

- `Start Run` requires the local `server.py`; `python3 -m http.server` can serve
  the static sample but cannot execute the runner.
- The runner uses the Codex CLI. Make sure `codex` is available on `PATH`.
- Browser observation uses the repo Playwright dependency. Run `npm install`
  from the repository root first if `node_modules` is missing, and run
  `npx playwright install chromium` if Playwright reports a missing browser.
- Real-user data is not required yet. The UI keeps real-user rows as generated
  placeholders and stores that status in JSON metadata.
