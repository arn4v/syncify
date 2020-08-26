import { Artist } from "./artist";

export interface Track {
    name: string | undefined;
    id: string | undefined;
    link: string | undefined;
    uri: string | undefined;
    position?: number;
    artists: Artist[] | undefined;
}
