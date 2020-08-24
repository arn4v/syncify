import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import { trackLinkValidator } from "../helpers/spotify_link_validator";

export async function playOrAddToQueue(platformInfo: any, songLink: string) {
    let status: any = {
        done: undefined,
        message: undefined,
    };
    let new_access_token: string;

    let playFunc = async (platInfo: any, trackUri: string) => {
        let _done: boolean;
        console.log(`Immediately playing song`);
        const request_url: string = endpoints.play_track.url;
        await DataHelper.fetchSpotifyTokens(platInfo)
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
                                        Authorization:
                                            "Bearer " + new_access_token,
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
    };

    let addToQueueFunc = async (platInfo: any, trackUri: string) => {
        let _done: boolean;
        const request_url: string = endpoints.add_to_queue.url;
        console.log("Adding song to queue");
        await DataHelper.fetchSpotifyTokens(platInfo)
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
                                        Authorization:
                                            "Bearer " + new_access_token,
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
    };

    const isValid: any = trackLinkValidator(songLink);
    await DataHelper.doesSessionExist(platformInfo)
        .then(async (res: any) => {
            if (isValid.valid == true) {
                console.log("URL is valid");
                if (res.status == 200) {
                    let sessionQueue: string[] = JSON.parse(res.data.queue);
                    let members: string[] = JSON.parse(res.data.members);
                    try {
                        for (const member of members) {
                            let platInfo = platformInfo;
                            platInfo.type == 1
                                ? (platInfo.discordUserId = member)
                                : (platInfo.telegramUserId = member);
                            if (sessionQueue.length == 0) {
                                await playFunc(platInfo, isValid.link)
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
                            } else {
                                await addToQueueFunc(platInfo, isValid.link)
                                    .then((_res) => {
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
                        await DataHelper.addToSessionQueue(
                            platformInfo,
                            isValid.link
                        )
                            .then((status) => {
                                console.log(status);
                                if (status.done) {
                                    console.log("New queue: " + status.queue);
                                }
                            })
                            .catch((error: string) =>
                                console.log(
                                    "ERROR: addToSessionQueue: " + error
                                )
                            );
                    } catch (err) {
                        if (err) {
                            status.done = false;
                            status.message = "Unable to play requested track";
                        }
                    }
                } else {
                    status.done = false;
                    status.message = "Please start a session first.";
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
    // @ts-ignore
    return status;
}
