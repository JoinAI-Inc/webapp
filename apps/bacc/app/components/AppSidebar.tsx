"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, FolderOpen, Menu } from "lucide-react";
import { UserMenuButton } from "./UserMenu";
import { usePathname } from "next/navigation";

const IMAGE_URL = (process.env.NEXT_PUBLIC_IMAGE_URL || 'https://pub-cfc37210b6a543b492b7f0e494faac09.r2.dev/bacc/image').replace(/\/$/, '');

/**
 * 应用级侧边栏 Shell，与 studio 路由组的导航保持视觉一致。
 * 在 generate/[id] 等子页面中独立使用。
 */
export function AppSidebar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const items = [
        { href: '/generate', Icon: LayoutGrid, label: 'Templates', active: !pathname.includes('/generate/') },
        { href: '/gallery', Icon: FolderOpen, label: 'My Gallery', active: pathname === '/gallery' },
    ];

    useEffect(() => {
        if (!mobileMenuOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [mobileMenuOpen]);

    return (
        <>
            <header className="flex h-[56px] w-full flex-shrink-0 items-center justify-between border-b border-[#f6f6f6] bg-white px-[16px] py-[12px] tablet:hidden">
                <div className="flex items-center gap-[8px]">
                    <div className="relative" ref={mobileMenuRef}>
                        <button
                            type="button"
                            aria-label="Open navigation menu"
                            aria-expanded={mobileMenuOpen}
                            onClick={() => setMobileMenuOpen((open) => !open)}
                            className="flex size-[32px] items-center justify-center text-[#080606]"
                        >
                            <Menu size={24} strokeWidth={2} />
                        </button>

                        {mobileMenuOpen && (
                            <nav className="absolute left-[0px] top-[44px] z-[100] w-[188px] overflow-hidden rounded-[12px] border border-[#f2f2f3] bg-white py-[6px] shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                                {items.map(({ href, Icon, label, active }) => (
                                    <Link
                                        key={label}
                                        href={href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`mx-[6px] flex h-[40px] items-center gap-[10px] rounded-[8px] px-[10px] text-[14px] leading-[1.4] tracking-[0.14px] transition-colors ${active
                                            ? "bg-[#FEF2F2] text-[#EC2E2E]"
                                            : "text-[#6A696C] hover:bg-[#F2F2F3]"
                                            }`}
                                    >
                                        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                                        <span>{label}</span>
                                    </Link>
                                ))}
                            </nav>
                        )}
                    </div>

                    <Link href="/" className="flex h-[28px] w-[126px] shrink-0 items-center">
                        <Image
                            src={`${IMAGE_URL}/new-home/icon-web.png`}
                            alt="lucky-photo"
                            width={126}
                            height={28}
                            className="h-[28px] w-[126px] object-contain object-left"
                            priority
                        />
                    </Link>
                </div>

                <UserMenuButton mobileCompact />
            </header>

            <aside className="hidden h-full w-[52px] flex-shrink-0 flex-col items-center gap-[20px] border-r border-gray-100 bg-white py-[16px] z-10 tablet:flex">
                {/* Logo */}
                <Link href="/" className="mb-[12px] flex items-center justify-center">
                    <Image
                        src={`${IMAGE_URL}/new-home/icon-web.png`}
                        alt="lucky-photo"
                        width={28}
                        height={28}
                        className="object-contain"
                    />
                </Link>

                {/* Nav Icons */}
                {items.map(({ href, Icon, label, active }) => (
                    <Link
                        key={label}
                        href={href}
                        title={label}
                        className={`w-[36px] h-[36px] flex items-center justify-center rounded-xl transition-all ${active
                            ? "bg-[#FF3F2A]/10 text-[#FF3F2A]"
                            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            }`}
                    >
                        <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                    </Link>
                ))}

                {/* Bottom: User Button */}
                <div className="mt-auto">
                    <UserMenuButton />
                </div>
            </aside>
        </>
    );
}
