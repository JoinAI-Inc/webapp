'use client';

import { ReactNode } from 'react';

interface SocialLoginButtonProps {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

// 按钮样式对应 Figma：420x56, bg=#d9d9d9, fully rounded, icon left + text center
export function SocialLoginButton({
    icon,
    label,
    onClick,
    disabled = false,
    className = '',
}: SocialLoginButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        relative w-full h-[56px] flex items-center rounded-full
        bg-[#d9d9d9] hover:bg-[#cccccc] active:bg-[#c0c0c0]
        transition-colors duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
        >
            {/* 图标固定左侧 */}
            <span className="absolute left-[20px] w-[24px] h-[24px] flex items-center justify-center flex-shrink-0">
                {icon}
            </span>
            {/* 文字居中 */}
            <span className="w-full text-center text-black font-medium text-[15px]">
                {label}
            </span>
        </button>
    );
}
