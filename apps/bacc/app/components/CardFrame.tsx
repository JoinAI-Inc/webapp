import React from "react";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

if (process.env.NODE_ENV === 'development' && !IMAGE_URL) {
    console.warn('[CardFrame] NEXT_PUBLIC_IMAGE_URL is not set. Card borders will not render.');
}


interface CardFrameProps {
    children?: React.ReactNode;
    width?: number | string;
    height?: number | string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * CardFrame - 使用 SVG border-image 9-slice 实现自适应卡片边框
 *
 * card-frame.svg viewBox=805×420
 * 角落保护区约 50 单位 → border-image-slice: 50
 * border-width 50px 控制实际渲染边框宽度
 */
export function CardFrame({
    children,
    width,
    height,
    className,
    style,
}: CardFrameProps) {
    return (
        <div
            className={className}
            style={{
                ...(width !== undefined ? { width } : {}),
                ...(height !== undefined ? { height } : {}),
                borderStyle: "solid",
                borderColor: "transparent",
                borderWidth: "50px",
                borderImageSource: `url(${IMAGE_URL}/new-home/card-frame.svg)`,
                borderImageSlice: "50 50 50 50 fill",
                borderImageRepeat: "stretch",
                boxSizing: "border-box",
                flexShrink: 0,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

