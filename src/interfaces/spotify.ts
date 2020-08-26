export interface Artist {
    name: string;
    link: string;
    uri: string;
}

export interface Track {
    name: string | undefined;
    id: string | undefined;
    link: string | undefined;
    uri: string | undefined;
    position?: number;
    artists: Artist[] | undefined;
}
