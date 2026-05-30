"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getActorType, logUXEvent } from "@/lib/analytics";
import { logFriction, recordPotentialRageClick } from "@/lib/friction";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const maxScrollDepth = useRef(0);
  const priceTimer = useRef<number | null>(null);

  useEffect(() => {
    const queryString = searchParams.toString();
    maxScrollDepth.current = 0;
    logUXEvent({
      actorType: getActorType(),
      type: "page_view",
      page: `${pathname}${queryString ? `?${queryString}` : ""}`,
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const element = target.closest("[data-testid]");
      if (!(element instanceof HTMLElement)) {
        return;
      }

      const testId = element.dataset.testid;
      if (!testId) {
        return;
      }

      logUXEvent({
        actorType: getActorType(),
        type: "click",
        page: window.location.pathname,
        elementTestId: testId,
        elementText: element.innerText?.trim().slice(0, 120),
        selector: `[data-testid="${testId}"]`,
        x: event.clientX,
        y: event.clientY,
      });
      recordPotentialRageClick(testId, window.location.pathname);
    }

    function handleInput(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
        return;
      }

      const element = target.closest("[data-testid]");
      const testId = element instanceof HTMLElement ? element.dataset.testid : undefined;
      if (!testId) {
        return;
      }

      logUXEvent({
        actorType: getActorType(),
        type: "input",
        page: window.location.pathname,
        elementTestId: testId,
        valueSummary: target.type === "checkbox" ? String(target.checked) : target.value,
      });
    }

    function handleScroll() {
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (documentHeight <= 0) {
        return;
      }

      const depth = Math.round((window.scrollY / documentHeight) * 100);
      const bucket = depth >= 90 ? 100 : depth >= 75 ? 75 : depth >= 50 ? 50 : depth >= 25 ? 25 : 0;

      if (bucket > maxScrollDepth.current) {
        maxScrollDepth.current = bucket;
        logUXEvent({
          actorType: getActorType(),
          type: "scroll",
          page: window.location.pathname,
          valueSummary: `${bucket}%`,
          metadata: { depth: bucket },
        });

        const task = new URLSearchParams(window.location.search).get("task");
        if (
          bucket >= 75 &&
          window.location.pathname.startsWith("/listing") &&
          (task === "find_policy" || task === "compare_cancellation")
        ) {
          logFriction("policy_search_friction", window.location.pathname, {
            scrollDepth: bucket,
          });
        }
      }
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("input", handleInput, true);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("input", handleInput, true);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (priceTimer.current) {
      window.clearTimeout(priceTimer.current);
      priceTimer.current = null;
    }

    if (pathname.startsWith("/checkout")) {
      priceTimer.current = window.setTimeout(() => {
        logFriction("checkout_price_surprise", pathname, {
          dwellMs: 8_000,
        });
      }, 8_000);
    }

    return () => {
      if (priceTimer.current) {
        window.clearTimeout(priceTimer.current);
      }
    };
  }, [pathname]);

  return <>{children}</>;
}
