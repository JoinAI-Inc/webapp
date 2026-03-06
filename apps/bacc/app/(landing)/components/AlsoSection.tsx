import React from "react";
import { TryItFreeButton } from "./TryItFreeButton";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

// Section 3 - Also / Pet / OOTD
const BASE = IMAGE_URL + "/new-home/";

// Also section 4 photos
const imgRect2720 = BASE + "img-also-1.png";
const imgRect2717 = BASE + "img-also-2.png";
const imgRect2718 = BASE + "img-also-3.png";
const imgRect2719 = BASE + "img-also-4.png";

// Pet section decorative
const imgCoin = BASE + "bg-also-1.png";
const imgPetBg = BASE + "bg-also-3.png";
const imgPetMain = BASE + "img-also-pet-bl.png";
const imgPetSmall1 = BASE + "img-also-pet-tr.png";
const imgPetSmall2 = BASE + "img-also-pet-tl.png";
const imgPetSmall3 = BASE + "img-also-pet-br.png";

// OOTD section
const imgOotd1 = BASE + "img-also-gen-1-2.png";
const imgOotd2 = BASE + "img-also-gen-2-2.png";
const imgOotd3 = BASE + "img-also-gen-3-2.png";
const imgAfter1 = BASE + "img-also-gen-1-3.jpg";
const imgAfter2 = BASE + "img-also-gen-2-3.jpg";
const imgAfter3 = BASE + "img-also-gen-3-3.jpg";
const imgBefore1 = BASE + "img-also-gen-1-1.jpg";
const imgBefore2 = BASE + "img-also-gen-2-1.jpg";
const imgBefore3 = BASE + "img-also-gen-3-1.jpg";

const headingStyle: React.CSSProperties = {
    fontFamily: "Manrope, sans-serif",
    fontWeight: 600,
    fontSize: 40,
    lineHeight: 1.3,
    letterSpacing: 0.4,
    color: "#000",
    margin: 0,
};

const bodyStyle: React.CSSProperties = {
    fontFamily: "Manrope, sans-serif",
    fontWeight: 400,
    fontSize: 17,
    lineHeight: 1.4,
    letterSpacing: 0.17,
    color: "#404040",
    margin: 0,
};

const CAPTION =
    "Capture the moments in the new year,Let every click of the shutter preserve the essence of time.May the coming year be as splendid as a brocade, with all wishes fulfilled.";

// ─── Section 3a: Also can not just you (48:9215) ─────────────────────────────
function AlsoSubSection() {
    return (
        <section
            style={{
                width: "100%",
                height: 1000,
                padding: "120px 240px 80px",
                display: "flex",
                flexDirection: "column",
                gap: 48,
                alignItems: "center",
                boxSizing: "border-box",
                position: "relative",
            }}
        >
            {/* 左侧装饰铜钱 */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 180,
                    height: 368,
                    opacity: 0.6,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgCoin} alt="" style={{ position: "absolute", left: "-100%", top: 0, width: "200%", height: "100%", maxWidth: "none" }} />
            </div>

            {/* 右下角装饰铜钱 */}
            <div
                style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    width: 180,
                    height: 368,
                    opacity: 0.6,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgCoin} alt="" style={{ position: "absolute", left: 0, top: "5%", width: "200%", height: "100%", maxWidth: "none" }} />
            </div>

            {/* 标题 */}
            <div style={{ width: 760, textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={headingStyle}>
                    Also, can <span style={{ color: "#FF3F2A" }}>not just  you...</span>
                </h2>
                <p style={bodyStyle}>{CAPTION}</p>
            </div>

            {/* 4图区域 */}
            <div style={{ display: "flex", gap: 24, height: 512, alignItems: "center", width: "100%" }}>
                {[imgRect2720, imgRect2717, imgRect2718, imgRect2719].map((src, i) => (
                    <div key={i} className="skeleton" style={{ flex: "1 0 0", height: "100%", borderRadius: 15, overflow: "hidden", position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" loading="lazy"
                            onLoad={(e) => (e.currentTarget.parentElement as HTMLElement)?.classList.remove('skeleton')}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Section 3b: OR, Even for your pet ───────────────────────────────────────
function PetSection() {
    return (
        <section style={{ width: "100%", position: "relative", minHeight: 720 }}>
            {/* 全宽背景图 */}
            <div style={{ position: "absolute", left: 0, bottom: -200, width: "100%", height: 527, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgPetBg} alt="" style={{ width: "auto", height: "100%", objectFit: "cover", maxWidth: "none" }} />
            </div>



            {/* 小图 - 左上 */}
            <div
                className="skeleton"
                style={{
                    position: "absolute",
                    left: "588px",
                    top: "-50px",
                    width: 133,
                    height: 191,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #ddd",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgPetSmall2} alt="" loading="lazy"
                    onLoad={(e) => (e.currentTarget.parentElement as HTMLElement)?.classList.remove('skeleton')}
                    style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
            </div>

            {/* 主标题 */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    top: 220,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    fontFamily: "Manrope, sans-serif",
                    fontWeight: 600,
                    fontSize: 100,
                    lineHeight: 1.3,
                    letterSpacing: 1,
                    color: "#000",
                    zIndex: 10,
                }}
            >
                <span style={{ color: "#FF3F2A" }}>OR, </span>
                <span>Even for </span>
                <span style={{ color: "#FF3F2A" }}>your pet</span>
            </div>

            {/* 说明文字 */}
            <div
                style={{
                    position: "absolute",
                    left: "600px",
                    top: 450,
                    width: 560,
                    zIndex: 10,
                }}
            >
                <p style={bodyStyle}>{CAPTION}</p>
            </div>

            {/* 小图 - 右上 */}
            <div
                className="skeleton"
                style={{
                    position: "absolute",
                    right: "350px",
                    top: "-70px",
                    width: 256,
                    height: 331,
                    borderRadius: 24,
                    overflow: "hidden",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgPetSmall1} alt="" loading="lazy"
                    onLoad={(e) => (e.currentTarget.parentElement as HTMLElement)?.classList.remove('skeleton')}
                    style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
            </div>

            {/* 主大图 - 左 */}
            <div
                className="skeleton"
                style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: 307,
                    height: 410,
                    borderRadius: 16,
                    overflow: "hidden",
                    marginLeft: 240,
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgPetMain} alt="" loading="lazy"
                    onLoad={(e) => (e.currentTarget.parentElement as HTMLElement)?.classList.remove('skeleton')}
                    style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
            </div>

            {/* 小图 - 右下 */}
            <div
                className="skeleton"
                style={{
                    position: "absolute",
                    right: 0,
                    bottom: 60,
                    width: 157,
                    height: 204,
                    borderRadius: 12,
                    overflow: "hidden",
                    marginRight: 240,
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgPetSmall3} alt="" loading="lazy"
                    onLoad={(e) => (e.currentTarget.parentElement as HTMLElement)?.classList.remove('skeleton')}
                    style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
            </div>

            {/* 占位高度 */}
            <div style={{ height: 700 }} />
        </section>
    );
}

// ─── Section 3c: IN Every OOTD You LIKE ─────────────────────────────────────
function OotdSection() {
    const cards = [
        { before: imgBefore1, after: imgAfter1, ootd: imgOotd1 },
        { before: imgBefore2, after: imgAfter2, ootd: imgOotd2 },
        { before: imgBefore3, after: imgAfter3, ootd: imgOotd3 },
    ];

    return (
        <section
            style={{
                width: "100%",
                padding: "80px 240px 40px",
                display: "flex",
                flexDirection: "column",
                gap: 48,
                alignItems: "center",
                boxSizing: "border-box",
            }}
        >
            {/* 标题 */}
            <div style={{ width: 760, textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={headingStyle}>
                    IN Every <span style={{ color: "#FF3F2A" }}>OOTD</span> You LIKE
                </h2>
                <p style={bodyStyle}>{CAPTION}</p>
            </div>

            {/* 3列卡片 */}
            <div style={{ display: "flex", gap: 24, width: "100%", justifyContent: "center" }}>
                {cards.map((card, i) => (
                    <div
                        key={i}
                        style={{
                            flex: "1 0 0",
                            backgroundColor: "#F5F5F5",
                            borderRadius: 18,
                            padding: "20px 20px 32px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            boxSizing: "border-box",
                            position: "relative",
                            minWidth: 464,
                            minHeight: 546,
                        }}
                    >
                        {/* 顶部 before/after 小图行 */}
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            {/* before 小图 */}
                            <div
                                className="skeleton"
                                style={{
                                    width: 133,
                                    height: 178,
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    border: "1px solid #ddd",
                                    flexShrink: 0,
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={card.before} alt="" loading="lazy"
                                    onLoad={(e) => (e.currentTarget.parentElement as HTMLElement)?.classList.remove('skeleton')}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
                            </div>
                            {/* OOTD 参考图 */}
                            <div
                                className="skeleton"
                                style={{
                                    width: 145,
                                    height: 178,
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    border: "1px solid #ddd",
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={card.ootd} alt="" loading="lazy"
                                    onLoad={(e) => (e.currentTarget.parentElement as HTMLElement)?.classList.remove('skeleton')}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
                            </div>
                        </div>

                        {/* 箭头 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <div style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
                            <img src={`${IMAGE_URL}/new-home/icon-arrow-g.png`} alt="arrow" style={{ display: "block", marginLeft: 80, marginTop: 12 }} />
                        </div>


                        {/* after 大图 */}
                        <div
                            className="skeleton"
                            style={{
                                position: "absolute",
                                right: 20,
                                bottom: 20,
                                width: 260,
                                height: 348,
                                borderRadius: 16,
                                overflow: "hidden",
                                border: "6px solid #FFD322",
                                alignSelf: "center",
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={card.after} alt="" loading="lazy"
                                onLoad={(e) => (e.currentTarget.parentElement as HTMLElement)?.classList.remove('skeleton')}
                                style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── 对外导出：合并三个子 section ────────────────────────────────────────────
export function AlsoSection() {
    return (
        <>
            <AlsoSubSection />
            <PetSection />
            <OotdSection />

            <div style={{ marginTop: 50, marginBottom: 100, display: "flex", justifyContent: "center" }}>
                <TryItFreeButton />
            </div>
        </>
    );
}
