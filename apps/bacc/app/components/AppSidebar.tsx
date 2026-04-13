"use client";

import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, FolderOpen } from "lucide-react";
import { UserMenuButton } from "./UserMenu";
import { usePathname } from "next/navigation";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

/**
 * 应用级侧边栏 Shell，与 GenerateStudio 内的侧边栏保持视觉一致。
 * 在 generate/[id] 等子页面中独立使用。
 */
export function AppSidebar() {
    const pathname = usePathname();

    const items = [
        { href: '/generate', Icon: LayoutGrid, label: 'Templates', active: !pathname.includes('/generate/') },
        { href: '/generate?tab=gallery', Icon: FolderOpen, label: 'My Gallery', active: false },
    ];

    return (
        <aside className="w-[52px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-5 z-10 h-full">
            {/* Logo */}
            <Link href="/" className="mb-3 flex items-center justify-center">
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
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${active
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
    );
}
