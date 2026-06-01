"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteThemeConfig } from "../../lib/site-theme";
import { FooterSection } from "../../components/FooterSection";
import { LandingScrollOptimizer } from "../../components/LandingScrollOptimizer";

type Participant = {
    name: string;
    id: string;
    followers: string;
};

type OverflowState = {
    left: boolean;
    right: boolean;
};

const VISIBLE_ROW_COUNT = 16;
const POKE_BACKGROUND_URL = "/landing-poke/lucky-photo-poke-background.png";
const PANEL_BASE = "/landing-poke";

export function PokePageClient({
    material,
    participants,
}: {
    material: SiteThemeConfig;
    participants: Participant[];
}) {
    const poke = material.poke;
    const tableWrapRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [overflow, setOverflow] = useState<OverflowState>({
        left: false,
        right: false,
    });

    const hasExtraRows = participants.length > VISIBLE_ROW_COUNT;

    const syncOverflow = useCallback(() => {
        const wrap = tableWrapRef.current;
        if (!wrap) return;

        const maxScrollLeft = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
        setOverflow({
            left: wrap.scrollLeft > 2,
            right: wrap.scrollLeft < maxScrollLeft - 2,
        });
    }, []);

    useEffect(() => {
        const wrap = tableWrapRef.current;
        if (!wrap) return;

        syncOverflow();
        wrap.addEventListener("scroll", syncOverflow, { passive: true });
        window.addEventListener("resize", syncOverflow);

        return () => {
            wrap.removeEventListener("scroll", syncOverflow);
            window.removeEventListener("resize", syncOverflow);
        };
    }, [syncOverflow]);

    useEffect(() => {
        const frame = requestAnimationFrame(syncOverflow);

        return () => cancelAnimationFrame(frame);
    }, [isExpanded, syncOverflow]);

    const tableFrameClass = [
        "poke-thanks-table-frame",
        overflow.left ? "has-left-overflow" : "",
        overflow.right ? "has-right-overflow" : "",
        hasExtraRows && !isExpanded ? "has-collapsed-rows" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            className="landing-page-shell poke-landing-page"
            style={{
                "--poke-landing-bg": poke.backgroundColor,
                "--poke-landing-bg-image": `url(${POKE_BACKGROUND_URL})`,
                "--poke-heading-color": poke.headingColor,
                "--poke-table-header-color": poke.tableHeaderColor,
                "--poke-table-text-color": poke.tableTextColor,
                "--poke-table-border-color": poke.tableBorderColor,
                "--poke-thanks-color": poke.thanksTextColor,
            } as CSSProperties}
        >
            <LandingScrollOptimizer />
            <main className="poke-landing-main" aria-label="Poke page content">
                <section
                    className="poke-landing-hero"
                    aria-labelledby="poke-landing-title"
                    data-landing-section
                >
                    <h1
                        className="poke-landing-title"
                        id="poke-landing-title"
                        data-scroll-reveal
                    >
                        {poke.headingLines.map((line) => (
                            <span key={line}>{line}</span>
                        ))}
                    </h1>

                    <div
                        className="poke-thanks-panel"
                        aria-label="Poke inspiration content"
                        data-scroll-reveal
                        style={{ "--reveal-delay": "80ms" } as CSSProperties}
                    >
                        <PanelSlice className="poke-thanks-panel-top-left" src="lucky-photo-poke-panel-top-left.png" />
                        <PanelSlice className="poke-thanks-panel-top" src="lucky-photo-poke-panel-top.png" />
                        <PanelSlice className="poke-thanks-panel-top-right" src="lucky-photo-poke-panel-top-right.png" />
                        <PanelSlice className="poke-thanks-panel-left" src="lucky-photo-poke-panel-left.png" />

                        <div className="poke-thanks-panel-content">
                            <div className={tableFrameClass}>
                                <div ref={tableWrapRef} className="poke-thanks-table-wrap">
                                    <div
                                        className="poke-thanks-table poke-thanks-table-head"
                                        role="table"
                                        aria-label="Thanks list header"
                                    >
                                        <div className="poke-thanks-col poke-thanks-col-name" role="columnheader">
                                            Name
                                        </div>
                                        <div className="poke-thanks-col poke-thanks-col-id" role="columnheader">
                                            rednote ID
                                        </div>
                                        <div className="poke-thanks-col poke-thanks-col-followers" role="columnheader">
                                            Followers
                                        </div>
                                    </div>
                                    <div
                                        className={`poke-thanks-table-body${isExpanded ? " is-expanded" : ""}`}
                                        id="poke-thanks-table-body"
                                        role="rowgroup"
                                    >
                                        {participants.map((participant, index) => (
                                            <div
                                                key={`${participant.id}-${index}`}
                                                className={`poke-thanks-table-row${index >= VISIBLE_ROW_COUNT ? " is-extra-row" : ""}`}
                                                role="row"
                                            >
                                                <div className="poke-thanks-col poke-thanks-col-name" role="cell">
                                                    {participant.name}
                                                </div>
                                                <div className="poke-thanks-col poke-thanks-col-id" role="cell">
                                                    {participant.id}
                                                </div>
                                                <div className="poke-thanks-col poke-thanks-col-followers" role="cell">
                                                    {participant.followers}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="poke-thanks-bottom-mask" aria-hidden="true" />
                            </div>

                            <button
                                className="poke-thanks-more-button"
                                type="button"
                                hidden={!hasExtraRows}
                                aria-expanded={isExpanded}
                                aria-controls="poke-thanks-table-body"
                                onClick={() => setIsExpanded((expanded) => !expanded)}
                            >
                                <span className="poke-thanks-more-label">
                                    {isExpanded ? "Close" : "More"}
                                </span>
                            </button>

                            <div className="poke-thanks-meta">
                                <div className="poke-thanks-divider" aria-hidden="true" />
                                <p className="poke-thanks-note">{poke.thanksText}</p>
                                <div className="poke-thanks-special">
                                    <span>{poke.specialThanksText}</span>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        className="poke-thanks-special-icon"
                                        src={`${PANEL_BASE}/lucky-photo-special-thanks-icon.svg`}
                                        alt=""
                                        draggable={false}
                                    />
                                </div>
                            </div>
                        </div>

                        <PanelSlice className="poke-thanks-panel-right" src="lucky-photo-poke-panel-right.png" />
                        <PanelSlice className="poke-thanks-panel-bottom-left" src="lucky-photo-poke-panel-bottom-left.png" />
                        <PanelSlice className="poke-thanks-panel-bottom" src="lucky-photo-poke-panel-bottom.png" />
                        <PanelSlice className="poke-thanks-panel-bottom-right" src="lucky-photo-poke-panel-bottom-right.png" />
                    </div>
                </section>
            </main>

            <FooterSection material={material} />
        </div>
    );
}

function PanelSlice({
    className,
    src,
}: {
    className: string;
    src: string;
}) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            className={`poke-thanks-panel-slice ${className}`}
            src={`${PANEL_BASE}/${src}`}
            alt=""
            draggable={false}
        />
    );
}
