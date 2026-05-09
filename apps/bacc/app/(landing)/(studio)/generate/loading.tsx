// apps/bacc/app/(landing)/generate/loading.tsx
// Next.js 自动在 page.tsx 加载时显示此组件（Suspense 边界）

export default function GenerateLoading() {
    return (
        <main
            className="min-h-screen bg-[#FDFDFD] pt-[96px] pb-[80px] px-[32px] flex flex-col items-center"
            style={{ fontFamily: "Manrope, sans-serif" }}
        >
            <div className="w-full max-w-[1280px]">
                {/* 标题占位 */}
                <div className="skeleton h-[40px] w-[256px] mb-[12px]" />
                <div className="skeleton h-[20px] w-[384px] mb-[40px]" />

                {/* 标签过滤占位 */}
                <div className="flex gap-[12px] mb-[40px]">
                    {[80, 90, 70, 85, 75].map((w, i) => (
                        <div key={i} className="skeleton h-[36px] rounded-full" style={{ width: w }} />
                    ))}
                </div>

                {/* 模板卡片网格占位 */}
                <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 desktop-l:grid-cols-4 gap-[32px]">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-[12px]">
                            <div className="skeleton w-full rounded-2xl" style={{ aspectRatio: "2/3" }} />
                            <div className="skeleton h-[20px] w-3/4" />
                            <div className="skeleton h-[16px] w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
