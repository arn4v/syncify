import Axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { SpotifyInfo, RequestStatus } from "../../interfaces/interfaces";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import { defaultStatusTemplate } from "../../helpers/status_template";

export async function queueRequest(
    spotifyInfo: SpotifyInfo,
    trackUri: string
): Promise<RequestStatus> {
    const request_url: string = endpoints.add_to_queue.url;
    let status: RequestStatus = defaultStatusTemplate;
    let requestConfig: (accessToken: string) => AxiosRequestConfig = (
        accessToken: string
    ): AxiosRequestConfig => {
        return {
            url: request_url,
            method: "post",
            headers: {
                Authorization: "Bearer " + accessToken,
            },
            params: {
                uri: trackUri,
            },
        };
    };
    await Axios(requestConfig(spotifyInfo.spotifyAccessToken))
        .then((res: AxiosResponse) => {
            res.status == 204
                ? (status.successfull = true)
                : (status.successfull = false);
            status.status = res.status;
        })
        .catch(async (error: AxiosError) => {
            if (error.response?.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        await Axios(requestConfig(newAccessToken))
                            .then((_res: AxiosResponse) => {
                                if (_res.status == 204) {
                                    status.successfull = true;
                                    status.status = _res.status;
                                } else {
                                    status.status = error.response?.status;
                                    status.error = error.response;
                                }
                            })
                            .catch((_error: AxiosError) => {
                                status.successfull = false;
                                status.status = _error.response?.status;
                                status.error = _error;
                                console.log(
                                    "Error: resumePausePlayback: Second axios call: ",
                                    _error
                                );
                            });
                    }
                );
            } else {
                console.trace(
                    `queueRequest:60: Unknown status error ${error.response?.status}`
                );
                status.successfull = false;
            }
        });
    return status;
}
