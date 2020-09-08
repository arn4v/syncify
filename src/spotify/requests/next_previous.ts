import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { RequestStatus, SpotifyInfo } from "../../interfaces/interfaces";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import { defaultStatusTemplate } from "../../helpers/status_template";

export async function nextPreviousTrackRequest(
    spotifyInfo: SpotifyInfo,
    request_type: number
): Promise<RequestStatus> {
    const request_url: string =
        request_type == 1
            ? endpoints.next_track.url
            : endpoints.previous_track.url;
    const requestConfig: (accessToken: string) => AxiosRequestConfig = (
        accessToken: string
    ): AxiosRequestConfig => {
        return {
            url: request_url,
            method: "post",
            headers: {
                Authorization: `Bearer ${accessToken}}`,
            },
        };
    };
    let status: RequestStatus = defaultStatusTemplate;

    await Axios(requestConfig(spotifyInfo.spotifyAccessToken))
        .then((res: AxiosResponse) => {
            status.status = res.status;
            if (res.status == 204) status.successfull = true;
        })
        .catch(async (error: AxiosError) => {
            if (error.response?.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        await Axios(requestConfig(newAccessToken))
                            .then((_res) => {
                                status.status = _res.status;
                                if (_res.status == 204) {
                                    status.successfull = true;
                                }
                            })
                            .catch((_error) =>
                                console.log(
                                    "Error: nextPreviousTrack: Second Axios call: ",
                                    _error
                                )
                            );
                    }
                );
            } else {
                console.trace();
                console.log(
                    `ERROR: nextPreviousTrackRequest:54: ${error.response?.status}`
                );
                status.successfull = false;
            }
        });
    return status;
}
