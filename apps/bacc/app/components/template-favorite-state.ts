export interface FavoriteState {
    isFavorited: boolean;
    favoriteCount: number;
}

export function resolveFavoriteState(
    current: FavoriteState,
    nextIsFavorited: boolean,
): FavoriteState {
    if (current.isFavorited === nextIsFavorited) {
        return current;
    }

    return {
        isFavorited: nextIsFavorited,
        favoriteCount: nextIsFavorited
            ? current.favoriteCount + 1
            : Math.max(0, current.favoriteCount - 1),
    };
}
