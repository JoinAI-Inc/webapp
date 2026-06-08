type SkeletonCountProps = {
    count?: number;
};

export function StudioTemplateGallerySkeleton() {
    const columnPatterns = [
        ["aspect-[2/3]", "aspect-[4/5]", "aspect-[3/4]"],
        ["aspect-[5/7]", "aspect-[2/3]", "aspect-[1/1]"],
        ["aspect-[3/4]", "aspect-[2/3]", "aspect-[4/5]"],
        ["aspect-[2/3]", "aspect-[1/1]", "aspect-[5/7]"],
        ["aspect-[4/5]", "aspect-[2/3]", "aspect-[3/4]"],
        ["aspect-[2/3]", "aspect-[5/7]", "aspect-[1/1]"],
    ];

    return (
        <div>
            <div className="flex flex-wrap gap-[6px] tablet:gap-[8px] mb-[20px]">
                {[48, 82, 70, 94, 76, 88].map((width, index) => (
                    <div
                        key={index}
                        className="skeleton h-[32px] rounded-[16px]"
                        style={{ width }}
                    />
                ))}
            </div>

            <div className="w-full flex gap-[4px] items-start">
                {columnPatterns.map((column, columnIndex) => (
                    <div
                        key={columnIndex}
                        className="hidden min-w-[0px] flex-1 flex-col gap-[8px] tablet:gap-[4px] first:flex [&:nth-child(2)]:flex mobile-l:[&:nth-child(3)]:flex tablet:[&:nth-child(4)]:flex desktop:[&:nth-child(5)]:flex desktop-l:[&:nth-child(6)]:flex"
                    >
                        {column.map((aspect, itemIndex) => (
                            <div key={itemIndex} className="w-full overflow-hidden rounded-[8px] bg-white">
                                <div className={`skeleton w-full rounded-[8px] ${aspect}`} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function GenerateStudioSkeleton() {
    return (
        <main className="w-full h-full overflow-y-auto flex justify-center bg-white">
            <div className="w-[92vw] max-w-[1600px]">
                <div className="p-[0px]">
                    <div className="flex items-center gap-[6px] pt-[32px]">
                        <div className="skeleton h-[28px] w-[28px] rounded-[6px]" />
                        <div className="skeleton h-[28px] w-[156px] rounded-[8px]" />
                    </div>
                    <div className="mt-[24px]">
                        <StudioTemplateGallerySkeleton />
                    </div>
                </div>
            </div>
        </main>
    );
}

export function TemplateDetailSkeleton({
    showBackButton = false,
    onBack,
}: {
    showBackButton?: boolean;
    onBack?: () => void;
}) {
    return (
        <div className="w-full max-w-[1280px] px-[16px] tablet:px-[24px] py-[24px] tablet:py-[32px] mx-auto">
            <div className="mb-[14px] flex items-center justify-between gap-[6px] tablet:justify-start">
                <div className="flex min-w-[0px] items-center gap-[16px]">
                    {showBackButton ? (
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex shrink-0 items-center gap-[4px] rounded-[16px] border border-[#f2f2f3] px-[12px] py-[6px] text-[#080606]"
                        >
                            <span className="skeleton h-[16px] w-[16px] rounded-full" />
                            <span className="skeleton h-[18px] w-[34px] rounded-[6px]" />
                        </button>
                    ) : (
                        <div className="flex h-[32px] w-[74px] shrink-0 items-center gap-[4px] rounded-[16px] border border-[#f2f2f3] px-[12px] py-[6px]">
                            <span className="skeleton h-[16px] w-[16px] rounded-full" />
                            <span className="skeleton h-[18px] flex-1 rounded-[6px]" />
                        </div>
                    )}
                    <div className="hidden tablet:block skeleton h-[28px] w-[260px] rounded-[8px]" />
                </div>

                <div className="flex shrink-0 items-center gap-[10px] tablet:gap-[6px]">
                    <div className="skeleton h-[20px] w-[54px] rounded-[10px]" />
                    <div className="skeleton size-[28px] rounded-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 desktop:grid-cols-[506px_minmax(0,758px)] gap-[16px] items-start">
                <div className="relative left-1/2 w-[92vw] -translate-x-1/2 desktop:sticky desktop:left-auto desktop:top-[24px] desktop:w-full desktop:translate-x-[0px]">
                    <div className="flex w-full justify-center desktop:block">
                        <div className="relative inline-flex max-w-full overflow-hidden rounded-[16px] border border-[#e8e8e8] bg-[#f2f2f3] p-[12px] tablet:flex tablet:h-[360px] tablet:w-full tablet:items-center tablet:justify-center tablet:rounded-[8px] tablet:bg-white tablet:p-[16px] desktop:block desktop:h-auto">
                            <div className="skeleton aspect-[474/706] h-[296px] max-w-[calc(92vw-24px)] rounded-[4px] tablet:h-[328px] tablet:max-w-none desktop:h-auto desktop:w-full" />
                        </div>
                    </div>
                    <div className="tablet:hidden w-full mt-[20px] mb-[8px]">
                        <div className="skeleton h-[28px] w-[72%] rounded-[8px]" />
                    </div>
                </div>

                <div className="w-full overflow-hidden rounded-[8px] border border-[#e8e8e8] bg-white p-[15px] desktop:min-h-[776px]">
                    <div className="flex gap-[8px] overflow-hidden">
                        {[0, 1, 2, 3].map((item) => (
                            <div key={item} className="skeleton h-[112px] w-[138px] shrink-0 rounded-[8px]" />
                        ))}
                    </div>
                    <div className="relative mt-[16px] flex min-h-[174px] flex-col rounded-[8px] border border-[#e1d9ff] bg-white px-[16px] py-[21px]">
                        <div className="flex flex-col gap-[16px]">
                            {[0, 1].map((item) => (
                                <div key={item} className="flex flex-col gap-[12px] tablet:flex-row tablet:items-center">
                                    <div className="skeleton h-[20px] w-[130px] rounded-[6px]" />
                                    <div className="flex items-center gap-[8px]">
                                        {[0, 1, 2].map((button) => (
                                            <div key={button} className="skeleton h-[34px] w-[92px] rounded-[16px]" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-[16px]">
                            <div className="skeleton mb-[6px] h-[20px] w-[52px] rounded-[6px]" />
                            <div className="grid grid-cols-3 gap-[8px] tablet:grid-cols-4">
                                {[0, 1, 2, 3].map((item) => (
                                    <div key={item} className="skeleton aspect-[4/5] rounded-[8px]" />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="my-[24px] h-px w-full bg-[#e8e8e8]" />
                    <div className="skeleton h-[39px] w-[174px] rounded-[23px]" />
                </div>
            </div>
        </div>
    );
}

export function GalleryGridSkeleton({ count = 12 }: SkeletonCountProps) {
    return (
        <section className="w-full">
            <div className="mb-[20px] flex items-center gap-[6px] pl-[2px]">
                <div className="skeleton h-[22px] w-[24px] rounded-[6px]" />
                <div className="skeleton h-[26px] w-[132px] rounded-[8px]" />
            </div>
            <div className="grid grid-cols-2 gap-[4px] tablet:grid-cols-3 desktop:grid-cols-4 desktop-l:grid-cols-6">
                {Array.from({ length: count }).map((_, index) => (
                    <article key={index} className="flex flex-col overflow-hidden rounded-[8px] border border-[#e8e8e8] bg-white">
                        <div className="relative aspect-[255/329] w-full p-[3px] pb-[0px]">
                            <div className="skeleton h-full w-full rounded-[4px]" />
                        </div>
                        <div className="mt-[4px] flex h-[68px] items-center gap-[4px] overflow-hidden px-[3px]">
                            {[0, 1, 2].map((item) => (
                                <div key={item} className="skeleton h-[68px] w-[48px] rounded-[4px]" />
                            ))}
                        </div>
                        <div className="flex min-h-[44px] items-end justify-between gap-[8px] px-[3px] pb-[10px] pt-[4px]">
                            <div className="min-w-[0px] flex-1">
                                <div className="skeleton mb-[5px] h-[17px] w-[72%] rounded-[6px]" />
                                <div className="skeleton h-[14px] w-[46%] rounded-[6px]" />
                            </div>
                            <div className="skeleton h-[14px] w-[42px] rounded-[6px]" />
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export function FavoritesSkeleton({ count = 12 }: SkeletonCountProps) {
    return (
        <div>
            <div className="mb-[32px] flex items-center gap-[12px]">
                <div className="skeleton size-[28px] rounded-full" />
                <div className="skeleton h-[32px] w-[142px] rounded-[8px]" />
            </div>
            <div className="grid grid-cols-2 gap-[12px] tablet:grid-cols-3 desktop:grid-cols-5 desktop-l:grid-cols-6">
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="skeleton aspect-[2/3] rounded-[1rem]" />
                ))}
            </div>
        </div>
    );
}

export function SubscribePlansSkeleton() {
    return (
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-[24px] w-full max-w-4xl">
            {[0, 1, 2].map((item) => (
                <div key={item} className="relative rounded-[1.5rem] bg-white p-[28px] shadow-[0_12px_40px_rgba(26,28,28,0.04)]">
                    <div className="skeleton absolute top-[-12px] left-[24px] h-[24px] w-[88px] rounded-full" />
                    <div className="mb-[20px] mt-[8px] flex items-center gap-[12px]">
                        <div className="skeleton h-[44px] w-[44px] rounded-2xl" />
                        <div>
                            <div className="skeleton mb-[6px] h-[34px] w-[64px] rounded-[8px]" />
                            <div className="skeleton h-[18px] w-[74px] rounded-[6px]" />
                        </div>
                    </div>
                    <div className="skeleton mb-[8px] h-[22px] w-[58%] rounded-[6px]" />
                    <div className="mb-[24px] flex flex-col gap-[8px]">
                        {[0, 1, 2].map((line) => (
                            <div key={line} className="flex items-center gap-[8px]">
                                <div className="skeleton size-[14px] rounded-full" />
                                <div className="skeleton h-[18px] w-[70%] rounded-[6px]" />
                            </div>
                        ))}
                    </div>
                    <div className="skeleton mb-[12px] h-[46px] w-[132px] rounded-[8px]" />
                    <div className="skeleton h-[43px] w-full rounded-full" />
                </div>
            ))}
        </div>
    );
}

export function HistoryPageSkeleton({ includeHeader = true }: { includeHeader?: boolean }) {
    return (
        <div>
            {includeHeader && (
                <>
                    <div className="mb-[48px]">
                        <div className="mb-[16px] flex items-center gap-[12px]">
                            <div className="skeleton size-[32px] rounded-[8px]" />
                            <div className="skeleton h-[42px] w-[180px] rounded-[8px]" />
                        </div>
                        <div className="skeleton h-[22px] w-[240px] rounded-[6px]" />
                    </div>
                    <div className="mb-[32px] flex gap-[16px]">
                        {[64, 104, 64, 64].map((width, index) => (
                            <div key={index} className="skeleton h-[40px] rounded-full" style={{ width }} />
                        ))}
                    </div>
                </>
            )}
            {!includeHeader && (
                <div className="mb-[32px] grid grid-cols-1 gap-[24px] tablet:grid-cols-2 desktop:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="rounded-[1.5rem] bg-white p-[16px] shadow-[0_12px_40px_rgba(26,28,28,0.04)]">
                            <div className="skeleton mb-[12px] aspect-video rounded-[1rem]" />
                            <div className="space-y-[8px]">
                                <div className="flex items-center justify-between">
                                    <div className="skeleton h-[24px] w-[84px] rounded-md" />
                                    <div className="skeleton h-[16px] w-[72px] rounded-[6px]" />
                                </div>
                                <div className="skeleton h-[20px] w-[78%] rounded-[6px]" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {includeHeader && <HistoryPageSkeleton includeHeader={false} />}
        </div>
    );
}

export function LoginPageSkeleton() {
    return (
        <div className="min-h-screen flex bg-white font-['Inter',_sans-serif]">
            <div className="w-full tablet:w-1/2 flex flex-col px-[40px] py-[40px] bg-white">
                <div className="flex items-center gap-[10px]">
                    <div className="skeleton h-[32px] w-[32px] rounded-xl" />
                    <div className="skeleton h-[20px] w-[104px] rounded-[6px]" />
                </div>
                <div className="flex flex-1 flex-col items-center justify-center">
                    <div className="w-full max-w-[420px] space-y-[32px]">
                        <div className="space-y-[12px]">
                            <div className="skeleton mx-auto h-[48px] w-full rounded-[10px]" />
                            <div className="skeleton mx-auto h-[20px] w-[76%] rounded-[8px]" />
                        </div>
                        <div className="space-y-[12px]">
                            <div className="skeleton h-[56px] w-full rounded-[999px]" />
                            <div className="skeleton h-[56px] w-full rounded-[999px]" />
                        </div>
                        <div className="skeleton mx-auto h-[20px] w-[64px] rounded-[6px]" />
                    </div>
                </div>
            </div>
            <div className="hidden tablet:block w-1/2">
                <div className="skeleton h-full w-full rounded-[0px]" />
            </div>
        </div>
    );
}
