import "../home.css";
import "../styles/poke.css";
import "../styles/poke-skeleton.css";
import { getSiteTheme } from "../../lib/site-theme";
import { PokePageClient } from "./PokePageClient";
import { PokeSkeleton } from "../../components/PokeSkeleton";

export default async function PokePage() {
    const material = await getSiteTheme();

    return (
        <>
            <PokeSkeleton />
            <PokePageClient material={material} participants={material.poke.participants} />
        </>
    );
}
