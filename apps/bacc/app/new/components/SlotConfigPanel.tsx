"use client";

import { useState } from "react";
import { Upload, X, UserSearch, Shuffle, Sparkles, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface Slot {
    id: string;
    slotType: 'PERSON' | 'OOTD' | 'DECORATION';
    label: string;
    description: string | null;
}

export function SlotConfigPanel({ templateId, slots }: { templateId: string, slots: Slot[] }) {
    // State to hold uploaded files/previews
    const [uploads, setUploads] = useState<Record<string, string | null>>({});

    const handleFileChange = (slotId: string, file: File | null) => {
        if (!file) {
            setUploads(prev => ({ ...prev, [slotId]: null }));
            return;
        }

        // In a real implementation we would upload to a server or use S3
        // For demo UI purposes, use local object URL
        const url = URL.createObjectURL(file);
        setUploads(prev => ({ ...prev, [slotId]: url }));
    };

    const getSlotIcon = (type: string) => {
        switch (type) {
            case 'PERSON': return <UserSearch size={20} className="text-blue-500" />;
            case 'OOTD': return <Shuffle size={20} className="text-purple-500" />;
            case 'DECORATION': return <Sparkles size={20} className="text-pink-500" />;
            default: return <ImageIcon size={20} className="text-gray-500" />;
        }
    };

    const isReadyToGenerate = slots.length === 0 || slots.every(s => uploads[s.id] !== null);

    return (
        <div className="flex flex-col gap-6 w-full">
            {slots.length === 0 ? (
                <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-2xl">
                    No configuration needed for this template.
                </div>
            ) : (
                slots.map((slot) => (
                    <div key={slot.id} className="border border-gray-100 bg-gray-50/50 p-5 rounded-2xl flex flex-col sm:flex-row gap-5">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {getSlotIcon(slot.slotType)}
                                <h3 className="font-bold text-gray-900 text-lg">{slot.label}</h3>
                                <span className="px-2 py-0.5 text-[11px] font-semibold bg-gray-200 text-gray-700 rounded-full tracking-wider uppercase">
                                    {slot.slotType}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mb-4">
                                {slot.description || `Upload an image for ${slot.label.toLowerCase()}`}
                            </p>

                            <div className="relative">
                                {!uploads[slot.id] ? (
                                    <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                            <p className="mb-2 text-sm text-gray-500">
                                                <span className="font-semibold text-[#FF3F2A]">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/jpg"
                                            onChange={(e) => handleFileChange(slot.id, e.target.files?.[0] || null)}
                                        />
                                    </label>
                                ) : (
                                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 group bg-gray-100">
                                        <Image
                                            src={uploads[slot.id] as string}
                                            alt={slot.label}
                                            fill
                                            className="object-contain"
                                        />
                                        <button
                                            onClick={() => handleFileChange(slot.id, null)}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}

            <button
                className={`mt-4 w-full py-4 px-6 rounded-full text-lg font-bold transition-all flex justify-center items-center gap-2 ${isReadyToGenerate
                        ? "bg-[#1a1a1a] text-white hover:bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                disabled={!isReadyToGenerate}
                onClick={() => {
                    if (isReadyToGenerate) {
                        alert("Generation triggered! Implement API call here.");
                    }
                }}
            >
                <Sparkles size={20} />
                Generate Now
            </button>
        </div>
    );
}
