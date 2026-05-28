import type { CSSProperties } from "react";
import type { SiteThemeConfig } from "../lib/site-theme";
import { LandingImage } from "./LandingImage";

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
        <div className="split-feature-copy">
          <div className="split-feature-copy-inner">
            <h2 className="split-feature-title">
              <span>{announcement.titlePrefix} </span>
              <span className="split-feature-title-highlight">
                {announcement.titleHighlight}
              </span>
            </h2>
            <p className="split-feature-support">
              {announcement.support}
            </p>
          </div>
        </div>

        <div className="split-feature-media">
          <div
            className="split-feature-media-bg"
            style={{ backgroundImage: `url(${announcement.mediaBackgroundImageUrl})` }}
            aria-hidden="true"
          />
          <LandingImage className="split-feature-image" src={announcement.imageUrl} />
        </div>
      </div>
    </section>
  );
}
