import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { SpotifyInfo, RequestStatus } from "../../interfaces/interfaces";
import { defaultStatusTemplate } from "../../helpers/status_template";
import { refreshAccessToken } from "./refresh_tokens";

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
    let status: RequestStatus = defaultStatusTemplate;
    let requestConfig: (accessToken: string) => AxiosRequestConfig = (
        accessToken: string
    ): AxiosRequestConfig => {
        return {
            method: "get",
            url: requestUrl,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };
    };

    await axios(requestConfig(spotifyInfo.spotifyAccessToken))
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
                        spotifyInfo.spotifyAccessToken = newAccessToken;
                        await axios(requestConfig(newAccessToken)).then(
                            (_res: AxiosResponse) => {
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
                            }
                        );
                    }
                );
            }
        })
        .catch(async (error: AxiosError) => {
            status.successfull = false;
            status.error = error;
            if (error.response?.status == (400 || 401)) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        status.isRefreshed = true;
                        await axios({
                            method: "get",
                            url: requestUrl,
                            headers: {
                                Authorization: `Bearer ${newAccessToken}`,
                            },
                        }).then((_res: AxiosResponse) => {
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
