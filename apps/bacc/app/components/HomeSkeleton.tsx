"use client";

import { useEffect, useRef } from "react";

// 单个骨架块，带 shimmer 光泽动画
function SkeletonBlock({ className }: { className?: string }) {
  return <span className={`home-sk-block${className ? ` ${className}` : ""}`} />;
}

const NAV_LINK_SKELETON_COUNT = 3;

// Hero 骨架
function HeroSkeleton() {
  return (
    <div className="home-sk-hero">
      <SkeletonBlock className="home-sk-accent" />
      <div className="home-sk-title">
        <SkeletonBlock className="home-sk-line home-sk-line-xl" />
        <div className="home-sk-title-logo-row">
          <SkeletonBlock className="home-sk-line home-sk-line-logo-text" />
          <SkeletonBlock className="home-sk-line home-sk-line-logo-mark" />
        </div>
      </div>
      <SkeletonBlock className="home-sk-line home-sk-line-subtitle" />
      <SkeletonBlock className="home-sk-button" />
      <div className="home-sk-media">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className={`home-sk-media-row ${row === 1 ? "home-sk-media-row-reverse" : "home-sk-media-row-forward"}`}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonBlock key={i} className="home-sk-media-card" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Year / RedBrand 骨架
function YearSkeleton() {
  return (
    <div className="home-sk-year">
      <div className="home-sk-year-decor home-sk-year-decor-left" />
      <div className="home-sk-year-decor home-sk-year-decor-right" />
      <div className="home-sk-year-copy">
        <SkeletonBlock className="home-sk-year-icon" />
        <SkeletonBlock className="home-sk-line home-sk-line-sm" />
        <SkeletonBlock className="home-sk-line home-sk-line-md" />
        <SkeletonBlock className="home-sk-line home-sk-line-sm" />
      </div>
    </div>
  );
}

// Gallery 四格骨架
function GallerySkeleton() {
  return (
    <div className="home-sk-gallery">
      <div className="home-sk-copy">
        <SkeletonBlock className="home-sk-line home-sk-line-sm" />
        <SkeletonBlock className="home-sk-line home-sk-line-md" />
      </div>
      <div className="home-sk-gallery-grid home-sk-gallery-grid-four">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="home-sk-gallery-card" />
        ))}
      </div>
    </div>
  );
}

// Pet 骨架
function PetSkeleton() {
  return (
    <div className="home-sk-pet">
      <SkeletonBlock className="home-sk-line home-sk-line-lg home-sk-pet-title" />
    </div>
  );
}

// OOTD 三格骨架
function OotdSkeleton() {
  return (
    <div className="home-sk-gallery">
      <div className="home-sk-copy">
        <SkeletonBlock className="home-sk-line home-sk-line-sm" />
        <SkeletonBlock className="home-sk-line home-sk-line-md" />
      </div>
      <div className="home-sk-gallery-grid home-sk-gallery-grid-three">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="home-sk-gallery-card" />
        ))}
      </div>
    </div>
  );
}

// Inspiration 卡片骨架
function CardSkeleton() {
  return (
    <div className="home-sk-card-block">
      <div className="home-sk-card-inner">
        <div className="home-sk-card-frame-side" />
        <div className="home-sk-card-frame-center">
          <SkeletonBlock className="home-sk-line home-sk-line-sm" />
          <div className="home-sk-card-marquee">
            <SkeletonBlock className="home-sk-line home-sk-line-md" />
            <SkeletonBlock className="home-sk-line home-sk-line-md" />
            <SkeletonBlock className="home-sk-line home-sk-line-md" />
          </div>
          <SkeletonBlock className="home-sk-card-divider" />
          <SkeletonBlock className="home-sk-line home-sk-line-md" />
          <SkeletonBlock className="home-sk-line home-sk-line-sm" />
        </div>
        <div className="home-sk-card-frame-side" />
      </div>
    </div>
  );
}

// Split / Announcement 骨架
function SplitSkeleton() {
  return (
    <div className="home-sk-split">
      <div className="home-sk-copy home-sk-split-copy">
        <SkeletonBlock className="home-sk-line home-sk-line-split-title" />
        <SkeletonBlock className="home-sk-line home-sk-line-md" />
        <SkeletonBlock className="home-sk-line home-sk-line-md" />
      </div>
      <SkeletonBlock className="home-sk-split-image" />
    </div>
  );
}

// Footer 骨架
function FooterSkeleton() {
  return (
    <div className="home-sk-footer">
      <SkeletonBlock className="home-sk-line home-sk-line-footer-title" />
      <SkeletonBlock className="home-sk-footer-cta" />
      <SkeletonBlock className="home-sk-footer-collage" />
      <div className="home-sk-footer-meta">
        <SkeletonBlock className="home-sk-line home-sk-line-meta" />
        <SkeletonBlock className="home-sk-line home-sk-line-meta" />
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    function dismiss() {
      if (!el) return;
      el.classList.add("home-sk-dismissed");
      el.addEventListener(
        "transitionend",
        () => {
          el.style.display = "none";
        },
        { once: true },
      );
    }

    // 等所有图片 + load 事件
    if (document.readyState === "complete") {
      dismiss();
      return;
    }

    window.addEventListener("load", dismiss, { once: true });

    // 最多等 3s，避免卡住
    const timer = window.setTimeout(dismiss, 3000);

    return () => {
      window.removeEventListener("load", dismiss);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={rootRef} className="home-sk-root" aria-hidden="true">
      {/* Nav skeleton */}
      <div className="home-sk-nav">
        <SkeletonBlock className="home-sk-logo" />
        <div className="home-sk-nav-links">
          {Array.from({ length: NAV_LINK_SKELETON_COUNT }).map((_, i) => (
            <SkeletonBlock key={i} className="home-sk-navlink" />
          ))}
        </div>
        <SkeletonBlock className="home-sk-cta" />
      </div>

      <HeroSkeleton />
      <YearSkeleton />
      <GallerySkeleton />
      <PetSkeleton />
      <OotdSkeleton />
      <CardSkeleton />
      <SplitSkeleton />
      <FooterSkeleton />
    </div>
  );
}
