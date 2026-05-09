// 模板详情页加载骨架屏
export default function TemplateDetailLoading() {
    return (
        <main
            className="min-h-screen bg-[#FDFDFD] pt-[96px] pb-[40px] flex flex-col items-center"
            style={{ fontFamily: "Manrope, sans-serif" }}
        >
            <div className="w-full max-w-[1280px] px-[32px]">
                {/* Header */}
                <div className="flex items-center gap-[16px] mb-[32px]">
                    <div className="skeleton w-[40px] h-[40px] rounded-full" />
                    <div className="flex flex-col gap-[8px]">
                        <div className="skeleton h-[32px] w-[256px]" />
                        <div className="skeleton h-[16px] w-[192px]" />
                    </div>
                </div>

                <div className="flex flex-col desktop:flex-row gap-[40px] items-start">
                    {/* 左：图片预览占位 */}
                    <div className="w-full desktop:w-[45%]">
                        <div className="skeleton w-full rounded-3xl" style={{ aspectRatio: "2/3" }} />
                    </div>
                    {/* 右：配置面板占位 */}
                    <div className="w-full desktop:w-[55%] flex flex-col gap-[24px]">
                        <div className="border border-gray-100 rounded-3xl p-[32px]">
                            <div className="skeleton h-[28px] w-[192px] mb-[12px]" />
                            <div className="skeleton h-[16px] w-[320px] mb-[24px]" />
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton h-[112px] w-full mb-[16px] rounded-2xl" />
                            ))}
                            <div className="skeleton h-[48px] w-full rounded-full mt-[16px]" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
