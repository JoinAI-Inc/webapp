import "./home.css";
import { HeroSection } from "../components/HeroSection";
import { RedBrandSection } from "../components/RedBrandSection";
import { AlsoSection } from "../components/AlsoSection";
import { InspritionSection } from "../components/InspritionSection";
import { AnnouncementSection } from "../components/AnnouncementSection";
import { FooterSection } from "../components/FooterSection";
import { LandingScrollOptimizer } from "../components/LandingScrollOptimizer";

// ─── 主导出 ───────────────────────────────────────────────────────────────────
// 导航栏由 (landing)/layout.tsx 中的 LandingNavBar 统一提供
export default function HomePage() {
  return (
    <main
      className="w-full overflow-x-hidden bg-white text-[#0A0708]"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      <div className="flex w-full flex-col items-center">
        <LandingScrollOptimizer />
        <HeroSection />
        <RedBrandSection />
        <AlsoSection />
        <InspritionSection />
        <AnnouncementSection />
        <FooterSection />
      </div>
    </main>
  );
}
