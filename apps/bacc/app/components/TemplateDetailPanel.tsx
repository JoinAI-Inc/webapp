"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SlotConfigPanel } from "./SlotConfigPanel";

interface Slot {
    id: string;
    refId: string;
    slotType: "PERSON" | "OOTD" | "DECORATION";
    label: string;
    description: string | null;
}

interface TemplateDetail {
    id: string;
    name: string;
    imageUrl: string;
    slots: Slot[];
}

export function TemplateDetailPanel({
    templateId,
    onBack,
    onTaskSubmitted,
}: {
    templateId: string;
    onBack: () => void;
    onTaskSubmitted?: (taskId: string) => void;
}) {
    const [template, setTemplate] = useState<TemplateDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setTemplate(null);
        fetch(`/api/templates/${templateId}`)
            .then((r) => r.json())
            .then((data) => setTemplate(data))
            .finally(() => setLoading(false));
    }, [templateId]);

    if (loading) {
        return (
            <div className="w-full max-w-[1280px] px-8 py-10 mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    >
                        <ArrowLeft size={22} className="text-gray-600" />
                    </button>
                    <div className="skeleton h-9 w-60 rounded-lg" />
                </div>
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    <div className="w-full lg:w-[40%] skeleton rounded-3xl" style={{ aspectRatio: "2/3" }} />
                    <div className="w-full lg:w-[60%] skeleton rounded-3xl h-80" />
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>Template not found</p>
                <button onClick={onBack} className="mt-4 text-sm underline">Go back</button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1280px] px-8 py-10 mx-auto" style={{ fontFamily: "Manrope, sans-serif" }}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                    <ArrowLeft size={22} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">{template.name}</h1>
                    <p className="text-gray-500 mt-1">Configure your subjects and start generating</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                {/* Preview */}
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

                {/* Controls */}
                <div className="w-full lg:w-[60%] flex flex-col gap-6 pb-10">
                    <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-8 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">Replacements</h2>
                            <p className="text-gray-500 text-sm">
                                Upload images for each slot below. We support Person, Outfit and Decoration replacements.
                            </p>
                        </div>
                        <SlotConfigPanel
                            templateId={template.id}
                            slots={template.slots}
                            onTaskSubmitted={onTaskSubmitted}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
