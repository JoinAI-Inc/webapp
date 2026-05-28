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

    // 缓存初始 CSS bottom 值（is-docked 时 bottom 变成 auto，不能动态读）
    let cachedBottom = parseFloat(getComputedStyle(el).bottom) || 48;

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
    // 保留 is-fixed 不移除，避免类切换瞬间闪烁
    // is-docked 在 CSS 中后声明，其 position: absolute 会覆盖
    function showDocked(topValue: number) {
      if (!el) return;
      const wasHidden = stateRef.current === "hidden";

      clearExitTimer();
      el.classList.remove("is-exiting");
      el.classList.add("is-fixed", "is-docked");
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

        // 用 parentElement 而非 offsetParent：
        // position: fixed 时 offsetParent 返回 null，导致 parentDocTop=0 坐标偏移
        const parent = el.parentElement;
        const parentDocTop = parent
          ? parent.getBoundingClientRect().top + window.scrollY
          : 0;

        const viewportHeight = window.innerHeight;
        const isMobile = window.innerWidth < 735;
        const dockLift = isMobile ? 16 : 40;
        const buttonHeight = el.offsetHeight || 48;

        const fixedTop = viewportHeight - cachedBottom - buttonHeight;

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

    // resize 时刷新缓存的 bottom（响应式断点可能改变）
    const handleResize = () => {
      // 临时切回 fixed 状态读取正确的 bottom
      const wasDocked = el.classList.contains("is-docked");
      if (wasDocked) {
        el.classList.remove("is-docked");
        el.classList.add("is-fixed");
      }
      cachedBottom = parseFloat(getComputedStyle(el).bottom) || 48;
      if (wasDocked) {
        el.classList.remove("is-fixed");
        el.classList.add("is-docked");
      }
      sync();
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", handleResize);
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
