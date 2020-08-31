import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { RequestStatus } from "../../interfaces/spotify";
import { SpotifyInfo } from "../../interfaces/global";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import { defaultStatusTemplate } from "../../helpers/status_template";

/**
    This function exists purely to be used by other Spotify methods in this
    directory that use DataHelper.fetchSpotifyTokens as well. In order to 
    avoid that method from being called two times unnecessarily, this function 
    has been extracted from the main togglePlayback function that is to be 
    used for individual queries in chat bots. 
**/
export async function togglePlaybackRequest(
    spotifyInfo: SpotifyInfo,
    requestType: number
): Promise<RequestStatus> {
    const request_url: string =
        requestType == 1
            ? endpoints.resume_playback.url
            : endpoints.pause_playback.url;

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
        };
    };

    await axios(requestConfig(spotifyInfo.spotifyAccessToken))
        .then((res: AxiosResponse) => {
            status.status = res.status;
            status.response = res.data;
            res.status == 204
                ? (status.successfull = true)
                : (status.successfull = false);
        })
        .catch(async (error: AxiosError) => {
            if (error.response?.status == (401 || 403)) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        spotifyInfo.spotifyAccessToken = newAccessToken;
                        await axios(requestConfig(newAccessToken))
                            .then((_res: AxiosResponse) => {
                                status.status = _res.status;
                                status.response = _res.data;
                                if (_res.status == 204) {
                                    status.successfull = true;
                                }
                            })
                            .catch((_error: AxiosError) =>
                                console.log(
                                    "Error: resumePausePlayback: Second axios call: ",
                                    _error
                                )
                            );
                    }
                );
            } else {
                console.trace("togglePlaybackRequest.ts: 64: Unknown status");
                status.successfull = false;
                status.status = error.response?.status;
                status.error = error;
            }
        });
    return status;
}
