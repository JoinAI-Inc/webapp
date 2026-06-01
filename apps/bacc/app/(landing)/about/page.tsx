import "../home.css";
import "../styles/about.css";
import "../styles/about-skeleton.css";
import { getSiteTheme } from "../../lib/site-theme";
import { AboutPageClient } from "./AboutPageClient";
import { AboutSkeleton } from "../../components/AboutSkeleton";

export default async function AboutPage() {
    const material = await getSiteTheme();

    return (
        <>
            <AboutSkeleton />
            <AboutPageClient material={material} />
        </>
    );
}
