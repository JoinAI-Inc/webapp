"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * 页面切换时顶部渐进式进度条
 * 当路由变化时自动显示 → 完成后消失
 */
export function NavigationProgress() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [width, setWidth] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevPath = useRef(pathname);

    useEffect(() => {
        if (pathname === prevPath.current) return;
        prevPath.current = pathname;

        // 路由变化：启动进度条
        setWidth(0);
        setVisible(true);

        // 快速跑到 85%
        const ramp = setTimeout(() => setWidth(85), 50);

        // 完成后收尾
        timerRef.current = setTimeout(() => {
            setWidth(100);
            setTimeout(() => {
                setVisible(false);
                setWidth(0);
            }, 300);
        }, 400);

        return () => {
            clearTimeout(ramp);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [pathname]);

    if (!visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                height: 3,
                width: `${width}%`,
                background: "linear-gradient(90deg, #E8281E, #FF6B35)",
                transition: width === 85
                    ? "width 350ms cubic-bezier(0.4, 0, 0.2, 1)"
                    : "width 200ms ease-out, opacity 200ms ease-out",
                zIndex: 9999,
                borderRadius: "0 2px 2px 0",
                boxShadow: "0 0 8px rgba(232,40,30,0.6)",
            }}
        />
    );
}
