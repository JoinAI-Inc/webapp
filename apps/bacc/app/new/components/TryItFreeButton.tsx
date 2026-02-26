import Link from "next/link";

interface TryItFreeButtonProps {
    /** "primary": 红底白字 (默认); "inverse": 白底红字 (用于深色背景) */
    variant?: "primary" | "inverse";
    /** 按钮后缀符号，默认 "›" */
    suffix?: string;
    href?: string;
}

export function TryItFreeButton({
    variant = "primary",
    suffix = "›",
    href = "/new/generate",
}: TryItFreeButtonProps) {
    const isPrimary = variant === "primary";
    return (
        <Link
            href={href}
            style={{
                background: isPrimary
                    ? "linear-gradient(180deg, #FF5C2E 0%, #E81500 100%)"
                    : "#fff",
                color: isPrimary ? "#fff" : "#CA1816",
                fontFamily: "Manrope, sans-serif",
                fontWeight: isPrimary ? 500 : 400,
                fontSize: isPrimary ? 16 : 19,
                lineHeight: 1.4,
                letterSpacing: isPrimary ? undefined : 0.19,
                padding: isPrimary ? "12px 32px" : "14px 40px",
                borderRadius: 100,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: isPrimary ? 48 : 54,
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                border: isPrimary ? "2px solid #FFD322" : "none",
            }}
        >
            {/* 花纹背景图（透明 PNG，叠在渐变色上方） */}
            {isPrimary && (
                <span
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: "url(/new-home/bg-try-it-free-button.png)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        pointerEvents: "none",
                    }}
                />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>
                try it free {suffix}
            </span>
        </Link>
    );
}
