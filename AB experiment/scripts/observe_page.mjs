#!/usr/bin/env node

import { chromium } from "@playwright/test";

const args = parseArgs(process.argv.slice(2));
if (!args.url) {
  console.error("Usage: observe_page.mjs --url <url> [--timeout 15000] [--wait-ms 1200]");
  process.exit(2);
}

const timeout = Number(args.timeout || 15000);
const waitMs = Number(args["wait-ms"] || 1200);

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SyntheticABLab/1.0",
  });
  await page.goto(args.url, { waitUntil: "domcontentloaded", timeout });
  await page.waitForTimeout(waitMs);

  const context = await page.evaluate(() => {
    const MAX_TEXT_LINES = 180;
    const MAX_ITEMS = 40;

    function clean(value) {
      return String(value || "").replace(/\s+/g, " ").trim();
    }

    function unique(values, limit = MAX_ITEMS) {
      const seen = new Set();
      const result = [];
      for (const value of values) {
        const text = clean(value);
        if (!text || seen.has(text)) {
          continue;
        }
        seen.add(text);
        result.push(text.slice(0, 180));
        if (result.length >= limit) {
          break;
        }
      }
      return result;
    }

    function isVisible(node) {
      if (!node || !(node instanceof Element)) {
        return false;
      }
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.width > 0 &&
        rect.height > 0
      );
    }

    function nodeLabel(node) {
      if (!node) {
        return "";
      }
      const aria = node.getAttribute("aria-label");
      const placeholder = node.getAttribute("placeholder");
      const value = node.getAttribute("value");
      const title = node.getAttribute("title");
      return clean(aria || placeholder || value || title || node.innerText || node.textContent || "");
    }

    function collect(selector, mapper, limit = MAX_ITEMS) {
      return unique(
        Array.from(document.querySelectorAll(selector))
          .filter(isVisible)
          .map(mapper)
          .filter(Boolean),
        limit,
      );
    }

    const bodyText = clean(document.body?.innerText || "");
    const visibleLines = unique(bodyText.split(/\n+/), MAX_TEXT_LINES);
    const headings = collect("h1,h2,h3", nodeLabel, 28);
    const buttons = collect(
      "button,[role='button'],input[type='button'],input[type='submit']",
      nodeLabel,
      32,
    );
    const links = collect("a[href]", (node) => nodeLabel(node), 36);
    const inputs = collect("input,textarea,select", (node) => {
      const type = node.getAttribute("type") || node.tagName.toLowerCase();
      return `${nodeLabel(node) || node.getAttribute("name") || type} (${type})`;
    }, 30);
    const forms = collect("form", (node) => nodeLabel(node), 12);
    const clickableElements = collect(
      "button,[role='button'],a[href],input,textarea,select,[tabindex]",
      (node) => {
        const label = nodeLabel(node);
        if (!label) {
          return "";
        }
        const role = node.getAttribute("role") || node.tagName.toLowerCase();
        return `${role}: ${label}`;
      },
      50,
    );

    const priceText = unique(
      visibleLines.filter((line) =>
        /(\$|€|£|¥)\s?\d|\d+\s?(usd|eur|gbp)|price|fee|total|night|nights/i.test(line),
      ),
      32,
    );
    const trustSignals = unique(
      visibleLines.filter((line) =>
        /rating|review|guest favorite|superhost|verified|safe|secure|trust|star/i.test(line),
      ),
      32,
    );
    const ctas = unique(
      [...buttons, ...links].filter((line) =>
        /search|reserve|book|checkout|continue|start|try|sign up|log in|save|wishlist/i.test(line),
      ),
      24,
    );

    return {
      title: clean(document.title),
      meta_description: clean(
        document.querySelector("meta[name='description']")?.getAttribute("content") || "",
      ),
      headings,
      buttons,
      links,
      inputs,
      forms,
      ctas,
      price_text: priceText,
      trust_signals: trustSignals,
      clickable_elements: clickableElements,
      visible_text_excerpt: visibleLines.join("\n").slice(0, 5000),
    };
  });

  const payload = {
    schema_version: "browser_page_context_v1",
    observation_source: "playwright_chromium",
    url: args.url,
    final_url: page.url(),
    observed_at: new Date().toISOString(),
    page_kind: detectPageKind([
      context.title,
      context.meta_description,
      context.headings.join(" "),
      context.visible_text_excerpt,
    ].join(" ")),
    viewport: { width: 1440, height: 1200 },
    ...context,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
} catch (error) {
  console.error(error?.stack || String(error));
  process.exit(1);
} finally {
  if (browser) {
    await browser.close();
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      continue;
    }
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function detectPageKind(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("airbnb archive") || lower.includes("airbed & breakfast")) {
    return "airbnb_archive";
  }
  if (lower.includes("staybnb") || lower.includes("mock checkout") || lower.includes("search stays")) {
    return "staybnb_booking";
  }
  return "airbnb_homepage";
}
