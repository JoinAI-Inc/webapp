"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog", hidden: true },
  { label: "About", href: "/about" },
  { label: "Poke", href: "/poke" },
];

const navConfigs = {
  default: {
    transparentTone: "dark",
  },
  "/poke": {
    transparentTone: "light",
  },
} as const;

export default function LandingNavBar() {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navConfig = navConfigs[pathname as keyof typeof navConfigs] ?? navConfigs.default;
  const isTransparentLight = navConfig.transparentTone === "light";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header || !isMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!header.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <style>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 64px;
          border-bottom: 1px solid transparent;
          background: transparent;
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .site-header.site-header-scrolled {
          background-color: #fff;
          background-image: none;
          border-bottom-color: rgba(10, 7, 8, 0.04);
          box-shadow: 0 1px 0 rgba(10, 7, 8, 0.02);
        }

        .site-header-inner {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 176px) 1fr minmax(0, 176px);
          align-items: center;
          width: 87.5vw;
          max-width: 1440px;
          height: 100%;
          margin: 0 auto;
        }

        .site-logo {
          display: inline-flex;
          align-items: center;
          justify-self: start;
          height: 32px;
        }

        .site-logo img {
          display: block;
          width: auto;
          height: 32px;
          object-fit: contain;
          -webkit-user-drag: none;
        }

        .site-logo img.site-logo-image-light {
          display: none;
        }

        .site-header-transparent-light:not(.site-header-scrolled) .site-logo img.site-logo-image-default {
          display: none;
        }

        .site-header-transparent-light:not(.site-header-scrolled) .site-logo img.site-logo-image-light {
          display: block;
        }

        .site-header-transparent-light.site-header-scrolled .site-logo img.site-logo-image-default {
          display: block;
        }

        .site-header-transparent-light.site-header-scrolled .site-logo img.site-logo-image-light {
          display: none;
        }

        .site-nav {
          display: inline-flex;
          align-items: stretch;
          justify-content: center;
          height: 100%;
        }

        .site-nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 0 20px;
          color: #39383b;
          font-family: Manrope, sans-serif;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.4;
          text-decoration: none;
          transition:
            color 160ms ease,
            background-color 160ms ease;
        }

        .site-nav-link:hover {
          color: #0a0708;
        }

        .site-nav-link-active {
          color: #ec2e2e;
          font-weight: 500;
        }

        .site-nav-link-active:hover {
          color: #d42424;
          font-weight: 500;
        }

        .site-header-transparent-light:not(.site-header-scrolled) .site-nav-link {
          color: rgba(255, 255, 255, 0.78);
        }

        .site-header-transparent-light:not(.site-header-scrolled) .site-nav-link:hover,
        .site-header-transparent-light:not(.site-header-scrolled) .site-nav-link-active,
        .site-header-transparent-light:not(.site-header-scrolled) .site-nav-link-active:hover {
          color: #fff;
        }

        .site-nav-link[data-hidden=true],
        .site-mobile-menu-link[data-hidden=true] {
          display: none;
        }

        .site-cta {
          position: relative;
          display: inline-flex;
          min-height: 32px;
          align-items: center;
          justify-content: center;
          justify-self: end;
          padding: 0 16px;
          overflow: hidden;
          border: 1px solid rgba(236, 46, 46, 0.16);
          border-radius: 999px;
          background: #ec2e2e;
          color: #fff;
          font-family: Manrope, sans-serif;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.4;
          text-decoration: none;
          transition:
            background-color 160ms ease,
            border-color 160ms ease,
            color 160ms ease;
        }

        .site-cta:hover {
          border-color: rgba(212, 36, 36, 0.18);
          background: #d42424;
        }

        .site-header-transparent-light:not(.site-header-scrolled) .site-cta {
          border-color: rgba(255, 255, 255, 0.42);
          background: #fff;
          color: #ec2e2e;
        }

        .site-header-transparent-light:not(.site-header-scrolled) .site-cta:hover {
          border-color: #fff;
          background: #fff7f7;
          color: #d42424;
        }

        .site-menu-button {
          display: none;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          padding: 0;
          border: 0;
          border-radius: 8px;
          background: transparent url(/landing-nav/lucky-photo-menu-icon.svg) center / 24px 24px no-repeat;
          color: transparent;
          font-size: 0;
          cursor: pointer;
        }

        .site-menu-button.is-open {
          background-color: rgba(10, 7, 8, 0.04);
        }

        .site-header-transparent-light:not(.site-header-scrolled) .site-menu-button {
          background-image: url(/landing-nav/lucky-photo-menu-icon-light.svg);
        }

        .site-header-transparent-light:not(.site-header-scrolled) .site-menu-button.is-open {
          background-color: rgba(255, 255, 255, 0.14);
        }

        .site-mobile-menu {
          display: none;
        }

        @media (min-width: 1068px) {
          .site-nav-link {
            font-size: 14px;
          }
        }

        @media (max-width: 899px) {
          .site-header-inner {
            grid-template-columns: auto auto 1fr auto;
            column-gap: 0;
          }

          .site-menu-button {
            display: inline-flex;
            grid-column: 1;
            grid-row: 1;
            justify-self: start;
            transform: translateX(-8px);
          }

          .site-logo {
            grid-column: 2;
            grid-row: 1;
            height: 28px;
            justify-self: start;
          }

          .site-logo img {
            height: 28px;
          }

          .site-nav {
            display: none;
          }

          .site-cta {
            grid-column: 4;
            grid-row: 1;
          }

          .site-mobile-menu {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 20;
            display: flex;
            min-width: 168px;
            flex-direction: column;
            padding: 8px;
            border: 1px solid rgba(10, 7, 8, 0.06);
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 22px 56px rgba(10, 7, 8, 0.16);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateY(-6px);
            transition:
              opacity 180ms ease,
              visibility 180ms ease,
              transform 180ms ease;
          }

          .site-header.is-mobile-menu-open .site-mobile-menu {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateY(0);
          }

          .site-mobile-menu-link {
            display: flex;
            min-height: 40px;
            align-items: center;
            padding: 0 12px;
            border-radius: 8px;
            color: #39383b;
            font-family: Manrope, sans-serif;
            font-size: 14px;
            font-weight: 400;
            line-height: 1.4;
            text-decoration: none;
            transition:
              background-color 160ms ease,
              color 160ms ease;
          }

          .site-mobile-menu-link:hover {
            background: #f2f2f3;
            color: #0a0708;
          }

          .site-mobile-menu-link-active {
            color: #ec2e2e;
          }
        }
      `}</style>
      <header
        ref={headerRef}
        className={[
          "site-header",
          isTransparentLight ? "site-header-transparent-light" : "",
          isScrolled ? "site-header-scrolled" : "",
          isMenuOpen ? "is-mobile-menu-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="site-header-inner">
          <button
            type="button"
            className={`site-menu-button${isMenuOpen ? " is-open" : ""}`}
            aria-expanded={isMenuOpen}
            aria-controls="site-mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((open) => !open);
            }}
          >
            Menu
          </button>

          <Link
            href="/"
            className="site-logo"
            aria-label="Lucky Photo home"
            onClick={() => setIsMenuOpen(false)}
          >
            <Image
              className="site-logo-image site-logo-image-default"
              src="/landing-nav/lucky-photo-logo.svg"
              alt="Lucky Photo"
              width={144}
              height={32}
              priority
            />
            <Image
              className="site-logo-image site-logo-image-light"
              src="/landing-nav/lucky-photo-logo-light.svg"
              alt=""
              width={144}
              height={32}
              aria-hidden="true"
            />
          </Link>

          <nav className="site-nav" aria-label="Primary navigation">
            {navItems.map(({ label, href, hidden }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`site-nav-link${isActive ? " site-nav-link-active" : ""}`}
                  data-hidden={hidden ? "true" : undefined}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/generate"
            className="site-cta"
            aria-label="Try it free"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="site-cta-label">Try it free</span>
          </Link>

          <nav
            id="site-mobile-menu"
            className="site-mobile-menu"
            aria-label="Mobile navigation"
          >
            {navItems.map(({ label, href, hidden }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`site-mobile-menu-link${
                    isActive ? " site-mobile-menu-link-active" : ""
                  }`}
                  data-hidden={hidden ? "true" : undefined}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
}
