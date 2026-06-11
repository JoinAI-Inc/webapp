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
      className="home-hero-section relative isolate flex w-full flex-col items-center overflow-hidden text-center"
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

      <div className="hero-copy relative z-[1] flex flex-col items-center">
        {hero.brandIconUrl && (
          <Image
            className="hero-brand-icon hero-reveal block h-auto object-contain"
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
            className="hero-title m-0 font-semibold tracking-[0]"
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
          >
            <span className="hero-title font-semibold">{hero.logoPrefix}</span>
            {hero.logoImageUrl && (
              <Image
                className="hero-title-mark block h-auto object-contain"
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
          className="hero-support hero-reveal text-center font-normal"
          style={
            {
              "--reveal-delay": "160ms",
              color: theme.mutedTextColor,
            } as CSSProperties
          }
        >
          <span>{hero.subtitlePrefix}</span>{" "}
          <span className="hero-support-line-break">
            {hero.subtitleSuffix}
          </span>
        </p>

        <div
          className="hero-cta-wrap hero-reveal flex justify-center"
          style={{ "--reveal-delay": "240ms" } as CSSProperties}
          data-hero-cta
        >
          <TryItFreeButton
            className="hero-cta-button"
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
        className="hero-media-shell relative"
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
