import type { Ref } from "react";

function SkeletonBlock({ className }: { className?: string }) {
  return <span className={`home-sk-block${className ? ` ${className}` : ""}`} />;
}

function SkeletonNav() {
  return (
    <div className="home-sk-nav">
      <SkeletonBlock className="home-sk-logo" />
      <div className="home-sk-nav-links">
        {[0, 1, 2].map((item) => (
          <SkeletonBlock key={item} className="home-sk-navlink" />
        ))}
      </div>
      <SkeletonBlock className="home-sk-cta" />
    </div>
  );
}

function HomeHeroSkeleton() {
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
            {Array.from({ length: 7 }).map((_, item) => (
              <SkeletonBlock key={item} className="home-sk-media-card" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

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

function GallerySkeleton() {
  return (
    <div className="home-sk-gallery">
      <div className="home-sk-copy">
        <SkeletonBlock className="home-sk-line home-sk-line-sm" />
        <SkeletonBlock className="home-sk-line home-sk-line-md" />
      </div>
      <div className="home-sk-gallery-grid home-sk-gallery-grid-four">
        {Array.from({ length: 4 }).map((_, item) => (
          <SkeletonBlock key={item} className="home-sk-gallery-card" />
        ))}
      </div>
    </div>
  );
}

function PetSkeleton() {
  return (
    <div className="home-sk-pet">
      <SkeletonBlock className="home-sk-line home-sk-line-lg home-sk-pet-title" />
      <SkeletonBlock className="home-sk-pet-collage home-sk-pet-collage-top-left" />
      <SkeletonBlock className="home-sk-pet-collage home-sk-pet-collage-top-right" />
      <div className="home-sk-pet-story">
        <SkeletonBlock className="home-sk-pet-collage home-sk-pet-collage-bottom-left" />
        <SkeletonBlock className="home-sk-line home-sk-pet-story-line" />
      </div>
      <SkeletonBlock className="home-sk-pet-collage home-sk-pet-collage-bottom-right" />
      <SkeletonBlock className="home-sk-line home-sk-pet-mobile-copy" />
      <div className="home-sk-pet-mobile-grid">
        {Array.from({ length: 4 }).map((_, item) => (
          <SkeletonBlock key={item} className="home-sk-gallery-card" />
        ))}
      </div>
    </div>
  );
}

function OotdSkeleton() {
  return (
    <div className="home-sk-gallery">
      <div className="home-sk-copy">
        <SkeletonBlock className="home-sk-line home-sk-line-sm" />
        <SkeletonBlock className="home-sk-line home-sk-line-md" />
      </div>
      <div className="home-sk-gallery-grid home-sk-gallery-grid-three">
        {Array.from({ length: 3 }).map((_, item) => (
          <SkeletonBlock key={item} className="home-sk-gallery-card home-sk-ootd-card" />
        ))}
      </div>
      <div className="home-sk-ootd-dots">
        {[0, 1, 2].map((item) => (
          <SkeletonBlock key={item} className="home-sk-ootd-dot" />
        ))}
      </div>
    </div>
  );
}

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

function LandingFooterSkeleton() {
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

type LandingRouteSkeletonProps = {
  rootRef?: Ref<HTMLDivElement>;
};

export function HomeRouteSkeleton({ rootRef }: LandingRouteSkeletonProps = {}) {
  return (
    <div ref={rootRef} className="home-sk-root" data-route-loading="true" aria-hidden="true">
      <SkeletonNav />
      <HomeHeroSkeleton />
      <YearSkeleton />
      <GallerySkeleton />
      <PetSkeleton />
      <OotdSkeleton />
      <CardSkeleton />
      <SplitSkeleton />
      <LandingFooterSkeleton />
    </div>
  );
}

export function AboutRouteSkeleton({ rootRef }: LandingRouteSkeletonProps = {}) {
  return (
    <div ref={rootRef} className="home-sk-root about-sk-root" data-route-loading="true" aria-hidden="true">
      <SkeletonNav />
      <div className="about-sk-hero">
        <div className="about-sk-copy">
          <SkeletonBlock className="about-sk-line about-sk-line-title" />
          <SkeletonBlock className="about-sk-line about-sk-line-title about-sk-line-title-short" />
          <SkeletonBlock className="about-sk-line about-sk-line-title" />
          <SkeletonBlock className="about-sk-input" />
          <SkeletonBlock className="about-sk-button" />
          <SkeletonBlock className="about-sk-line about-sk-line-sm" />
        </div>
        <div className="about-sk-media">
          <SkeletonBlock className="about-sk-illustration" />
        </div>
      </div>
      <LandingFooterSkeleton />
    </div>
  );
}

export function PokeRouteSkeleton({ rootRef }: LandingRouteSkeletonProps = {}) {
  return (
    <div ref={rootRef} className="home-sk-root poke-sk-root" data-route-loading="true" aria-hidden="true">
      <SkeletonNav />
      <div className="poke-sk-hero">
        {Array.from({ length: 3 }).map((_, item) => (
          <div
            key={item}
            className={`poke-sk-title-row${item === 2 ? " poke-sk-line-title-short" : ""}`}
          >
            <SkeletonBlock className="poke-sk-line poke-sk-line-title" />
            <SkeletonBlock className="poke-sk-line poke-sk-line-title-mobile-continuation" />
          </div>
        ))}
        <div className="poke-sk-panel">
          <div className="poke-sk-table-head">
            <SkeletonBlock className="poke-sk-col" />
            <SkeletonBlock className="poke-sk-col" />
            <SkeletonBlock className="poke-sk-col poke-sk-col-narrow" />
          </div>
          {Array.from({ length: 16 }).map((_, item) => (
            <div key={item} className="poke-sk-table-row">
              <SkeletonBlock className="poke-sk-col" />
              <SkeletonBlock className="poke-sk-col" />
              <SkeletonBlock className="poke-sk-col poke-sk-col-narrow" />
            </div>
          ))}
          <SkeletonBlock className="poke-sk-more" />
          <div className="poke-sk-meta">
            <SkeletonBlock className="poke-sk-divider" />
            <SkeletonBlock className="poke-sk-line poke-sk-line-sm" />
            <SkeletonBlock className="poke-sk-line poke-sk-line-special" />
          </div>
        </div>
      </div>
      <LandingFooterSkeleton />
    </div>
  );
}
