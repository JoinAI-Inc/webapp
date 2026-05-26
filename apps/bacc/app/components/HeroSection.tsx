import Image from "next/image";
import type { CSSProperties } from "react";
import { LandingImage } from "./LandingImage";
import { TryItFreeButton } from "./TryItFreeButton";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "";
const BASE = `${IMAGE_URL}/new-home`;

const ROW_IMAGES: string[][] = [
  [
    `${BASE}/img-home-hero-1-1.png`,
    `${BASE}/img-home-hero-1-2.png`,
    `${BASE}/img-home-hero-1-3.png`,
    `${BASE}/img-home-hero-1-4.png`,
    `${BASE}/img-home-hero-1-5.png`,
    `${BASE}/img-home-hero-1-6.png`,
    `${BASE}/img-home-hero-1-7.png`,
    `${BASE}/img-home-hero-1-8.png`,
  ],
  [
    `${BASE}/img-home-hero-2-1.png`,
    `${BASE}/img-home-hero-2-2.png`,
    `${BASE}/img-home-hero-2-3.png`,
    `${BASE}/img-home-hero-2-4.png`,
    `${BASE}/img-home-hero-2-5.png`,
    `${BASE}/img-home-hero-2-6.png`,
    `${BASE}/img-home-hero-2-7.png`,
    `${BASE}/img-home-hero-2-8.png`,
  ],
  [
    `${BASE}/img-home-hero-3-1.png`,
    `${BASE}/img-home-hero-3-2.png`,
    `${BASE}/img-home-hero-3-3.png`,
    `${BASE}/img-home-hero-3-4.png`,
    `${BASE}/img-home-hero-3-5.png`,
    `${BASE}/img-home-hero-3-6.png`,
    `${BASE}/img-home-hero-3-7.png`,
    `${BASE}/img-home-hero-3-8.png`,
  ],
];

const MARQUEE_DURATIONS = ["32s", "29s", "31s"];
const DESKTOP_ITEMS_PER_GROUP = 8;
const MOBILE_ITEMS_PER_GROUP = 5;

function HeroMediaRow({
  images,
  rowIndex,
  itemCount,
  media,
  variant,
}: {
  images: string[];
  rowIndex: number;
  itemCount: number;
  media: string;
  variant: "desktop" | "mobile";
}) {
  const repeatedImages = Array.from(
    { length: itemCount },
    (_, index) => images[index % images.length],
  );

  return (
    <div
      className={`hero-media-row hero-media-row-${variant} w-full overflow-hidden`}
      data-row-index={rowIndex}
      style={
        {
          "--marquee-duration": MARQUEE_DURATIONS[rowIndex],
          "--items-per-group": itemCount,
        } as CSSProperties
      }
    >
      <div className="hero-media-track">
        {[0, 1].map((groupIndex) => (
          <div className="hero-media-group" key={groupIndex}>
            {repeatedImages.map((src, imageIndex) => (
              <figure
                className="hero-media-card m-0 overflow-hidden bg-[#d0d0d0]"
                key={`${groupIndex}-${imageIndex}-${src}`}
                style={{
                  opacity: 0.72 + ((imageIndex + rowIndex) % 4) * 0.07,
                }}
              >
                <LandingImage
                  className="hero-media-image"
                  src={src}
                  loading={groupIndex === 0 ? "eager" : "lazy"}
                  fetchPriority={
                    groupIndex === 0 && imageIndex < 4 ? "high" : "auto"
                  }
                  media={media}
                />
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      className="relative isolate flex w-full flex-col items-center overflow-hidden bg-white text-center text-[#0A0708]"
      aria-labelledby="home-hero-title"
      data-landing-section
      data-landing-eager
    >
      <div
        className="pointer-events-none absolute top-0 left-1/2 z-[-1] w-screen -translate-x-1/2 bg-no-repeat opacity-30"
        style={{
          backgroundImage: `url(${BASE}/bg-hero.png)`,
          backgroundPosition: "top center",
          backgroundSize: "100% auto",
          aspectRatio: "1920 / 680",
        }}
        aria-hidden="true"
      />

      <div className="relative z-[1] flex w-[87.5vw] max-w-[1440px] flex-col items-center pt-8 md:pt-12 xl:pt-[70px]">
        <Image
          className="hero-reveal block h-auto w-[clamp(80px,calc(46.1px+10.6vw),120px)] object-contain xl:w-[clamp(120px,calc(73.11px+4.39vw),158px)]"
          src={`${BASE}/icon-house.png`}
          alt=""
          width={158}
          height={89}
          priority
        />

        <div
          className="hero-reveal flex flex-col items-center"
          style={{ "--reveal-delay": "80ms" } as CSSProperties}
        >
          <h1
            className="m-0 text-[clamp(24px,calc(12px+3.75vw),32px)] leading-[1.3] font-semibold tracking-[0] text-[#0A0708] md:text-[clamp(40px,calc(14.85px+3.43vw),52px)] xl:text-[clamp(52px,calc(36.96px+1.41vw),64px)]"
            id="home-hero-title"
          >
            <span>The most </span>
            <span className="whitespace-nowrap text-[#EC2E2E]">
              popular fortune
            </span>
          </h1>
          <div
            className="inline-flex items-center justify-center gap-2 md:gap-[14px]"
            aria-label="foto in Xiaohongshu"
          >
            <span>foto in</span>
            <Image
              className="block h-auto w-[clamp(88px,calc(74.06px+4.36vw),100px)] object-contain min-[481px]:w-[clamp(100px,calc(42.58px+11.96vw),130px)] md:w-[clamp(130px,calc(117.17px+1.71vw),150px)]"
              src={`${BASE}/icon-xiaohongshu.png`}
              alt=""
              width={150}
              height={69}
              priority
            />
          </div>
        </div>

        <p
          className="hero-reveal mt-1 text-center text-base leading-[1.4] font-normal text-[#39383B] md:mt-2 md:text-[19px]"
          style={{ "--reveal-delay": "160ms" } as CSSProperties}
        >
          <span className="inline">how to make a foto</span>
          <span className="hidden md:inline">
            {" "}
            that real Chinese would jealous
          </span>
          <span className="block md:hidden">
            that real Chinese would jealous
          </span>
        </p>

        <div
          className="hero-reveal mt-6 flex justify-center md:mt-8 xl:mt-10"
          style={{ "--reveal-delay": "240ms" } as CSSProperties}
        >
          <TryItFreeButton className="h-10 px-6 text-[15px] md:h-12 md:px-8 md:text-[16px]" />
        </div>
      </div>

      <div
        className="hero-media-shell relative mt-12 mb-[60px] h-[600px] w-[87.5vw] max-w-[1600px] overflow-hidden rounded-2xl md:mt-14 md:mb-20 xl:mt-16 xl:mb-[100px] xl:h-[clamp(600px,calc(486.29px+10.65vw),700px)] xl:rounded-[clamp(24px,calc(14.9px+0.85vw),32px)]"
      >
        <div className="hero-media-stack">
          {ROW_IMAGES.map((images, rowIndex) => (
            <HeroMediaRow
              images={images}
              rowIndex={rowIndex}
              itemCount={DESKTOP_ITEMS_PER_GROUP}
              media="(min-width: 735px)"
              variant="desktop"
              key={`desktop-${rowIndex}`}
            />
          ))}
          {ROW_IMAGES.map((images, rowIndex) => (
            <HeroMediaRow
              images={images}
              rowIndex={rowIndex}
              itemCount={MOBILE_ITEMS_PER_GROUP}
              media="(max-width: 734px)"
              variant="mobile"
              key={`mobile-${rowIndex}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
