import Image from "next/image";
import type { CSSProperties } from "react";
import type { SiteThemeConfig } from "../lib/site-theme";
import { HeroMarquee } from "./HeroMarquee";
import { LandingImage } from "./LandingImage";
import { TryItFreeButton } from "./TryItFreeButton";

const DESKTOP_MARQUEE_SPEEDS = [54, 60, 56];
const MOBILE_MARQUEE_SPEEDS = [20, 22, 21];
const DESKTOP_ITEMS_PER_GROUP = 8;
const MOBILE_ITEMS_PER_GROUP = 5;
const ENABLE_HERO_MARQUEE = true;

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
  const speed =
    variant === "desktop"
      ? DESKTOP_MARQUEE_SPEEDS[rowIndex]
      : MOBILE_MARQUEE_SPEEDS[rowIndex];

  return (
    <div
      className={`hero-media-row hero-media-row-${variant} w-full overflow-hidden`}
      data-row-index={rowIndex}
      data-marquee-enabled={ENABLE_HERO_MARQUEE}
    >
      <HeroMarquee
        autoFill={false}
        className="hero-media-track"
        direction={rowIndex === 1 ? "right" : "left"}
        gradient={false}
        pauseOnClick={false}
        pauseOnHover={false}
        play={ENABLE_HERO_MARQUEE}
        speed={speed}
      >
        {repeatedImages.map((src, imageIndex) => (
          <figure
            className="hero-media-card m-0 overflow-hidden bg-[#d0d0d0]"
            key={`${imageIndex}-${src}`}
            style={{
              opacity: 0.72 + ((imageIndex + rowIndex) % 4) * 0.07,
            }}
          >
            <LandingImage
              className="hero-media-image"
              src={src}
              loading={imageIndex < 4 ? "eager" : "lazy"}
              fetchPriority="auto"
              media={media}
            />
          </figure>
        ))}
      </HeroMarquee>
    </div>
  );
}

export function HeroSection({
  material,
}: {
  material: SiteThemeConfig;
}) {
  const { theme, hero } = material;

  return (
    <section
      className="relative isolate flex w-full flex-col items-center overflow-hidden text-center"
      aria-labelledby="home-hero-title"
      data-landing-section
      data-landing-eager
      style={{
        backgroundColor: theme.heroBackgroundColor,
        color: theme.textColor,
      }}
    >
      {hero.backgroundImageUrl && (
        <div
          className="pointer-events-none absolute top-0 left-1/2 z-[-1] w-screen -translate-x-1/2 bg-no-repeat opacity-30"
          style={{
            backgroundImage: `url(${hero.backgroundImageUrl})`,
            backgroundPosition: "top center",
            backgroundSize: "100% auto",
            aspectRatio: "1920 / 680",
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-[1] flex w-[87.5vw] max-w-[1440px] flex-col items-center pt-8 md:pt-12 xl:pt-[70px]">
        {hero.brandIconUrl && (
          <Image
            className="hero-reveal block h-auto w-[clamp(80px,calc(46.1px+10.6vw),120px)] object-contain xl:w-[clamp(120px,calc(73.11px+4.39vw),158px)]"
            src={hero.brandIconUrl}
            alt=""
            width={158}
            height={89}
            priority
          />
        )}

        <div
          className="hero-reveal flex flex-col items-center"
          style={{ "--reveal-delay": "80ms" } as CSSProperties}
        >
          <h1
            className="m-0 text-[clamp(24px,calc(12px+3.75vw),32px)] leading-[1.3] font-semibold tracking-[0] md:text-[clamp(40px,calc(14.85px+3.43vw),52px)] xl:text-[clamp(52px,calc(36.96px+1.41vw),64px)]"
            id="home-hero-title"
            style={{ color: theme.textColor }}
          >
            <span>{hero.titlePrefix}</span>
            <span
              className="whitespace-nowrap"
              style={{ color: theme.primaryColor }}
            >
              {hero.titleHighlight}
            </span>
            <span>{hero.titleSuffix}</span>
          </h1>
          <div
            className="inline-flex items-center justify-center gap-2 md:gap-[14px]"
            aria-label={hero.logoPrefix}
          >
            <span>{hero.logoPrefix}</span>
            {hero.logoImageUrl && (
              <Image
                className="block h-auto w-[clamp(88px,calc(74.06px+4.36vw),100px)] object-contain min-[481px]:w-[clamp(100px,calc(42.58px+11.96vw),130px)] md:w-[clamp(130px,calc(117.17px+1.71vw),150px)]"
                src={hero.logoImageUrl}
                alt=""
                width={150}
                height={69}
                priority
              />
            )}
          </div>
        </div>

        <p
          className="hero-reveal mt-1 text-center text-base leading-[1.4] font-normal md:mt-2 md:text-[19px]"
          style={
            {
              "--reveal-delay": "160ms",
              color: theme.mutedTextColor,
            } as CSSProperties
          }
        >
          <span className="inline">{hero.subtitlePrefix}</span>
          <span className="hidden md:inline"> {hero.subtitleSuffix}</span>
          <span className="block md:hidden">{hero.subtitleSuffix}</span>
        </p>

        <div
          className="hero-reveal mt-6 flex justify-center md:mt-8 xl:mt-10"
          style={{ "--reveal-delay": "240ms" } as CSSProperties}
        >
          <TryItFreeButton
            className="h-10 px-6 text-[15px] md:h-12 md:px-8 md:text-[16px]"
            label={hero.ctaLabel}
            backgroundImageUrl={hero.ctaBackgroundImageUrl}
            gradient={{
              from: theme.ctaGradientStart,
              to: theme.ctaGradientEnd,
            }}
            focusColor={theme.ctaFocusColor}
          />
        </div>
      </div>

      <div
        className="hero-media-shell relative mt-12 mb-[60px] w-[87.5vw] max-w-[1600px] overflow-hidden rounded-2xl md:mt-14 md:mb-20 xl:mt-16 xl:mb-[100px] xl:rounded-[clamp(24px,calc(14.9px+0.85vw),32px)]"
        style={
          {
            "--hero-media-shell-from": theme.mediaShellStart,
            "--hero-media-shell-to": theme.mediaShellEnd,
            "--hero-media-card-from": theme.cardBackgroundStart,
            "--hero-media-card-to": theme.cardBackgroundEnd,
          } as CSSProperties
        }
      >
        <div className="hero-media-stack">
          {hero.rows.map((images, rowIndex) => (
            <HeroMediaRow
              images={images}
              rowIndex={rowIndex}
              itemCount={DESKTOP_ITEMS_PER_GROUP}
              media="(min-width: 735px)"
              variant="desktop"
              key={`desktop-${rowIndex}`}
            />
          ))}
          {hero.rows.map((images, rowIndex) => (
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
