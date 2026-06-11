"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";
import type { ReactNode, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu } from "lucide-react";
import { UserMenuButton } from "./UserMenu";
import {
    FavoritesSkeleton,
    GalleryGridSkeleton,
    GenerateStudioSkeleton,
    TemplateDetailSkeleton,
} from "./Skeletons";

type TabType = "idea" | "gallery" | "favorites";
type NavIconProps = SVGProps<SVGSVGElement> & { size?: number | string };

interface GenerateContextProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    startNavigation: (href: string) => void;
    latestTaskId: string | null;
    setLatestTaskId: (id: string | null) => void;
}

const GenerateContext = createContext<GenerateContextProps | null>(null);

function IdeaNavIcon({ size = 20, ...props }: NavIconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            {...props}>
            <path d="M9.86998 8.08C9.03998 7.73 8.36998 7.07 8.02998 6.24C7.92998 6 7.59998 6 7.49998 6.24C7.14998 7.06 6.48998 7.73 5.65998 8.08C5.41998 8.18 5.41998 8.5 5.65998 8.6C6.48998 8.95 7.14998 9.61 7.49998 10.44C7.59998 10.68 7.91998 10.68 8.02998 10.44C8.36998 9.61 9.03998 8.94 9.86998 8.6C10.11 8.5 10.11 8.18 9.86998 8.08Z" fill="#6A696C" />
            <path d="M17.6701 7.12C17.6701 4.5 15.5301 2.37 12.9101 2.37C11.8401 2.37 10.8301 2.74 10.0001 3.39C9.17007 2.74 8.16007 2.37 7.09007 2.37C4.46007 2.37 2.32007 4.5 2.32007 7.12C2.32007 8.17 2.68007 9.17 3.32007 10C2.68007 10.82 2.32007 11.82 2.32007 12.87C2.32007 15.5 4.46007 17.63 7.09007 17.63C9.72007 17.63 11.8401 15.49 11.8401 12.87C11.8401 12.5 11.5401 12.2 11.1701 12.2C10.8001 12.2 10.5001 12.5 10.5001 12.87C10.5001 14.75 8.97007 16.29 7.09007 16.29C5.21007 16.29 3.67007 14.76 3.67007 12.87C3.67007 11.97 4.02007 11.12 4.66007 10.48C4.70007 10.44 4.72007 10.39 4.75007 10.34C4.77007 10.31 4.79007 10.29 4.80007 10.26C4.82007 10.21 4.82007 10.17 4.83007 10.12C4.83007 10.08 4.85007 10.05 4.85007 10.01C4.85007 9.96 4.83007 9.92 4.82007 9.87C4.82007 9.83 4.82007 9.79 4.80007 9.75C4.78007 9.7 4.74007 9.64999 4.71007 9.60999C4.69007 9.57999 4.68007 9.54999 4.66007 9.52999C4.02007 8.87999 3.66007 8.02 3.66007 7.12C3.66007 5.24 5.19007 3.71 7.08007 3.71C8.00007 3.71 8.86007 4.07 9.51007 4.73C9.54007 4.76 9.58007 4.78 9.62007 4.8C9.66007 4.82 9.69007 4.85 9.73007 4.87C9.77007 4.89 9.82007 4.89 9.86007 4.9C9.90007 4.9 9.94007 4.92 9.98007 4.92C10.0201 4.92 10.0601 4.9 10.1001 4.9C10.1501 4.9 10.1901 4.9 10.2301 4.87C10.2701 4.85 10.3001 4.82 10.3401 4.8C10.3801 4.78 10.4201 4.76 10.4501 4.73C11.1001 4.07 11.9601 3.71 12.8801 3.71C14.7601 3.71 16.3001 5.24 16.3001 7.12C16.3001 8.02 15.9501 8.87999 15.3001 9.52999C15.2801 9.54999 15.2701 9.58999 15.2501 9.60999C15.2201 9.66 15.1801 9.7 15.1601 9.75C15.1401 9.79 15.1401 9.83 15.1401 9.87C15.1401 9.91 15.1201 9.96 15.1201 10C15.1201 10.04 15.1401 10.08 15.1401 10.12C15.1401 10.17 15.1401 10.21 15.1701 10.26C15.1801 10.29 15.2101 10.32 15.2301 10.35C15.2601 10.4 15.2801 10.45 15.3201 10.49C15.9601 11.13 16.3101 11.98 16.3101 12.88C16.3101 14.76 14.7801 16.3 12.8901 16.3C12.5201 16.3 12.2201 16.6 12.2201 16.97C12.2201 17.34 12.5201 17.64 12.8901 17.64C15.5201 17.64 17.6501 15.5 17.6501 12.88C17.6501 11.82 17.2901 10.83 16.6501 10.01C17.2901 9.18 17.6501 8.19 17.6501 7.13L17.6701 7.12Z" fill="#6A696C" />
        </svg>
    );
}

function IdeaActiveNavIcon(props: NavIconProps) {
    // Replace this return value with the final active-state Idea icon.
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
            <path d="M17.6801 7.12C17.6801 4.5 15.5401 2.37 12.9101 2.37C11.8401 2.37 10.8301 2.72 10.0001 3.36C9.17008 2.72 8.16008 2.37 7.09008 2.37C4.47008 2.37 2.33008 4.5 2.33008 7.12C2.33008 7.69 2.43008 8.24 2.63008 8.76C2.78008 9.2 3.01008 9.62 3.31008 10C2.67008 10.82 2.33008 11.82 2.33008 12.87C2.33008 13.48 2.45008 14.07 2.66008 14.61H2.67008C2.75008 14.82 2.85008 15.03 2.96008 15.23C3.02008 15.33 3.08008 15.43 3.14008 15.52C3.75008 16.41 4.63008 17.09 5.68008 17.41C5.92008 17.48 6.16008 17.54 6.42008 17.58C6.64008 17.6 6.86008 17.62 7.09008 17.62C7.77008 17.62 8.42008 17.48 9.01008 17.22C9.36008 17.07 9.70008 16.87 10.0001 16.63H10.0101C10.1701 16.51 10.3101 16.38 10.4501 16.24C10.6401 16.05 10.8101 15.85 10.9501 15.64C11.2501 15.23 11.4801 14.78 11.6301 14.29C11.6701 14.14 11.7101 13.99 11.7401 13.84C11.7801 13.67 11.8101 13.49 11.8201 13.31C11.8401 13.16 11.8501 13.01 11.8501 12.86V12.8C11.8801 12.46 12.1801 12.2 12.5201 12.2C12.9001 12.2 13.2001 12.5 13.2001 12.88C13.2001 14.11 12.8401 15.24 12.2201 16.2C11.9501 16.61 11.6301 16.99 11.2701 17.33C11.7801 17.52 12.3301 17.62 12.9101 17.62C15.5401 17.62 17.6801 15.49 17.6801 12.86C17.6801 11.81 17.3401 10.81 16.7001 9.99C17.3401 9.16999 17.6801 8.16 17.6801 7.11V7.12ZM5.67008 8.6C5.43008 8.5 5.43008 8.17 5.67008 8.08C6.50008 7.73 7.16008 7.06 7.51008 6.24C7.60008 5.99999 7.93008 5.99999 8.03008 6.24C8.33008 6.97 8.90008 7.58 9.61008 7.95C9.69008 8 9.78008 8.04 9.87008 8.08C10.1101 8.17 10.1101 8.5 9.87008 8.6C9.04008 8.94 8.37008 9.60999 8.03008 10.44C7.93008 10.68 7.60008 10.68 7.51008 10.44C7.48008 10.37 7.45008 10.3 7.40008 10.23C7.04008 9.49999 6.43008 8.91 5.67008 8.6Z" fill="#0A0708" />
            <path d="M17.6801 7.12C17.6801 4.5 15.5401 2.37 12.9101 2.37C11.8401 2.37 10.8301 2.72 10.0001 3.36C9.17008 2.72 8.16008 2.37 7.09008 2.37C4.47008 2.37 2.33008 4.5 2.33008 7.12C2.33008 7.69 2.43008 8.24 2.63008 8.76C2.78008 9.2 3.01008 9.62 3.31008 10C2.67008 10.82 2.33008 11.82 2.33008 12.87C2.33008 13.48 2.45008 14.07 2.66008 14.61H2.67008C2.75008 14.82 2.85008 15.03 2.96008 15.23C3.02008 15.33 3.08008 15.43 3.14008 15.52C3.75008 16.41 4.63008 17.09 5.68008 17.41C5.92008 17.48 6.16008 17.54 6.42008 17.58C6.64008 17.6 6.86008 17.62 7.09008 17.62C7.77008 17.62 8.42008 17.48 9.01008 17.22C9.36008 17.07 9.70008 16.87 10.0001 16.63H10.0101C10.1701 16.51 10.3101 16.38 10.4501 16.24C10.6401 16.05 10.8101 15.85 10.9501 15.64C11.2501 15.23 11.4801 14.78 11.6301 14.29C11.6701 14.14 11.7101 13.99 11.7401 13.84C11.7801 13.67 11.8101 13.49 11.8201 13.31C11.8401 13.16 11.8501 13.01 11.8501 12.86V12.8C11.8801 12.46 12.1801 12.2 12.5201 12.2C12.9001 12.2 13.2001 12.5 13.2001 12.88C13.2001 14.11 12.8401 15.24 12.2201 16.2C11.9501 16.61 11.6301 16.99 11.2701 17.33C11.7801 17.52 12.3301 17.62 12.9101 17.62C15.5401 17.62 17.6801 15.49 17.6801 12.86C17.6801 11.81 17.3401 10.81 16.7001 9.99C17.3401 9.16999 17.6801 8.16 17.6801 7.11V7.12ZM5.67008 8.6C5.43008 8.5 5.43008 8.17 5.67008 8.08C6.50008 7.73 7.16008 7.06 7.51008 6.24C7.60008 5.99999 7.93008 5.99999 8.03008 6.24C8.33008 6.97 8.90008 7.58 9.61008 7.95C9.69008 8 9.78008 8.04 9.87008 8.08C10.1101 8.17 10.1101 8.5 9.87008 8.6C9.04008 8.94 8.37008 9.60999 8.03008 10.44C7.93008 10.68 7.60008 10.68 7.51008 10.44C7.48008 10.37 7.45008 10.3 7.40008 10.23C7.04008 9.49999 6.43008 8.91 5.67008 8.6Z" fill="black" fillOpacity="0.2" />
            <path d="M9.87023 8.59994C9.04023 8.93994 8.37023 9.60994 8.03023 10.4399C7.93023 10.6799 7.60023 10.6799 7.51023 10.4399C7.48023 10.3699 7.45023 10.2999 7.40023 10.2299C7.04023 9.49994 6.43023 8.90994 5.67023 8.59994C5.43023 8.49994 5.43023 8.16994 5.67023 8.07994C6.50023 7.72994 7.16023 7.05994 7.51023 6.23994C7.60023 5.99994 7.93023 5.99994 8.03023 6.23994C8.33023 6.96994 8.90023 7.57994 9.61023 7.94994C9.69023 7.99994 9.78023 8.03994 9.87023 8.07994C10.1102 8.16994 10.1102 8.49994 9.87023 8.59994Z" fill="#FFE944" />
        </svg>
    );
}

function GalleryNavIcon({ size = 20, ...props }: NavIconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            {...props}>
            <path d="M16.8001 3.08997C16.3501 2.56997 15.7201 2.24997 15.0401 2.20997L9.77011 1.81997C9.08011 1.76997 8.42011 1.99997 7.90011 2.44997C7.38011 2.89997 7.07011 3.52997 7.02011 4.20997V4.29997L4.88011 4.51997C4.19011 4.58997 3.57011 4.92997 3.14011 5.46997C2.71011 5.99997 2.52011 6.66997 2.59011 7.33997L3.47011 15.89C3.54011 16.58 3.87011 17.19 4.40011 17.63C4.86011 18.01 5.43011 18.2 6.01011 18.2C6.10011 18.2 6.20011 18.2 6.29011 18.18L11.5401 17.64C12.5801 17.54 13.4001 16.84 13.7101 15.89L14.0401 15.91C14.1001 15.91 14.1601 15.91 14.2201 15.91C14.8401 15.91 15.4301 15.69 15.9101 15.28C16.4301 14.83 16.7501 14.2 16.7901 13.52L17.4201 4.94997C17.4701 4.25997 17.2501 3.59997 16.8001 3.07997V3.08997ZM11.4101 16.29L6.15011 16.83C5.82011 16.86 5.50011 16.77 5.25011 16.57C5.00011 16.36 4.84011 16.07 4.81011 15.74L3.93011 7.18997C3.90011 6.86997 3.99011 6.55997 4.19011 6.30997C4.40011 6.04997 4.69011 5.88997 5.02011 5.85997L6.91011 5.66997L6.39011 12.78C6.34011 13.47 6.56011 14.13 7.01011 14.65C7.46011 15.17 8.09011 15.49 8.77011 15.53L12.2801 15.79C12.0801 16.07 11.7701 16.26 11.4101 16.3V16.29ZM16.0701 4.85997L15.4401 13.43C15.4201 13.75 15.2701 14.05 15.0201 14.26C14.7701 14.47 14.4601 14.58 14.1301 14.56L13.2401 14.49C13.2401 14.49 13.2301 14.49 13.2201 14.49L8.87011 14.17C8.55011 14.15 8.25011 14 8.04011 13.75C7.83011 13.5 7.72011 13.18 7.74011 12.86L8.31011 4.94997L8.36011 4.29997C8.38011 3.96997 8.53011 3.67997 8.78011 3.45997C9.01011 3.25997 9.29011 3.15997 9.59011 3.15997C9.62011 3.15997 9.65011 3.15997 9.67011 3.15997L14.9401 3.54997C15.2701 3.56997 15.5601 3.71997 15.7801 3.96997C15.9901 4.21997 16.1001 4.52997 16.0701 4.85997Z" fill="#6A696C" />
            <path d="M14.4301 6.73995C14.4401 6.27995 13.8801 6.07995 13.5901 6.42995C12.9801 7.16995 12.3101 7.67995 11.6601 7.87995C11.3301 7.97995 11.2001 8.32995 11.3801 8.62995C11.7401 9.20995 11.9201 10.0299 11.9001 10.9899C11.8901 11.4499 12.4501 11.6499 12.7401 11.2999C13.3501 10.5599 14.0201 10.0499 14.6701 9.84995C15.0001 9.74995 15.1301 9.39995 14.9501 9.09995C14.5901 8.51995 14.4101 7.69995 14.4301 6.73995Z" fill="#6A696C" />
        </svg>
    );
}

function GalleryActiveNavIcon(props: NavIconProps) {
    // Replace this return value with the final active-state Gallery icon.
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
            <path d="M17.42 4.96L16.79 13.53C16.75 14.22 16.43 14.84 15.91 15.29C15.44 15.7 14.84 15.92 14.22 15.92C14.16 15.92 14.1 15.91 14.04 15.91L13.72 15.89L12.29 15.78L8.77004 15.52C8.09004 15.47 7.46004 15.16 7.02004 14.64C6.57004 14.12 6.35004 13.45 6.40004 12.77L6.91004 5.66L7.01004 4.29V4.2C7.07004 3.52 7.38004 2.9 7.90004 2.44C8.38004 2.03 8.97004 1.81 9.59004 1.81C9.65004 1.81 9.71004 1.81 9.77004 1.82L15.04 2.21C15.73 2.25 16.35 2.57 16.8 3.09C17.25 3.61 17.47 4.28 17.42 4.96Z" fill="#0A0708" />
            <path d="M17.42 4.96L16.79 13.53C16.75 14.22 16.43 14.84 15.91 15.29C15.44 15.7 14.84 15.92 14.22 15.92C14.16 15.92 14.1 15.91 14.04 15.91L13.72 15.89L12.29 15.78L8.77004 15.52C8.09004 15.47 7.46004 15.16 7.02004 14.64C6.57004 14.12 6.35004 13.45 6.40004 12.77L6.91004 5.66L7.01004 4.29V4.2C7.07004 3.52 7.38004 2.9 7.90004 2.44C8.38004 2.03 8.97004 1.81 9.59004 1.81C9.65004 1.81 9.71004 1.81 9.77004 1.82L15.04 2.21C15.73 2.25 16.35 2.57 16.8 3.09C17.25 3.61 17.47 4.28 17.42 4.96Z" fill="black" fillOpacity="0.2" />
            <path d="M12.7101 17.22C12.3701 17.44 11.9801 17.59 11.5501 17.63L6.30011 18.18C6.20011 18.19 6.11011 18.19 6.02011 18.19C5.43011 18.19 4.87011 17.99 4.41011 17.62C3.87011 17.18 3.54011 16.56 3.47011 15.88L2.59011 7.32999C2.52011 6.65999 2.71011 5.98999 3.14011 5.45999C3.57011 4.91999 4.19011 4.57999 4.88011 4.50999L5.61011 4.42999L5.51011 5.79999L5.00011 12.67C4.93011 13.73 5.27011 14.75 5.95011 15.55C6.40011 16.07 6.97011 16.46 7.59011 16.68C7.94011 16.81 8.30011 16.89 8.68011 16.92L12.7101 17.22Z" fill="#0A0708" />
            <path d="M12.7101 17.22C12.3701 17.44 11.9801 17.59 11.5501 17.63L6.30011 18.18C6.20011 18.19 6.11011 18.19 6.02011 18.19C5.43011 18.19 4.87011 17.99 4.41011 17.62C3.87011 17.18 3.54011 16.56 3.47011 15.88L2.59011 7.32999C2.52011 6.65999 2.71011 5.98999 3.14011 5.45999C3.57011 4.91999 4.19011 4.57999 4.88011 4.50999L5.61011 4.42999L5.51011 5.79999L5.00011 12.67C4.93011 13.73 5.27011 14.75 5.95011 15.55C6.40011 16.07 6.97011 16.46 7.59011 16.68C7.94011 16.81 8.30011 16.89 8.68011 16.92L12.7101 17.22Z" fill="black" fillOpacity="0.2" />
            <path d="M14.6801 9.85001C14.0301 10.05 13.3601 10.56 12.7501 11.3C12.4601 11.65 11.9001 11.45 11.9101 10.99C11.9301 10.03 11.7501 9.21001 11.3901 8.63001C11.2101 8.34001 11.3401 7.99001 11.6701 7.88001C12.3201 7.68001 12.9901 7.16001 13.6001 6.43001C13.8901 6.08001 14.4501 6.28001 14.4401 6.74001C14.4201 7.69001 14.6001 8.52001 14.9601 9.10001C15.1401 9.39001 15.0101 9.74001 14.6801 9.85001Z" fill="#FFE944" />
        </svg>
    );
}

function StudioNavigationLoadingOverlay({ href }: { href: string }) {
    let content: ReactNode;

    if (/^\/generate\/[^/?#]+/.test(href)) {
        content = (
            <div className="w-[92vw] max-w-[1280px]">
                <TemplateDetailSkeleton />
            </div>
        );
    } else if (href.startsWith("/gallery") || href.startsWith("/generate?tab=gallery")) {
        content = (
            <div className="w-[92vw] max-w-[1280px] py-[32px]">
                <GalleryGridSkeleton />
            </div>
        );
    } else if (href.startsWith("/favorites")) {
        content = (
            <div className="w-[92vw] max-w-[1280px] py-[32px]">
                <FavoritesSkeleton />
            </div>
        );
    } else {
        content = <GenerateStudioSkeleton />;
    }

    return (
        <div className="absolute inset-0 z-[80] flex justify-center overflow-y-auto bg-white" data-studio-nav-loading="true">
            {content}
        </div>
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
    const [pendingHref, setPendingHref] = useState<string | null>(null);

    let activeTab: TabType = "idea";
    if (pathname?.includes("/gallery")) activeTab = "gallery";
    else if (pathname?.includes("/favorites")) activeTab = "favorites";

    const startNavigation = (href: string) => {
        if (href === pathname) return;
        setPendingHref(href);
        router.push(href);
    };

    const setActiveTab = (tab: TabType) => {
        const href = tab === "idea" ? "/generate" : tab === "gallery" ? "/gallery" : "/favorites";
        startNavigation(href);
    };

    const [latestTaskId, setLatestTaskId] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPendingHref(null);
    }, [pathname]);

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                event.button !== 0
            ) {
                return;
            }

            const target = event.target;
            if (!(target instanceof Element)) return;

            const anchor = target.closest<HTMLAnchorElement>("a[href]");
            if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

            const url = new URL(anchor.href, window.location.href);
            if (url.origin !== window.location.origin || url.pathname === pathname) return;

            if (url.pathname === "/generate" && url.searchParams.get("tab") === "gallery") {
                setPendingHref("/generate?tab=gallery");
                return;
            }

            if (
                url.pathname === "/generate" ||
                url.pathname.startsWith("/generate/") ||
                url.pathname === "/gallery" ||
                url.pathname === "/favorites"
            ) {
                setPendingHref(`${url.pathname}${url.search}`);
            }
        };

        document.addEventListener("click", handleDocumentClick, true);
        return () => document.removeEventListener("click", handleDocumentClick, true);
    }, [pathname]);

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
        { tab: "idea", Icon: IdeaNavIcon, ActiveIcon: IdeaActiveNavIcon, label: "Idea" },
        { tab: "gallery", Icon: GalleryNavIcon, ActiveIcon: GalleryActiveNavIcon, label: "Gallery" },
        // { tab: "favorites", Icon: Heart, ActiveIcon: Heart, label: "Favorites" },
    ] satisfies {
        tab: TabType;
        Icon: (props: NavIconProps) => ReactNode;
        ActiveIcon: (props: NavIconProps) => ReactNode;
        label: string;
    }[];

    return (
        <GenerateContext.Provider value={{
            activeTab, setActiveTab,
            startNavigation,
            latestTaskId, setLatestTaskId
        }}>
            <div className="flex flex-col h-screen bg-white overflow-hidden w-full">
                {/* Top Header */}
                <header className="relative z-[150] h-[56px] tablet:h-[64px] w-full bg-white flex items-center justify-center border-b border-[#F6F6F6]">
                    {/* Left: Logo & Nav */}
                    <div className="flex h-full w-[92vw] items-center justify-between tablet:w-[100vw] max-w-[1600px] tablet:px-[24px]">
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
                                        {sidebarItems.map(({ tab, Icon, ActiveIcon, label }) => {
                                            const isActive = activeTab === tab;
                                            const CurrentIcon = isActive ? ActiveIcon : Icon;
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
                                                    <CurrentIcon
                                                        size={18}
                                                        strokeWidth={isActive ? 2.2 : 1.8}
                                                        className={isActive ? "text-[#0A0708]" : ""}
                                                    />
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
                                {sidebarItems.map(({ tab, Icon, ActiveIcon, label }) => {
                                    const isActive = activeTab === tab;
                                    const CurrentIcon = isActive ? ActiveIcon : Icon;
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
                                            <CurrentIcon
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
                    {pendingHref ? <StudioNavigationLoadingOverlay href={pendingHref} /> : null}
                    {children}
                </div>
            </div>
        </GenerateContext.Provider>
    );
}
