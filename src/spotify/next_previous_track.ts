import { DataHelper } from "../data/data_helper";
import {
    MethodStatus,
    PlatformInfo,
    SpotifyInfo,
    UserInfo,
} from "../interfaces/global";
import { RequestStatus } from "../interfaces/spotify";
import { RequestsHandler } from "./requests_handler";

async function fetchAndRequest(platformInfo: PlatformInfo, requestType: 1 | 2) {
    let done = false;
    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo: SpotifyInfo) => {
            await RequestsHandler.nextPreviousTrack(spotifyInfo, requestType)
                .then(async (res: RequestStatus) => {
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
                .catch(() => {
                    done = false;
                });
        }
    );
    return done;
}

export async function nextPreviousTrack(
    platformInfo: PlatformInfo,
    requestType: 1 | 2
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    await DataHelper.doesUserExist(platformInfo)
        .then(async (user: UserInfo) => {
            if (user?.exists) {
                await DataHelper.doesSessionExist(platformInfo)
                    .then(async (_res: MethodStatus) => {
                        if (_res.done) {
                            if (
                                user?.inSession &&
                                user.sessionInfo?.id === _res.data.sessionId
                            ) {
                                let members: string[] = JSON.parse(
                                    _res.data.members
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
                                        )
                                            .then((done: boolean) => {
                                                status.done = done;
                                                status.message =
                                                    requestType == 1
                                                        ? "Skipped to next track for the session"
                                                        : "Went back to previous track for the session";
                                            })
                                            .catch((error) =>
                                                console.log(error)
                                            );
                                    }
                                } catch (err) {
                                    if (err) status.done = false;
                                    status.message =
                                        "Unable to skip track for the session";
                                }
                            } else {
                                status.done = false;
                                status.message =
                                    "You are in a different session, use the leave command to leave that session.";
                            }
                        } else {
                            status.done = false;
                            status.message =
                                "Please start/join a session first.";
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message = "Unable to skip/go back track";
                    });
            } else {
                status.done = false;
                status.message = "Please register first.";
            }
        })
        .catch(() => {
            status.done = false;
            status.message = "Please register first.";
        });
    return status;
}
