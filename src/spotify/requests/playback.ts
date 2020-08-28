import axios from "axios";
import {
    PlatformInfo,
    SpotifyInfo,
    MethodStatus,
} from "../../interfaces/global";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import { DataHelper } from "../../data/data_helper";

/**
    This function exists purely to be used by other Spotify methods in this
    directory that use DataHelper.fetchSpotifyTokens as well. In order to 
    avoid that method from being called two times unnecessarily, this function 
    has been extracted from the main togglePlayback function that is to be 
    used for individual queries in chat bots. 
**/
export async function togglePlaybackRequest(
    platformInfo: PlatformInfo,
    spotifyInfo: SpotifyInfo,
    requestType: number
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
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
            res.status == 204 ? (status.done = true) : (status.done = false);
        })
        .catch(async (error) => {
            if (error.response.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: any) => {
                        DataHelper.updateSpotifyAccessToken(
                            newAccessToken,
                            platformInfo
                        );
                        await axios({
                            url: request_url,
                            method: "put",
                            headers: {
                                Authorization: "Bearer " + newAccessToken,
                            },
                        })
                            .then((_res) => {
                                if (_res.status == 204) {
                                    status.done = true;
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
                status.done = false;
                status.error = error;
            }
        });
    return status;
}
