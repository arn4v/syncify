import { DataHelper } from "../data/data_helper";
import { MethodStatus, UserInfo, PlatformInfo, SpotifyInfo } from "../interfaces/global";
import { Track } from "../interfaces/spotify";
import { RequestsHandler } from './requests_handler'

async function getAdminTrackInfo(platformInfo: PlatformInfo) {
    let trackInfo: Track = Object();
    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo: SpotifyInfo) => {
            await RequestsHandler.trackInfo(platformInfo, spotifyInfo)
                .then((status: MethodStatus) => {
                    trackInfo = status.data;
                })
                .catch((error: Error) => {
                    console.log(error);
                });
        }
    );
    return trackInfo ?? undefined;
}

export async function syncSession(platformInfo: any): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    await DataHelper.doesUserExist(platformInfo)
        .then(async (user: UserInfo) => {
            if (user?.exists) {
                if (user?.inSession) {
                    await DataHelper.doesSessionExist(platformInfo)
                        .then(async (res: MethodStatus) => {
                            if (user.sessionInfo?.id == res.data.sessionId) {
                                if (res.done) {
                                    let members: Array<string> = JSON.parse(
                                        res.data.members
                                    );
                                    let admin: string = res.data.createdBy;

                                    for (const member of members) {
                                        let platInfo = platformInfo;
                                        platInfo.type == 1
                                            ? (platInfo.discordUserId = member)
                                            : (platInfo.telegramUserId = member);
                                        await DataHelper.fetchSpotifyTokens(
                                            platInfo
                                        )
                                            .then(async (spotifyInfo: SpotifyInfo) => {
                                                await RequestsHandler.togglePlayback(
                                                    platInfo,
                                                    spotifyInfo,
                                                    2
                                                ).catch(() => {
                                                    status.done = false;
                                                    status.message =
                                                        "Unable to sync session";
                                                });
                                            })
                                            .catch(() => {
                                                status.done = false;
                                                status.message =
                                                    "Unable to sync session";
                                            });
                                    }

                                    let adminPlatInfo = platformInfo;
                                    adminPlatInfo.type == 1
                                        ? (adminPlatInfo.discordUserId = admin)
                                        : (adminPlatInfo.telegramUserId = admin);

                                    await getAdminTrackInfo(adminPlatInfo)
                                        .then(
                                            async (
                                                trackInfo: Track
                                            ) => {
                                                if (trackInfo != undefined) {
                                                    let position: number = trackInfo?.position as number;
                                                    for (const member of members) {
                                                        let platInfo = platformInfo;
                                                        platInfo.type == 1
                                                            ? (platInfo.discordUserId = member)
                                                            : (platInfo.telegramUserId = member);

                                                        await DataHelper.fetchSpotifyTokens(
                                                            platInfo
                                                        )
                                                            .then(
                                                                async (
                                                                    spotifyInfo: SpotifyInfo
                                                                ) => {
                                                                    await RequestsHandler.seek(
                                                                        platInfo,
                                                                        spotifyInfo,
                                                                        position
                                                                    );
                                                                    await RequestsHandler.togglePlayback(
                                                                        platInfo,
                                                                        spotifyInfo,
                                                                        1
                                                                    ).catch(
                                                                        () => {
                                                                            status.done = false;
                                                                            status.message =
                                                                                "Unable to sync session";
                                                                        }
                                                                    );
                                                                }
                                                            )
                                                            .catch(() => {
                                                                status.done = false;
                                                                status.message =
                                                                    "Unable to sync session";
                                                            });
                                                    }
                                                } else {
                                                    status.done = false;
                                                    status.message =
                                                        "Unable to sync session";
                                                }
                                            }
                                        )
                                        .catch((error) => {
                                            console.log(error);
                                            status.done = false;
                                            status.message =
                                                "Unable to sync session";
                                        });
                                }
                            } else {
                                status.done = false;
                                status.message =
                                    "You are enrolled in a different session.";
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            status.done = false;
                            status.message =
                                "No session exists in group/server";
                        });
                } else {
                    status.done = false;
                    status.message = "Please create or join a session first.";
                }
            } else {
                status.done = false;
                status.message = "Please register first.";
            }
        })
        .catch();
    return status;
}
