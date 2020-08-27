import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { MethodStatus, UserInfo, SpotifyInfo } from "../interfaces/global";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import { trackLinkValidator } from "../helpers/spotify_link_validator";
import { getPlaylistOrAlbumItems } from "./playlist_helper";

export async function addToQueue(
    platformInfo: any,
    trackUri: string
): Promise<boolean> {
    const request_url: string = endpoints.add_to_queue.url;
    let _done: boolean;
    let new_access_token: string;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
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
    tracks: string[]
): Promise<boolean> {
    let new_access_token: string;
    let _done: boolean = false;
    const request_url: string = endpoints.play_track.url;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
            let access_token: string = spotifyInfo.spotifyAccessToken;
            await axios({
                url: request_url,
                method: "put",
                headers: {
                    Authorization: "Bearer " + access_token,
                    "Content-Type": "application/json",
                },
                data: {
                    uris: tracks,
                },
            })
                .then((res: any) => {
                    console.log(res.config);
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
                                data: {
                                    uris: [tracks[0]],
                                },
                            })
                                .then((_res: any) => {
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
                            `ERROR: play_queue_track:playTrack:136: ${error.response.status}`
                        );
                        _done = false;
                    }
                });
        })
        .catch((__error) => {
            console.log("ERROR: DataHelper.fetchSpotifyTokens: " + __error);
            _done = false;
        });
    return _done;
}

export async function playOrAddToQueue(
    platformInfo: any,
    songLink: string[]
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };
    let successful_play_session: string = "Playing song for the session";
    let successful_queue_session: string =
        "Added song to queue for the session";
    let unsuccessful_play_session: string;
    let unsuccessful_queue_session: string =
        "Unable to add song to queue for the session";
    let start_session: string = "Please start a session first";
    let register: string = "Please register first.";

    const rawUris: string[] = trackLinkValidator(songLink).data.uris;
    const trackUris: string[] = rawUris.filter(
        (e) => !e.includes("album") && !e.includes("playlist")
    );
    const playlistAndAlbumUris: string[] = rawUris.filter(
        (e) => e.includes("album") || e.includes("playlist")
    );
    let uris: string[] = trackUris;

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
                                    if (playlistAndAlbumUris.length >= 1) {
                                        await getPlaylistOrAlbumItems(
                                            platformInfo,
                                            playlistAndAlbumUris
                                        ).then((_res: MethodStatus) => {
                                            if (_res.data.length >= 1) {
                                                _res.data.forEach(
                                                    (track: string) => {
                                                        uris.push(track);
                                                    }
                                                );
                                            }
                                        });
                                    }
                                    if (res.data.playInstant) {
                                        await playTrack(platInfo, uris)
                                            .then((_res: boolean) => {
                                                status.done = _res;
                                                status.message = successful_play_session;
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                status.done = false;
                                                status.message = unsuccessful_play_session;
                                            });

                                        await DataHelper.updatePlayInstantStatus(
                                            platformInfo
                                        ).catch((error: string) =>
                                            console.log(
                                                "ERROR: addToSessionQueue: " +
                                                    error
                                            )
                                        );
                                    } else {
                                        for (const uri of uris) {
                                            await addToQueue(platInfo, uri)
                                                .then((_res) => {
                                                    status.done = _res;
                                                    status.message = successful_queue_session;
                                                })
                                                .catch((error) => {
                                                    console.log("ERROR", error);
                                                    status.done = false;
                                                    status.message = unsuccessful_queue_session;
                                                });
                                        }
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                                status.done = false;
                                status.message =
                                    "Unable to play requested track";
                            }
                        } else {
                            status.done = false;
                            status.message = "Please create a session first";
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message = start_session;
                    });
            } else {
                status.done = false;
                status.message = register;
            }
        })
        .catch(() => {
            status.done = false;
            status.message = register;
        });
    return status;
}
