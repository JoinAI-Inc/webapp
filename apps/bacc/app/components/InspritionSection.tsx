import type { CSSProperties } from "react";
import { CardFrame } from "./CardFrame";
import { LandingImage } from "./LandingImage";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "";
const BASE = `${IMAGE_URL}/new-home`;

const imgLeftDecor = `${BASE}/bg-insprition-left.png`;
const imgRightDecor = `${BASE}/bg-insprition-right.png`;
const imgThanksIcon = "/icon-xhs.svg";
const imgBgPattern = "/bg-insprition.svg";

const INSPIRATION_ITEMS = [
  { id: "Yetkitty951004", name: "哈尼桃桃酱" },
  { id: "207305504", name: "李开心的亲子时光" },
  { id: "375785978", name: "绵绵岛" },
  { id: "Hyl95234", name: "Nico匠" },
  { id: "944605407", name: "-是溪溪呀-" },
  { id: "95555262084", name: "米米🌸🌸🌸" },
  { id: "6574283932", name: "是安宁呀！！！" },
  { id: "R44444444", name: "叔系少年老三" },
  { id: "bei185448278", name: "贝贝万事屋" },
  { id: "109627123", name: "鹿儿Tata" },
  { id: "94118559427", name: "数码侦探小何" },
  { id: "959628182", name: "Mici" },
];

function chunkPairs<T>(items: T[]) {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }
  return rows;
}

function MarqueeGroup() {
  return (
    <div className="feature-gradient-card-marquee-group">
      {chunkPairs(INSPIRATION_ITEMS).map((row, rowIndex) => (
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

export function InspritionSection() {
  return (
    <section
      className="feature-gradient-card-section"
      aria-hidden="true"
      data-landing-section
    >
      <div
        className="feature-gradient-card"
        style={
          {
            "--feature-gradient-card-pattern": `url(${imgBgPattern})`,
          } as CSSProperties
        }
      >
        <div className="feature-gradient-card-decor" aria-hidden="true">
          <LandingImage
            className="feature-gradient-card-decor-left"
            src={imgLeftDecor}
          />
          <LandingImage
            className="feature-gradient-card-decor-right"
            src={imgRightDecor}
          />
        </div>

        <div className="feature-gradient-card-frame">
          <CardFrame
            className="feature-gradient-card-frame-center"
            width="clamp(442px, calc(222.84px + 29.83vw), 700px)"
            height={420}
          >
            <h2 className="feature-gradient-card-title">Insprition from</h2>

            <div className="feature-gradient-card-marquee">
              <div className="feature-gradient-card-marquee-track">
                <MarqueeGroup />
                <MarqueeGroup />
              </div>
            </div>

            <div className="feature-gradient-card-meta">
              <div
                className="feature-gradient-card-divider"
                aria-hidden="true"
              />
              <p className="feature-gradient-card-note">
                鼓励大家去follow他们的话和感谢的话
              </p>
              <div className="feature-gradient-card-thanks">
                <span>Special Thanks to</span>
                <LandingImage
                  className="feature-gradient-card-thanks-icon"
                  src={imgThanksIcon}
                />
              </div>
            </div>
          </CardFrame>
        </div>
      </div>
    </section>
  );
}
