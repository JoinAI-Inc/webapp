import { getSiteTheme } from "../../lib/site-theme";
import { AboutPageClient } from "./AboutPageClient";

export default async function AboutPage() {
    const material = await getSiteTheme();

    return <AboutPageClient material={material} />;
}
