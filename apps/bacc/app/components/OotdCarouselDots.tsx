"use client";

import { startTransition, useEffect, useRef, useState } from "react";

interface OotdCarouselDotsProps {
  carouselId: string;
  slideCount: number;
}

export function OotdCarouselDots({
  carouselId,
  slideCount,
}: OotdCarouselDotsProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const activeSlideRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const carousel = document.getElementById(
      carouselId,
    ) as HTMLDivElement | null;
    if (!carousel) {
      return;
    }

    const syncNow = () => {
      frameRef.current = 0;

      const width = carousel.clientWidth || 1;
      const nextSlide = Math.min(
        slideCount - 1,
        Math.max(0, Math.round(carousel.scrollLeft / width)),
      );

      if (nextSlide !== activeSlideRef.current) {
        activeSlideRef.current = nextSlide;
        startTransition(() => setActiveSlide(nextSlide));
      }
    };

    const sync = () => {
      if (frameRef.current) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(syncNow);
    };

    sync();
    carousel.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      carousel.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [carouselId, slideCount]);

  const scrollToSlide = (index: number) => {
    const carousel = document.getElementById(
      carouselId,
    ) as HTMLDivElement | null;
    if (!carousel) {
      return;
    }

    carousel.scrollTo({
      left: (carousel.clientWidth || 0) * index,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="gallery-feature-carousel-dots"
      aria-label="OOTD gallery pagination"
    >
      {Array.from({ length: slideCount }, (_, index) => (
        <button
          type="button"
          className={`gallery-feature-carousel-dot${activeSlide === index ? " is-active" : ""}`}
          aria-label={`Go to slide ${index + 1}`}
          key={index}
          onClick={() => scrollToSlide(index)}
        />
      ))}
    </div>
  );
}
