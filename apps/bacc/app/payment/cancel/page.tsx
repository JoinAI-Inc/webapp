'use client';

import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex items-center justify-center px-[24px] font-['Inter',_sans-serif]">
            <div className="max-w-md text-center space-y-[24px] bg-white p-[32px] rounded-[2rem] shadow-[0_12px_40px_rgba(26,28,28,0.04)] w-full">
                <div className="w-[80px] h-[80px] bg-[#EC2E2E]/10 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-[40px] h-[40px] text-[#EC2E2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-[#1a1c1c] font-['Plus_Jakarta_Sans',_sans-serif]">支付已取消</h1>
                <p className="text-[#6a696c]">
                    您可以随时返回订阅页面继续购买
                </p>
                <div className="pt-[8px]">
                    <button
                        onClick={() => router.push('/')}
                        className="px-[32px] py-[12px] bg-gradient-to-b from-[#EC2E2E] to-[#d62626] rounded-full text-white font-bold shadow-[0_12px_40px_rgba(236,46,46,0.2)] hover:scale-[1.02] transition-transform w-full"
                    >
                        返回首页
                    </button>
                </div>
            </div>
        </div>
    );
}
