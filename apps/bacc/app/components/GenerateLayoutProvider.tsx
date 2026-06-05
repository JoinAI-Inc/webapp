"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";
import type { ReactNode, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu } from "lucide-react";
import { UserMenuButton } from "./UserMenu";

type TabType = "idea" | "gallery" | "favorites";
type NavIconProps = SVGProps<SVGSVGElement> & { size?: number | string };

interface GenerateContextProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    latestTaskId: string | null;
    setLatestTaskId: (id: string | null) => void;
}

const GenerateContext = createContext<GenerateContextProps | null>(null);

function IdeaNavIcon({ size = 20, ...props }: NavIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <g transform="translate(2.33 2.37)">
                <path
                    d="M15.35 4.75C15.35 2.13 13.21 0 10.58 0C9.51 0 8.5 0.35 7.67 0.99C6.84 0.35 5.83 0 4.76 0C2.14 0 0 2.13 0 4.75C0 5.32 0.1 5.87 0.3 6.39C0.45 6.83 0.68 7.25 0.98 7.63C0.34 8.45 0 9.45 0 10.5C0 11.11 0.12 11.7 0.33 12.24H0.34C0.42 12.45 0.52 12.66 0.63 12.86C0.69 12.96 0.75 13.06 0.81 13.15C1.42 14.04 2.3 14.72 3.35 15.04C3.59 15.11 3.83 15.17 4.09 15.21C4.31 15.23 4.53 15.25 4.76 15.25C5.44 15.25 6.09 15.11 6.68 14.85C7.03 14.7 7.37 14.5 7.67 14.26H7.68C7.84 14.14 7.98 14.01 8.12 13.87C8.31 13.68 8.48 13.48 8.62 13.27C8.92 12.86 9.15 12.41 9.3 11.92C9.34 11.77 9.38 11.62 9.41 11.47C9.45 11.3 9.48 11.12 9.49 10.94C9.51 10.79 9.52 10.64 9.52 10.49V10.43C9.55 10.09 9.85 9.83 10.19 9.83C10.57 9.83 10.87 10.13 10.87 10.51C10.87 11.74 10.51 12.87 9.89 13.83C9.62 14.24 9.3 14.62 8.94 14.96C9.45 15.15 10 15.25 10.58 15.25C13.21 15.25 15.35 13.12 15.35 10.49C15.35 9.44 15.01 8.44 14.37 7.62C15.01 6.8 15.35 5.79 15.35 4.74V4.75ZM3.34 6.23C3.1 6.13 3.1 5.8 3.34 5.71C4.17 5.36 4.83 4.69 5.18 3.87C5.27 3.63 5.6 3.63 5.7 3.87C6 4.6 6.57 5.21 7.28 5.58C7.36 5.63 7.45 5.67 7.54 5.71C7.78 5.8 7.78 6.13 7.54 6.23C6.71 6.57 6.04 7.24 5.7 8.07C5.6 8.31 5.27 8.31 5.18 8.07C5.15 8 5.12 7.93 5.07 7.86C4.71 7.13 4.1 6.54 3.34 6.23Z"
                    fill="currentColor"
                />
                <path
                    d="M15.35 4.75C15.35 2.13 13.21 0 10.58 0C9.51 0 8.5 0.35 7.67 0.99C6.84 0.35 5.83 0 4.76 0C2.14 0 0 2.13 0 4.75C0 5.32 0.1 5.87 0.3 6.39C0.45 6.83 0.68 7.25 0.98 7.63C0.34 8.45 0 9.45 0 10.5C0 11.11 0.12 11.7 0.33 12.24H0.34C0.42 12.45 0.52 12.66 0.63 12.86C0.69 12.96 0.75 13.06 0.81 13.15C1.42 14.04 2.3 14.72 3.35 15.04C3.59 15.11 3.83 15.17 4.09 15.21C4.31 15.23 4.53 15.25 4.76 15.25C5.44 15.25 6.09 15.11 6.68 14.85C7.03 14.7 7.37 14.5 7.67 14.26H7.68C7.84 14.14 7.98 14.01 8.12 13.87C8.31 13.68 8.48 13.48 8.62 13.27C8.92 12.86 9.15 12.41 9.3 11.92C9.34 11.77 9.38 11.62 9.41 11.47C9.45 11.3 9.48 11.12 9.49 10.94C9.51 10.79 9.52 10.64 9.52 10.49V10.43C9.55 10.09 9.85 9.83 10.19 9.83C10.57 9.83 10.87 10.13 10.87 10.51C10.87 11.74 10.51 12.87 9.89 13.83C9.62 14.24 9.3 14.62 8.94 14.96C9.45 15.15 10 15.25 10.58 15.25C13.21 15.25 15.35 13.12 15.35 10.49C15.35 9.44 15.01 8.44 14.37 7.62C15.01 6.8 15.35 5.79 15.35 4.74V4.75ZM3.34 6.23C3.1 6.13 3.1 5.8 3.34 5.71C4.17 5.36 4.83 4.69 5.18 3.87C5.27 3.63 5.6 3.63 5.7 3.87C6 4.6 6.57 5.21 7.28 5.58C7.36 5.63 7.45 5.67 7.54 5.71C7.78 5.8 7.78 6.13 7.54 6.23C6.71 6.57 6.04 7.24 5.7 8.07C5.6 8.31 5.27 8.31 5.18 8.07C5.15 8 5.12 7.93 5.07 7.86C4.71 7.13 4.1 6.54 3.34 6.23Z"
                    fill="black"
                    fillOpacity="0.2"
                />
                <path
                    d="M7.54016 6.22994C6.71016 6.56994 6.04016 7.23994 5.70016 8.06994C5.60016 8.30994 5.27016 8.30994 5.18016 8.06994C5.15016 7.99994 5.12016 7.92994 5.07016 7.85994C4.71016 7.12994 4.10016 6.53994 3.34016 6.22994C3.10016 6.12994 3.10016 5.79994 3.34016 5.70994C4.17016 5.35994 4.83016 4.68994 5.18016 3.86994C5.27016 3.62994 5.60016 3.62994 5.70016 3.86994C6.00016 4.59994 6.57016 5.20994 7.28016 5.57994C7.36016 5.62994 7.45016 5.66994 7.54016 5.70994C7.78016 5.79994 7.78016 6.12994 7.54016 6.22994Z"
                    fill="#FFE944"
                />
            </g>
        </svg>
    );
}

function GalleryNavIcon({ size = 20, ...props }: NavIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <g transform="translate(2.57 1.81)">
                <path
                    d="M14.2242 1.27674C13.7742 0.75674 13.1442 0.43674 12.4642 0.39674L7.19418 0.00673976C6.50418 -0.0432602 5.84418 0.18674 5.32418 0.63674C4.80418 1.08674 4.49418 1.71674 4.44418 2.39674V2.48674L2.30418 2.70674C1.61418 2.77674 0.994184 3.11674 0.564184 3.65674C0.134184 4.18674 -0.0558162 4.85674 0.0141838 5.52674L0.894184 14.0767C0.964184 14.7667 1.29418 15.3767 1.82418 15.8167C2.28418 16.1967 2.85418 16.3867 3.43418 16.3867C3.52418 16.3867 3.62418 16.3867 3.71418 16.3667L8.96418 15.8267C10.0042 15.7267 10.8242 15.0267 11.1342 14.0767L11.4642 14.0967C11.5242 14.0967 11.5842 14.0967 11.6442 14.0967C12.2642 14.0967 12.8542 13.8767 13.3342 13.4667C13.8542 13.0167 14.1742 12.3867 14.2142 11.7067L14.8442 3.13674C14.8942 2.44674 14.6742 1.78674 14.2242 1.26674V1.27674ZM8.83418 14.4767L3.57418 15.0167C3.24418 15.0467 2.92418 14.9567 2.67418 14.7567C2.42418 14.5467 2.26418 14.2567 2.23418 13.9267L1.35418 5.37674C1.32418 5.05674 1.41418 4.74674 1.61418 4.49674C1.82418 4.23674 2.11418 4.07674 2.44418 4.04674L4.33418 3.85674L3.81418 10.9667C3.76418 11.6567 3.98418 12.3167 4.43418 12.8367C4.88418 13.3567 5.51418 13.6767 6.19418 13.7167L9.70418 13.9767C9.50418 14.2567 9.19418 14.4467 8.83418 14.4867V14.4767ZM13.4942 3.04674L12.8642 11.6167C12.8442 11.9367 12.6942 12.2367 12.4442 12.4467C12.1942 12.6567 11.8842 12.7667 11.5542 12.7467L10.6642 12.6767C10.6642 12.6767 10.6542 12.6767 10.6442 12.6767L6.29418 12.3567C5.97418 12.3367 5.67418 12.1867 5.46418 11.9367C5.25418 11.6867 5.14418 11.3667 5.16418 11.0467L5.73418 3.13674L5.78418 2.48674C5.80418 2.15674 5.95418 1.86674 6.20418 1.64674C6.43418 1.44674 6.71418 1.34674 7.01418 1.34674C7.04418 1.34674 7.07418 1.34674 7.09418 1.34674L12.3642 1.73674C12.6942 1.75674 12.9842 1.90674 13.2042 2.15674C13.4142 2.40674 13.5242 2.71674 13.4942 3.04674Z"
                    fill="currentColor"
                />
                <path
                    d="M11.8542 4.92674C11.8642 4.46674 11.3042 4.26674 11.0142 4.61674C10.4042 5.35674 9.73418 5.86674 9.08418 6.06674C8.75418 6.16674 8.62418 6.51674 8.80418 6.81674C9.16418 7.39674 9.34418 8.21674 9.32418 9.17674C9.31418 9.63674 9.87418 9.83674 10.1642 9.48674C10.7742 8.74674 11.4442 8.23674 12.0942 8.03674C12.4242 7.93674 12.5542 7.58674 12.3742 7.28674C12.0142 6.70674 11.8342 5.88674 11.8542 4.92674Z"
                    fill="currentColor"
                />
            </g>
        </svg>
    );
}

export function useGenerateContext() {
    const context = useContext(GenerateContext);
    if (!context) throw new Error("useGenerateContext must be used within a GenerateLayoutProvider");
    return context;
}

export function GenerateLayoutProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    let activeTab: TabType = "idea";
    if (pathname?.includes("/gallery")) activeTab = "gallery";
    else if (pathname?.includes("/favorites")) activeTab = "favorites";

    const setActiveTab = (tab: TabType) => {
        if (tab === "idea") router.push("/generate");
        else if (tab === "gallery") router.push("/gallery");
        else if (tab === "favorites") router.push("/favorites");
    };

    const [latestTaskId, setLatestTaskId] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mobileMenuOpen]);

    const IMAGE_URL = (process.env.NEXT_PUBLIC_IMAGE_URL || 'https://pub-cfc37210b6a543b492b7f0e494faac09.r2.dev/bacc/image').replace(/\/$/, '');

    const SELECTED_BG = `${IMAGE_URL}/new-home/bg-nav-button-selected.png`;



    const sidebarItems = [
        { tab: "idea", Icon: IdeaNavIcon, label: "Idea" },
        { tab: "gallery", Icon: GalleryNavIcon, label: "Gallery" },
        // { tab: "favorites", Icon: Heart, label: "Favorites" },
    ] satisfies { tab: TabType; Icon: (props: NavIconProps) => ReactNode; label: string }[];

    return (
        <GenerateContext.Provider value={{
            activeTab, setActiveTab,
            latestTaskId, setLatestTaskId
        }}>
            <div className="flex flex-col h-screen bg-white overflow-hidden w-full">
                {/* Top Header */}
                <header className="relative z-[150] h-[56px] tablet:h-[64px] w-full bg-white flex items-center justify-center border-b border-[#F6F6F6]">
                    {/* Left: Logo & Nav */}
                    <div className="flex h-full w-full items-center justify-between px-[16px] tablet:w-[92vw] tablet:max-w-[92vw] tablet:px-[0px] desktop:max-w-[1600px]">
                        <div className="flex flex-row items-center justify-center gap-[8px] tablet:gap-[32px]">
                            {/* Mobile Hamburger Menu */}
                            <div className="tablet:hidden relative flex items-center" ref={menuRef}>
                                <button
                                    type="button"
                                    aria-label="Open navigation menu"
                                    aria-expanded={mobileMenuOpen}
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="flex size-[32px] items-center justify-center text-[#080606]"
                                >
                                    <Menu size={24} strokeWidth={2} />
                                </button>

                                {mobileMenuOpen && (
                                    <div className="absolute top-[calc(100%+16px)] left-[0px] w-[200px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-150 py-[8px]">
                                        {sidebarItems.map(({ tab, Icon, label }) => {
                                            const isActive = activeTab === tab;
                                            return (
                                                <button
                                                    key={tab}
                                                    onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
                                                    className={`w-[calc(100%-16px)] mx-[8px] my-[4px] flex items-center gap-[12px] px-[12px] py-[10px] rounded-[12px] transition-all bg-center bg-no-repeat bg-[length:100%_100%] ${isActive
                                                        ? "text-[#0A0708]"
                                                        : "text-gray-500 hover:bg-[#F2F2F3]"
                                                        }`}
                                                    style={isActive ? { backgroundImage: `url(${SELECTED_BG})` } : undefined}
                                                >
                                                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? "text-[#0A0708]" : ""} />
                                                    <span className={`text-[15px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <Link href="/" className="flex h-[28px] w-[126px] items-center justify-center tablet:h-auto tablet:w-auto">
                                <Image
                                    src={`${IMAGE_URL}/new-home/icon-web.png`}
                                    alt="lucky-photo"
                                    width={126}
                                    height={28}
                                    className="h-[28px] w-[126px] object-contain object-left tablet:h-auto tablet:w-[153px]"
                                    priority
                                />
                                <span></span>
                            </Link>

                            <nav className="hidden tablet:flex items-center gap-[8px]">
                                {sidebarItems.map(({ tab, Icon, label }) => {
                                    const isActive = activeTab === tab;
                                    return (
                                        <button
                                            key={tab}
                                            title={label}
                                            onClick={() => setActiveTab(tab)}
                                            className={`h-[32px] px-[12px] py-[6px] flex items-center justify-center gap-[4px] rounded-[16px] transition-all bg-center bg-no-repeat bg-[length:100%_100%] ${isActive
                                                ? "text-[#080606]"
                                                : "text-[#6A696C] hover:bg-[#F2F2F3]"
                                                }`}
                                            style={isActive ? { backgroundImage: `url(${SELECTED_BG})` } : undefined}
                                        >
                                            <Icon
                                                size={20}
                                                strokeWidth={isActive ? 2.2 : 1.8}
                                                className={`shrink-0 ${isActive ? "text-[#0A0708]" : "text-[#6A696C]"}`}
                                            />
                                            <span className={`text-[14px] leading-[1.4] tracking-[0.14px] ${isActive ? 'font-medium' : 'font-normal'}`}>{label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right: User Button */}
                        <div className="flex items-center tablet:hidden">
                            <UserMenuButton mobileCompact />
                        </div>
                        <div className="hidden items-center tablet:flex">
                            <UserMenuButton />
                        </div>
                    </div>


                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </div>
        </GenerateContext.Provider>
    );
}
