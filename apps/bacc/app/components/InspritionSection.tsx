import type { CSSProperties } from "react";
import type { SiteThemeConfig } from "../lib/site-theme";
import { CardFrame } from "./CardFrame";
import { LandingImage } from "./LandingImage";

function chunkPairs<T>(items: T[]) {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }
  return rows;
}

function MarqueeGroup({
  items,
}: {
  items: SiteThemeConfig["inspiration"]["items"];
}) {
  return (
    <div className="feature-gradient-card-marquee-group">
      {chunkPairs(items).map((row, rowIndex) => (
        <div className="feature-gradient-card-marquee-row" key={rowIndex}>
          {row.map((item) => (
            <div className="feature-gradient-card-marquee-entry" key={item.id}>
              <span className="feature-gradient-card-marquee-name">
                {item.name}
              </span>
              <span className="feature-gradient-card-marquee-id">
                ID:{item.id}
              </span>
            </div>
          ))}
          {row.length === 1 ? (
            <div className="feature-gradient-card-marquee-entry is-empty" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function InspritionSection({ material }: { material: SiteThemeConfig }) {
  const inspiration = material.inspiration;

  return (
    <section
      className="feature-gradient-card-section"
      aria-hidden="true"
      data-landing-section
    >
      <div
        className="feature-gradient-card"
        data-scroll-reveal
        style={
          {
            "--feature-gradient-card-pattern": `url(${inspiration.patternImageUrl})`,
            "--feature-gradient-card-start": inspiration.backgroundStartColor,
            "--feature-gradient-card-end": inspiration.backgroundEndColor,
            "--feature-gradient-card-title-color": inspiration.titleColor,
            "--feature-gradient-card-entry-color": inspiration.entryColor,
            "--feature-gradient-card-divider-color": inspiration.dividerColor,
            "--feature-gradient-card-note-color": inspiration.noteColor,
          } as CSSProperties
        }
      >
        <div className="feature-gradient-card-decor" aria-hidden="true">
          <LandingImage
            className="feature-gradient-card-decor-img"
            src={inspiration.decorImageUrl}
          />
        </div>

        <div className="feature-gradient-card-frame">
          <CardFrame
            className="feature-gradient-card-frame-center"
            width="clamp(442px, calc(222.84px + 29.83vw), 700px)"
            height={420}
          >
            <h2 className="feature-gradient-card-title">
              {inspiration.title}
            </h2>

            <div className="feature-gradient-card-marquee">
              <div className="feature-gradient-card-marquee-track">
                <MarqueeGroup items={inspiration.items} />
                <MarqueeGroup items={inspiration.items} />
              </div>
            </div>

            <div className="feature-gradient-card-meta">
              <div
                className="feature-gradient-card-divider"
                aria-hidden="true"
              />
              <p className="feature-gradient-card-note">
                {inspiration.note}
              </p>
              <div className="feature-gradient-card-thanks">
                <span>{inspiration.specialThanksText}</span>
                <LandingImage
                  className="feature-gradient-card-thanks-icon"
                  src={inspiration.thanksIconUrl}
                />
              </div>
            </div>
          </CardFrame>
        </div>
      </div>
    </section>
  );
}
