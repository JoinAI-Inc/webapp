import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppSidebar } from "../../components/AppSidebar";
import { GenerateShell } from "./GenerateShell";

export const runtime = 'edge';
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

export default async function TemplateGeneratePage({ params }: { params: { id: string } }) {
    const res = await fetch(`${API_BASE_URL}/api/templates/${params.id}`, { cache: 'no-store' });
    if (!res.ok) return notFound();
    const template = await res.json();

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8f8f8]" style={{ fontFamily: "Manrope, sans-serif" }}>
            {/* 侧边栏 */}
            <AppSidebar />

            {/* 可滚动内容区 */}
            <main className="flex-1 overflow-y-auto">
                <div className="w-full max-w-[1280px] px-8 py-10 mx-auto">
                    {/* Header with back button */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/generate" className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                            <ArrowLeft size={22} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">{template.name}</h1>
                            <p className="text-gray-500 mt-1">Configure your subjects and start generating</p>
                        </div>
                    </div>

                    {/* Content: Template image + Controls + Gallery */}
                    <div className="flex flex-col lg:flex-row gap-10 items-start">
                        {/* Left: Template preview (sticky) */}
                        <div className="w-full lg:w-[40%] sticky top-10 border border-gray-100 bg-white p-4 rounded-3xl shadow-sm">
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

                        {/* Right: Generation controls + My Gallery */}
                        <div className="w-full lg:w-[60%] flex flex-col gap-6 pb-10">
                            <GenerateShell templateId={template.id} slots={template.slots} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
