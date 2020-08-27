import axios from "axios";
import { refreshAccessToken } from "./refresh_access_token";
import { PlatformInfo, SpotifyInfo, MethodStatus } from "../interfaces/global";
import { DataHelper } from "../data/data_helper";

async function getItemsRequest(
    platformInfo: PlatformInfo,
    spotifyInfo: SpotifyInfo,
    type: number,
    uri: string
): Promise<string[]> {
    let id =
        type == 1
            ? uri.replace("spotify:album:", "")
            : uri.replace("spotify:playlist:", "");
    let requestUrl = `https://api.spotify.com/v1/${
        type == 1 ? "albums" : "playlists"
    }/${id}/tracks`;
    let uris: string[] = [];

    await axios({
        method: "get",
        url: requestUrl,
        headers: {
            Authorization: `Bearer ${spotifyInfo.spotifyAccessToken}`,
        },
    })
        .then(async (res: any) => {
            if (res.status == 200) {
                res.data.items.forEach((track: any) => {
                    if (type == 1) {
                        uris.push(track.uri);
                    } else if (type == 2) {
                        uris.push(track.track.uri);
                    }
                });
            } else if (res.status == 400 || res.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        DataHelper.updateSpotifyAccessToken(
                            newAccessToken,
                            platformInfo
                        );
                        await axios({
                            method: "get",
                            url: requestUrl,
                            headers: {
                                Authorization: `Bearer ${newAccessToken}`,
                            },
                        }).then((_res: any) => {
                            if (_res.status == 200) {
                                _res.data.items.forEach((track: any) => {
                                    if (type == 1) {
                                        uris.push(track.uri);
                                    } else if (type == 2) {
                                        uris.push(track.track.uri);
                                    }
                                });
                            }
                        });
                    }
                );
            }
        })
        .catch(async (error) => {
            if (error.response.status == 400 || error.response.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        DataHelper.updateSpotifyAccessToken(
                            newAccessToken,
                            platformInfo
                        );
                        await axios({
                            method: "get",
                            url: requestUrl,
                            headers: {
                                Authorization: `Bearer ${newAccessToken}`,
                            },
                        }).then((_res: any) => {
                            if (_res.status == (200 || 201)) {
                                _res.data.items.forEach((track: any) => {
                                    if (type == 1) {
                                        uris.push(track.uri);
                                    } else if (type == 2) {
                                        uris.push(track.track.uri);
                                    }
                                });
                            }
                        });
                    }
                );
            }
        });

    return uris;
}

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
                    await getItemsRequest(platformInfo, spotifyInfo, 1, album)
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
                    await getItemsRequest(
                        platformInfo,
                        spotifyInfo,
                        2,
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
