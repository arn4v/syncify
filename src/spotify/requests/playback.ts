import axios from "axios";
import { RequestStatus } from "../../interfaces/spotify";
import { SpotifyInfo } from "../../interfaces/global";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";

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
    let status: RequestStatus = {
        successfull: false,
        status: undefined,
        error: undefined,
        response: undefined,
        isRefreshed: false,
    };

    const request_url: string =
        requestType == 1
            ? endpoints.resume_playback.url
            : endpoints.pause_playback.url;

    await axios({
        url: request_url,
        method: "put",
        headers: {
            Authorization: "Bearer " + spotifyInfo.spotifyAccessToken,
        },
    })
        .then((res) => {
            status.status = res.status;
            status.response = res.data;
            res.status == 204
                ? (status.successfull = true)
                : (status.successfull = false);
        })
        .catch(async (error) => {
            if (error.response.status == 401 || error.response.status == 403) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        status.isRefreshed = true;
                        status.newAccessToken = newAccessToken;
                        await axios({
                            url: request_url,
                            method: "put",
                            headers: {
                                Authorization: "Bearer " + newAccessToken,
                            },
                        })
                            .then((_res) => {
                                status.status = _res.status;
                                status.response = _res.data;
                                if (_res.status == 204) {
                                    status.successfull = true;
                                }
                            })
                            .catch((_error) =>
                                console.log(
                                    "Error: resumePausePlayback: Second axios call: ",
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
                status.status = error.response.status;
                status.error = error;
            }
        });
    return status;
}
