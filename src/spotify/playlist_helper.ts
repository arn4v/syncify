import { DataHelper } from "../data/data_helper";
import {
    PlatformInfo,
    SpotifyInfo,
    RequestStatus,
    MethodStatus,
} from "../interfaces/interfaces";
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
                    await RequestsHandler.getAlbumItems(spotifyInfo, album)
                        .then((res: RequestStatus) => {
                            if (res.successfull) {
                                if (
                                    res.uris !== undefined &&
                                    res.uris.length > 0
                                ) {
                                    res.uris.forEach((track: string) => {
                                        returnUris.push(track);
                                    });
                                }
                            }
                            if (
                                res.isRefreshed &&
                                res.newAccessToken != undefined
                            ) {
                                DataHelper.updateSpotifyAccessToken(
                                    res.newAccessToken,
                                    platformInfo
                                );
                            }
                        })
                        .catch((error) => console.log(error));
                }
            }

            if (playlistUris.length >= 1) {
                for (const playlist of playlistUris) {
                    await RequestsHandler.getPlaylistItems(
                        spotifyInfo,
                        playlist
                    )
                        .then((res: RequestStatus) => {
                            if (res.uris !== undefined && res.uris.length > 0) {
                                res.uris.forEach((track) => {
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
