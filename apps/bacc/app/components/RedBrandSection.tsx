
const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';
// ─── Section 2: 红色品牌区 (46:1518) ──────────────────────────────────────────
// 背景纹理 SVG
const imgBgPattern = `${IMAGE_URL}/new-home/bg-pattern.svg`;
// 左侧装饰
const imgLeft1 = `${IMAGE_URL}/new-home/bg-petal-landscape.png`; // 花瓣山水
const imgLeft2 = `${IMAGE_URL}/new-home/bg-mid-autumn.png`; // 中秋祝福
const imgLeft3 = `${IMAGE_URL}/new-home/bg-guo-chao.png`; // 国潮山水
// 右侧装饰
const imgRight1 = `${IMAGE_URL}/new-home/bg-feng-jing.png`; // 中国风古风山峰
const imgRight2 = `${IMAGE_URL}/new-home/bg-dragon-boat.png`; // 端午素材
// 中央福字图标
const imgFuIcon = `${IMAGE_URL}/new-home/icon-fu.png`;

export function RedBrandSection() {
    return (
        <section
            style={{
                width: "100%",
                height: 500,
                background: "#DD1E1B",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* 背景纹理 SVG - 链状图案 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                alt=""
                src={imgBgPattern}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 2556,
                    height: 1357,
                    maxWidth: "none",
                    opacity: 0.6,
                    pointerEvents: "none",
                }}
            />

            {/* 左侧装饰 */}
            <div style={{ position: "absolute", left: 0, top: 150, width: 420, height: 350 }}>
                {/* 花瓣山水 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt=""
                    src={imgLeft1}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "-10%",
                        width: "110%",
                        height: "132%",
                        objectFit: "cover",
                        maxWidth: "none",
                    }}
                />
            </div>
            <div style={{ position: "absolute", left: 0, top: 198, width: 408, height: 302, overflow: "hidden" }}>
                {/* 中秋祝福背景 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt=""
                    src={imgLeft2}
                    style={{
                        position: "absolute",
                        top: "-71%",
                        left: "-49%",
                        width: "149%",
                        height: "287%",
                        maxWidth: "none",
                    }}
                />
            </div>
            {/* 国潮山水 - 翻转 */}
            <div
                style={{
                    position: "absolute",
                    left: 360,
                    top: 430,
                    width: 131,
                    height: 70,
                    overflow: "hidden",
                    transform: "scaleY(-1) rotate(180deg)",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt=""
                    src={imgLeft3}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "163%", maxWidth: "none" }}
                />
            </div>

            {/* 右侧装饰 */}
            <div style={{ position: "absolute", right: 0, top: 157, width: 288, height: 304, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt=""
                    src={imgRight1}
                    style={{ position: "absolute", top: 0, left: 0, width: "127%", height: "100%", maxWidth: "none" }}
                />
            </div>
            <div style={{ position: "absolute", right: 107, top: 294, width: 235, height: 190, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt=""
                    src={imgRight2}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "108%", maxWidth: "none" }}
                />
            </div>

            {/* 中央内容 */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    width: 600,
                    textAlign: "center",
                }}
            >
                {/* 福字图标 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt="福"
                    src={imgFuIcon}
                    style={{ width: 68, height: 68, objectFit: "contain" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                    <h2
                        style={{
                            fontFamily: "Manrope, sans-serif",
                            fontWeight: 600,
                            fontSize: 28,
                            lineHeight: 1.4,
                            letterSpacing: "0.28px",
                            color: "#fff",
                            margin: 0,
                        }}
                    >
                        furtune Foto of the year now
                    </h2>
                    <p
                        style={{
                            fontFamily: "Manrope, sans-serif",
                            fontWeight: 400,
                            fontSize: 19,
                            lineHeight: 1.4,
                            letterSpacing: "0.19px",
                            color: "rgba(255,255,255,0.73)",
                            margin: 0,
                        }}
                    >
                        Capture the moments in the new year,<br />
                        Let every click of the shutter preserve the essence of time.<br />
                        May the coming year be as splendid as a brocade, with all wishes fulfilled.
                    </p>
                </div>
            </div>
        </section>
    );
}
