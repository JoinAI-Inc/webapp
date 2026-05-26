import { LandingImage } from "./LandingImage";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "";
const BASE = `${IMAGE_URL}/new-home`;

const imgBgPattern = `${BASE}/bg-pattern.svg`;
const imgLeftMountain = `${BASE}/bg-petal-landscape.png`;
const imgLeftFestival = `${BASE}/bg-mid-autumn.png`;
const imgRightMountain = `${BASE}/bg-feng-jing.png`;
const imgRightFestival = `${BASE}/bg-dragon-boat.png`;
const imgFuIcon = `${BASE}/icon-fu.png`;

export function RedBrandSection() {
  return (
    <section
      className="year-feature-section"
      aria-labelledby="year-feature-title"
      data-landing-section
    >
      <div
        className="year-feature-pattern"
        style={{ backgroundImage: `url(${imgBgPattern})` }}
        aria-hidden="true"
      />

      <div
        className="year-feature-decor-slot year-feature-decor-slot-left"
        aria-hidden="true"
      >
        <LandingImage
          className="year-feature-decor year-feature-decor-left year-feature-decor-base"
          src={imgLeftMountain}
        />
        <LandingImage
          className="year-feature-decor year-feature-decor-left year-feature-decor-overlay"
          src={imgLeftFestival}
        />
      </div>

      <div
        className="year-feature-decor-slot year-feature-decor-slot-right"
        aria-hidden="true"
      >
        <LandingImage
          className="year-feature-decor year-feature-decor-right year-feature-decor-base"
          src={imgRightMountain}
        />
        <LandingImage
          className="year-feature-decor year-feature-decor-right year-feature-decor-overlay year-feature-decor-overlay-right"
          src={imgRightFestival}
        />
      </div>

      <div className="year-feature-inner">
        <LandingImage className="year-feature-icon" src={imgFuIcon} />

        <div className="year-feature-copy">
          <h2 className="year-feature-title" id="year-feature-title">
            furtune Foto of the year now
          </h2>
          <p className="year-feature-support">
            <span>Capture the moments</span>
            <span className="year-feature-support-line-break-safe">
              {" "}
              in the new year,
            </span>
            <br />
            Let every click of the shutter preserve the essence of time. May the
            coming year be as splendid as a brocade, with all wishes fulfilled.
          </p>
        </div>
      </div>
    </section>
  );
}
