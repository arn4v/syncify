import { MethodStatus, RequestStatus } from "../interfaces/interfaces";

export const PORT: string = process.env.PORT ?? "8888";

export const SERVER_URL: string =
    process.env["SYNCIFY_SERVER_BASE_URL"] != undefined
        ? process.env["SYNCIFY_SERVER_BASE_URL"] + "/auth"
        : "http://localhost:" + PORT + "/auth";

export const defaultStatusTemplate: RequestStatus = {
    successfull: false,
    status: undefined,
    error: undefined,
    response: undefined,
    isRefreshed: false,
};

export class Helpers {
    static parseISOString(isoDate: any): Date {
        var b = isoDate.split(/\D+/);
        return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
    }

    static link2UriParser(link: string, type: number): string {
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

    static trackLinkValidator(links: string[]): MethodStatus {
        let status: MethodStatus = {
            done: false,
            data: { uris: undefined },
        };
        let tracks: string[] = [];
        if (links.length >= 1) {
            for (const link of links) {
                if (link.includes("spotify")) {
                    if (link.includes("track")) {
                        let uri: string = this.link2UriParser(link, 1);
                        if (uri.includes("spotify:")) tracks.push(uri);
                    } else if (link.includes("album")) {
                        let uri: string = this.link2UriParser(link, 2);
                        if (uri.includes("spotify:")) tracks.push(uri);
                    } else if (link.includes("playlist")) {
                        let uri: string = this.link2UriParser(link, 3);
                        if (uri.includes("spotify:")) tracks.push(uri);
                    }
                }
            }
            status.data.uris = tracks;
        }
        if (tracks.length >= 1) status.done = true;
        return status;
    }
}
