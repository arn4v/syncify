import { MethodStatus } from "../interfaces/global";

function link2UriParser(link: string, type: number): string {
    let typeString: string;
    switch (type) {
        case 1:
            typeString = "track";
            break;
        case 2:
            typeString = "album";
            break;
        case 3:
            typeString = "playlist";
            break;
        default:
            typeString = "track";
            break;
    }

    return link.includes("open.spotify.com")
        ? `spotify:${typeString}:` +
              link
                  .slice(link.indexOf(`${typeString}/`))
                  .split("?")[0]
                  .replace(`${typeString}/`, "")
        : link.includes(`spotify:${typeString}`)
        ? link
        : "";
}

export function trackLinkValidator(links: string[]): MethodStatus {
    let status: MethodStatus = {
        done: false,
        data: { uris: undefined },
    };
    let tracks: string[] = [];

    if (links.length >= 1) {
        for (const link of links) {
            if (link.includes("spotify")) {
                if (link.includes("track")) {
                    let uri: string = link2UriParser(link, 1);
                    if (uri.includes("spotify:")) tracks.push(uri);
                } else if (link.includes("album")) {
                    let uri: string = link2UriParser(link, 2);
                    if (uri.includes("spotify:")) tracks.push(uri);
                } else if (link.includes("playlist")) {
                    let uri: string = link2UriParser(link, 3);
                    if (uri.includes("spotify:")) tracks.push(uri);
                }
            }
        }
        status.data.uris = tracks;
    }
    if (tracks.length >= 1) status.done = true;
    return status;
}
