import { prisma } from "@repo/database";
import { TemplateGallery } from "@/app/new/components/TemplateGallery";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
    // 1. Fetch tags
    const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' }
    });

    // 2. Fetch PUBLISHED templates with their associated tags and favorite counts
    const templates = await prisma.template.findMany({
        where: { status: 'PUBLISHED' },
        include: {
            tags: {
                include: { tag: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // 3. Format templates for the frontend
    const formattedTemplates = templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        imageUrl: t.imageUrl,
        resolution: t.resolution,
        theme: t.theme,
        favoriteCount: t.favoriteCount,
        tags: t.tags.map((tt: any) => tt.tag.name),
        tagIds: t.tags.map((tt: any) => tt.tag.id)
    }));

    return (
        <main className="min-h-screen bg-[#FDFDFD] pt-24 pb-20 px-8 flex flex-col items-center" style={{ fontFamily: "Manrope, sans-serif" }}>
            <div className="w-full max-w-[1280px]">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Inspiration Gallery</h1>
                <p className="text-gray-500 mb-8 max-w-2xl">
                    Discover our collection of premium templates. Pick a style, customize your subjects, and generate stunning photos in seconds.
                </p>

                <TemplateGallery
                    initialTags={tags}
                    initialTemplates={formattedTemplates}
                />
            </div>
        </main>
    );
}
