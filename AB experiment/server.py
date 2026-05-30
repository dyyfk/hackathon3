#!/usr/bin/env python3
"""Local server for the Synthetic A/B Lab and runner UI."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Sequence
from urllib.parse import unquote, urlparse

from scripts.normalize_ab_run import normalize_ab_run


BASE_DIR = Path(__file__).resolve().parent
REPO_DIR = BASE_DIR.parent
SCRIPT_PATH = BASE_DIR / "scripts" / "airbnb_synth_demo.py"
DATA_DIR = BASE_DIR / "data"
RUNS_DIR = DATA_DIR / "runs"
LATEST_PATH = DATA_DIR / "latest_ab_run.json"

JOBS: Dict[str, Dict[str, Any]] = {}
JOBS_LOCK = threading.Lock()
EXECUTOR = ThreadPoolExecutor(max_workers=1)


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Serving Synthetic A/B Lab at http://{args.host}:{args.port}/AB%20experiment/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
    finally:
        EXECUTOR.shutdown(wait=False, cancel_futures=True)
        server.server_close()
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the local Synthetic A/B Lab server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    return parser


class Handler(BaseHTTPRequestHandler):
    server_version = "SyntheticABServer/1.0"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/latest-run":
            self.send_json(read_latest())
            return
        if parsed.path.startswith("/api/synthetic-runs/"):
            job_id = parsed.path.rsplit("/", 1)[-1]
            self.send_json(get_job(job_id))
            return
        self.serve_static(parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/synthetic-runs":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            payload = self.read_json()
            job = create_job(payload)
        except Exception as exc:  # noqa: BLE001 - return readable API errors.
            self.send_json({"status": "failed", "error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return
        self.send_json(job, status=HTTPStatus.ACCEPTED)

    def serve_static(self, path: str) -> None:
        decoded = unquote(path)
        if decoded in {"", "/"}:
            self.redirect("/AB%20experiment/")
            return
        if decoded == "/AB experiment":
            self.redirect("/AB%20experiment/")
            return
        if decoded == "/AB experiment/synthetic_user":
            self.redirect("/AB%20experiment/synthetic_user/")
            return
        if not decoded.startswith("/AB experiment/"):
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        relative = decoded.removeprefix("/AB experiment/")
        file_path = BASE_DIR / relative
        if decoded.endswith("/"):
            file_path = file_path / "index.html"
        if not file_path.resolve().is_relative_to(BASE_DIR) or not file_path.exists() or file_path.is_dir():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type(file_path))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        with file_path.open("rb") as handle:
            shutil.copyfileobj(handle, self.wfile)

    def read_json(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def send_json(self, payload: Dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def redirect(self, target: str) -> None:
        self.send_response(HTTPStatus.FOUND)
        self.send_header("Location", target)
        self.end_headers()

    def log_message(self, format: str, *args: Any) -> None:
        print(f"{self.address_string()} - {format % args}")


def create_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    config = normalize_config(payload)
    job_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + "-" + uuid.uuid4().hex[:8]
    job = {
        "job_id": job_id,
        "status": "queued",
        "config": config,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with JOBS_LOCK:
        JOBS[job_id] = job
    EXECUTOR.submit(run_job, job_id, config)
    return job


def get_job(job_id: str) -> Dict[str, Any]:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if job:
            return job
    run_path = RUNS_DIR / f"{job_id}.json"
    if run_path.exists():
        return {"job_id": job_id, "status": "completed", "result": json.loads(run_path.read_text(encoding="utf-8"))}
    return {"job_id": job_id, "status": "missing"}


def run_job(job_id: str, config: Dict[str, Any]) -> None:
    update_job(job_id, status="running", started_at=datetime.now(timezone.utc).isoformat())
    try:
        with ThreadPoolExecutor(max_workers=2) as variant_executor:
            a_future = variant_executor.submit(run_variant, "A", config)
            b_future = variant_executor.submit(run_variant, "B", config)
            a_stdout = a_future.result()
            b_stdout = b_future.result()
        (RUNS_DIR / f"{job_id}_A.out").write_text(a_stdout, encoding="utf-8")
        (RUNS_DIR / f"{job_id}_B.out").write_text(b_stdout, encoding="utf-8")
        result = normalize_ab_run(a_stdout=a_stdout, b_stdout=b_stdout, config=config, run_id=job_id)
        result_path = RUNS_DIR / f"{job_id}.json"
        result_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
        LATEST_PATH.write_text(json.dumps(result, indent=2), encoding="utf-8")
        update_job(
            job_id,
            status="completed",
            completed_at=datetime.now(timezone.utc).isoformat(),
            result=result,
            result_path=str(result_path.relative_to(BASE_DIR)),
        )
    except Exception as exc:  # noqa: BLE001 - keep job failure visible in UI.
        update_job(job_id, status="failed", completed_at=datetime.now(timezone.utc).isoformat(), error=str(exc))


def run_variant(label: str, config: Dict[str, Any]) -> str:
    url = config["a_url"] if label == "A" else config["b_url"]
    cmd = [
        sys.executable,
        str(SCRIPT_PATH),
        "--url",
        url,
        "--variant",
        label,
        "--trace-mode",
        "rule",
        "--profiles",
        str(config["profiles"]),
        "--runs",
        str(config["runs"]),
        "--codex-timeout",
        str(config["codex_timeout"]),
    ]
    if config["model"] != "auto":
        cmd.extend(["--model", config["model"]])
    completed = subprocess.run(
        cmd,
        cwd=str(BASE_DIR),
        text=True,
        capture_output=True,
        timeout=max(120, int(config["codex_timeout"]) * 4),
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(
            "Variant {label} run failed.\nCommand: {cmd}\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}".format(
                label=label,
                cmd=" ".join(cmd),
                stdout=tail(completed.stdout),
                stderr=tail(completed.stderr),
            )
        )
    return completed.stdout


def normalize_config(payload: Dict[str, Any]) -> Dict[str, Any]:
    a_url = str(payload.get("a_url") or "https://www.airbnb.com").strip()
    b_url = str(payload.get("b_url") or "https://www.airbnb.com").strip()
    profiles = clamp_int(payload.get("profiles", 20), 5, 200)
    runs = clamp_int(payload.get("runs", 5), 1, profiles)
    timeout = clamp_int(payload.get("codex_timeout", payload.get("timeout", 240)), 30, 1200)
    model = str(payload.get("model") or "auto").strip() or "auto"
    return {
        "a_url": a_url,
        "b_url": b_url,
        "profiles": profiles,
        "runs": runs,
        "model": model,
        "codex_timeout": timeout,
    }


def read_latest() -> Dict[str, Any]:
    if not LATEST_PATH.exists():
        return {"status": "missing", "error": "No latest run is available yet."}
    return {"status": "completed", "result": json.loads(LATEST_PATH.read_text(encoding="utf-8"))}


def update_job(job_id: str, **updates: Any) -> None:
    with JOBS_LOCK:
        JOBS.setdefault(job_id, {"job_id": job_id}).update(updates)


def clamp_int(value: Any, low: int, high: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = low
    return max(low, min(high, parsed))


def content_type(path: Path) -> str:
    return {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
    }.get(path.suffix.lower(), "application/octet-stream")


def tail(text: str, limit: int = 4000) -> str:
    if len(text) <= limit:
        return text
    return text[-limit:]


if __name__ == "__main__":
    raise SystemExit(main())
