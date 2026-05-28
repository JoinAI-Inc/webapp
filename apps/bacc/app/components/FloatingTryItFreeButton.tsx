"use client";

import { useEffect, useRef, useState } from "react";
import { TryItFreeButton } from "./TryItFreeButton";

const EXIT_DURATION = 420;

export function FloatingTryItFreeButton() {
    // visible: 按钮是否在 DOM 里可见（opacity）
    // exiting: 是否正在播放退出动画
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stateRef = useRef<"hidden" | "visible">("hidden");

    useEffect(() => {
        let frame = 0;

        function showCta() {
            if (stateRef.current === "visible") return;

            // 取消正在进行的退出计时
            if (exitTimerRef.current) {
                clearTimeout(exitTimerRef.current);
                exitTimerRef.current = null;
            }

            stateRef.current = "visible";
            setExiting(false);
            setVisible(true);
        }

        function hideCta() {
            if (stateRef.current === "hidden") return;
            if (exitTimerRef.current) return; // 已在退出中

            stateRef.current = "hidden";
            setExiting(true); // 触发退出动画

            exitTimerRef.current = setTimeout(() => {
                exitTimerRef.current = null;
                setVisible(false);
                setExiting(false);
            }, EXIT_DURATION);
        }

        const sync = () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                const start = document.querySelector<HTMLElement>("[data-floating-cta-start]");
                const end = document.querySelector<HTMLElement>("[data-floating-cta-end]");
                const viewportHeight = window.innerHeight;
                const bottomOffset = window.innerWidth < 735 ? 40 : window.innerWidth < 1068 ? 60 : 80;
                const buttonHeight = 48;
                const fixedTop = viewportHeight - bottomOffset - buttonHeight;
                const startTop = (start?.getBoundingClientRect().top ?? viewportHeight) + window.scrollY;
                const endTop = (end?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY) + window.scrollY;
                const scrollY = window.scrollY;

                const shouldShow = scrollY >= Math.max(0, startTop - fixedTop)
                    && scrollY < endTop - viewportHeight * 0.25;

                if (shouldShow) {
                    showCta();
                } else {
                    hideCta();
                }
            });
        };

        sync();
        window.addEventListener("scroll", sync, { passive: true });
        window.addEventListener("resize", sync);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("scroll", sync);
            window.removeEventListener("resize", sync);
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        };
    }, []);

    // 完全隐藏时不渲染（节省事件开销）
    if (!visible && !exiting) return null;

    return (
        <div
            className={[
                "fixed left-1/2 z-[60] -translate-x-1/2",
                "bottom-10 md:bottom-[60px] xl:bottom-20",
                // 进入：从下方滑入 + 淡入
                // 退出：向下滑出 + 淡出，duration 与 EXIT_DURATION 对应
                "transition-[opacity,transform]",
                visible && !exiting
                    ? "pointer-events-auto translate-y-0 opacity-100 duration-300"
                    : "pointer-events-none translate-y-3 opacity-0 duration-[420ms]",
            ].join(" ")}
            aria-hidden={exiting || !visible}
            style={{ easing: "cubic-bezier(0.22, 1, 0.36, 1)" } as React.CSSProperties}
        >
            <TryItFreeButton className="shadow-[0_24px_56px_rgba(212,36,36,0.30),0_10px_22px_rgba(10,7,8,0.12)]" />
        </div>
    );
}
