export interface Artist {
    name: string;
    link: string;
    uri: string;
}

export interface Track {
    id: string | undefined;
    name?: string | undefined;
    link?: string | undefined;
    uri: string | undefined;
    artists?: Artist[] | undefined;
    position?: number;
}

export interface PlaylistInfo {
    id: string;
    items: Track[];
}

export interface AlbumInfo extends PlaylistInfo {}

export type ShuffleRepeatState = boolean | "off" | "context" | "track";

export interface RequestStatus {
    successfull: boolean;
    status: number | undefined;
    response: any | undefined;
    error: any | undefined;
    isRefreshed: boolean | undefined;
    newAccessToken?: string;
    uris?: string[];
    trackInfo?: Track;
}
