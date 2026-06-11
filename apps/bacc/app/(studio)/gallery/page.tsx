import { MyGallery } from "../../components/MyGallery";

export const runtime = 'edge';
export const dynamic = "force-dynamic";

export default function GalleryPage() {
    return (
        <main className="w-full h-full overflow-y-auto flex justify-center bg-[#f9f9f9]">
            <div className="w-[92vw] max-w-[1600px] px-0 tablet:w-full tablet:px-[24px] py-[40px]">
                <MyGallery forceVisible />
            </div>
        </main>
    );
}
