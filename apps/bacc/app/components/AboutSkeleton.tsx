"use client";

import { useEffect, useRef } from "react";
import { AboutRouteSkeleton } from "./LandingRouteSkeletons";

export function AboutSkeleton() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const dismiss = () => {
      element.classList.add("home-sk-dismissed");
      element.addEventListener(
        "transitionend",
        () => {
          element.style.display = "none";
        },
        { once: true },
      );
    };

    if (document.readyState === "complete") {
      dismiss();
      return;
    }

    window.addEventListener("load", dismiss, { once: true });
    const timer = window.setTimeout(dismiss, 3000);

    return () => {
      window.removeEventListener("load", dismiss);
      window.clearTimeout(timer);
    };
  }, []);

  return <AboutRouteSkeleton rootRef={rootRef} />;
}
