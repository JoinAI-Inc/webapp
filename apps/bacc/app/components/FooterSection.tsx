import Link from "next/link";
import { LandingImage } from "./LandingImage";

const footerCollage = "/landing-footer/lucky-photo-footer-collage.png";
const footerCtaIcon = "/landing-footer/lucky-photo-home-cta-icon-brand.svg";

export function FooterSection() {
  return (
    <footer className="site-footer" aria-hidden="true" data-landing-section>
      <div className="site-footer-inner">
        <h2 className="site-footer-title">
          Get your fortune Foto <span className="text-nowrap">right now</span>
        </h2>
        <Link
          href="/generate"
          className="site-footer-cta"
          aria-label="Try it free"
        >
          <span className="site-footer-cta-label">Try it free</span>
          <LandingImage
            className="site-footer-cta-icon"
            src={footerCtaIcon}
            alt=""
            width={20}
            height={20}
          />
        </Link>

        <div className="site-footer-collage-wrap">
          <LandingImage
            className="site-footer-collage"
            src={footerCollage}
            alt=""
            width={2560}
            height={311}
          />
        </div>

        <div className="site-footer-meta">
          <span>Copyright © 2026 JoinAI. All rights reserved.</span>
          <span>浙ICP备2021040718号-2</span>
        </div>
      </div>
    </footer>
  );
}
