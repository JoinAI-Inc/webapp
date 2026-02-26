import React from "react";
import { CardFrame } from "./CardFrame";

// Section 4 - Insprition panel
const imgInsprBg = "/ac834a30c719bcaec6b6214694b640cbb1850695.png";
const imgInsprRight = "/9cea046ce8dd41cf4bc1cc1a1bc0b22af4bbd986.png";
// SVG assets from Figma
const imgDivider = "/eae1d5ba4a93242ba477ccb9d70f669c7795f65e.svg"; // 黄色虚线分隔线
const imgFlower = "/new-home/bg-flower.svg"; // 花朵图标
const imgBgPattern = "/new-home/bg-insprition.png"; // 背景纹理

// ─── Section 4: Insprition (48:10031) ─────────────────────────────────────────
export function InspritionSection() {
    return (
        <section
            style={{
                width: "100%",
                maxWidth: 1600,
                borderRadius: 32,
                background: "linear-gradient(180deg, #DA2524 0%, #C00B0A 100%)",
                position: "relative",
                overflow: "hidden",
                minHeight: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 0",
            }}
        >
            {/* 背景纹理图，居中覆盖，保持宽高比 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imgBgPattern}
                alt=""
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "100%",
                    height: "auto",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />
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

                {/* 左列文字 */}
                {/* 哈尼桃桃酱 */}
                <div style={{ position: "absolute", top: "22.62%", left: "19.13%", right: "51.43%", bottom: "71.67%", display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "center", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>哈尼桃桃酱   ID:Yetkitty951004</p>
                </div>
                {/* 绵绵岛 */}
                <div style={{ position: "absolute", top: "31.19%", left: "27.45%", right: "51.43%", bottom: "63.10%", display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "right", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>绵绵岛   ID:375785978</p>
                </div>
                {/* -是溪溪呀- */}
                <div style={{ position: "absolute", top: "39.76%", left: "22.86%", right: "51.43%", bottom: "54.52%", display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "right", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>-是溪溪呀-   ID:944605407</p>
                </div>
                {/* 是安宁呀 */}
                <div style={{ position: "absolute", top: "48.33%", left: "17.39%", right: "51.43%", bottom: "45.95%", display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "right", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>是安宁呀！！！   ID:6574283932</p>
                </div>
                {/* 贝贝万事屋 */}
                <div style={{ position: "absolute", top: "56.90%", left: "20.25%", right: "51.43%", bottom: "37.38%", display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "right", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>贝贝万事屋   ID:bei185448278</p>
                </div>
                {/* 数码侦探小何 */}
                <div style={{ position: "absolute", top: "65.48%", left: "15.78%", right: "51.43%", bottom: "28.81%", display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "right", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>数码侦探小何   ID:bei94118559427</p>
                </div>

                {/* 右列文字 */}
                {/* 李开心的亲子时光 */}
                <div style={{ position: "absolute", top: "22.62%", left: "51.55%", right: "16.27%", bottom: "71.67%", display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "center", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>李开心的亲子时光   ID:207305504</p>
                </div>
                {/* Nico匠 */}
                <div style={{ position: "absolute", top: "31.19%", left: "51.55%", right: "29.07%", bottom: "63.10%", display: "flex", flexDirection: "column", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>Nico匠  ID:Hyl95234</p>
                </div>
                {/* 米米 */}
                <div style={{ position: "absolute", top: "39.76%", left: "51.55%", right: "20%", bottom: "54.52%", display: "flex", flexDirection: "column", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>米米🌸🌸🌸   ID:95555262084</p>
                </div>
                {/* 叔系少年老三 */}
                <div style={{ position: "absolute", top: "48.33%", left: "51.55%", right: "20%", bottom: "45.95%", display: "flex", flexDirection: "column", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>叔系少年老三   ID:R44444444</p>
                </div>
                {/* 鹿儿Tata */}
                <div style={{ position: "absolute", top: "56.90%", left: "51.55%", right: "25.47%", bottom: "37.38%", display: "flex", flexDirection: "column", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>鹿儿Tata   ID:109627123</p>
                </div>
                {/* Mici */}
                <div style={{ position: "absolute", top: "65.48%", left: "51.55%", right: "29.44%", bottom: "28.81%", display: "flex", flexDirection: "column", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
                    <p style={nameStyle}>Mici   ID:959628182</p>
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
