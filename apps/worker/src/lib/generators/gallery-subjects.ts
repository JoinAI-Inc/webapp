interface GallerySubjectSlot {
    refId: string;
    slotType: string;
    imageSource?: string;
    gender?: unknown;
    makeup?: unknown;
}

export function createGallerySubjects(slots: GallerySubjectSlot[]) {
    return slots
        .filter((slot) => slot.slotType === "PERSON")
        .map((slot) => ({
            refId: slot.refId,
            gender: slot.gender ?? null,
            makeup: slot.makeup ?? null,
        }));
}
