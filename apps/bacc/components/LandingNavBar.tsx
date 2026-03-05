"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

export default function LandingNavBar() {
    const navRef = useRef<HTMLElement>(null);
    const pathname = usePathname();

    const navItems = [
        { label: "Home", href: "/" },
        { label: "Blog", href: "/blog" },
        { label: "About", href: "/about" },
        { label: "Poke", href: "/poke" },
        { label: "My Gallery", href: "/generate#gallery" },
    ];

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const handleScroll = () => {
            nav.classList.toggle("nav-scrolled", window.scrollY > 10);
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <style>{`
                .landing-nav {
                    background: transparent;
                    backdrop-filter: none;
                    border-bottom: none;
                    transition: background 0.3s ease, border-bottom 0.3s ease;
                }
                .landing-nav.nav-scrolled {
                    background: rgba(255,255,255,0.96);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(0,0,0,0.06);
                }
                .nav-link { color: rgba(0,0,0,0.65); }
                .nav-scrolled .nav-link { color: #333; }
                .nav-link.active { color: #E8281E !important; }
            `}</style>
            <nav
                ref={navRef}
                className="landing-nav"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    height: 64,
                }}
            >
                <div
                    style={{
                        maxWidth: 1488,
                        margin: "0 auto",
                        padding: "0 24px",
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Logo */}
                    <Link
                        href="/"
                        style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
                    >
                        <Image
                            src={`${IMAGE_URL}/new-home/icon-web.png`}
                            alt="lucky-photo"
                            width={120}
                            height={32}
                            style={{ objectFit: "contain" }}
                        />
                    </Link>

                    {/* 中间导航链接 */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {navItems.map(({ label, href }) => {
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={label}
                                    href={href}
                                    className={`nav-link${isActive ? " active" : ""}`}
                                    style={{
                                        padding: "22px 20px",
                                        fontWeight: 500,
                                        fontSize: 16,
                                        fontFamily: "Manrope, sans-serif",
                                        textDecoration: "none",
                                        transition: "color 0.3s ease",
                                    }}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* CTA 按钮 */}
                    <Link
                        href="/generate"
                        style={{
                            background: "#E8281E",
                            color: "#fff",
                            padding: "8px 20px",
                            borderRadius: '48px',
                            fontSize: 14,
                            fontWeight: 500,
                            fontFamily: "Manrope, sans-serif",
                            textDecoration: "none",
                        }}
                    >
                        try it free
                    </Link>
                </div>
            </nav>
        </>
    );
}

