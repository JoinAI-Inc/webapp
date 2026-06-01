import type { CSSProperties } from "react";
import type { SiteThemeConfig } from "../lib/site-theme";
import { LandingImage } from "./LandingImage";
import { OotdCarouselDots } from "./OotdCarouselDots";

const OOTD_CAROUSEL_ID = "ootd-feature-carousel";

function GalleryFeatureCopy({
  title,
  highlight,
  suffix,
  support,
  id,
}: {
  title: string;
  highlight: string;
  suffix?: string;
  support: string;
  id: string;
}) {
  return (
    <div className="gallery-feature-copy">
      <h2 className="gallery-feature-title gallery-feature-title-fluid" id={id}>
        <span className="gallery-feature-title-base">{title}</span>{" "}
        <span className="gallery-feature-title-highlight">{highlight}</span>
        {suffix ? (
          <span className="gallery-feature-title-base"> {suffix}</span>
        ) : null}
      </h2>
      <p className="gallery-feature-support">{support}</p>
    </div>
  );
}

function GalleryImageCard({
  src,
  backgroundColor,
}: {
  src: string;
  backgroundColor: string;
}) {
  return (
    <figure className="gallery-feature-card" style={{ backgroundColor }}>
      <LandingImage src={src} />
    </figure>
  );
}

function AlsoSubSection({ material }: { material: SiteThemeConfig }) {
  const gallery = material.gallery;

  return (
    <section
      className="gallery-feature-section"
      aria-labelledby="gallery-feature-title"
      data-floating-cta-start
      data-landing-section
      style={{
        "--gallery-feature-bg": gallery.backgroundColor,
        "--gallery-feature-title-color": gallery.titleColor,
        "--gallery-feature-highlight-color": gallery.highlightColor,
        "--gallery-feature-support-color": gallery.supportColor,
      } as CSSProperties}
    >
      <div className="gallery-feature-inner">
        <div data-scroll-reveal>
          <GalleryFeatureCopy
            title={gallery.title}
            highlight={gallery.highlight}
            suffix={gallery.suffix}
            support={gallery.support}
            id="gallery-feature-title"
          />
        </div>

        <div className="gallery-feature-grid" data-scroll-reveal style={{ "--reveal-delay": "80ms" } as CSSProperties}>
          {gallery.images.map((src, index) => (
            <GalleryImageCard
              key={`${src}-${index}`}
              src={src}
              backgroundColor={gallery.cardBackgroundColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PetSection({ material }: { material: SiteThemeConfig }) {
  const pet = material.pet;
  const mobileImages = [
    pet.topLeftImageUrl,
    pet.topRightImageUrl,
    pet.bottomLeftImageUrl,
    pet.bottomRightImageUrl,
  ];

  return (
    <section
      className="pet-feature-section"
      aria-labelledby="pet-feature-title"
      data-landing-section
      data-scroll-reveal
      style={{
        "--pet-feature-bg": pet.backgroundColor,
        "--pet-feature-title-color": pet.titleColor,
        "--pet-feature-highlight-color": pet.highlightColor,
        "--pet-feature-text-color": pet.textColor,
      } as CSSProperties}
    >
      <LandingImage
        className="page-pet-cloud"
        src={pet.cloudImageUrl}
        media="(min-width: 735px)"
      />

      <div className="pet-feature-inner">
        <div className="pet-feature-story">
          <LandingImage
            className="pet-feature-collage pet-feature-collage-bottom-left"
            src={pet.bottomLeftImageUrl}
            media="(min-width: 735px)"
          />
          <p className="pet-feature-story-copy">{pet.text}</p>
        </div>

        <LandingImage
          className="pet-feature-collage pet-feature-collage-left"
          src={pet.topLeftImageUrl}
          media="(min-width: 735px)"
        />
        <LandingImage
          className="pet-feature-collage"
          src={pet.topRightImageUrl}
          media="(min-width: 735px)"
        />
        <LandingImage
          className="pet-feature-collage pet-feature-collage-bottom-right"
          src={pet.bottomRightImageUrl}
          media="(min-width: 735px)"
        />

        <h2
          className="pet-feature-title pet-feature-title-fluid"
          id="pet-feature-title"
        >
          <span className="pet-feature-title-highlight">{pet.titlePrefix} </span>
          <span className="pet-feature-title-base">{pet.titleMiddle} </span>
          <span className="pet-feature-title-highlight">{pet.titleHighlight}</span>
        </h2>

        <div className="pet-feature-mobile-grid" aria-hidden="true">
          {mobileImages.map((src, index) => (
            <figure className="pet-feature-mobile-card" key={`${src}-${index}`}>
              <LandingImage src={src} media="(max-width: 734px)" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function OotdFeatureCard({
  item,
  backgroundColor,
}: {
  item: SiteThemeConfig["ootd"]["items"][number];
  backgroundColor: string;
}) {
  return (
    <figure
      className={`gallery-feature-card ootd-feature-card ${
        item.imageUrl ? "ootd-feature-card-image" : "ootd-feature-card-placeholder"
      }`}
      style={{ backgroundColor }}
    >
      {item.imageUrl ? (
        <LandingImage src={item.imageUrl} />
      ) : (
        <div
          className="ootd-feature-placeholder"
          style={{ backgroundColor: item.placeholderColor }}
          aria-label={item.label}
        />
      )}
    </figure>
  );
}

function OotdSection({ material }: { material: SiteThemeConfig }) {
  const ootd = material.ootd;

  return (
    <section
      className="gallery-feature-section gallery-feature-section-secondary"
      aria-labelledby="ootd-feature-title"
      data-landing-section
      data-scroll-reveal
      style={{
        "--gallery-feature-bg": ootd.backgroundColor,
        "--gallery-feature-title-color": ootd.titleColor,
        "--gallery-feature-highlight-color": ootd.highlightColor,
        "--gallery-feature-support-color": ootd.supportColor,
      } as CSSProperties}
    >
      <div className="gallery-feature-inner">
        <GalleryFeatureCopy
          title={ootd.title}
          highlight={ootd.highlight}
          suffix={ootd.suffix}
          support={ootd.support}
          id="ootd-feature-title"
        />

        <div
          className="gallery-feature-grid gallery-feature-grid-three gallery-feature-grid-carousel"
          id={OOTD_CAROUSEL_ID}
        >
          {ootd.items.map((item, index) => (
            <OotdFeatureCard
              item={item}
              backgroundColor={ootd.cardBackgroundColor}
              key={`${item.imageUrl || item.placeholderColor}-${index}`}
            />
          ))}
        </div>

        <OotdCarouselDots
          carouselId={OOTD_CAROUSEL_ID}
          slideCount={ootd.items.length}
        />

        <div
          data-floating-cta-end
          className="floating-cta-dock-anchor"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

export function AlsoSection({ material }: { material: SiteThemeConfig }) {
  return (
    <>
      <AlsoSubSection material={material} />
      <PetSection material={material} />
      <OotdSection material={material} />
    </>
  );
}
