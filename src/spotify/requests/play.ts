import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import { SpotifyInfo } from "../../interfaces/global";
import { RequestStatus } from "../../interfaces/spotify";
import { defaultStatusTemplate } from "../../helpers/status_template";

export async function playTrackRequest(
    spotifyInfo: SpotifyInfo,
    tracks: string[]
): Promise<RequestStatus> {
    let status: RequestStatus = defaultStatusTemplate;
    const request_url: string = endpoints.play_track.url;

    let requestConfig: (accessToken: string) => AxiosRequestConfig = (
        accessToken: string
    ): AxiosRequestConfig => {
        return {
            url: request_url,
            method: "put",
            headers: {
                Authorization: `Bearer ${accessToken} `,
                "Content-Type": "application/json",
            },
            data: {
                uris: tracks,
            },
        };
    };

    await Axios(requestConfig(spotifyInfo.spotifyAccessToken))
        .then((res: AxiosResponse) => {
            if (res.status == 204) {
                status.successfull = true;
            }
            status.status = res.status;
            status.response = res.data;
        })
        .catch(async (error: AxiosError) => {
            status.status = error.response?.status;
            status.error = error.response;
            if (error.response?.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: any) => {
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        await Axios(requestConfig(newAccessToken))
                            .then((_res: any) => {
                                status.status = _res.status;
                                status.response = _res.data;
                                if (_res.status == 204) {
                                    status.successfull = true;
                                }
                            })
                            .catch((_error) => {
                                status.error = _error;
                                console.log(
                                    "Error: resumePausePlayback: Second axios call: ",
                                    _error
                                );
                            });
                    }
                );
            } else {
                console.trace();
                console.log(
                    `ERROR: playTrackRequest:63: ${error.response?.status}`
                );
            }
        });
    return status;
}
