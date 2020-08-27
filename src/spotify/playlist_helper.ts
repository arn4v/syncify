import axios from "axios";
import { PlatformInfo, SpotifyInfo, MethodStatus } from "../interfaces/global";
import { DataHelper } from "../data/data_helper";
import { RequestsHandler } from "./requests_handler";


export async function getPlaylistOrAlbumItems(
    platformInfo: PlatformInfo,
    uris: string[]
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: false,
        data: undefined,
    };

    let albumUris: string[] = uris.filter((e) => e.includes("album"));
    let playlistUris: string[] = uris.filter((e) => e.includes("playlist"));
    let returnUris: string[] = [];

    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
            if (albumUris.length >= 1) {
                for (const album of albumUris) {
                    await RequestsHandler.getAlbumItems(platformInfo, spotifyInfo, album)
                        .then((res: string[]) => {
                            if (res.length > 0) {
                                res.forEach((track) => {
                                    returnUris.push(track);
                                });
                            }
                        })
                        .catch((error) => console.log(error));
                }
            }

            if (playlistUris.length >= 1) {
                for (const playlist of playlistUris) {
                    await RequestsHandler.getPlaylistItems(
                        platformInfo,
                        spotifyInfo,
                        playlist
                    )
                        .then((res: string[]) => {
                            if (res.length > 0) {
                                res.forEach((track) => {
                                    returnUris.push(track);
                                });
                            }
                        })
                        .catch((error) => console.log(error));
                }
            }
        })
        .catch((error) => {
            status.error = error;
            status.done = false;
        });

    if (returnUris.length >= 1) {
        status.done = true;
        status.data = returnUris;
    }

    return status;
}
