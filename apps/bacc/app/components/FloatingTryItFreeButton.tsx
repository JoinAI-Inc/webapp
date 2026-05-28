"use client";

import { useEffect, useRef } from "react";
import { TryItFreeButton } from "./TryItFreeButton";

const EXIT_DURATION = 420;

export function FloatingTryItFreeButton() {
  const wrapRef = useRef<HTMLDivElement>(null);
  // 用 ref 追踪状态，避免 re-render 影响动画
  const stateRef = useRef<"hidden" | "docked">("hidden");
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let frame = 0;

    function showFloatingCta(topValue: number) {
      if (!el) return;
      const wasHidden = stateRef.current !== "docked";

      // 取消退出计时
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }

      el.classList.remove("is-exiting");
      // 切换到停靠定位
      el.style.setProperty("--floating-cta-top", `${topValue}px`);
      el.classList.add("is-docked");

      if (wasHidden) {
        // 强制重排，确保入场动画从初始状态开始
        el.classList.remove("is-visible");
        void el.offsetWidth;
      }

      el.classList.add("is-visible");
      stateRef.current = "docked";
    }

    function hideFloatingCta() {
      if (!el) return;

      // 已经不可见，直接清理
      if (!el.classList.contains("is-visible")) {
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
        stateRef.current = "hidden";
        el.classList.remove("is-visible", "is-exiting", "is-docked");
        el.style.removeProperty("--floating-cta-top");
        return;
      }

      // 已在退出中，不重复触发
      if (stateRef.current === "hidden" || el.classList.contains("is-exiting")) {
        return;
      }

      stateRef.current = "hidden";
      el.classList.add("is-visible", "is-exiting");

      exitTimerRef.current = setTimeout(() => {
        exitTimerRef.current = null;
        if (!el) return;
        if (stateRef.current !== "hidden") return;
        el.classList.remove("is-visible", "is-exiting", "is-docked");
        el.style.removeProperty("--floating-cta-top");
      }, EXIT_DURATION);
    }

    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!el) return;

        const startSection = document.querySelector<HTMLElement>("[data-floating-cta-start]");
        const endAnchor = document.querySelector<HTMLElement>("[data-floating-cta-end]");

        if (!startSection || !endAnchor) return;

        const viewportHeight = window.innerHeight;
        const isMobile = window.innerWidth < 735;
        const isTablet = window.innerWidth >= 735 && window.innerWidth <= 1068;
        const bottomOffset = isMobile ? 40 : isTablet ? 60 : 80;
        const dockLift = isMobile ? 16 : 40;
        const buttonHeight = el.offsetHeight || 48;

        // 按钮固定在视口底部时的 top 值（距页面顶部）
        const fixedTop = viewportHeight - bottomOffset - buttonHeight;

        // 开始显示：gallery section 顶部滚入固定位置时
        const startTop = startSection.getBoundingClientRect().top + window.scrollY;
        const startScroll = Math.max(0, startTop - fixedTop);

        // 停靠位置：endAnchor 顶部往上 buttonHeight + dockLift
        const endTop = endAnchor.getBoundingClientRect().top + window.scrollY - buttonHeight - dockLift;

        const scrollY = window.scrollY;

        if (scrollY < startScroll) {
          hideFloatingCta();
          return;
        }

        // top = min(当前滚动位置对应的fixed位置, 停靠位置)
        showFloatingCta(Math.min(scrollY + fixedTop, endTop));
      });
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  return (
    <div ref={wrapRef} className="floating-cta-root" aria-hidden="true">
      <TryItFreeButton />
    </div>
  );
}
