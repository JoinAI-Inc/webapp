"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteThemeConfig } from "../../lib/site-theme";
import { FooterSection } from "../../components/FooterSection";
import { LandingScrollOptimizer } from "../../components/LandingScrollOptimizer";

type Status = "idle" | "submitting" | "done" | "limitReached";

const IMAGE_URL = (process.env.NEXT_PUBLIC_IMAGE_URL || "https://pub-cfc37210b6a543b492b7f0e494faac09.r2.dev/bacc/image").replace(/\/$/, "");
const ABOUT_BACKGROUND_FALLBACK =
    `${IMAGE_URL}/landing-about/lucky-photo-poke-top-pattern.png`;
const ABOUT_ILLUSTRATION_FALLBACK =
    `${IMAGE_URL}/landing-about/lucky-photo-poke-horses.png`;

function resolveAboutAsset(src: string, fallback: string) {
    if (!src || src.startsWith("/new-home/")) {
        return fallback;
    }

    return src;
}

export function AboutPageClient({
    material,
}: {
    material: SiteThemeConfig;
}) {
    const about = material.about;
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const copyRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const sendRef = useRef<HTMLButtonElement>(null);
    const emailRef = useRef<HTMLParagraphElement>(null);
    const mediaImageRef = useRef<HTMLImageElement>(null);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");

    const backgroundImageUrl = resolveAboutAsset(
        about.backgroundImageUrl,
        ABOUT_BACKGROUND_FALLBACK,
    );
    const illustrationUrl = resolveAboutAsset(
        about.illustrationUrl,
        ABOUT_ILLUSTRATION_FALLBACK,
    );
    const canSend = message.trim().length > 0 && status === "idle";
    const isLocked =
        status === "submitting" ||
        status === "done" ||
        status === "limitReached";

    const resizeInput = useCallback(() => {
        const input = inputRef.current;
        if (!input) return;
        const inputElement = input;

        function getDefaultInputHeight() {
            const copy = copyRef.current;
            const title = titleRef.current;
            const sendButton = sendRef.current;
            const email = emailRef.current;

            if (
                window.innerWidth <= 734 ||
                !copy ||
                !title ||
                !sendButton ||
                !email
            ) {
                return 160;
            }

            const copyStyles = window.getComputedStyle(copy);
            const copyPaddingTop = Number.parseFloat(copyStyles.paddingTop) || 0;
            const copyPaddingBottom = Number.parseFloat(copyStyles.paddingBottom) || 0;
            const titleHeight = title.getBoundingClientRect().height;
            const inputMarginTop =
                Number.parseFloat(window.getComputedStyle(inputElement).marginTop) || 0;
            const sendHeight = sendButton.getBoundingClientRect().height;
            const sendMarginTop =
                Number.parseFloat(window.getComputedStyle(sendButton).marginTop) || 0;
            const emailHeight = email.getBoundingClientRect().height;
            const emailMarginTop =
                Number.parseFloat(window.getComputedStyle(email).marginTop) || 0;
            const mediaHeight =
                mediaImageRef.current?.getBoundingClientRect().height || 0;
            const layoutHeight = mediaHeight || copy.getBoundingClientRect().height;
            const availableHeight =
                layoutHeight -
                copyPaddingTop -
                copyPaddingBottom -
                titleHeight -
                inputMarginTop -
                sendHeight -
                sendMarginTop -
                emailHeight -
                emailMarginTop;

            return Math.max(availableHeight, 160);
        }

        const defaultHeight = getDefaultInputHeight();
        inputElement.style.height = "auto";
        inputElement.style.height = `${Math.max(inputElement.scrollHeight, defaultHeight)}px`;
    }, []);

    useEffect(() => {
        resizeInput();
    }, [message, status, resizeInput]);

    useEffect(() => {
        const image = mediaImageRef.current;

        resizeInput();
        window.addEventListener("resize", resizeInput);
        image?.addEventListener("load", resizeInput);

        return () => {
            window.removeEventListener("resize", resizeInput);
            image?.removeEventListener("load", resizeInput);
        };
    }, [resizeInput]);

    async function handleSend() {
        if (!canSend) return;
        setStatus("submitting");
        setError("");

        try {
            const res = await fetch("/api/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: message.trim() }),
            });

            if (res.status === 429) {
                setStatus("limitReached");
            } else if (res.ok) {
                setStatus("done");
                setMessage("");
            } else {
                throw new Error("Server error");
            }
        } catch {
            setStatus("idle");
            setError("Failed to send, please try again.");
        }
    }

    const btnLabel =
        status === "submitting"
            ? "Sending..."
            : status === "done"
                ? "Sent"
                : status === "limitReached"
                    ? "Already sent"
                    : "Send";

    return (
        <div
            className="landing-page-shell about-page"
            style={{
                "--about-bg": about.backgroundColor,
                "--about-bg-image": `url(${backgroundImageUrl})`,
                "--about-accent": about.accentColor,
                "--about-text": about.textColor,
                "--about-muted": about.mutedTextColor,
                "--about-input-bg": about.inputBackgroundColor,
                "--about-input-border": about.inputBorderColor,
                "--about-disabled": about.disabledButtonColor,
            } as CSSProperties}
        >
            <LandingScrollOptimizer />
            <main className="about-main" aria-label="About page content">
                <section className="about-hero" data-landing-section>
                    <div className="about-hero-inner">
                        <div ref={copyRef} className="about-hero-copy">
                            <h1
                                ref={titleRef}
                                className="about-hero-title"
                                data-scroll-reveal
                            >
                                <span className="about-hero-title-line about-hero-title-highlight">
                                    {about.title}
                                </span>
                                <span className="about-hero-title-line">
                                    {about.headlinePrefix}{" "}
                                    <span className="about-hero-title-highlight about-hero-title-nowrap">
                                        {about.headlineHighlight}
                                    </span>
                                    {about.headlineSuffix ? ` ${about.headlineSuffix}` : ""}
                                </span>
                                <span className="about-hero-title-line">
                                    {about.subheadline}
                                </span>
                            </h1>

                            <textarea
                                ref={inputRef}
                                value={message}
                                onChange={(event) => {
                                    setMessage(event.target.value);
                                    if (error) setError("");
                                }}
                                placeholder={about.placeholder}
                                disabled={isLocked}
                                className="about-hero-input"
                                data-filled={message.trim() ? "true" : undefined}
                                rows={5}
                                aria-label={about.placeholder}
                                data-scroll-reveal
                                style={{ "--reveal-delay": "80ms" } as CSSProperties}
                            />

                            <button
                                ref={sendRef}
                                type="button"
                                onClick={handleSend}
                                disabled={!canSend}
                                className="about-hero-send"
                                aria-disabled={!canSend}
                                aria-label="Send message"
                                data-scroll-reveal
                                style={{ "--reveal-delay": "160ms" } as CSSProperties}
                            >
                                <span className="about-hero-send-label">{btnLabel}</span>
                            </button>

                            <p
                                ref={emailRef}
                                className="about-hero-email"
                                data-scroll-reveal
                                style={{ "--reveal-delay": "240ms" } as CSSProperties}
                            >
                                <span>{about.emailLabel}</span>{" "}
                                <a href={`mailto:${about.email}`}>{about.email}</a>
                            </p>

                            <p className="about-hero-status" aria-live="polite">
                                {status === "done"
                                    ? "Thank you! Your message has been sent."
                                    : error}
                            </p>
                        </div>

                        <div
                            className="about-hero-media"
                            aria-hidden="true"
                            data-scroll-reveal
                            style={{ "--reveal-delay": "320ms" } as CSSProperties}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                ref={mediaImageRef}
                                src={illustrationUrl}
                                alt=""
                                width={550}
                                height={723}
                                fetchPriority="high"
                                loading="eager"
                                decoding="async"
                                draggable={false}
                                data-landing-predecode="true"
                            />
                        </div>
                    </div>
                </section>
            </main>

            <FooterSection material={material} />
        </div>
    );
}
