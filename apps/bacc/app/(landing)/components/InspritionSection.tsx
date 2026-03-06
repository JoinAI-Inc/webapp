import React from "react";
import { CardFrame } from "./CardFrame";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

// Section 4 - Insprition panel
const imgInsprBg = `${IMAGE_URL}/new-home/bg-insprition-left.png`;
const imgInsprRight = `${IMAGE_URL}/new-home/bg-insprition-right.png`;
// SVG assets from Figma
const imgDivider = `${IMAGE_URL}/new-home/bg-insprition-divider.svg`; // 黄色虚线分隔线
const imgFlower = `/icon-xhs.svg`; // 花朵图标
const imgBgPattern = `/bg-insprition.svg`; // 背景纹理

// ─── 垂直无缝滚动列组件 ────────────────────────────────────────────────────────
function MarqueeColumn({
    names,
    align,
    duration = 18,
}: {
    names: string[];
    align: "flex-end" | "flex-start";
    duration?: number;
}) {
    const GAP = 28; // px，行间距
    return (
        <div
            style={{
                flex: 1,
                overflow: "hidden",
                // 上下渐变遮罩
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
            }}
        >
            {/* 内容复制两份，滚完一份回到起点，实现无缝循环 */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: align,
                    gap: GAP,
                    animation: `marquee-up ${duration}s linear infinite`,
                }}
            >
                {/* 原始列表 */}
                {names.map((name, i) => (
                    <p key={i} style={nameStyle}>{name}</p>
                ))}
                {/* 复制列表，保证滚动无缝衔接 */}
                {names.map((name, i) => (
                    <p key={`dup-${i}`} style={nameStyle} aria-hidden>{name}</p>
                ))}
            </div>
        </div>
    );
}

// ─── Section 4: Insprition (48:10031) ─────────────────────────────────────────
export function InspritionSection() {
    return (
        <section
            style={{
                width: "100%",
                maxWidth: 1600,
                borderRadius: 32,
                background: `url(${imgBgPattern}), linear-gradient(180deg, #DA2524 0%, #C00B0A 100%)`,
                position: "relative",
                overflow: "hidden",
                minHeight: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 0"
            }}
        >
            {/* 背景纹理图，居中覆盖，保持宽高比 */}
            {/* 左下角荷花装饰图 */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: 352,
                    height: 448,
                    pointerEvents: "none",
                    overflow: "hidden",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imgInsprBg}
                    alt=""
                    style={{
                        position: "absolute",
                        width: "106.25%",
                        height: "148.44%",
                        left: "-6.25%",
                        top: "-17.41%",
                        maxWidth: "none",
                    }}
                />
            </div>
            {/* 右侧装饰图 */}
            <div
                style={{
                    position: "absolute",
                    top: 80,
                    right: 0,
                    width: 329,
                    height: 500,
                    pointerEvents: "none",
                    overflow: "hidden",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imgInsprRight}
                    alt=""
                    style={{
                        position: "absolute",
                        width: "106.18%",
                        height: "124.13%",
                        left: 0,
                        top: 0,
                        maxWidth: "none",
                    }}
                />
            </div>

            {/* 中心卡片区域：固定 805×420 */}
            <CardFrame width={805} height={420}>

                {/* 标题 "Insprition from" */}
                <div
                    style={{
                        position: "absolute",
                        top: "9.52%",
                        left: "37.52%",
                        right: "37.52%",
                        bottom: "81.19%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                    }}
                >
                    <p
                        style={{
                            fontFamily: "Manrope, sans-serif",
                            fontWeight: 600,
                            fontSize: 28,
                            lineHeight: 1.4,
                            letterSpacing: 0.28,
                            color: "#C51C1B",
                            margin: 0,
                        }}
                    >
                        Insprition from
                    </p>
                </div>

                <style>{`
                    @keyframes marquee-up {
                        from { transform: translateY(0); }
                        to { transform: translateY(-50%); }
                    }
                `}</style>
                {/* 名单两列：左列右对齐，右列左对齐，中间 gap */}
                <div style={{
                    position: "absolute",
                    top: "22.62%",
                    bottom: "28.81%",
                    left: "10%",
                    right: "10%",
                    display: "flex",
                    flexDirection: "row",
                    gap: 24,
                }}>
                    <MarqueeColumn
                        align="flex-end"
                        duration={25}
                        names={[
                            "哈尼桃桃酱   ID:Yetkitty951004",
                            "绵绵岛   ID:375785978",
                            "-是溪溪呀-   ID:944605407",
                            "是安宁呀！！！   ID:6574283932",
                            "贝贝万事屋   ID:bei185448278",
                            "数码侦探小何   ID:bei94118559427",
                        ]}
                    />
                    <MarqueeColumn
                        align="flex-start"
                        duration={25}
                        names={[
                            "李开心的亲子时光   ID:207305504",
                            "Nico匠   ID:Hyl95234",
                            "米米🌸🌸🌸   ID:95555262084",
                            "叔系少年老三   ID:R44444444",
                            "鹿儿Tata   ID:109627123",
                            "Mici   ID:959628182",
                        ]}
                    />
                </div>

                {/* 底部区域：虚线 + 感谢文字 */}
                <div
                    style={{
                        position: "absolute",
                        top: "74.29%",
                        left: "10.31%",
                        right: "10.19%",
                        bottom: "9.52%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 20,
                    }}
                >
                    {/* 虚线分隔线 */}
                    <div style={{ position: "relative", width: 640, height: 0, flexShrink: 0 }}>
                        <div style={{ position: "absolute", top: -0.5, left: 0, right: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgDivider} alt="" style={{ display: "block", width: "100%", height: 1, maxWidth: "none" }} />
                        </div>
                    </div>
                    {/* 文字区域 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <p
                            style={{
                                fontFamily: "Manrope, sans-serif",
                                fontWeight: 400,
                                fontSize: 14,
                                lineHeight: 1.4,
                                letterSpacing: 0.14,
                                color: "#C51C1B",
                                textAlign: "center",
                                margin: 0,
                                whiteSpace: "nowrap",
                            }}
                        >
                            鼓励大家去follow他们的话和感谢的话
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <span
                                style={{
                                    fontFamily: "Manrope, sans-serif",
                                    fontWeight: 400,
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                    letterSpacing: 0.14,
                                    color: "#C51C1B",
                                    textAlign: "center",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Special Thanks to
                            </span>
                            {/* 花朵图标 24×24 */}
                            <div style={{ width: 24, height: 24, flexShrink: 0, position: "relative" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imgFlower} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", maxWidth: "none" }} />
                            </div>
                        </div>
                    </div>
                </div>
            </CardFrame>
        </section>
    );
}

const nameStyle: React.CSSProperties = {
    fontFamily: "Manrope, 'Noto Sans SC', 'Noto Sans JP', sans-serif",
    fontWeight: 400,
    fontSize: 17,
    lineHeight: 1.4,
    letterSpacing: 0.17,
    color: "#E29211",
    margin: 0,
};
