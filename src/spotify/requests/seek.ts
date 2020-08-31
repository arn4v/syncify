import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from "axios";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import { SpotifyInfo } from "../../interfaces/global";
import { RequestStatus } from "../../interfaces/spotify";
import { defaultStatusTemplate } from "../../helpers/status_template";

export async function seekRequest(
    spotifyInfo: SpotifyInfo,
    position_ms: number | undefined
): Promise<RequestStatus> {
    const request_url: string = endpoints.seek.url;
    let status: RequestStatus = defaultStatusTemplate;
    let requestConfig: (accessToken: string) => AxiosRequestConfig = (
        accessToken: string
    ): AxiosRequestConfig => {
        return {
            url: request_url,
            method: "put",
            headers: {
                Authorization: "Bearer " + accessToken,
            },
            params: {
                position_ms: position_ms,
            },
        };
    };

    if (position_ms != undefined) {
        await axios(requestConfig(spotifyInfo.spotifyAccessToken))
            .then((res: AxiosResponse) => {
                res.status == 204
                    ? (status.successfull = true)
                    : (status.successfull = false);
            })
            .catch(async (error: AxiosError) => {
                status.error = error;
                status.status = error.response?.status;
                if (error.response?.status == 401) {
                    await refreshAccessToken(
                        spotifyInfo.spotifyRefreshToken
                    ).then(async (newAccessToken: string) => {
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        await axios(requestConfig(newAccessToken)).then(
                            (_res: AxiosResponse) => {
                                status.status = _res.status;
                                status.response = _res.data;
                                if (_res.status == 204) {
                                    status.error = undefined;
                                    status.successfull = true;
                                }
                            }
                        );
                    });
                } else {
                    console.log(
                        `ERROR: seekRequest:66: Unknown status error ${error.response?.status}`
                    );
                }
            });
    }
    return status;
}
