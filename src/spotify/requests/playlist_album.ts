import axios from "axios";
import { SpotifyInfo } from "../../interfaces/global";
import { refreshAccessToken } from "./refresh_tokens";
import { RequestStatus } from "../../interfaces/spotify";

export async function playlistAlbumItemsRequest(
    spotifyInfo: SpotifyInfo,
    type: 1 | 2,
    uri: string
): Promise<RequestStatus> {
    let id =
        type == 1
            ? uri.replace("spotify:album:", "")
            : uri.replace("spotify:playlist:", "");
    let requestUrl = `https://api.spotify.com/v1/${
        type == 1 ? "albums" : "playlists"
    }/${id}/tracks`;
    let uris: string[] = [];
    let status: RequestStatus = {
        successfull: false,
        status: undefined,
        error: undefined,
        response: undefined,
        isRefreshed: false,
    };

    await axios({
        method: "get",
        url: requestUrl,
        headers: {
            Authorization: `Bearer ${spotifyInfo.spotifyAccessToken}`,
        },
    })
        .then(async (res: any) => {
            if (res.status == 200) {
                status.successfull = true;
                status.status = res.status;
                status.response = res.data;
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
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        await axios({
                            method: "get",
                            url: requestUrl,
                            headers: {
                                Authorization: `Bearer ${newAccessToken}`,
                            },
                        }).then((_res: any) => {
                            status.status = _res.status;
                            status.response = _res.data;
                            if (_res.status == 200) {
                                status.successfull = true;
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
            status.successfull = false;
            status.error = error;
            if (error.response.status == 400 || error.response.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        status.isRefreshed = true;
                        await axios({
                            method: "get",
                            url: requestUrl,
                            headers: {
                                Authorization: `Bearer ${newAccessToken}`,
                            },
                        }).then((_res: any) => {
                            status.status = _res.status;
                            status.response = _res.data;
                            if (_res.status == (200 || 201)) {
                                status.successfull = true;
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
    if (uris.length >= 1) status.uris = uris;
    return status;
}
