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
  const stateRef = useRef<"hidden" | "visible">("hidden");
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let frame = 0;

    function show(topValue: number) {
      if (!el) return;
      const wasHidden = stateRef.current !== "visible";

      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }

      el.classList.remove("is-exiting");
      el.classList.add("is-docked");
      el.style.setProperty("--floating-cta-top", `${topValue}px`);

      if (wasHidden) {
        // 强制重排，让入场动画从初始状态开始
        el.classList.remove("is-visible");
        void el.offsetWidth;
      }

      el.classList.add("is-visible");
      stateRef.current = "visible";
    }

    function hide() {
      if (!el) return;

      // 还没显示过，直接清理
      if (!el.classList.contains("is-visible")) {
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
        stateRef.current = "hidden";
        el.classList.remove("is-visible", "is-exiting", "is-docked");
        el.style.removeProperty("--floating-cta-top");
        return;
      }

      // 已在退出中
      if (stateRef.current === "hidden" || el.classList.contains("is-exiting")) {
        return;
      }

      stateRef.current = "hidden";
      el.classList.add("is-exiting");

      exitTimerRef.current = setTimeout(() => {
        exitTimerRef.current = null;
        if (!el || stateRef.current !== "hidden") return;
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

        // 获取父容器（position: relative 的 main）的文档偏移，用于坐标转换
        const parent = el.offsetParent as HTMLElement | null;
        const parentDocTop = parent
          ? parent.getBoundingClientRect().top + window.scrollY
          : 0;

        const viewportHeight = window.innerHeight;
        const isMobile = window.innerWidth < 735;
        const isTablet = window.innerWidth >= 735 && window.innerWidth <= 1068;
        const bottomOffset = isMobile ? 40 : isTablet ? 60 : 80;
        const dockLift = isMobile ? 16 : 40;
        const buttonHeight = el.offsetHeight || 48;

        // 按钮在视口底部 bottomOffset 处时，对应的 document Y
        const fixedTop = viewportHeight - bottomOffset - buttonHeight;

        // 各锚点的文档绝对 Y
        const startDocY = startSection.getBoundingClientRect().top + window.scrollY;
        const endDocY = endAnchor.getBoundingClientRect().top + window.scrollY - buttonHeight - dockLift;

        // 触发显示的 scrollY 阈值
        const startScroll = Math.max(0, startDocY - fixedTop);
        const scrollY = window.scrollY;

        // ── 第一段：隐藏 ──
        if (scrollY < startScroll) {
          hide();
          return;
        }

        // ── 第二/三段 ──
        // 文档绝对 Y（第二段跟随 scroll，第三段锁定在 endDocY）
        const docTop = Math.min(scrollY + fixedTop, endDocY);

        // 转换为父容器相对坐标
        const relativeTop = docTop - parentDocTop;

        show(relativeTop);
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
      <TryItFreeButton
        label={label}
        backgroundImageUrl={backgroundImageUrl}
        gradient={gradient}
        focusColor={focusColor}
      />
    </div>
  );
}
