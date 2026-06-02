"use client";

import type { ReactNode } from "react";
import { Children, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface OotdCarouselProps {
  carouselId: string;
  slideCount: number;
  children: ReactNode;
}

export function OotdCarousel({
  carouselId,
  slideCount,
  children,
}: OotdCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = Children.toArray(children);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    active: false,
    align: "start",
    containScroll: false,
    loop: slideCount > 1,
    skipSnaps: false,
    breakpoints: {
      "(max-width: 734px)": {
        active: true,
      },
    },
  });

  const syncActiveSlide = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setActiveSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    syncActiveSlide();
    emblaApi.on("select", syncActiveSlide);
    emblaApi.on("reInit", syncActiveSlide);

    return () => {
      emblaApi.off("select", syncActiveSlide);
      emblaApi.off("reInit", syncActiveSlide);
    };
  }, [emblaApi, syncActiveSlide]);

  const scrollToSlide = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  return (
    <>
      <div
        className="gallery-feature-grid gallery-feature-grid-three gallery-feature-grid-carousel"
        id={carouselId}
        ref={emblaRef}
      >
        <div className="gallery-feature-carousel-track">
          {slides.map((slide, index) => (
            <div className="gallery-feature-carousel-slide" key={index}>
              {slide}
            </div>
          ))}
        </div>
      </div>

      <div
        className="gallery-feature-carousel-dots"
        aria-label="OOTD gallery pagination"
      >
        {Array.from({ length: slideCount }, (_, index) => (
          <button
            type="button"
            className={`gallery-feature-carousel-dot${
              activeSlide === index ? " is-active" : ""
            }`}
            aria-label={`Go to slide ${index + 1}`}
            key={index}
            onClick={() => scrollToSlide(index)}
          />
        ))}
      </div>
    </>
  );
}
