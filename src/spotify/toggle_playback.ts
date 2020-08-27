import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import {
    MethodStatus,
    PlatformInfo,
    SpotifyInfo,
    UserInfo,
} from "../interfaces/global";

// Template
// await DataHelper.doesUserExist(platformInfo)
//     .then(async (user?: UserInfo) => {
//         if (user?.exists) {
//         } else {
//             status.done = false;
//             status.message = "Please register first.";
//         }
//     })
//     .catch(() => {
//         status.done = false;
//         status.message = unsuccessful_message;
//     });

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

// This function serves to fetch spotify access/refresh token for
// togglePlaybackRequestFunc to use to carry out the call to the Spotify
// Web API
async function fetchAndRequest(
    platformInfo: any,
    rt: number
): Promise<boolean> {
    let done: boolean = false;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
            await togglePlaybackRequest(platformInfo, spotifyInfo, rt)
                .then((res: MethodStatus) => {
                    if (res.done) {
                        done = true;
                    } else {
                        done = false;
                    }
                })
                .catch(() => (done = false));
        })
        .catch(() => {
            done = false;
        });
    return done;
}

export async function togglePlayback(
    requestType: number,
    platformInfo: any
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    let successful_message =
        requestType == 1 ? "Resumed playback." : "Paused playback.";
    let unsuccessful_message =
        requestType == 1
            ? "Unable to resume playback."
            : "Unable to pause playback.";
    let successful_session_message =
        requestType == 1
            ? "Resumed playback for this session"
            : "Paused playback for the session.";
    let unsuccessful_session_message =
        requestType == 1
            ? "Unable to resume playback for session members"
            : `Unable to pause for all session members`;

    await DataHelper.doesUserExist(platformInfo)
        .then(async (user?: UserInfo) => {
            if (user?.exists) {
                await DataHelper.doesSessionExist(platformInfo)
                    .then(async (res: MethodStatus) => {
                        if (res.done) {
                            let members: string[] = JSON.parse(
                                res.data.members
                            );
                            try {
                                for (const member of members) {
                                    let platInfo = platformInfo;
                                    platInfo.type == 1
                                        ? (platInfo.discordUserId = member)
                                        : (platInfo.telegramUserId = member);
                                    await fetchAndRequest(
                                        platInfo,
                                        requestType
                                    ).catch((error) => console.log(error));
                                }
                                status.done = true;
                                status.message = successful_session_message;
                            } catch (err) {
                                if (err) status.done = false;
                                status.message = unsuccessful_session_message;
                            }
                        } else {
                            await fetchAndRequest(platformInfo, requestType)
                                .then((_res: boolean) => {
                                    if (_res) {
                                        status.done = true;
                                        status.message = successful_message;
                                    } else {
                                        status.done = false;
                                        status.message = unsuccessful_message;
                                    }
                                })
                                .catch((error) => {
                                    console.log(error);
                                    status.done = false;
                                    status.message = unsuccessful_message;
                                });
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message = unsuccessful_message;
                    });
            } else {
                status.done = false;
                status.message = "Please register first.";
            }
        })
        .catch(() => {
            status.done = false;
            status.message = unsuccessful_message;
        });

    return status;
}
