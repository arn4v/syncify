import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { MethodStatus } from "../types/status";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import { trackLinkValidator } from "../helpers/spotify_link_validator";

export async function addToQueue(
    platformInfo: any,
    trackUri: string
): Promise<boolean> {
    const request_url: string = endpoints.add_to_queue.url;
    let _done: boolean;
    let new_access_token: string;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: any) => {
            let access_token: string = spotifyInfo.spotifyAccessToken;
            await axios({
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
                    res.status == 204 ? (_done = true) : (_done = false);
                })
                .catch(async (error) => {
                    if (error.response.status == 401) {
                        await refreshAccessToken(
                            spotifyInfo.spotifyRefreshToken
                        ).then(async (data: any) => {
                            new_access_token = data;
                            DataHelper.updateSpotifyAccessToken(
                                data,
                                platformInfo
                            );
                            await axios({
                                url: request_url,
                                method: "put",
                                headers: {
                                    Authorization: "Bearer " + new_access_token,
                                },
                            })
                                .then((_res) => {
                                    if (_res.status == 204) {
                                        _done = true;
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
                        _done = false;
                    }
                });
        })
        .catch((__error) => {
            console.log("ERROR: DataHelper.fetchSpotifyTokens: " + __error);
            _done = false;
        });
    // @ts-ignore
    return _done;
}

export async function playTrack(
    platformInfo: any,
    trackUri: string
): Promise<boolean> {
    let new_access_token: string;
    let _done: boolean;
    const request_url: string = endpoints.play_track.url;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: any) => {
            let access_token: string = spotifyInfo.spotifyAccessToken;
            await axios({
                url: request_url,
                method: "put",
                headers: {
                    Authorization: "Bearer " + access_token,
                },
                data: {
                    uris: [trackUri],
                },
            })
                .then((res) => {
                    res.status == 204 ? (_done = true) : (_done = false);
                })
                .catch(async (error) => {
                    if (error.response.status == 401) {
                        await refreshAccessToken(
                            spotifyInfo.spotifyRefreshToken
                        ).then(async (data: any) => {
                            new_access_token = data;
                            DataHelper.updateSpotifyAccessToken(
                                data,
                                platformInfo
                            );
                            await axios({
                                url: request_url,
                                method: "put",
                                headers: {
                                    Authorization: "Bearer " + new_access_token,
                                },
                            })
                                .then((_res) => {
                                    if (_res.status == 204) {
                                        _done = true;
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
                        _done = false;
                    }
                });
        })
        .catch((__error) => {
            console.log("ERROR: DataHelper.fetchSpotifyTokens: " + __error);
            _done = false;
        });
    // @ts-ignore
    return _done;
}
export async function playOrAddToQueue(
    platformInfo: any,
    songLink: string
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    const isValid: any = trackLinkValidator(songLink);
    if (isValid.valid == true) {
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
                            if (res.data.playInstant) {
                                await playTrack(platInfo, isValid.link)
                                    .then((_res) => {
                                        status.done = _res;
                                        status.message =
                                            "Playing song for the session";
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        status.done = false;
                                        status.message =
                                            "Unable to play song for the session";
                                    });

                                await DataHelper.updatePlayInstantStatus(
                                    platformInfo
                                ).catch((error: string) =>
                                    console.log(
                                        "ERROR: addToSessionQueue: " + error
                                    )
                                );
                            } else {
                                await addToQueue(platInfo, isValid.link)
                                    .then((_res) => {
                                        console.log(_res)
                                        status.done = _res;
                                        status.message =
                                            "Added song to queue for the session";
                                    })
                                    .catch((error) => {
                                        console.log("ERROR", error);
                                        status.done = false;
                                        status.message =
                                            "Unable to add song to queue for the session";
                                    });
                            }
                        }
                    } catch (err) {
                        if (err) {
                            status.done = false;
                            status.message = "Unable to play requested track";
                        }
                    }
                } else {
                    console.log("URL is not valid");
                    status.done = false;
                    status.message = "Please send a valid URL";
                }
            })
            .catch((error) => {
                console.log(error);
                status.done = false;
                status.message = "Please start a session first.";
            });
    } else {
        status.done = false;
        status.message = "Please start a session first.";
    }

    return status;
}
