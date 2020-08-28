import Axios from "axios";
import { RequestStatus } from "../../interfaces/spotify";
import { SpotifyInfo } from "../../interfaces/global";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";

export async function nextPreviousTrackRequest(
    spotifyInfo: SpotifyInfo,
    request_type: number
): Promise<RequestStatus> {
    const request_url: string =
        request_type == 1
            ? endpoints.next_track.url
            : endpoints.previous_track.url;
    let status: RequestStatus = {
        successfull: false,
        status: undefined,
        error: undefined,
        response: undefined,
        isRefreshed: false,
    };

    await Axios({
        url: request_url,
        method: "post",
        headers: {
            Authorization: "Bearer " + spotifyInfo.spotifyAccessToken,
        },
    })
        .then((res) => {
            status.status = res.status;
            if (res.status == 204) status.successfull = true;
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
                                Authorization: "Bearer " + newAccessToken,
                            },
                        })
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
                console.log(
                    `ERROR: SpotifyHelper.resumePlayback: ${error.response.status}`
                );
                status.successfull = false;
            }
        });
    return status;
}
