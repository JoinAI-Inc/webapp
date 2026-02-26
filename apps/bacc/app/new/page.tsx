import { HeroSection } from "./components/HeroSection";
import { RedBrandSection } from "./components/RedBrandSection";
import { AlsoSection } from "./components/AlsoSection";
import { InspritionSection } from "./components/InspritionSection";
import { AnnouncementSection } from "./components/AnnouncementSection";
import { FooterSection } from "./components/FooterSection";

// ─── 主导出 ───────────────────────────────────────────────────────────────────
// 导航栏由 new/layout.tsx 中的 LandingNavBar 统一提供
export default function NewHomePage() {
    return (
        <main style={{ fontFamily: "Manrope, sans-serif", background: "#fff", minWidth: 1280 }}>
            <div className="flex flex-col items-center">
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
