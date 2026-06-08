import { TemplateDetailSkeleton } from "../../../components/Skeletons";

export default function TemplateDetailLoading() {
    return (
        <main className="w-full h-full overflow-y-auto flex justify-center bg-white">
            <div className="w-[92vw] max-w-[1600px]">
                <TemplateDetailSkeleton />
            </div>
        </main>
    );
}
