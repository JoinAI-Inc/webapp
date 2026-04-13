"use client";

import { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, FolderOpen, Heart, Menu } from "lucide-react";
import { UserMenuButton } from "./UserMenu";

type TabType = "idea" | "gallery" | "favorites";

interface GenerateContextProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    latestTaskId: string | null;
    setLatestTaskId: (id: string | null) => void;
    selectedTemplateId: string | null;
    setSelectedTemplateId: (id: string | null) => void;
}

const GenerateContext = createContext<GenerateContextProps | null>(null);

export function useGenerateContext() {
    const context = useContext(GenerateContext);
    if (!context) throw new Error("useGenerateContext must be used within a GenerateLayoutProvider");
    return context;
}

export function GenerateLayoutProvider({ children }: { children: ReactNode }) {
    const [activeTab, setActiveTab] = useState<TabType>("idea");
    const [latestTaskId, setLatestTaskId] = useState<string | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
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

    const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

    const SELECTED_BG = IMAGE_URL + '/new-home/bg-nav-button-selected.png';



    const sidebarItems: { tab: TabType; Icon: React.ElementType; label: string }[] = [
        { tab: "idea", Icon: LayoutGrid, label: "Idea" },
        { tab: "gallery", Icon: FolderOpen, label: "Gallery" },
        { tab: "favorites", Icon: Heart, label: "Favorites" },
    ];

    return (
        <GenerateContext.Provider value={{
            activeTab, setActiveTab,
            latestTaskId, setLatestTaskId,
            selectedTemplateId, setSelectedTemplateId
        }}>
            <div className="flex flex-col h-screen bg-white overflow-hidden w-full">
                {/* Top Header */}
                <header className="h-[56px] tablet:h-[64px] w-full bg-white flex items-center justify-center z-10 border-b border-[#F6F6F6]">
                    {/* Left: Logo & Nav */}
                    <div className="flex items-center w-[92vw] max-w-[92vw] desktop:max-w-[1600px] justify-between">
                        <div className="flex flex-row items-center justify-center gap-[12px] tablet:gap-[32px]">
                            {/* Mobile Hamburger Menu */}
                            <div className="tablet:hidden relative flex items-center" ref={menuRef}>
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#FFF0F0] text-[#FF3F2A]"
                                >
                                    <Menu size={20} strokeWidth={2.5} />
                                </button>

                                {mobileMenuOpen && (
                                    <div className="absolute top-[calc(100%+16px)] left-0 w-[200px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-150 py-2">
                                        {sidebarItems.map(({ tab, Icon, label }) => {
                                            const isActive = activeTab === tab;
                                            return (
                                                <button
                                                    key={tab}
                                                    onClick={() => { setActiveTab(tab); setSelectedTemplateId(null); setMobileMenuOpen(false); }}
                                                    className={`w-[calc(100%-16px)] mx-2 my-1 flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all bg-center bg-no-repeat bg-[length:100%_100%] ${isActive
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

                            <Link href="/" className="flex items-center justify-center">
                                <Image
                                    src={`${IMAGE_URL}/new-home/icon-web.png`}
                                    alt="lucky-photo"
                                    width={153}
                                    height={32}
                                    className="object-contain w-[120px] tablet:w-[153px]"
                                />
                                <span></span>
                            </Link>

                            <nav className="hidden tablet:flex items-center gap-2">
                                {sidebarItems.map(({ tab, Icon, label }) => {
                                    const isActive = activeTab === tab;
                                    return (
                                        <button
                                            key={tab}
                                            title={label}
                                            onClick={() => { setActiveTab(tab); setSelectedTemplateId(null); }}
                                            className={`h-[32px] px-[12px] py-[6px] flex items-center justify-center gap-2 rounded-[16px] transition-all bg-center bg-no-repeat bg-[length:100%_100%] ${isActive
                                                ? "text-[#0A0708]"
                                                : "text-gray-500 hover:bg-[#F2F2F3]"
                                                }`}
                                            style={isActive ? { backgroundImage: `url(${SELECTED_BG})` } : undefined}
                                        >
                                            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                                            <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right: User Button */}
                        <div className="flex items-center">
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
