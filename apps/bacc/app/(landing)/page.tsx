import "./home.css";
import { HeroSection } from "../components/HeroSection";
import { RedBrandSection } from "../components/RedBrandSection";
import { AlsoSection } from "../components/AlsoSection";
import { InspritionSection } from "../components/InspritionSection";
import { AnnouncementSection } from "../components/AnnouncementSection";
import { FooterSection } from "../components/FooterSection";
import { LandingScrollOptimizer } from "../components/LandingScrollOptimizer";
import { HomeSkeleton } from "../components/HomeSkeleton";
import { FloatingTryItFreeButton } from "../components/FloatingTryItFreeButton";
import { getSiteTheme } from "../lib/site-theme";

// ─── 主导出 ───────────────────────────────────────────────────────────────────
// 导航栏由 (landing)/layout.tsx 中的 LandingNavBar 统一提供
export default async function HomePage() {
  const siteTheme = await getSiteTheme();

  return (
    <>
      <HomeSkeleton />
      {/* position: relative 是 FloatingTryItFreeButton is-docked 绝对定位的锚点 */}
      <main
        className="landing-page-shell home-page-shell relative w-full overflow-x-hidden bg-white text-[#0A0708]"
      >
        <div className="flex w-full flex-col items-center">
          <LandingScrollOptimizer />
          <HeroSection material={siteTheme} />
          <RedBrandSection material={siteTheme} />
          <AlsoSection material={siteTheme} />
          <InspritionSection material={siteTheme} />
          <AnnouncementSection material={siteTheme} />
          <FooterSection material={siteTheme} />
        </div>
        <FloatingTryItFreeButton
          label={siteTheme.hero.ctaLabel}
          backgroundImageUrl={siteTheme.hero.ctaBackgroundImageUrl}
          gradient={{
            from: siteTheme.theme.ctaGradientStart,
            to: siteTheme.theme.ctaGradientEnd,
          }}
          focusColor={siteTheme.theme.ctaFocusColor}
        />
      </main>
    </>
  );
}
