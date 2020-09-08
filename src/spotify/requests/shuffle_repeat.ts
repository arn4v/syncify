import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { defaultStatusTemplate } from "../../helpers/status_template";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import {
    RequestStatus,
    ShuffleRepeatState,
    SpotifyInfo,
} from "../../interfaces/interfaces";

export async function toggleShuffleRepeatRequest(
    requestType: number,
    toggleState: ShuffleRepeatState,
    spotifyInfo: SpotifyInfo
): Promise<RequestStatus> {
    const request_url: string =
        requestType == 1
            ? endpoints.shuffle_playback.url
            : endpoints.repeat_playback.url;

    // Can probably unify response and error since they serve the same
    // purpose
    let status: RequestStatus = defaultStatusTemplate;
    let requestConfig: (accessToken: string) => AxiosRequestConfig = (
        accessToken: string
    ): AxiosRequestConfig => {
        return {
            method: "put",
            url: request_url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: { state: toggleState },
        };
    };

    await axios(requestConfig(spotifyInfo.spotifyAccessToken))
        .then(async (res: AxiosResponse) => {
            status.response = res.data;
            if (res.status == (200 || 201 || 204)) {
                status.status = res.status;
                status.successfull = true;
            } else if (res.status == (400 || 401)) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        await axios(requestConfig(newAccessToken))
                            .then(async (_res: any) => {
                                status.status = res.status;
                                status.response = _res.data;
                                if (_res.status == (200 || 201)) {
                                    status.successfull = true;
                                }
                            })
                            .catch((error: Error) => {
                                status.error = error;
                                console.log(
                                    `ERROR: toggleShuffle: axiosFunc: Catch Block ${error}`
                                );
                            });
                    }
                );
            }
        })
        .catch((error: AxiosError) => {
            status.error = error;
            console.log(`ERROR: toggleShuffle: ${error}`);
        });
    return status;
}
