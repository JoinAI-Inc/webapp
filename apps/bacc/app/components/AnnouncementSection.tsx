import { LandingImage } from "./LandingImage";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "";
const BASE = `${IMAGE_URL}/new-home`;

const imgHorse = `${BASE}/bg-horse.png`;
const imgBg = `${BASE}/bg-special.png`;

export function AnnouncementSection() {
  return (
    <section
      className="split-feature-section"
      aria-hidden="true"
      data-landing-section
    >
      <div className="split-feature-inner">
        <div className="split-feature-copy">
          <div className="split-feature-copy-inner">
            <h2 className="split-feature-title">
              <span>Special </span>
              <span className="split-feature-title-highlight">
                Announcement
              </span>
            </h2>
            <p className="split-feature-support">
              As part of our commitment to respecting your privacy,{" "}
              <span className="split-feature-support-highlight">
                we do not store any photos you upload.
              </span>{" "}
              Furthermore, since our service does not require creating a unique
              Avatar of you,{" "}
              <span className="split-feature-support-highlight">
                there is no need to upload multiple photos
              </span>
              —just one is sufficient.
            </p>
          </div>
        </div>

        <div className="split-feature-media">
          <div
            className="split-feature-media-bg"
            style={{ backgroundImage: `url(${imgBg})` }}
            aria-hidden="true"
          />
          <LandingImage className="split-feature-image" src={imgHorse} />
        </div>
      </div>
    </section>
  );
}
