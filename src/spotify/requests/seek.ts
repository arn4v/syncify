import axios from "axios";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import {
    MethodStatus,
    PlatformInfo,
    SpotifyInfo,
} from "../../interfaces/global";
import { RequestStatus } from "../../interfaces/spotify";

export async function seekRequest(
    spotifyInfo: SpotifyInfo,
    position_ms: number | undefined
): Promise<RequestStatus> {
    let status: RequestStatus = {
        successfull: false,
        status: undefined,
        error: undefined,
        response: undefined,
        isRefreshed: false,
    };

    const request_url: string = endpoints.seek.url;
    let access_token: string | undefined = spotifyInfo.spotifyAccessToken;

    if (position_ms != undefined) {
        await axios({
            url: request_url,
            method: "put",
            headers: {
                Authorization: "Bearer " + access_token,
            },
            params: {
                position_ms: position_ms,
            },
        })
            .then((res) => {
                res.status == 204
                    ? (status.successfull = true)
                    : (status.successfull = false);
            })
            .catch(async (error) => {
                status.error = error;
                status.status = error.response.status;
                if (error.response.status == 401) {
                    await refreshAccessToken(
                        spotifyInfo.spotifyRefreshToken
                    ).then(async (newAccessToken: string) => {
                        await axios({
                            url: request_url,
                            method: "put",
                            headers: {
                                Authorization: "Bearer " + newAccessToken,
                            },
                            params: {
                                position_ms: position_ms,
                            },
                        })
                            .then((_res) => {
                                status.status = _res.status;
                                status.response = _res.data;
                                if (_res.status == 204) {
                                    status.error = undefined;
                                    status.successfull = true;
                                }
                            })
                            .catch((_error) =>
                                console.log(
                                    "Error: resumePausePlayback: Second axios call: ",
                                    _error
                                )
                            );
                    });
                } else {
                    console.log(
                        `ERROR: SpotifyHelper.resumePlayback: ${error.response.status}`
                    );
                }
            });
    }
    return status;
}
