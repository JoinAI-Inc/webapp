import { SubscribePlansSkeleton } from "../../components/Skeletons";

export default function SubscribeLoading() {
    return (
        <main className="min-h-screen bg-[#f9f9f9] flex flex-col items-center px-[24px] py-[64px] font-['Inter',_sans-serif]">
            <div className="text-center mb-[48px] max-w-xl">
                <div className="skeleton mx-auto mb-[16px] h-[32px] w-[172px] rounded-full" />
                <div className="skeleton mx-auto mb-[12px] h-[44px] w-[300px] rounded-[10px]" />
                <div className="skeleton mx-auto h-[27px] w-full max-w-[520px] rounded-[8px]" />
            </div>
            <SubscribePlansSkeleton />
            <div className="skeleton mt-[48px] h-[16px] w-full max-w-md rounded-[6px]" />
        </main>
    );
}
