"use client";

import { useState } from "react";
import type { SiteThemeConfig } from "../../lib/site-theme";
import { FooterSection } from "../../components/FooterSection";

type Status = "idle" | "submitting" | "done" | "limitReached";

export function AboutPageClient({
    material,
}: {
    material: SiteThemeConfig;
}) {
    const about = material.about;
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");

    const canSend = message.trim().length > 0 && status === "idle";

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
                ? "Sent ✓"
                : status === "limitReached"
                    ? "Already sent ✓"
                    : "Send";

    return (
        <div
            style={{
                background: about.backgroundColor,
                width: "100%",
                position: "relative",
                overflowX: "hidden",
            }}
        >
            <section
                style={{
                    position: "relative",
                    width: "100%",
                    minHeight: 900,
                    overflow: "hidden",
                }}
            >
                {about.backgroundImageUrl && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 1920,
                            height: 680,
                            pointerEvents: "none",
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={about.backgroundImageUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </div>
                )}

                <div
                    style={{
                        zIndex: 2,
                        maxWidth: 1488,
                        margin: "0 auto",
                        padding: "0 0",
                    }}
                >
                    <div
                        className="flex flex-row justify-between w-full pb-[120px]"
                        style={{
                            paddingTop: 194,
                            paddingLeft: 50,
                            paddingRight: 50,
                        }}
                    >
                        <div className="w-[60%] relative pt-[30px] ">
                            {about.decorationImageUrl && (
                                <div className="absolute top-[0px] right-[0px]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={about.decorationImageUrl} alt="" height={175.66} width={186.48} />
                                </div>
                            )}
                            <div className="flex flex-row items-center gap-[8px]">
                                <p
                                    style={{
                                        fontFamily: "Manrope, sans-serif",
                                        fontWeight: 600,
                                        fontSize: 40,
                                        lineHeight: 1.3,
                                        color: about.accentColor,
                                        letterSpacing: 0.4,
                                        margin: 0,
                                    }}
                                >
                                    {about.title}
                                </p>
                                {about.heartIconUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={about.heartIconUrl} alt="" height={45} width={45} />
                                )}
                            </div>

                            <div className="flex flex-row gap-[16px]" style={{
                                fontFamily: "Manrope, sans-serif",
                                fontWeight: 600,
                                fontSize: 40,
                                lineHeight: 1.3,
                                color: about.textColor,
                                letterSpacing: 0.4,
                            }}>
                                <span>{about.headlinePrefix}</span>
                                <span style={{ color: about.accentColor }}>{about.headlineHighlight}</span>
                                {about.headlineSuffix && <span>{about.headlineSuffix}</span>}
                            </div>

                            <div className="flex flex-row gap-[16px] pb-[40px]" style={{
                                fontFamily: "Manrope, sans-serif",
                                fontWeight: 600,
                                fontSize: 40,
                                lineHeight: 1.3,
                                color: about.textColor,
                                letterSpacing: 0.4,
                            }}>
                                {about.subheadline}
                            </div>

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={about.placeholder}
                                disabled={status === "done" || status === "limitReached"}
                                style={{
                                    width: "100%",
                                    height: 327,
                                    background: about.inputBackgroundColor,
                                    border: `1px solid ${about.inputBorderColor}`,
                                    borderRadius: 16,
                                    padding: "16px",
                                    fontFamily: "Manrope, sans-serif",
                                    fontSize: 17,
                                    color: "#333",
                                    letterSpacing: 0.17,
                                    lineHeight: 1.4,
                                    resize: "none",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />

                            <div style={{ marginTop: 16 }}>
                                <button
                                    onClick={handleSend}
                                    disabled={!canSend}
                                    style={{
                                        background: canSend ? about.accentColor : about.disabledButtonColor,
                                        border: "none",
                                        borderRadius: 81,
                                        padding: "10px 28px",
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: 17,
                                        color: "#fff",
                                        letterSpacing: 0.17,
                                        cursor: canSend ? "pointer" : "default",
                                        transition: "background 0.2s",
                                        lineHeight: 1.4,
                                        minWidth: 106,
                                    }}
                                >
                                    {btnLabel}
                                </button>
                            </div>

                            {error && (
                                <p
                                    style={{
                                        marginTop: 8,
                                        fontSize: 13,
                                        color: "#e53e3e",
                                        fontFamily: "Manrope, sans-serif",
                                    }}
                                >
                                    {error}
                                </p>
                            )}

                            <p
                                style={{
                                    marginTop: 12,
                                    fontFamily:
                                        "Manrope, 'Noto Sans JP', 'Noto Sans SC', sans-serif",
                                    fontSize: 14,
                                    color: about.mutedTextColor,
                                    letterSpacing: 0.14,
                                    lineHeight: 1.4,
                                }}
                            >
                                {about.emailLabel}{" "}
                                <a
                                    href={`mailto:${about.email}`}
                                    style={{ color: about.mutedTextColor, textDecoration: "underline" }}
                                >
                                    {about.email}
                                </a>
                            </p>
                        </div>

                        <div
                            className="w-[40%]"
                            style={{
                                width: 550,
                                height: 723,
                                overflow: "hidden",
                                pointerEvents: "none",
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={about.illustrationUrl}
                                alt="Lucky horses illustration"
                                style={{
                                    width: 550,
                                    height: 723,
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <FooterSection material={material} />
        </div>
    );
}
