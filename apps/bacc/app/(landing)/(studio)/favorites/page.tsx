"use client";

import { FavoritesPanel } from "../../../components/FavoritesPanel";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
    const router = useRouter();

    return (
        <main className="w-full h-full overflow-y-auto flex justify-center bg-[#f9f9f9]">
            <div className="w-full max-w-full desktop:max-w-[1600px] px-[24px] tablet:px-[48px] py-[40px]">
                <FavoritesPanel onSelect={(id) => {
                    router.push(`/generate/${id}`);
                }} />
            </div>
        </main>
    );
}
