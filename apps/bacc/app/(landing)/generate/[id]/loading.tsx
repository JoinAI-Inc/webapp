// 模板详情页加载骨架屏
export default function TemplateDetailLoading() {
    return (
        <main
            className="min-h-screen bg-[#FDFDFD] pt-24 pb-10 flex flex-col items-center"
            style={{ fontFamily: "Manrope, sans-serif" }}
        >
            <div className="w-full max-w-[1280px] px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <div className="skeleton h-8 w-64" />
                        <div className="skeleton h-4 w-48" />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    {/* 左：图片预览占位 */}
                    <div className="w-full lg:w-[45%]">
                        <div className="skeleton w-full rounded-3xl" style={{ aspectRatio: "2/3" }} />
                    </div>
                    {/* 右：配置面板占位 */}
                    <div className="w-full lg:w-[55%] flex flex-col gap-6">
                        <div className="border border-gray-100 rounded-3xl p-8">
                            <div className="skeleton h-7 w-48 mb-3" />
                            <div className="skeleton h-4 w-80 mb-6" />
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton h-28 w-full mb-4 rounded-2xl" />
                            ))}
                            <div className="skeleton h-12 w-full rounded-full mt-4" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
