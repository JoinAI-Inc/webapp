import { LandingImage } from "./LandingImage";
import { OotdCarouselDots } from "./OotdCarouselDots";
import { TryItFreeButton } from "./TryItFreeButton";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "";
const BASE = `${IMAGE_URL}/new-home`;

const galleryImages = [
  `${BASE}/img-also-1.png`,
  `${BASE}/img-also-2.png`,
  `${BASE}/img-also-3.png`,
  `${BASE}/img-also-4.png`,
];

const petImages = {
  cloud: `${BASE}/bg-also-3.png`,
  topLeft: `${BASE}/img-also-pet-tl.png`,
  topRight: `${BASE}/img-also-pet-tr.png`,
  bottomLeft: `${BASE}/img-also-pet-bl.png`,
  bottomRight: `${BASE}/img-also-pet-br.png`,
};

const ootdCards = [
  {
    before: `${BASE}/img-also-gen-1-1.jpg`,
    outfit: `${BASE}/img-also-gen-1-2.png`,
    after: `${BASE}/img-also-gen-1-3.jpg`,
  },
  {
    before: `${BASE}/img-also-gen-2-1.jpg`,
    outfit: `${BASE}/img-also-gen-2-2.png`,
    after: `${BASE}/img-also-gen-2-3.jpg`,
  },
  {
    before: `${BASE}/img-also-gen-3-1.jpg`,
    outfit: `${BASE}/img-also-gen-3-2.png`,
    after: `${BASE}/img-also-gen-3-3.jpg`,
  },
];

const CAPTION =
  "Capture the moments in the new year,Let every click of the shutter preserve the essence of time.May the coming year be as splendid as a brocade, with all wishes fulfilled.";
const OOTD_CAROUSEL_ID = "ootd-feature-carousel";

function GalleryFeatureCopy({
  title,
  highlight,
  suffix,
  id,
}: {
  title: string;
  highlight: string;
  suffix?: string;
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
      <p className="gallery-feature-support">{CAPTION}</p>
    </div>
  );
}

function GalleryImageCard({ src }: { src: string }) {
  return (
    <figure className="gallery-feature-card">
      <LandingImage src={src} />
    </figure>
  );
}

function AlsoSubSection() {
  return (
    <section
      className="gallery-feature-section"
      aria-labelledby="gallery-feature-title"
      data-floating-cta-start
      data-landing-section
    >
      <div className="gallery-feature-inner">
        <GalleryFeatureCopy
          title="Also, can"
          highlight="not just you..."
          id="gallery-feature-title"
        />

        <div className="gallery-feature-grid">
          {galleryImages.map((src) => (
            <GalleryImageCard key={src} src={src} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PetSection() {
  const mobileImages = [
    petImages.topLeft,
    petImages.topRight,
    petImages.bottomLeft,
    petImages.bottomRight,
  ];

  return (
    <section
      className="pet-feature-section"
      aria-labelledby="pet-feature-title"
      data-landing-section
    >
      <LandingImage
        className="page-pet-cloud"
        src={petImages.cloud}
        media="(min-width: 735px)"
      />

      <div className="pet-feature-inner">
        <div className="pet-feature-story">
          <LandingImage
            className="pet-feature-collage pet-feature-collage-bottom-left"
            src={petImages.bottomLeft}
            media="(min-width: 735px)"
          />
          <p className="pet-feature-story-copy">{CAPTION}</p>
        </div>

        <LandingImage
          className="pet-feature-collage pet-feature-collage-left"
          src={petImages.topLeft}
          media="(min-width: 735px)"
        />
        <LandingImage
          className="pet-feature-collage"
          src={petImages.topRight}
          media="(min-width: 735px)"
        />
        <LandingImage
          className="pet-feature-collage pet-feature-collage-bottom-right"
          src={petImages.bottomRight}
          media="(min-width: 735px)"
        />

        <h2
          className="pet-feature-title pet-feature-title-fluid"
          id="pet-feature-title"
        >
          <span className="pet-feature-title-highlight">OR, </span>
          <span className="pet-feature-title-base">Even for </span>
          <span className="pet-feature-title-highlight">your pet</span>
        </h2>

        <div className="pet-feature-mobile-grid" aria-hidden="true">
          {mobileImages.map((src) => (
            <figure className="pet-feature-mobile-card" key={src}>
              <LandingImage src={src} media="(max-width: 734px)" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function SmallPhoto({ src }: { src: string }) {
  return (
    <div className="ootd-small-photo">
      <LandingImage src={src} />
    </div>
  );
}

function OotdCompositeCard({ card }: { card: (typeof ootdCards)[number] }) {
  return (
    <figure className="gallery-feature-card gallery-feature-card-natural ootd-feature-card">
      <div className="ootd-card-pair">
        <SmallPhoto src={card.before} />
        <SmallPhoto src={card.outfit} />
      </div>

      <LandingImage
        className="ootd-card-arrow"
        src={`${BASE}/icon-arrow-g.png`}
      />

      <div className="ootd-card-result">
        <LandingImage src={card.after} />
      </div>
    </figure>
  );
}

function OotdSection() {
  return (
    <section
      className="gallery-feature-section gallery-feature-section-secondary"
      aria-labelledby="ootd-feature-title"
      data-landing-section
    >
      <div className="gallery-feature-inner">
        <GalleryFeatureCopy
          title="IN Every"
          highlight="OOTD"
          suffix="You LIKE"
          id="ootd-feature-title"
        />

        <div
          className="gallery-feature-grid gallery-feature-grid-three gallery-feature-grid-carousel"
          id={OOTD_CAROUSEL_ID}
        >
          {ootdCards.map((card, index) => (
            <OotdCompositeCard card={card} key={index} />
          ))}
        </div>

        <OotdCarouselDots
          carouselId={OOTD_CAROUSEL_ID}
          slideCount={ootdCards.length}
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

export function AlsoSection() {
  return (
    <>
      <AlsoSubSection />
      <PetSection />
      <OotdSection />

      <div className="also-section-cta">
        <TryItFreeButton />
      </div>
    </>
  );
}
