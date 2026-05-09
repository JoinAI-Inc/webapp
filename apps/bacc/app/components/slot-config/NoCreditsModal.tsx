import { ShoppingCart } from "lucide-react";

export function NoCreditsModal({ onClose, remainingCount }: { onClose: () => void; remainingCount: number }) {
    return (
        <div className="fixed inset-[0px] z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-[32px] max-w-sm w-full mx-[16px] shadow-2xl">
                <div className="text-center mb-[24px]">
                    <div className="w-[64px] h-[64px] bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-[16px]">
                        <ShoppingCart size={28} className="text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-[8px]">
                        {remainingCount === 0 ? "Counts Exhausted" : "Insufficient Counts"}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        You have <span className="font-bold text-orange-500">{remainingCount}</span> generation counts remaining.
                        Purchase more to continue creating stunning AI photos.
                    </p>
                </div>
                <div className="flex flex-col gap-[12px]">
                    <a
                        href="/subscribe"
                        className="w-full py-[12px] px-[24px] bg-[#1a1a1a] text-white text-center rounded-full font-bold hover:bg-black transition-colors"
                    >
                        Buy Counts
                    </a>
                    <button
                        onClick={onClose}
                        className="w-full py-[12px] px-[24px] border border-gray-200 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
