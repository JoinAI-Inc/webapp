'use client';

interface LoadingSpinnerProps {
    message?: string;
}

/**
 * 统一的加载状态UI组件
 */
export default function LoadingSpinner({ message = '验证中...' }: LoadingSpinnerProps) {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-cny-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xl text-cny-ivory/60">{message}</p>
            </div>
        </div>
    );
}
