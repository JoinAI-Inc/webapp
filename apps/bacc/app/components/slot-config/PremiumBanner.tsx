import Image from "next/image";

const IMAGE_URL = (process.env.NEXT_PUBLIC_IMAGE_URL || "https://pub-cfc37210b6a543b492b7f0e494faac09.r2.dev/bacc/image").replace(/\/$/, "");

export function PremiumCoinIcon() {
    return (
        <div className="relative size-[24px] shrink-0 overflow-hidden tablet:size-[26px]" aria-hidden="true">
            <Image
                src="/assets/subscription-banner/coin-ellipse.svg"
                alt=""
                width={7}
                height={7}
                className="absolute inset-1/4 size-1/2"
                unoptimized
            />
            <Image
                src="/assets/subscription-banner/coin-base.svg"
                alt=""
                width={26}
                height={26}
                className="absolute inset-[0px] size-full"
                unoptimized
            />
            <Image
                src="/assets/subscription-banner/coin-ring.svg"
                alt=""
                width={24}
                height={24}
                className="absolute left-[5.56%] top-1/2 aspect-square w-[88.88%] -translate-y-1/2"
                unoptimized
            />
            <Image
                src="/assets/subscription-banner/coin-mark.svg"
                alt=""
                width={16}
                height={16}
                className="absolute inset-[19.55%]"
                unoptimized
            />
            <Image
                src="/assets/subscription-banner/coin-highlight.svg"
                alt=""
                width={15}
                height={15}
                className="absolute inset-[21.45%]"
                unoptimized
            />
        </div>
    );
}

export function PremiumFeatureSubscribeBanner({ featureKey }: { featureKey: string }) {
    const subscribeHref = `/subscribe?featureKey=${encodeURIComponent(featureKey)}`;

    return (
        <div className="h-[75px] w-full tablet:mb-[16px] tablet:h-[60px]">
            <div className="fixed left-[0px] right-[0px] top-[56px] z-[60] h-[75px] overflow-hidden border-b border-[#f2f2f3] bg-white tablet:relative tablet:left-auto tablet:right-auto tablet:top-auto tablet:z-auto tablet:h-[60px] tablet:w-full tablet:rounded-[8px] tablet:border tablet:border-[#f2f2f3]">
                <div className="absolute flex h-[492.928px] w-[640.168px] items-center justify-center left-[-6.92px] top-[-247.12px] tablet:hidden">
                    <div className="-scale-y-100 rotate-[-110.09deg]">
                        <div className="relative h-[565.298px] w-[318.088px]">
                            <Image
                                src={`${IMAGE_URL}/assets/subscription-banner/banner-bg-mobile.png`}
                                alt=""
                                fill
                                sizes="318px"
                                className="absolute inset-[0px] size-full max-w-none object-cover"
                                unoptimized
                            />
                            <div className="absolute inset-[0px] bg-gradient-to-b from-[52.404%] from-white/0 to-[90%] to-white" />
                        </div>
                    </div>
                </div>
                <div className="absolute hidden h-[576.169px] w-[748.274px] items-center justify-center left-[100px] top-[-263.29px] tablet:flex">
                    <div className="-scale-y-100 rotate-[-110.09deg]">
                        <div className="relative h-[660.76px] w-[371.804px]">
                            <Image
                                src={`${IMAGE_URL}/assets/subscription-banner/banner-bg-desktop.png`}
                                alt=""
                                fill
                                sizes="372px"
                                className="absolute inset-[0px] size-full max-w-none object-cover"
                                unoptimized
                            />
                            <div className="absolute inset-[0px] bg-gradient-to-b from-[52.404%] from-white/0 to-[90%] to-white" />
                        </div>
                    </div>
                </div>

                <div className="absolute left-[16px] top-[25px] tablet:top-[16px]">
                    <PremiumCoinIcon />
                </div>

                <div className="absolute left-[48px] top-[12px] flex w-[190px] flex-col items-start tracking-[0.12px] tablet:left-[50px] tablet:top-1/2 tablet:w-[min(325px,calc(100%-170px))] tablet:-translate-y-1/2">
                    <p className="w-full text-[12px] font-medium leading-[1.4] text-[#39383b] tablet:text-[14px] tablet:tracking-[0.14px]">
                        Premium feature active
                    </p>
                    <p className="w-full text-[12px] font-normal leading-[1.4] text-[#9b9a9d]">
                        You can unlock it for a small fee.{" "}
                        <a href={subscribeHref} className="text-[#ec2e2e] underline decoration-solid">
                            Top up
                        </a>{" "}
                        for more.
                    </p>
                </div>

                <Image
                    src="/assets/subscription-banner/banner-illustration.svg"
                    alt=""
                    width={114}
                    height={56}
                    className="pointer-events-none absolute right-[-70px] top-[20px] h-[55px] w-[114px] max-w-none tablet:right-[8px] tablet:top-[4px]"
                    unoptimized
                />
            </div>
        </div>
    );
}
