"use client";

import { useEffect, useRef } from "react";

const CENTER_SAFE_GAP_PX = 80;

export function RedBrandSafeArea() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    const section = marker?.closest(".year-feature-section") as HTMLElement | null;

    if (!section) {
      return;
    }

    const leftImage = section.querySelector<HTMLImageElement>(
      ".year-feature-decor-left.year-feature-decor-base",
    );
    const rightImage = section.querySelector<HTMLImageElement>(
      ".year-feature-decor-right.year-feature-decor-base",
    );
    const images = [leftImage, rightImage].filter((image): image is HTMLImageElement => Boolean(image));
    let frame = 0;

    const calculateOffsets = () => {
      const sectionWidth = section.getBoundingClientRect().width || window.innerWidth;
      const maxInnerImageWidth = Math.max(0, sectionWidth / 2 - CENTER_SAFE_GAP_PX);

      const leftOffset = leftImage
        ? -Math.max(0, leftImage.getBoundingClientRect().width - maxInnerImageWidth)
        : 0;
      const rightOffset = rightImage
        ? Math.max(0, rightImage.getBoundingClientRect().width - maxInnerImageWidth)
        : 0;

      section.style.setProperty("--year-feature-left-offset", `${leftOffset}px`);
      section.style.setProperty("--year-feature-right-offset", `${rightOffset}px`);
    };

    const scheduleCalculation = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(calculateOffsets);
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            scheduleCalculation();
          });

    resizeObserver?.observe(section);
    images.forEach((image) => {
      resizeObserver?.observe(image);
      image.addEventListener("load", scheduleCalculation);
      image.addEventListener("error", scheduleCalculation);
    });
    window.addEventListener("resize", scheduleCalculation, { passive: true });
    scheduleCalculation();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      images.forEach((image) => {
        image.removeEventListener("load", scheduleCalculation);
        image.removeEventListener("error", scheduleCalculation);
      });
      window.removeEventListener("resize", scheduleCalculation);
    };
  }, []);

  return <span ref={markerRef} hidden aria-hidden="true" />;
}
