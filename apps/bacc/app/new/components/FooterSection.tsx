import { TryItFreeButton } from "./TryItFreeButton";

const BASE = "/new-home"
// Footer - 转动相册
const fImg21 = BASE + "/img-foot-21.png";
const fImg22 = BASE + "/img-foot-22.png";
const fImg23 = BASE + "/img-foot-23.png";
const fImg28 = BASE + "/img-foot-28.png";
const fImg27 = BASE + "/img-foot-27.png";
const fImg29 = BASE + "/img-foot-29.png";
const fImg210 = BASE + "/img-foot-210.png";
const fImg211 = BASE + "/img-foot-211.png";
const fImg212 = BASE + "/img-foot-212.png";
const fImg213 = BASE + "/img-foot-213.png";
const fImgFooterBg = BASE + "/img-foot-bg.png";

// ─── Section 6: Footer (154:861) ─────────────────────────────────────────────
const footerPhotos = [
    { src: fImg213, left: -18.54, top: 273.71, rotate: 2 },
    { src: fImg212, left: 177, top: 271.94, rotate: -3 },
    { src: fImg211, left: 377.91, top: 267.71, rotate: 5 },
    { src: fImg210, left: 588, top: 271.94, rotate: -3 },
    { src: fImg29, left: 788.34, top: 268.71, rotate: 4.53 },
    { src: fImg27, left: 996, top: 275.96, rotate: -0.7 },
    { src: fImg28, left: 1184.33, top: 268.71, rotate: 4.34 },
    { src: fImg22, left: 1391.86, top: 274.71, rotate: 1.18 },
    { src: fImg21, left: 1583, top: 266, rotate: -6.31 },
    { src: fImg23, left: 1800, top: 266.21, rotate: -6 },
];

export function FooterSection() {
    return (
        <section
            style={{
                width: "100%",
                position: "relative",
                overflow: "hidden",
                minHeight: 700,
            }}
        >
            {/* 背景渐变 */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 1920,
                    height: 819,
                    background: "linear-gradient(180deg, #C4100F 0%, #7A0202 100%)",
                }}
            />
            {/* 背景纹理图 */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 1920,
                    height: 819,
                    opacity: 0.53,
                    overflow: "hidden",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fImgFooterBg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            {/* 转动照片区 */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    top: 0,
                    width: 1920,
                    height: 590,
                }}
            >
                {footerPhotos.map((p, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: p.left,
                            top: p.top,
                            width: 224.853,
                            height: 299.318,
                            transform: `rotate(${p.rotate}deg)`,
                            border: "3px solid white",
                            borderRadius: 18,
                            overflow: "hidden",
                            background: "#f8e8e8",
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={p.src}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </div>
                ))}
            </div>

            {/* CTA 区域 */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 24,
                    alignItems: "center",
                    paddingTop: 80,
                }}
            >
                <h2
                    style={{
                        fontFamily: "Manrope, sans-serif",
                        fontWeight: 600,
                        fontSize: 40,
                        lineHeight: 1.3,
                        color: "#FFF3E0",
                        letterSpacing: 0.4,
                        margin: 0,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                    }}
                >
                    GET your fortune Foto right now
                </h2>
                <TryItFreeButton variant="inverse" suffix=">" />
            </div>

            {/* Copyright */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 2,
                    textAlign: "center",
                    paddingBottom: 32,
                }}
            >
                <p
                    style={{
                        fontFamily: "Manrope, sans-serif",
                        fontWeight: 400,
                        fontSize: 14,
                        lineHeight: 1.4,
                        color: "#E0B2B2",
                        letterSpacing: 0.14,
                        margin: 0,
                    }}
                >
                    Copyright © 2026 JoinAI. All rights reserved.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <a
                        href="#"
                        style={{ color: "#E0B2B2", textDecoration: "underline" }}
                    >
                        浙ICP备2021040718号-2
                    </a>
                </p>
            </div>
        </section>
    );
}

