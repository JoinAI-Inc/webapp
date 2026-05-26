import Link from "next/link";
import { twMerge } from "tailwind-merge";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "";

interface TryItFreeButtonProps {
    /** "primary": 红底白字 (默认); "inverse": 白底红字 (用于深色背景) */
    variant?: "primary" | "inverse";
    /** 按钮后缀符号，默认 "›" */
    suffix?: string;
    href?: string;
    className?: string;
    label?: string;
}

export function TryItFreeButton({
    variant = "primary",
    suffix = "›",
    href = "/generate",
    className,
    label = "Try it free",
}: TryItFreeButtonProps) {
    const isPrimary = variant === "primary";
    return (
        <Link
            href={href}
            className={twMerge(
                "group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-7 text-[16px] font-medium leading-none no-underline transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD322] sm:px-8",
                isPrimary
                    ? "border border-[#FFD322] bg-[#E8281E] text-white shadow-[0_14px_32px_rgba(212,36,36,0.22)]"
                    : "border border-white bg-white text-[#CA1816] shadow-[0_12px_30px_rgba(10,7,8,0.14)]",
                className
            )}
            style={{
                fontFamily: "Manrope, sans-serif",
                background: isPrimary
                    ? "linear-gradient(180deg, #FF5C2E 0%, #E81500 100%)"
                    : undefined,
            }}
        >
            {isPrimary && IMAGE_URL && (
                <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center opacity-95"
                    style={{
                        backgroundImage: `url(${IMAGE_URL}/new-home/bg-try-it-free-button.png)`,
                    }}
                />
            )}
            <span
                aria-hidden="true"
                className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(150px circle at 50% 50%, rgba(255,210,105,0.48), rgba(255,210,105,0) 72%)",
                }}
            />
            <span className="relative z-10">
                {label} {suffix}
            </span>
        </Link>
    );
}
