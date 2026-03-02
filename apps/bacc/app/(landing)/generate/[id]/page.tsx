import { prisma } from "@repo/database";
import { notFound } from "next/navigation";
import Image from "next/image";
import { SlotConfigPanel } from "../../components/SlotConfigPanel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TemplateGeneratePage({ params }: { params: { id: string } }) {
    const template = await prisma.template.findUnique({
        where: { id: params.id },
        include: {
            slots: {
                orderBy: { sortOrder: 'asc' }
            }
        }
    });

    if (!template) {
        return notFound();
    }

    return (
        <main className="min-h-screen bg-[#FDFDFD] pt-24 pb-10 flex flex-col items-center" style={{ fontFamily: "Manrope, sans-serif" }}>
            <div className="w-full max-w-[1280px] px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/generate" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">{template.name}</h1>
                        <p className="text-gray-500 mt-1">Configure your subjects and start generating</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    {/* Left Column: Preview */}
                    <div className="w-full lg:w-[45%] sticky top-28 border border-gray-100 bg-white p-4 rounded-3xl shadow-sm">
                        <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-gray-50">
                            <Image
                                src={template.imageUrl}
                                alt={template.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>

                    {/* Right Column: Configuration Panel */}
                    <div className="w-full lg:w-[55%] flex flex-col gap-6">
                        <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2">Replacements</h2>
                                <p className="text-gray-500 text-sm">Upload images for each slot below. We support Person, Outfit and Decoration replacements.</p>
                            </div>

                            <SlotConfigPanel templateId={template.id} slots={template.slots} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
