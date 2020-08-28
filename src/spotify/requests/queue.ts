import Axios from "axios";
import { DataHelper } from "../../data/data_helper";
import { SpotifyInfo } from "../../interfaces/global";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import { RequestStatus } from "../../interfaces/spotify";

export async function queueRequest(
    spotifyInfo: SpotifyInfo,
    trackUri: string
): Promise<RequestStatus> {
    let status: RequestStatus = {
        successfull: false,
        status: undefined,
        error: undefined,
        response: undefined,
        isRefreshed: false,
    };
    const request_url: string = endpoints.add_to_queue.url;
    let new_access_token: string;
    let access_token: string = spotifyInfo.spotifyAccessToken;
    await Axios({
        url: request_url,
        method: "post",
        headers: {
            Authorization: "Bearer " + access_token,
        },
        params: {
            uri: trackUri,
        },
    })
        .then((res) => {
            res.status == 204
                ? (status.successfull = true)
                : (status.successfull = false);
            status.status = res.status;
        })
        .catch(async (error) => {
            if (error.response.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        await Axios({
                            url: request_url,
                            method: "put",
                            headers: {
                                Authorization: "Bearer " + new_access_token,
                            },
                        })
                            .then((_res: any) => {
                                if (_res.status == 204) {
                                    status.successfull = true;
                                    status.status = _res.status;
                                } else {
                                    status.status = error.response.status;
                                    status.error = error.response;
                                }
                            })
                            .catch((_error: any) => {
                                status.successfull = false;
                                status.status = _error.response.status;
                                status.error = _error;
                                console.log(
                                    "Error: resumePausePlayback: Second axios call: ",
                                    _error
                                );
                            });
                    }
                );
            } else {
                console.log(
                    `ERROR: SpotifyHelper.resumePlayback: ${error.response.status}`
                );
                status.successfull = false;
            }
        });
    return status;
}
