import { DataHelper } from "../data/data_helper";
import { RequestsHandler } from "./requests_handler";
import {
    MethodStatus,
    PlatformInfo,
    SpotifyInfo,
    UserInfo,
    RequestStatus,
} from "../interfaces";

async function fetchAndRequest(
    platformInfo: PlatformInfo,
    position_ms: number
): Promise<boolean> {
    let done: boolean = false;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
            await RequestsHandler.togglePlayback(spotifyInfo, 2).then(
                async (res: RequestStatus) => {
                    if (res.isRefreshed && res.newAccessToken !== undefined) {
                        DataHelper.updateSpotifyAccessToken(
                            res?.newAccessToken,
                            platformInfo
                        );
                        spotifyInfo.spotifyAccessToken = res.newAccessToken;
                    }
                    await RequestsHandler.seek(spotifyInfo, position_ms).then(
                        async (_res: RequestStatus) => {
                            if (res.successfull && _res.successfull) {
                                done = true;
                            } else {
                                done = false;
                            }
                            await RequestsHandler.togglePlayback(
                                spotifyInfo,
                                1
                            );
                        }
                    );
                }
            );
        })
        .catch(() => {
            done = false;
        });
    return done;
}

export async function syncSession(
    platformInfo: PlatformInfo
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    await DataHelper.doesUserExist(platformInfo)
        .then(async (user?: UserInfo) => {
            if (user?.exists) {
                await DataHelper.doesSessionExist(platformInfo).then(
                    async (session: MethodStatus) => {
                        if (session.done) {
                            if (user?.inSession) {
                                if (
                                    user?.sessionInfo?.id ===
                                    session.data.sessionId
                                ) {
                                    let members: string[] = JSON.parse(
                                        session.data.members
                                    );
                                    let admin: string = session.data.createdBy;
                                    let adminPlatformInfo: PlatformInfo = platformInfo;
                                    platformInfo.type == 1
                                        ? (adminPlatformInfo.discordUserId = admin)
                                        : (adminPlatformInfo.telegramUserId = admin);
                                    await DataHelper.fetchSpotifyTokens(
                                        adminPlatformInfo
                                    ).then(async (spotifyInfo: SpotifyInfo) => {
                                        await RequestsHandler.trackInfo(
                                            spotifyInfo
                                        ).then(async (res: RequestStatus) => {
                                            let position: number | undefined =
                                                res?.trackInfo?.position;
                                            let logs: boolean[] = [];
                                            if (position != undefined) {
                                                for (const member of members) {
                                                    const memberPlatformInfo: PlatformInfo = platformInfo;
                                                    platformInfo.type == 1
                                                        ? (memberPlatformInfo.discordUserId = member)
                                                        : (memberPlatformInfo.telegramGroupId = member);
                                                    await fetchAndRequest(
                                                        memberPlatformInfo,
                                                        position
                                                    ).then((done: boolean) => {
                                                        logs.push(done);
                                                    });
                                                }
                                                if (!logs.includes(false)) {
                                                    status.done = true;
                                                    status.message =
                                                        "Synced every user in the session";
                                                } else {
                                                    status.done = false;
                                                    status.message =
                                                        "Unable to sync some users, try running sync command again";
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    status.done = false;
                                    status.message =
                                        "You're in a different session, use the leave command to leave it.";
                                }
                            } else {
                                status.done = false;
                                status.message =
                                    "Enroll yourself in a session first.";
                            }
                        } else {
                            status.done = false;
                            status.message = "Please create a session first.";
                        }
                    }
                );
            } else {
                status.done = false;
                status.message =
                    "Unable to find you in the database. Are you sure you registered?";
            }
        })
        .catch(() => {
            status.done = false;
            status.message =
                "Unable to fetch user info, are you sure you are registered?";
        });
    return status;
}
