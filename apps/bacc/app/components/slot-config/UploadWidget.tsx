import Image from "next/image";
import { Shuffle, Sparkles, Image as ImageIcon } from "lucide-react";
import { Slot } from "./slot-config.types";

export const SLOT_COLORS = [
    { bg: "bg-[#8364ff]", text: "text-[#8364ff]", border: "border-[#8364ff]" },
    { bg: "bg-[#ff50f7]", text: "text-[#ff50f7]", border: "border-[#ff50f7]" },
    { bg: "bg-[#ff7843]", text: "text-[#ff7843]", border: "border-[#ff7843]" },
    { bg: "bg-[#26c436]", text: "text-[#26c436]", border: "border-[#26c436]" },
];

function getSlotIcon(type: string) {
    switch (type) {
        case 'PERSON': return (
            <Image
                src="/assets/upload-widget/person-upload-icon.svg"
                alt=""
                width={28}
                height={28}
                className="size-[28px] shrink-0"
                unoptimized
            />
        );
        case 'OOTD': return <Shuffle size={28} className="text-[#6a696c]" />;
        case 'DECORATION': return <Sparkles size={28} className="text-[#6a696c]" />;
        default: return <ImageIcon size={28} className="text-[#6a696c]" />;
    }
}

export function DefaultAssetIcon({ type }: { type: Slot['slotType'] }) {
    const src = type === 'DECORATION'
        ? '/assets/figma-template-options/default-decoration-icon.svg'
        : '/assets/figma-template-options/default-ootd-icon.svg';
    return (
        <Image
            src={src}
            alt=""
            width={26}
            height={26}
            className="size-[26px] shrink-0"
            unoptimized
        />
    );
}

interface UploadWidgetProps {
    slot: Slot;
    index: number;
    isActive: boolean;
    upload: { preview: string; base64: string } | null | undefined;
    onFileChange: (slotId: string, file: File | null) => void;
}

export function UploadWidget({ slot, index, isActive, upload, onFileChange }: UploadWidgetProps) {
    const colorTheme = SLOT_COLORS[index % SLOT_COLORS.length];
    const title = index === 0 ? "Main Character" : "Guest Star";

    return (
        <div className="relative size-[138px] shrink-0">
            {!upload ? (
                <label className={`flex size-full cursor-pointer flex-col items-center justify-center rounded-[8px] border bg-[#f2f4f6] transition-colors ${isActive ? `${colorTheme.border} border-[1.5px]` : "border-dashed border-[#dadde6] hover:bg-[#eceff3]"}`}>
                    <div className="flex w-[98px] flex-col items-center gap-[8px] text-center">
                        {getSlotIcon(slot.slotType)}
                        <div className="flex w-full flex-col items-center leading-[1.4]">
                            <p className="w-full truncate text-[13px] font-medium tracking-[0.13px] text-[#6a696c]">
                                {slot.label || title}
                            </p>
                            <p className="w-full text-[12px] font-normal tracking-[0.12px] text-[#9b9a9d]">
                                upload your foto
                            </p>
                        </div>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(e) => onFileChange(slot.id, e.target.files?.[0] || null)}
                    />
                </label>
            ) : (
                <div className={`group relative size-full overflow-hidden rounded-[8px] border bg-[#f2f4f6] ${isActive ? `${colorTheme.border} border-[1.5px]` : "border-[#dadde6]"}`}>
                    <Image
                        src={upload.preview}
                        alt={slot.label}
                        fill
                        className="object-contain"
                        unoptimized
                    />
                    <div className="pointer-events-none absolute inset-[0px] rounded-[8px] bg-black/0 transition-colors group-hover:bg-black/25" />
                    <div className="absolute right-[4px] top-[4px] z-10 flex items-center gap-[4px]">
                        <label
                            className="flex size-[20px] cursor-pointer items-center justify-center rounded-[12px] border border-[#fcdada] bg-[#fef2f2] transition-colors hover:bg-white"
                            title="Replace image"
                            aria-label={`Replace ${slot.label || title} image`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src="/assets/upload-widget/replace.svg"
                                alt=""
                                width={16}
                                height={16}
                                className="size-[16px]"
                                unoptimized
                            />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onClick={(e) => { e.currentTarget.value = ""; }}
                                onChange={(e) => onFileChange(slot.id, e.target.files?.[0] || null)}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onFileChange(slot.id, null);
                            }}
                            className="flex cursor-pointer size-[20px] items-center justify-center rounded-[12px] border border-[#fcdada] bg-[#fef2f2] transition-colors hover:bg-white"
                            title="Remove image"
                            aria-label={`Remove ${slot.label || title} image`}
                        >
                            <Image
                                src="/assets/upload-widget/remove.svg"
                                alt=""
                                width={16}
                                height={16}
                                className="size-[16px]"
                                unoptimized
                            />
                        </button>
                    </div>
                </div>
            )}
            <div className={`absolute bottom-[4px] left-[4px] flex size-[22px] items-center justify-center rounded-[14px] border-2 border-white px-[8px] py-[3px] text-center text-[12px] font-medium leading-[1.4] tracking-[0.12px] text-white ${colorTheme.bg}`}>
                {index + 1}
            </div>
        </div>
    );
}
