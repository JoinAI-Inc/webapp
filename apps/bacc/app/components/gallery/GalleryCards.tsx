"use client";

import Image from "next/image";
import { Images } from "lucide-react";
import { RecreateIcon } from "./gallery-icons";
import {
    HistoryItem,
    PendingTask,
    extractSlotImages,
    extractPendingSlotImages,
    formatGalleryDate,
    getGalleryCardUrl,
    getGalleryMeta,
    getHistoryGalleryCardMeta,
    getPendingGalleryCardMeta,
    getTemplateId,
} from "./gallery.types";

function SourceThumbs({ images, muted = false }: { images: string[]; muted?: boolean }) {
    if (images.length === 0) return <div className="h-[68px]" aria-hidden="true" />;

    const visibleImages = images.slice(0, 3);
    const overflowCount = Math.max(0, images.length - visibleImages.length);

    return (
        <div className="mt-[4px] flex h-[68px] items-center gap-[4px] overflow-hidden px-[3px]">
            {visibleImages.map((src, index) => (
                <div key={`${src}-${index}`} className="flex h-full items-center gap-[4px]">
                    <div className="relative h-[68px] w-[48px] shrink-0 overflow-hidden rounded-[4px] bg-[#e8e8e8]">
                        <Image
                            src={src}
                            alt=""
                            fill
                            sizes="48px"
                            className={`h-full w-full object-cover ${muted ? "opacity-70 grayscale-[45%]" : ""}`}
                        />
                        {overflowCount > 0 && index === visibleImages.length - 1 && (
                            <div className="absolute inset-[0px] flex items-center justify-center bg-black/45 text-[12px] font-medium tracking-[0.12px] text-white">
                                +{overflowCount}
                            </div>
                        )}
                    </div>
                    {index < visibleImages.length - 1 && <div className="h-full w-px shrink-0 bg-[#e8e8e8]" />}
                </div>
            ))}
        </div>
    );
}

function GalleryText({
    title,
    subtitle,
    date,
}: {
    title: string;
    subtitle: string;
    date: string;
}) {
    return (
        <div className="flex min-h-[44px] items-end justify-between gap-[8px] px-[3px] pb-[4px] pt-[4px]">
            <div className="min-w-[0px]">
                <p className="truncate text-[14px] font-medium leading-[1.4] tracking-[0.14px] text-[#080606]">
                    {title}
                </p>
                <p className="truncate text-[12px] font-normal leading-[1.4] tracking-[0.12px] text-[#9b9a9d]">
                    {subtitle}
                </p>
            </div>
            <p className="shrink-0 whitespace-nowrap text-[12px] font-normal leading-[1.4] tracking-[0.12px] text-[#9b9a9d]">
                {date}
            </p>
        </div>
    );
}

// 生成中卡片
export function BrewingCard({ task }: { task: PendingTask }) {
    const slots = extractPendingSlotImages(task);
    const meta = getPendingGalleryCardMeta(task);

    return (
        <article className="flex flex-col overflow-hidden rounded-[8px] border border-[#e8e8e8] bg-white">
            <div className="relative aspect-[263/332] w-full p-[3px] pb-[0px]">
                <div className="relative h-full w-full overflow-hidden rounded-[4px] bg-[#F3F3F3]">
                    <div className="generation-preview-visual absolute inset-[0px]" aria-hidden="true" />

                    <div className="absolute inset-[0px] bg-black/[0.08]" />
                    <div className="absolute left-[12px] top-[12px] flex h-[25px] w-[100px] items-center pl-[6px] rounded-[4px] bg-[#EC2E2E]">
                        <span className="gallery-generating-label j-t4 text-white">
                            Generating<span aria-hidden="true" className="gallery-generating-dots" />
                        </span>
                    </div>
                    <div className="absolute inset-[0px] flex items-center justify-center px-[16px]">
                        <p className="text-center j-l2 text-white">✨Your LuckyFoto is brewing!</p>
                    </div>
                </div>
            </div>

            <SourceThumbs images={slots} />
            <GalleryText title={meta.title} subtitle={meta.subtitle} date={formatGalleryDate(task.createdAt)} />
        </article>
    );
}

// 历史完成卡片
export function HistoryCard({
    item,
    onPreview,
    onRecreate,
}: {
    item: HistoryItem;
    onPreview: (item: HistoryItem) => void;
    onRecreate: (item: HistoryItem) => void;
}) {
    const slotImages = extractSlotImages(item);
    const resultUrl = getGalleryCardUrl(item);
    const meta = getHistoryGalleryCardMeta(item);
    const templateMeta = getGalleryMeta(item);
    const templateId = getTemplateId(item);

    return (
        <article className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[8px] border border-[#e8e8e8] bg-white transition-colors">
            <button
                type="button"
                aria-label={`Preview ${templateMeta.title}`}
                onClick={() => onPreview(item)}
                className="absolute inset-[0px] z-[15] cursor-pointer rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2F80ED]"
            />
            <div className="relative aspect-[255/329] w-full p-[3px] pb-[0px]">
                {resultUrl ? (
                    <div className="relative h-full w-full overflow-hidden rounded-[4px]">
                        <Image
                            src={resultUrl}
                            alt="Generated"
                            fill
                            loading="lazy"
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 16vw"
                        />
                    </div>
                ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-[4px] bg-[#e8e8e8]">
                        <Images size={32} className="text-gray-400" />
                    </div>
                )}
                <p
                    aria-hidden="true"
                    data-template-title="mobile"
                    className="pointer-events-none absolute bottom-[12px] left-[15px] right-[15px] z-[11] truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] j-l2 text-white tablet:hidden"
                >
                    {templateMeta.title}
                </p>
                {templateId && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onRecreate(item);
                        }}
                        aria-label="Create another from this template"
                        className="absolute right-[12px] top-[12px] z-20 flex size-[32px] items-center justify-center rounded-[21px] bg-[rgba(10,7,8,0.4)] hover:bg-[rgba(10,7,8,0.8)] p-[4px] text-white opacity-0 backdrop-blur-[16px] transition-opacity duration-200 tablet:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
                    >
                        <RecreateIcon className="size-[24px]" />
                    </button>
                )}
            </div>

            <SourceThumbs images={slotImages} />
            <GalleryText title={meta.title} subtitle={meta.subtitle} date={formatGalleryDate(item.createdAt)} />
            <p
                aria-hidden="true"
                data-template-title="desktop"
                className="pointer-events-none absolute bottom-[16px] left-[16px] right-[16px] z-[11] hidden truncate j-l1 text-white opacity-0 transition-opacity duration-200 tablet:block tablet:group-hover:opacity-100"
            >
                {templateMeta.title}
            </p>
            <div
                aria-hidden="true"
                data-card-hover-mask="true"
                className="pointer-events-none absolute inset-[0px] z-10 rounded-[8px] bg-[linear-gradient(0deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.4)_40%,rgba(0,0,0,0.4)_100%)] opacity-0 transition-opacity duration-200 tablet:group-hover:opacity-100"
            />
        </article>
    );
}
