import { DataHelper } from "../data/data_helper";
import { trackLinkValidator } from "../helpers";
import {
    MethodStatus,
    PlatformInfo,
    RequestStatus,
    SpotifyInfo,
    UserInfo,
} from "../interfaces";
import { getPlaylistOrAlbumItems } from "./playlist_helper";
import { RequestsHandler } from "./requests_handler";

async function fetchAndRequest(
    platformInfo: PlatformInfo,
    tracks: string[],
    type: "queue" | "play"
): Promise<boolean> {
    let done: boolean = false;
    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo: SpotifyInfo) => {
            if (type == "play") {
                await RequestsHandler.playTrack(spotifyInfo, tracks).then(
                    async (res: RequestStatus) => {
                        if (res != undefined) {
                            if (res?.status == 204 || res.successfull) {
                                done = true;
                                if (
                                    res.isRefreshed &&
                                    res.newAccessToken != undefined
                                ) {
                                    DataHelper.updateSpotifyAccessToken(
                                        res.newAccessToken,
                                        platformInfo
                                    );
                                }
                            }
                        }
                    }
                );
            } else {
                for (const uri of tracks) {
                    await RequestsHandler.queue(spotifyInfo, uri)
                        .then((res: RequestStatus) => {
                            done = res.successfull;
                            if (
                                res.isRefreshed &&
                                res.newAccessToken != undefined
                            ) {
                                DataHelper.updateSpotifyAccessToken(
                                    res.newAccessToken,
                                    platformInfo
                                );
                            }
                        })
                        .catch((error: string) => {
                            console.log("ERROR", error);
                            done = false;
                        });
                }
            }
        }
    );
    return done;
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
    // let successful_queue_session: string =
    //     "Added song to queue for the session";
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
                                    let platInfo: PlatformInfo = platformInfo;
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
                                    await fetchAndRequest(
                                        platformInfo,
                                        uris,
                                        res.data.playInstant ? "play" : "queue"
                                    )
                                        .then((_res: boolean) => {
                                            status.done = _res;
                                            status.message = res.data
                                                .playInstant
                                                ? successful_play_session
                                                : `Added ${
                                                      uris.length == 1
                                                          ? "song"
                                                          : `${uris.length} songs`
                                                  } to queue for the session`;
                                        })
                                        .catch((error: string) => {
                                            console.log(error);
                                            status.done = false;
                                            status.message = res.data
                                                .playInstant
                                                ? unsuccessful_play_session
                                                : unsuccessful_queue_session;
                                        });

                                    if (res.data.playInstant === true) {
                                        await DataHelper.updatePlayInstantStatus(
                                            platformInfo
                                        ).catch((error: string) =>
                                            console.log(
                                                "ERROR: addToSessionQueue: " +
                                                    error
                                            )
                                        );
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
