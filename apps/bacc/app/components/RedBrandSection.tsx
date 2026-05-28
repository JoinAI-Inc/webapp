import type { CSSProperties } from "react";
import type { SiteThemeConfig } from "../lib/site-theme";
import { LandingImage } from "./LandingImage";

export function RedBrandSection({ material }: { material: SiteThemeConfig }) {
  const redBrand = material.redBrand;
  const supportLines = redBrand.support.split("\n");

  return (
    <section
      className="year-feature-section"
      aria-labelledby="year-feature-title"
      data-landing-section
      style={{
        "--year-feature-bg": redBrand.backgroundColor,
        "--year-feature-title-color": redBrand.titleColor,
        "--year-feature-support-color": redBrand.supportColor,
      } as CSSProperties}
    >
      <div
        className="year-feature-pattern"
        style={{ backgroundImage: `url(${redBrand.patternImageUrl})` }}
        aria-hidden="true"
      />

      <div
        className="year-feature-decor-slot year-feature-decor-slot-left"
        aria-hidden="true"
        data-scroll-reveal
      >
        <LandingImage
          className="year-feature-decor year-feature-decor-left year-feature-decor-base"
          src={redBrand.leftBaseImageUrl}
        />
        <LandingImage
          className="year-feature-decor year-feature-decor-left year-feature-decor-overlay"
          src={redBrand.leftOverlayImageUrl}
        />
      </div>

      <div
        className="year-feature-decor-slot year-feature-decor-slot-right"
        aria-hidden="true"
        data-scroll-reveal
        style={{ "--reveal-delay": "80ms" } as CSSProperties}
      >
        <LandingImage
          className="year-feature-decor year-feature-decor-right year-feature-decor-base"
          src={redBrand.rightBaseImageUrl}
        />
        <LandingImage
          className="year-feature-decor year-feature-decor-right year-feature-decor-overlay year-feature-decor-overlay-right"
          src={redBrand.rightOverlayImageUrl}
        />
      </div>

      <div className="year-feature-inner" data-scroll-reveal style={{ "--reveal-delay": "160ms" } as CSSProperties}>
        <LandingImage className="year-feature-icon" src={redBrand.iconUrl} />

        <div className="year-feature-copy">
          <h2 className="year-feature-title" id="year-feature-title">
            {redBrand.title}
          </h2>
          <p className="year-feature-support">
            {supportLines.map((line, index) => (
              <span key={line || index}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
