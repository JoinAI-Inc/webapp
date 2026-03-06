"use client";

import Image from "next/image";
import { TryItFreeButton } from "./TryItFreeButton";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

// Hero 背景纹理 - 18% opacity 链状图案
const imgHeroBg = `${IMAGE_URL}/new-home/bg-hero.png`;

// Hero 图片数组 (从Figma导出) - null 代表边缘灰色占位块
const ROW_IMAGES: (string)[][] = [
    [
        `${IMAGE_URL}/new-home/img-home-hero-1-1.png`,
        `${IMAGE_URL}/new-home/img-home-hero-1-2.png`,
        `${IMAGE_URL}/new-home/img-home-hero-1-3.png`,
        `${IMAGE_URL}/new-home/img-home-hero-1-4.png`,
        `${IMAGE_URL}/new-home/img-home-hero-1-5.png`,
        `${IMAGE_URL}/new-home/img-home-hero-1-6.png`,
        `${IMAGE_URL}/new-home/img-home-hero-1-7.png`,
        `${IMAGE_URL}/new-home/img-home-hero-1-8.png`,
    ],
    [
        `${IMAGE_URL}/new-home/img-home-hero-2-1.png`,
        `${IMAGE_URL}/new-home/img-home-hero-2-2.png`,
        `${IMAGE_URL}/new-home/img-home-hero-2-3.png`,
        `${IMAGE_URL}/new-home/img-home-hero-2-4.png`,
        `${IMAGE_URL}/new-home/img-home-hero-2-5.png`,
        `${IMAGE_URL}/new-home/img-home-hero-2-6.png`,
        `${IMAGE_URL}/new-home/img-home-hero-2-7.png`,
        `${IMAGE_URL}/new-home/img-home-hero-2-8.png`,
    ],
    [
        `${IMAGE_URL}/new-home/img-home-hero-3-1.png`,
        `${IMAGE_URL}/new-home/img-home-hero-3-2.png`,
        `${IMAGE_URL}/new-home/img-home-hero-3-3.png`,
        `${IMAGE_URL}/new-home/img-home-hero-3-4.png`,
        `${IMAGE_URL}/new-home/img-home-hero-3-5.png`,
        `${IMAGE_URL}/new-home/img-home-hero-3-6.png`,
        `${IMAGE_URL}/new-home/img-home-hero-3-7.png`,
        `${IMAGE_URL}/new-home/img-home-hero-3-8.png`,
    ],
];

// ─── Section 1: 头屏 Hero ──────────────────────────────────────────────────────
export function HeroSection() {
    return (
        <section style={{ position: "relative", width: "100%", minHeight: 1380, overflow: "hidden", background: "#fff" }}
            className="flex justify-center flex-col">
            {/* Hero 背景 - 白色底 + 18% opacity 链状纹理 */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: 581,
                    overflow: "hidden",
                    opacity: 0.3,
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imgHeroBg}
                    alt=""
                    style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }}
                />
            </div>


            {/* 标题区域 - x:559.5, y:134, w:802, h:382 -> 居中 */}
            <div
                style={{
                    width: '100%',
                    textAlign: "center",
                    zIndex: 2,
                }}
                className="flex flex-col items-center pt-[134px]"
            >
                <Image
                    src={`${IMAGE_URL}/new-home/icon-house.png`}
                    alt="icon-house"
                    width={158}
                    height={89}
                    style={{ objectFit: "contain" }}
                />

                {/* 行1：The most popular fortune */}
                <h1
                    style={{
                        fontFamily: "Manrope, sans-serif",
                        fontWeight: 800,
                        fontSize: 76,
                        lineHeight: 1.1,
                        color: "#1a1a1a",
                        margin: 0,
                        padding: 0,
                    }}
                >
                    The most{" "}
                    <span style={{ color: "#FF3F2A" }}>popular fortune</span>
                </h1>
                {/* 行2：foto in 小红书 */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                        marginTop: 8,
                    }}
                >
                    <h1
                        style={{
                            fontFamily: "Manrope, sans-serif",
                            fontWeight: 800,
                            fontSize: 76,
                            lineHeight: 1.1,
                            color: "#1a1a1a",
                            margin: 0,
                            padding: 0,
                        }}
                    >
                        foto in
                    </h1>
                    <Image
                        src={`${IMAGE_URL}/new-home/icon-xiaohongshu.png`}
                        alt="小红书"
                        width={150}
                        height={69}
                        style={{ objectFit: "contain" }}
                    />
                </div>
                <p
                    style={{
                        fontFamily: "Manrope, sans-serif",
                        fontWeight: 400,
                        fontSize: 18,
                        lineHeight: 1.4,
                        color: "#666",
                        marginTop: 24,
                    }}
                >
                    how to make a foto that real Chinese would jealous
                </p>
                {/* CTA 按钮 */}
                <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
                    <TryItFreeButton />
                </div>
            </div>

            {/* 图片网格 - 三行，首尾灰块溢出裁切 */}
            <div className="mx-[100px] my-[120px] rounded-[30px] overflow-hidden h-[700px] flex items-center">
                <div
                    style={{
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        gap: 18,
                    }}
                >
                    {ROW_IMAGES.map((images, ri) => (
                        <div
                            key={ri}
                            style={{
                                position: "relative",
                                left: "50%",
                                transform: "translateX(-50%)",
                                display: "flex",
                                gap: 18,
                                width: "max-content",
                            }}
                        >
                            {images.map((src, i) => (
                                <div
                                    key={i}
                                    className="skeleton"
                                    style={{
                                        width: 200,
                                        height: 263,
                                        borderRadius: 15,
                                        flexShrink: 0,
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    <Image
                                        src={src}
                                        alt=""
                                        fill
                                        priority={ri === 0}
                                        sizes="200px"
                                        className="object-cover"
                                        style={{ zIndex: 1 }}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

        </section>
    );
}

