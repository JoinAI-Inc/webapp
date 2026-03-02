"use client";
import { useState } from "react";
import { FooterSection } from "../components/FooterSection";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

// 右侧马年插画
const imgHorses = `${IMAGE_URL}/new-home/img-about-horses.png`;
// 背景纹理（福马纹）
const imgBg = `${IMAGE_URL}/new-home/bg-home-1.png`;

type Status = "idle" | "submitting" | "done" | "limitReached";

export default function AboutPage() {
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");

    const canSend = message.trim().length > 0 && status === "idle";

    async function handleSend() {
        if (!canSend) return;
        setStatus("submitting");
        setError("");
        try {
            const res = await fetch("/api/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: message.trim() }),
            });
            if (res.status === 429) {
                setStatus("limitReached");
            } else if (res.ok) {
                setStatus("done");
                setMessage("");
            } else {
                throw new Error("Server error");
            }
        } catch {
            setStatus("idle");
            setError("Failed to send, please try again.");
        }
    }

    const btnLabel =
        status === "submitting"
            ? "Sending..."
            : status === "done"
                ? "Sent ✓"
                : status === "limitReached"
                    ? "Already sent ✓"
                    : "Send";

    const btnActive = canSend;

    return (
        <div
            style={{
                background: "#fff8ed",
                width: "100%",
                position: "relative",
                overflowX: "hidden",
            }}
        >
            {/* ─── 主内容区 ─── */}
            <section
                style={{
                    position: "relative",
                    width: "100%",
                    minHeight: 900,
                    overflow: "hidden",
                }}
            >
                {/* 背景纹理图 */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 1920,
                        height: 680,
                        pointerEvents: "none",
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imgBg}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                </div>

                {/* 内容容器（最大宽 1488，居中） */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        maxWidth: 1488,
                        margin: "0 auto",
                        padding: "0 0",
                    }}
                >
                    {/* ─── 右侧：马年插画（absolute，对应 Figma left:1090, top:144） ─── */}
                    <div
                        style={{
                            position: "absolute",
                            left: 806,
                            top: 144,
                            width: 550,
                            height: 723,
                            overflow: "hidden",
                            pointerEvents: "none",
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imgHorses}
                            alt="Lucky horses illustration"
                            style={{
                                position: "absolute",
                                width: "104.36%",
                                height: "105.4%",
                                left: "-2.36%",
                                top: "-5.4%",
                                objectFit: "cover",
                            }}
                        />
                    </div>

                    {/* ─── 左侧：表单区域 ─── */}
                    <div
                        style={{
                            paddingTop: 194,
                            paddingLeft: 284,
                            width: 727,
                        }}
                    >
                        {/* 标题 */}
                        <p
                            style={{
                                fontFamily: "Manrope, sans-serif",
                                fontWeight: 600,
                                fontSize: 40,
                                lineHeight: 1.3,
                                color: "#ff3f2a",
                                letterSpacing: 0.4,
                                margin: "0 0 0",
                            }}
                        >
                            Leave us a message 💌
                        </p>
                        <p
                            style={{
                                fontFamily: "Manrope, sans-serif",
                                fontWeight: 600,
                                fontSize: 40,
                                lineHeight: 1.3,
                                color: "#000",
                                letterSpacing: 0.4,
                                margin: "0 0 0",
                            }}
                        >
                            just that your option is{" "}
                            <span style={{ color: "#ff3f2a" }}>precious to us</span>
                        </p>
                        <p
                            style={{
                                fontFamily: "Manrope, sans-serif",
                                fontWeight: 600,
                                fontSize: 40,
                                lineHeight: 1.3,
                                color: "#000",
                                letterSpacing: 0.4,
                                margin: "0 0 24px",
                            }}
                        >
                            feel free to write down anything
                        </p>

                        {/* 文本框 */}
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Leave us a message..."
                            disabled={status === "done" || status === "limitReached"}
                            style={{
                                width: "100%",
                                height: 327,
                                background: "#fffbf5",
                                border: "1px solid #e2d6c5",
                                borderRadius: 16,
                                padding: "16px",
                                fontFamily: "Manrope, sans-serif",
                                fontSize: 17,
                                color: "#333",
                                letterSpacing: 0.17,
                                lineHeight: 1.4,
                                resize: "none",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />

                        {/* Send 按钮 */}
                        <div style={{ marginTop: 16 }}>
                            <button
                                onClick={handleSend}
                                disabled={!btnActive}
                                style={{
                                    background: btnActive ? "#ff3f2a" : "#bebebe",
                                    border: "none",
                                    borderRadius: 81,
                                    padding: "10px 28px",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: 17,
                                    color: "#fff",
                                    letterSpacing: 0.17,
                                    cursor: btnActive ? "pointer" : "default",
                                    transition: "background 0.2s",
                                    lineHeight: 1.4,
                                    minWidth: 106,
                                }}
                            >
                                {btnLabel}
                            </button>
                        </div>

                        {/* 错误提示 */}
                        {error && (
                            <p
                                style={{
                                    marginTop: 8,
                                    fontSize: 13,
                                    color: "#e53e3e",
                                    fontFamily: "Manrope, sans-serif",
                                }}
                            >
                                {error}
                            </p>
                        )}

                        {/* 邮箱备选 */}
                        <p
                            style={{
                                marginTop: 12,
                                fontFamily:
                                    "Manrope, 'Noto Sans JP', 'Noto Sans SC', sans-serif",
                                fontSize: 14,
                                color: "#716b62",
                                letterSpacing: 0.14,
                                lineHeight: 1.4,
                            }}
                        >
                            or sent us an E-Mail：
                            <a
                                href="mailto:hello@joinai.com"
                                style={{ color: "#716b62", textDecoration: "underline" }}
                            >
                                hello@joinai.com
                            </a>
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── 底部 Footer ─── */}
            <FooterSection />
        </div>
    );
}
