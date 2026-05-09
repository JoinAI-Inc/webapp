"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, Images, Minus, Plus, X } from "lucide-react";
import { RecreateIcon } from "./gallery-icons";
import { HistoryItem, formatGalleryDate, getGalleryMeta, getTemplateId, getResultUrl } from "./gallery.types";

export function GalleryPreviewModal({
    item,
    onClose,
    onRecreate,
}: {
    item: HistoryItem;
    onClose: () => void;
    onRecreate: (item: HistoryItem) => void;
}) {
    const [zoom, setZoom] = useState(1);
    const resultUrl = getResultUrl(item);
    const meta = getGalleryMeta(item);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const adjustZoom = (delta: number) => {
        setZoom((value) => Math.min(1.8, Math.max(0.7, Number((value + delta).toFixed(2)))));
    };

    return (
        <div
            className="fixed inset-[0px] z-[200] flex items-center justify-center bg-white/40 p-[0px] backdrop-blur-[16px] tablet:p-[16px]"
            role="dialog"
            aria-modal="true"
            aria-label="Generated photo preview"
            onClick={onClose}
        >
            <div
                className="relative h-dvh w-full max-w-[1600px] overflow-hidden rounded-none bg-[#14161b] tablet:h-[87.5dvh] tablet:w-[92vw] tablet:rounded-[8px]"
                onClick={(event) => event.stopPropagation()}
            >
                {resultUrl && (
                    <>
                        <Image
                            src={resultUrl}
                            alt=""
                            fill
                            sizes="100vw"
                            className="scale-110 object-cover opacity-60 blur-[16px]"
                        />
                        <div className="absolute inset-[0px] bg-black/25 backdrop-blur-[16px]" />
                    </>
                )}
                <div className="absolute inset-x-[0px] top-[0px] h-[122px] bg-gradient-to-b from-black/60 to-black/0" />

                <div className="absolute left-[14px] top-[24px] z-10 max-w-[calc(100%-100px)] whitespace-nowrap tablet:left-[16px] tablet:top-[16px] tablet:max-w-[calc(100%-88px)]">
                    <p className="truncate text-[14px] font-medium leading-[1.4] tracking-[0.14px] text-white tablet:text-[17px] tablet:tracking-[0.17px]">
                        {meta.title}
                    </p>
                    <p className="text-[12px] font-normal leading-[1.4] tracking-[0.12px] text-[#9b9a9d]">
                        {formatGalleryDate(item.createdAt)}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close preview"
                    className="absolute right-[14px] top-[24px] z-20 flex size-[32px] items-center justify-center rounded-[8px] text-white transition-colors hover:bg-white/10 tablet:right-[16px] tablet:top-[16px]"
                >
                    <X size={20} strokeWidth={1.8} />
                </button>

                <div className="absolute inset-[0px] flex items-center justify-center px-[28px] py-[88px] tablet:p-[32px]">
                    <div className="relative h-[min(59dvh,515px)] w-full max-w-[346px] tablet:h-[87.5%] tablet:w-[87.5%] tablet:max-w-none">
                        {resultUrl ? (
                            <Image
                                src={resultUrl}
                                alt="Generated photo"
                                fill
                                sizes="(max-width: 734px) calc(100vw - 56px), 87vw"
                                className="rounded-[4px] object-contain transition-transform duration-150"
                                style={{ transform: `scale(${zoom})` }}
                                priority
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/60">
                                <Images size={40} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-[24px] right-[14px] z-20 flex flex-row items-center gap-[12px] tablet:bottom-[16px] tablet:right-[16px] tablet:flex-col">
                    {getTemplateId(item) && (
                        <button
                            type="button"
                            onClick={() => onRecreate(item)}
                            aria-label="Create another from this template"
                            className="flex size-[48px] items-center justify-center rounded-full border border-white/10 bg-[rgba(43,45,50,0.8)] text-white backdrop-blur-[16px] transition-colors hover:bg-[rgba(43,45,50,0.92)]"
                        >
                            <RecreateIcon className="size-[24px]" />
                        </button>
                    )}

                    {resultUrl && (
                        <a
                            href={resultUrl}
                            download
                            aria-label="Download generated image"
                            className="flex size-[48px] items-center justify-center rounded-full border border-white/10 bg-[rgba(43,45,50,0.8)] text-white backdrop-blur-[16px] transition-colors hover:bg-[rgba(43,45,50,0.92)]"
                        >
                            <Download size={20} strokeWidth={1.8} />
                        </a>
                    )}

                    <div className="hidden h-[178px] w-[48px] flex-col items-center rounded-[48px] border border-white/10 bg-[rgba(43,45,50,0.8)] py-[8px] text-white backdrop-blur-[16px] tablet:flex">
                        <button
                            type="button"
                            onClick={() => adjustZoom(0.1)}
                            aria-label="Zoom in"
                            className="flex size-[32px] items-center justify-center rounded-[8px] transition-colors hover:bg-white/10"
                        >
                            <Plus size={20} strokeWidth={1.8} />
                        </button>
                        <input
                            aria-label="Zoom"
                            type="range"
                            min="0.7"
                            max="1.8"
                            step="0.01"
                            value={zoom}
                            onChange={(event) => setZoom(Number(event.target.value))}
                            className="h-[80px] w-[2px] rotate-180 accent-[#ec2e2e] [writing-mode:vertical-lr]"
                        />
                        <button
                            type="button"
                            onClick={() => adjustZoom(-0.1)}
                            aria-label="Zoom out"
                            className="flex size-[32px] items-center justify-center rounded-[8px] transition-colors hover:bg-white/10"
                        >
                            <Minus size={20} strokeWidth={1.8} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
