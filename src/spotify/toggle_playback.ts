import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import { MethodStatus } from "../types/status";

/**
    This function exists purely to be used by other Spotify methods in this
    directory that use DataHelper.fetchSpotifyTokens as well. In order to 
    avoid that method from being called two times unnecessarily, this function 
    has been extracted from the main togglePlayback function that is to be 
    used for individual queries in chat bots. 
**/
export async function togglePlaybackRequest(
    platformInfo: any,
    spotifyInfo: any,
    request_type: number
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    const request_url: string =
        request_type == 1
            ? endpoints.resume_playback.url
            : endpoints.pause_playback.url;

    let access_token: string = spotifyInfo.spotifyAccessToken;
    let new_access_token: string;

    await axios({
        url: request_url,
        method: "put",
        headers: {
            Authorization: "Bearer " + access_token,
        },
    })
        .then((res) => {
            res.status == 204 ? (status.done = true) : (status.done = false);
        })
        .catch(async (error) => {
            if (error.response.status == 401) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (data: any) => {
                        new_access_token = data;
                        DataHelper.updateSpotifyAccessToken(data, platformInfo);
                        await axios({
                            url: request_url,
                            method: "put",
                            headers: {
                                Authorization: "Bearer " + new_access_token,
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
        .then(async (spotifyInfo) => {
            await togglePlaybackRequest(platformInfo, spotifyInfo, rt)
                .then((res) => {
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

export async function togglePlayback(request_type: number, platformInfo: any) {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    await DataHelper.doesSessionExist(platformInfo)
        .then(async (res: MethodStatus) => {
            if (res.done) {
                let members: string[] = JSON.parse(res.data.members);
                try {
                    for (const member of members) {
                        let platInfo = platformInfo;
                        platInfo.type == 1
                            ? (platInfo.discordUserId = member)
                            : (platInfo.telegramUserId = member);
                        await fetchAndRequest(
                            platInfo,
                            request_type
                        ).catch((error) => console.log(error));
                    }
                    status.done = true;
                    status.message =
                        request_type == 1
                            ? "Resumed playback for this session"
                            : "Paused playback for the session.";
                } catch (err) {
                    if (err) status.done = false;
                    status.message = `Unable to pause for all session members`;
                }
            } else {
                await fetchAndRequest(platformInfo, request_type)
                    .then((_res: any) => {
                        if (_res == true) {
                            status.done = true;
                            status.message = `Paused playback`;
                        } else {
                            status.done = false;
                            status.message = `Unable to pause playback`;
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message = `Unable to pause playback`;
                    });
            }
        })
        .catch((error) => {
            console.log(error);
            status.done = false;
            status.message = `Unable to pause`;
        });

    return status;
}
