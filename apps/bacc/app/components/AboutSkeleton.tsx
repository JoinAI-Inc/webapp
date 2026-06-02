"use client";

import { useEffect, useRef } from "react";

function SkeletonBlock({ className }: { className?: string }) {
  return <span className={`home-sk-block${className ? ` ${className}` : ""}`} />;
}

const NAV_LINK_SKELETON_COUNT = 3;

function AboutHeroSkeleton() {
  return (
    <div className="about-sk-hero">
      <div className="about-sk-copy">
        {/* title lines */}
        <SkeletonBlock className="about-sk-line about-sk-line-title" />
        <SkeletonBlock className="about-sk-line about-sk-line-title about-sk-line-title-short" />
        <SkeletonBlock className="about-sk-line about-sk-line-title" />
        {/* textarea */}
        <SkeletonBlock className="about-sk-input" />
        {/* send button */}
        <SkeletonBlock className="about-sk-button" />
        {/* email line */}
        <SkeletonBlock className="about-sk-line about-sk-line-sm" />
      </div>
      <div className="about-sk-media">
        <SkeletonBlock className="about-sk-illustration" />
      </div>
    </div>
  );
}

function FooterSkeleton() {
  return (
    <div className="about-sk-footer">
      <SkeletonBlock className="home-sk-line home-sk-line-sm" />
      <SkeletonBlock className="home-sk-button" />
      <SkeletonBlock className="about-sk-footer-collage" />
    </div>
  );
}

export function AboutSkeleton() {
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
    <div ref={rootRef} className="home-sk-root about-sk-root" aria-hidden="true">
      {/* Nav skeleton — reuse home nav skeleton classes */}
      <div className="home-sk-nav">
        <SkeletonBlock className="home-sk-logo" />
        <div className="home-sk-nav-links">
          {Array.from({ length: NAV_LINK_SKELETON_COUNT }).map((_, i) => (
            <SkeletonBlock key={i} className="home-sk-navlink" />
          ))}
        </div>
        <SkeletonBlock className="home-sk-cta" />
      </div>

      <AboutHeroSkeleton />
      <FooterSkeleton />
    </div>
  );
}
