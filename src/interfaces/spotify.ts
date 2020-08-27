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
