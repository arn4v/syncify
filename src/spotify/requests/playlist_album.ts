import axios from 'axios'
import { PlatformInfo, SpotifyInfo } from "../../interfaces/global";
import { refreshAccessToken } from './refresh_tokens'
import { DataHelper } from '../../data/data_helper'

export async function playlistAlbumItemsRequest(
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
