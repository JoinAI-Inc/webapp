"use client";

import { useEffect, useRef } from "react";

function SkeletonBlock({ className }: { className?: string }) {
  return <span className={`home-sk-block${className ? ` ${className}` : ""}`} />;
}

function PokeHeroSkeleton() {
  return (
    <div className="poke-sk-hero">
      {/* heading lines */}
      <SkeletonBlock className="poke-sk-line poke-sk-line-title" />
      <SkeletonBlock className="poke-sk-line poke-sk-line-title poke-sk-line-title-short" />

      {/* panel placeholder */}
      <div className="poke-sk-panel">
        {/* table header row */}
        <div className="poke-sk-table-head">
          <SkeletonBlock className="poke-sk-col" />
          <SkeletonBlock className="poke-sk-col" />
          <SkeletonBlock className="poke-sk-col poke-sk-col-narrow" />
        </div>
        {/* table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="poke-sk-table-row">
            <SkeletonBlock className="poke-sk-col" />
            <SkeletonBlock className="poke-sk-col" />
            <SkeletonBlock className="poke-sk-col poke-sk-col-narrow" />
          </div>
        ))}
        {/* bottom meta */}
        <SkeletonBlock className="poke-sk-divider" />
        <SkeletonBlock className="poke-sk-line poke-sk-line-sm" />
      </div>
    </div>
  );
}

function FooterSkeleton() {
  return (
    <div className="poke-sk-footer">
      <SkeletonBlock className="home-sk-line home-sk-line-sm" />
      <SkeletonBlock className="home-sk-button" />
      <SkeletonBlock className="poke-sk-footer-collage" />
    </div>
  );
}

export function PokeSkeleton() {
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

    if (document.readyState === "complete") {
      dismiss();
      return;
    }

    window.addEventListener("load", dismiss, { once: true });
    const timer = window.setTimeout(dismiss, 3000);

    return () => {
      window.removeEventListener("load", dismiss);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={rootRef} className="home-sk-root poke-sk-root" aria-hidden="true">
      {/* Nav skeleton */}
      <div className="home-sk-nav">
        <SkeletonBlock className="home-sk-logo" />
        <div className="home-sk-nav-links">
          <SkeletonBlock className="home-sk-navlink" />
          <SkeletonBlock className="home-sk-navlink" />
          <SkeletonBlock className="home-sk-navlink" />
          <SkeletonBlock className="home-sk-navlink" />
        </div>
        <SkeletonBlock className="home-sk-cta" />
      </div>

      <PokeHeroSkeleton />
      <FooterSkeleton />
    </div>
  );
}
