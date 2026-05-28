import Link from "next/link";
import type { CSSProperties } from "react";
import { DEFAULT_SITE_THEME, type SiteThemeConfig } from "../lib/site-theme";
import { LandingImage } from "./LandingImage";

export function FooterSection({ material }: { material?: SiteThemeConfig }) {
  const footer = material?.footer || DEFAULT_SITE_THEME.footer;

  return (
    <footer
      className="site-footer"
      aria-hidden="true"
      data-landing-section
      style={{
        "--site-footer-bg": footer.backgroundColor,
        "--site-footer-bg-image": `url(${footer.backgroundImageUrl})`,
        "--site-footer-title-color": footer.titleColor,
        "--site-footer-cta-bg": footer.ctaBackgroundColor,
        "--site-footer-cta-color": footer.ctaTextColor,
        "--site-footer-meta-color": footer.metaColor,
      } as CSSProperties}
    >
      <div className="site-footer-inner" data-scroll-reveal>
        <h2 className="site-footer-title">{footer.title}</h2>
        <Link
          href="/generate"
          className="site-footer-cta"
          aria-label={footer.ctaLabel}
        >
          <span className="site-footer-cta-label">{footer.ctaLabel}</span>
          <LandingImage
            className="site-footer-cta-icon"
            src={footer.ctaIconUrl}
            alt=""
            width={20}
            height={20}
          />
        </Link>

        <div className="site-footer-collage-wrap">
          <LandingImage
            className="site-footer-collage"
            src={footer.collageImageUrl}
            alt=""
            width={2560}
            height={311}
          />
        </div>

        <div className="site-footer-meta">
          <span>{footer.copyrightText}</span>
          <span>{footer.recordText}</span>
        </div>
      </div>
    </footer>
  );
}
