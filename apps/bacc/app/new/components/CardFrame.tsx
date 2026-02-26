import React from "react";

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
                borderImageSource: "url('/new-home/card-frame.svg')",
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

