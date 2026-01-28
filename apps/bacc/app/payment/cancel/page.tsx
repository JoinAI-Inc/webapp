'use client';

import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <div className="max-w-md text-center space-y-6">
                <div className="w-20 h-20 bg-cny-red/20 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-cny-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-cny-ivory">支付已取消</h1>
                <p className="text-cny-ivory/60">
                    您可以随时返回订阅页面继续购买
                </p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-cny-gold/10 hover:bg-cny-gold/20 border border-cny-gold/20 rounded-lg text-cny-gold transition-all"
                >
                    返回首页
                </button>
            </div>
        </div>
    );
}
