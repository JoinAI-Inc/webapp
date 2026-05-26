"use client";

import { useEffect, useState } from "react";
import { TryItFreeButton } from "./TryItFreeButton";

export function FloatingTryItFreeButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let frame = 0;

        const sync = () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                const start = document.querySelector<HTMLElement>("[data-floating-cta-start]");
                const end = document.querySelector<HTMLElement>("[data-floating-cta-end]");
                const viewportHeight = window.innerHeight;
                const fixedTop = viewportHeight - (window.innerWidth < 735 ? 40 : window.innerWidth < 1068 ? 60 : 80) - 48;
                const startTop = (start?.getBoundingClientRect().top ?? viewportHeight) + window.scrollY;
                const endTop = (end?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY) + window.scrollY;
                const scrollY = window.scrollY;

                setVisible(scrollY >= Math.max(0, startTop - fixedTop) && scrollY < endTop - viewportHeight * 0.25);
            });
        };

        sync();
        window.addEventListener("scroll", sync, { passive: true });
        window.addEventListener("resize", sync);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("scroll", sync);
            window.removeEventListener("resize", sync);
        };
    }, []);

    return (
        <div
            className={[
                "fixed left-1/2 z-[60] -translate-x-1/2 transition duration-300",
                "bottom-10 md:bottom-[60px] xl:bottom-20",
                visible
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-5 opacity-0",
            ].join(" ")}
            aria-hidden={!visible}
        >
            <TryItFreeButton className="shadow-[0_24px_56px_rgba(212,36,36,0.30),0_10px_22px_rgba(10,7,8,0.12)]" />
        </div>
    );
}
