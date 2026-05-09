import Navbar from "@/components/Navbar";
import { HistoryPageSkeleton } from "@/app/components/Skeletons";

export default function HistoryLoading() {
    return (
        <main className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] font-['Inter',_sans-serif]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-[24px] py-[96px]">
                <HistoryPageSkeleton />
            </div>
        </main>
    );
}
