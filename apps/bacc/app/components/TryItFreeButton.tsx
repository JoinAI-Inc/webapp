"use client";

import Link from "next/link";
import type { CSSProperties, PointerEvent } from "react";
import { useCallback, useRef } from "react";
import { twMerge } from "tailwind-merge";

interface TryItFreeButtonProps {
    /** "primary": 红底白字 (默认); "inverse": 白底红字 (用于深色背景) */
    variant?: "primary" | "inverse";
    /** 按钮后缀符号，默认 "›" */
    suffix?: string;
    href?: string;
    className?: string;
    label?: string;
    backgroundImageUrl?: string;
    gradient?: {
        from: string;
        to: string;
    };
    focusColor?: string;
}

export function TryItFreeButton({
    variant = "primary",
    suffix = "›",
    href = "/generate",
    className,
    label = "Try it free",
    backgroundImageUrl,
    gradient = { from: "#FF5C2E", to: "#E81500" },
    focusColor = "#FFD322",
}: TryItFreeButtonProps) {
    const isPrimary = variant === "primary";
    const linkRef = useRef<HTMLAnchorElement>(null);

    const handlePointerMove = useCallback((e: PointerEvent<HTMLAnchorElement>) => {
        const el = linkRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
        el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
    }, []);

    return (
        <Link
            ref={linkRef}
            href={href}
            className={twMerge(
                "group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-7 text-[16px] font-medium leading-none no-underline transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD322] sm:px-8",
                isPrimary
                    ? "border border-[#FFD322] bg-[#E8281E] text-white shadow-[0_14px_32px_rgba(212,36,36,0.22)]"
                    : "border border-white bg-white text-[#CA1816] shadow-[0_12px_30px_rgba(10,7,8,0.14)]",
                className
            )}
            style={{
                fontFamily: "Manrope, sans-serif",
                outlineColor: focusColor,
                background: isPrimary
                    ? `linear-gradient(180deg, ${gradient.from} 0%, ${gradient.to} 100%)`
                    : undefined,
            } as CSSProperties}
            onPointerMove={handlePointerMove}
        >
            {isPrimary && backgroundImageUrl && (
                <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center opacity-95"
                    style={{
                        backgroundImage: `url(${backgroundImageUrl})`,
                    }}
                />
            )}
            {/* 鼠标跟随光晕：跟踪 --glow-x / --glow-y */}
            <span
                aria-hidden="true"
                className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(120px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(255,210,105,0.52), rgba(255,210,105,0) 72%)",
                } as CSSProperties}
            />
            <span className="relative z-10">
                {label} {suffix}
            </span>
        </Link>
    );
}
