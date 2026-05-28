"use client";

import { useEffect, useRef } from "react";
import { TryItFreeButton } from "./TryItFreeButton";

const EXIT_DURATION = 420;

interface FloatingTryItFreeButtonProps {
  label?: string;
  backgroundImageUrl?: string;
  gradient?: { from: string; to: string };
  focusColor?: string;
}

export function FloatingTryItFreeButton({
  label,
  backgroundImageUrl,
  gradient,
  focusColor,
}: FloatingTryItFreeButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<"hidden" | "fixed" | "docked">("hidden");
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let frame = 0;

    function clearExitTimer() {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    }

    // ── 悬浮显示（position: fixed，浏览器原生处理，无抖动）──
    function showFixed() {
      if (!el) return;
      const wasHidden = stateRef.current === "hidden";

      clearExitTimer();
      el.classList.remove("is-exiting", "is-docked");
      el.classList.add("is-fixed");
      el.style.removeProperty("--floating-cta-top");

      if (wasHidden) {
        el.classList.remove("is-visible");
        void el.offsetWidth; // 强制重排让入场动画从头开始
      }

      el.classList.add("is-visible");
      stateRef.current = "fixed";
    }

    // ── 停靠（position: absolute，top 锁定）──
    function showDocked(topValue: number) {
      if (!el) return;
      const wasHidden = stateRef.current === "hidden";

      clearExitTimer();
      el.classList.remove("is-exiting", "is-fixed");
      el.classList.add("is-docked");
      el.style.setProperty("--floating-cta-top", `${topValue}px`);

      if (wasHidden) {
        el.classList.remove("is-visible");
        void el.offsetWidth;
      }

      el.classList.add("is-visible");
      stateRef.current = "docked";
    }

    // ── 隐藏（播放退场动画后清理）──
    function hide() {
      if (!el) return;

      if (!el.classList.contains("is-visible")) {
        clearExitTimer();
        stateRef.current = "hidden";
        el.classList.remove("is-visible", "is-exiting", "is-fixed", "is-docked");
        el.style.removeProperty("--floating-cta-top");
        return;
      }

      if (stateRef.current === "hidden" || el.classList.contains("is-exiting")) {
        return;
      }

      stateRef.current = "hidden";
      el.classList.add("is-exiting");

      exitTimerRef.current = setTimeout(() => {
        exitTimerRef.current = null;
        if (!el || stateRef.current !== "hidden") return;
        el.classList.remove("is-visible", "is-exiting", "is-fixed", "is-docked");
        el.style.removeProperty("--floating-cta-top");
      }, EXIT_DURATION);
    }

    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!el) return;

        const heroCta = document.querySelector<HTMLElement>("[data-hero-cta]");
        const endAnchor = document.querySelector<HTMLElement>("[data-floating-cta-end]");
        if (!heroCta || !endAnchor) return;

        const parent = el.offsetParent as HTMLElement | null;
        const parentDocTop = parent
          ? parent.getBoundingClientRect().top + window.scrollY
          : 0;

        const viewportHeight = window.innerHeight;
        const isMobile = window.innerWidth < 735;
        const isTablet = window.innerWidth >= 735 && window.innerWidth <= 1068;
        const bottomOffset = isMobile ? 24 : isTablet ? 40 : 48;
        const dockLift = isMobile ? 16 : 40;
        const buttonHeight = el.offsetHeight || 48;

        const fixedTop = viewportHeight - bottomOffset - buttonHeight;

        // Hero CTA 底边的文档绝对 Y — 滚过这里就触发
        const heroCtaRect = heroCta.getBoundingClientRect();
        const heroCtaBottomDocY = heroCtaRect.bottom + window.scrollY;
        const startScroll = heroCtaBottomDocY;

        const endDocY = endAnchor.getBoundingClientRect().top + window.scrollY - buttonHeight - dockLift;

        const scrollY = window.scrollY;

        // ── 第一段：隐藏（Hero CTA 还在视口内）──
        if (scrollY < startScroll) {
          hide();
          return;
        }

        // ── 第二段：固定悬浮（position: fixed） ──
        if (scrollY + fixedTop < endDocY) {
          showFixed();
          return;
        }

        // ── 第三段：停靠（position: absolute, top 锁定） ──
        showDocked(endDocY - parentDocTop);
      });
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      clearExitTimer();
    };
  }, []);

  return (
    <div ref={wrapRef} className="floating-cta-root" aria-hidden="true">
      <TryItFreeButton
        label={label}
        backgroundImageUrl={backgroundImageUrl}
        gradient={gradient}
        focusColor={focusColor}
      />
    </div>
  );
}
