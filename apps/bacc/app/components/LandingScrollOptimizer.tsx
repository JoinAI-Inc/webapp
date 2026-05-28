"use client";

import { useEffect } from "react";

type IdleDeadlineLike = {
  timeRemaining: () => number;
};

const DECODE_ROOT_MARGIN = "900px 0px";
const SECTION_ROOT_MARGIN = "640px 0px";
const FALLBACK_IDLE_TIMEOUT = 180;
const MAX_DECODE_PER_IDLE = 2;

function requestIdleWork(callback: (deadline: IdleDeadlineLike) => void) {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, {
      timeout: FALLBACK_IDLE_TIMEOUT,
    });
  }

  return globalThis.setTimeout(
    () => callback({ timeRemaining: () => 0 }),
    FALLBACK_IDLE_TIMEOUT,
  );
}

function cancelIdleWork(id: number | ReturnType<typeof setTimeout>) {
  if ("cancelIdleCallback" in window) {
    window.cancelIdleCallback(Number(id));
    return;
  }

  globalThis.clearTimeout(id);
}

const REVEAL_THRESHOLD = 0.12;
const REVEAL_ROOT_MARGIN = "0px 0px -10% 0px";

export function LandingScrollOptimizer() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-landing-section]"),
    );
    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>(
        "img[data-landing-predecode='true']",
      ),
    );
    const pendingImages = new Set<HTMLImageElement>();
    let idleId: number | ReturnType<typeof setTimeout> | undefined;

    const decodeNext = (deadline: IdleDeadlineLike) => {
      idleId = undefined;

      const imagesToDecode = Array.from(pendingImages);
      let decodedCount = 0;

      for (const image of imagesToDecode) {
        pendingImages.delete(image);

        if (!image.isConnected || !image.currentSrc || image.complete) {
          continue;
        }

        image.decode?.().catch(() => undefined);
        decodedCount += 1;

        if (
          decodedCount >= MAX_DECODE_PER_IDLE ||
          deadline.timeRemaining() < 8
        ) {
          break;
        }
      }

      if (pendingImages.size > 0) {
        scheduleDecode();
      }
    };

    function scheduleDecode() {
      if (idleId) {
        return;
      }

      idleId = requestIdleWork(decodeNext);
    }

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute(
            "data-landing-away",
            !entry.isIntersecting,
          );
        }
      },
      { rootMargin: SECTION_ROOT_MARGIN },
    );

    const imageObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const image = entry.target as HTMLImageElement;
          pendingImages.add(image);
          scheduleDecode();
          imageObserver.unobserve(image);
        }
      },
      { rootMargin: DECODE_ROOT_MARGIN },
    );

    // ─── Scroll Reveal ──────────────────────────────────────────────
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"),
    );

    if (prefersReducedMotion) {
      for (const el of revealElements) {
        el.classList.add("is-revealed");
      }
    } else {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-revealed");
            revealObserver.unobserve(entry.target);
          }
        },
        {
          root: null,
          threshold: REVEAL_THRESHOLD,
          rootMargin: REVEAL_ROOT_MARGIN,
        },
      );

      for (const el of revealElements) {
        revealObserver.observe(el);
      }

      sections.forEach((section) => sectionObserver.observe(section));
      images.forEach((image) => imageObserver.observe(image));

      return () => {
        if (idleId) {
          cancelIdleWork(idleId);
        }
        sectionObserver.disconnect();
        imageObserver.disconnect();
        revealObserver.disconnect();
        pendingImages.clear();
      };
    }
    // ────────────────────────────────────────────────────────────────

    sections.forEach((section) => sectionObserver.observe(section));
    images.forEach((image) => imageObserver.observe(image));

    return () => {
      if (idleId) {
        cancelIdleWork(idleId);
      }

      sectionObserver.disconnect();
      imageObserver.disconnect();
      pendingImages.clear();
    };
  }, []);

  return null;
}
