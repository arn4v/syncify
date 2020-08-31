import axios from "axios";
import { DataHelper } from "../data/data_helper";
import {
    MethodStatus,
    PlatformInfo,
    SpotifyInfo,
    UserInfo,
} from "../interfaces/global";
import { RequestStatus } from "../interfaces/spotify";
import { RequestsHandler } from "./requests_handler";

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
            await RequestsHandler.togglePlayback(spotifyInfo, rt)
                .then((res: RequestStatus) => {
                    if (res.successfull) {
                        done = true;
                    } else {
                        done = false;
                    }
                    if (res.isRefreshed && res.newAccessToken != undefined) {
                        DataHelper.updateSpotifyAccessToken(
                            res.newAccessToken,
                            platformInfo
                        );
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
                            if (
                                user.inSession &&
                                user.sessionInfo?.id === res.data.sessionId
                            ) {
                                let members: string[] = JSON.parse(
                                    res.data.members
                                );
                                try {
                                    let log: boolean[] = [];
                                    for (const member of members) {
                                        let platInfo = platformInfo;
                                        platInfo.type == 1
                                            ? (platInfo.discordUserId = member)
                                            : (platInfo.telegramUserId = member);
                                        await fetchAndRequest(
                                            platInfo,
                                            requestType
                                        )
                                            .then((done: boolean) => {
                                                log.push(done);
                                            })
                                            .catch((error) =>
                                                console.log(error)
                                            );

                                        status.done = log.includes(false)
                                            ? false
                                            : true;
                                        status.message = log.includes(false)
                                            ? unsuccessful_session_message
                                            : successful_session_message;
                                    }
                                } catch (err) {
                                    if (err) status.done = false;
                                    status.message = unsuccessful_session_message;
                                }
                            } else {
                                status.message =
                                    "You're in a different session, use the leave command to leave that session.";
                            }
                        } else {
                            status.done = false;
                            status.message = "Please start a session first.";
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message =
                            "Unable to fetch session info, please make a session exists / you are a part of it.";
                    });
            } else {
                status.done = false;
                status.message =
                    "Unable to find you in database, please register first.";
            }
        })
        .catch(() => {
            status.done = false;
            status.message =
                "Unable to fetch user info, please make sure you are registered.";
        });
    return status;
}
