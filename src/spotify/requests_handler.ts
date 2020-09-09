import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { defaultStatusTemplate } from "../helpers/status_template";
import {
    EndpointInfo,
    MethodStatus,
    RequestFuncConfig,
    RequestStatus,
    ShuffleRepeatState,
    SpotifyInfo,
} from "../interfaces/interfaces";
import { playlistAlbumItemsRequest } from "./requests/playlist_album";

const endpoints = require("./endpoints");

export class AxiosHelper {
    static configBuilder({
        access_token,
        endpoint_info,
    }: {
        access_token: string;
        endpoint_info: EndpointInfo;
    }): AxiosRequestConfig {
        const { url, method, data, params, custom_header } = endpoint_info;

        let config: AxiosRequestConfig = {
            url: url,
            method: method,
        };

        config.headers = {
            Authorization: `Bearer ${access_token}`,
        };

        if (typeof custom_header != "undefined") {
            config.headers = {
                ...config.headers,
                ...custom_header,
            };
        }

        if (typeof params != "undefined") {
            config.params = params;
        }

        if (typeof data != "undefined") {
            config.data = data;
        }

        return config;
    }

    static updateHeaderAccessToken(
        config: AxiosRequestConfig,
        newAccessToken: string
    ) {
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return config;
    }

    static async apiRequest({
        endpoint_info,
        spotify_info,
    }: RequestFuncConfig): Promise<RequestStatus> {
        let status: RequestStatus = defaultStatusTemplate;
        let config: AxiosRequestConfig = this.configBuilder({
            access_token: spotify_info.spotifyAccessToken,
            endpoint_info: endpoint_info,
        });

        await Axios(config)
            .then((res: AxiosResponse) => {
                status.status = res.status;
                if (endpoint_info.success_status.includes(res.status)) {
                    status.successfull = true;
                } else {
                    status.successfull = false;
                }
                if (endpoint_info.return_data) status.response = res.data;
            })
            .catch(async (error: AxiosError) => {
                if (error.response?.status == 401) {
                    const refresh_endpoint_info = endpoints.refresh_token;
                    refresh_endpoint_info.data = refresh_endpoint_info.data(
                        spotify_info.spotifyRefreshToken
                    );
                    refresh_endpoint_info.params = refresh_endpoint_info.params(
                        spotify_info.spotifyRefreshToken
                    );
                    await this.apiRequest({
                        spotify_info: spotify_info,
                        endpoint_info: refresh_endpoint_info,
                    }).then(async (res: RequestStatus) => {
                        status.isRefreshed = true;
                        status.newAccessToken = res.response?.data.access_token;
                        await Axios(
                            this.updateHeaderAccessToken(
                                config,
                                res.response?.data.access_token
                            )
                        )
                            .then((_res) => {
                                status.status = _res.status;
                                if (
                                    endpoint_info.success_status.includes(
                                        _res.status
                                    )
                                ) {
                                    status.successfull = true;
                                }
                                if (endpoint_info.return_data)
                                    status.response = _res.data;
                            })
                            .catch((_error) =>
                                console.log(
                                    "Error: axiosRequest: Second Axios call: ",
                                    _error
                                )
                            );
                    });
                } else {
                    console.trace();
                    console.log(
                        `ERROR: axiosRequest:54: ${error.response?.status}`
                    );
                    status.successfull = false;
                }
            });
        return status;
    }
}

export class RequestsHandler {
    static nextPreviousTrack(spotifyInfo: SpotifyInfo, requestType: 1 | 2) {
        const endpointInfo: EndpointInfo =
            requestType == 1 ? endpoints.next_track : endpoints.previous_track;
        return AxiosHelper.apiRequest({
            spotify_info: spotifyInfo,
            endpoint_info: endpointInfo,
        });
    }

    static togglePlayback(spotifyInfo: SpotifyInfo, requestType: number) {
        const endpointInfo: EndpointInfo = endpoints.togglePlayback;
        endpointInfo.data = endpointInfo.params(requestType);
        return AxiosHelper.apiRequest({
            spotify_info: spotifyInfo,
            endpoint_info: endpointInfo,
        });
    }

    // static trackInfo(spotifyInfo: SpotifyInfo) {
    //     const endpointInfo: EndpointInfo = endpoints.current_track
    //     this.axiosRequest();
    //     trackInfo.id = response.data.item.uri;
    //     trackInfo.link = response.data.item.external_urls.spotify;
    //     trackInfo.name = response.data.item.name;
    //     trackInfo.position = response.data.progress_ms;
    //     trackInfo.uri = response.data.item.uri;
    //     response.data.item.artists.forEach((data: any) => {
    //         trackInfo.artists?.push({
    //             name: data.name,
    //             link: data.external_urls.spotify,
    //             uri: data.uri,
    //         });
    //     });
    //     status.trackInfo = trackInfo;
    //     return trackInfoRequest(spotifyInfo);
    // }

    static toggleShuffleRepeat(
        requestType: number,
        toggleState: ShuffleRepeatState,
        spotifyInfo: SpotifyInfo
    ) {
        const endpointInfo: EndpointInfo =
            requestType == 1
                ? endpoints.shuffle_playback
                : endpoints.repeat_playback;
        endpointInfo.params = endpointInfo.params(toggleState);
        return AxiosHelper.apiRequest({
            spotify_info: spotifyInfo,
            endpoint_info: endpointInfo,
        });
    }

    static playTrack(spotifyInfo: SpotifyInfo, tracks: string[]) {
        const endpointInfo: EndpointInfo = endpoints.play_track;
        endpointInfo.data = endpointInfo.data(tracks);
        return AxiosHelper.apiRequest({
            endpoint_info: endpointInfo,
            spotify_info: spotifyInfo,
        });
    }

    static queue(spotifyInfo: SpotifyInfo, trackUri: string) {
        const endpointInfo: EndpointInfo = endpoints.add_to_queue;
        endpointInfo.data = endpointInfo.data(trackUri);
        return AxiosHelper.apiRequest({
            endpoint_info: endpointInfo,
            spotify_info: spotifyInfo,
        });
    }

    static seek(spotifyInfo: SpotifyInfo, position_ms: number) {
        const endpointInfo: EndpointInfo = endpoints.seek;
        endpointInfo.data = endpointInfo.params(position_ms);
        return AxiosHelper.apiRequest({
            endpoint_info: endpointInfo,
            spotify_info: spotifyInfo,
        });
    }

    static getAlbumItems(spotifyInfo: SpotifyInfo, uri: string) {
        return playlistAlbumItemsRequest(spotifyInfo, 2, uri);
    }

    static getPlaylistItems(spotifyInfo: SpotifyInfo, uri: string) {
        return playlistAlbumItemsRequest(spotifyInfo, 1, uri);
    }
}
