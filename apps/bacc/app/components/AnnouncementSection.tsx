import type { CSSProperties, ReactNode } from "react";
import type { SiteThemeConfig } from "../lib/site-theme";
import { LandingImage } from "./LandingImage";

function renderHighlightedText(text: string, highlightColor: string): ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} style={{ color: highlightColor }}>{part}</span>
      : part
  );
}

export function AnnouncementSection({ material }: { material: SiteThemeConfig }) {
  const announcement = material.announcement;

  return (
    <section
      className="split-feature-section"
      aria-hidden="true"
      data-landing-section
      style={{
        "--split-feature-bg": announcement.backgroundColor,
        "--split-feature-title-color": announcement.titleColor,
        "--split-feature-highlight-color": announcement.highlightColor,
        "--split-feature-support-color": announcement.supportColor,
      } as CSSProperties}
    >
      <div className="split-feature-inner">
        <div className="split-feature-copy" data-scroll-reveal>
          <div className="split-feature-copy-inner">
            <h2 className="split-feature-title">
              <span>{announcement.titlePrefix} </span>
              <span className="split-feature-title-highlight">
                {announcement.titleHighlight}
              </span>
            </h2>
            <p className="split-feature-support">
              {renderHighlightedText(announcement.support, announcement.supportHighlightColor)}
            </p>
          </div>
        </div>

        <div className="split-feature-media" data-scroll-reveal style={{ "--reveal-delay": "80ms" } as CSSProperties}>
          <LandingImage className="split-feature-image" src={announcement.imageUrl} />
        </div>
      </div>
    </section>
  );
}
