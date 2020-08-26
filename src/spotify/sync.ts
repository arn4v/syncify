import { DataHelper } from "../data/data_helper";
import { togglePlaybackRequest } from "./toggle_playback";
import { trackInfoRequest } from "./track_info";
import { MethodStatus } from "../types/status";
import { Track } from "../types/track";
import { seekRequest } from "./seek";

async function getAdminTrackInfo(platformInfo: any) {
    let trackInfo: Track;
    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo: any) => {
            await trackInfoRequest(platformInfo, spotifyInfo)
                .then((status: MethodStatus) => {
                    trackInfo = status.data;
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    );
    // @ts-ignore
    return trackInfo ?? undefined;
}

export async function syncSession(platformInfo: any): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    await DataHelper.doesSessionExist(platformInfo)
        .then(async (res: MethodStatus) => {
            if (res.done) {
                let members: Array<string> = JSON.parse(res.data.members);
                let admin: string = res.data.createdBy;

                for (const member of members) {
                    let platInfo = platformInfo;
                    platInfo.type == 1
                        ? (platInfo.discordUserId = member)
                        : (platInfo.telegramUserId = member);
                    await DataHelper.fetchSpotifyTokens(platInfo)
                        .then(async (spotifyInfo: any) => {
                            await togglePlaybackRequest(
                                platInfo,
                                spotifyInfo,
                                2
                            ).catch(() => {
                                status.done = false;
                                status.message = "Unable to sync session";
                            });
                        })
                        .catch(() => {
                            status.done = false;
                            status.message = "Unable to sync session";
                        });
                }

                let adminPlatInfo = platformInfo;
                adminPlatInfo.type == 1
                    ? (adminPlatInfo.discordUserId = admin)
                    : (adminPlatInfo.telegramUserId = admin);

                await getAdminTrackInfo(adminPlatInfo)
                    .then(async (trackInfo: Track | undefined) => {
                        if (trackInfo != undefined) {
                            let position: number | undefined =
                                trackInfo.position;
                            for (const member of members) {
                                let platInfo = platformInfo;
                                platInfo.type == 1
                                    ? (platInfo.discordUserId = member)
                                    : (platInfo.telegramUserId = member);

                                await DataHelper.fetchSpotifyTokens(platInfo)
                                    .then(async (spotifyInfo: any) => {
                                        await seekRequest(
                                            platInfo,
                                            spotifyInfo,
                                            position
                                        );
                                        await togglePlaybackRequest(
                                            platInfo,
                                            spotifyInfo,
                                            1
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
                        } else {
                            status.done = false;
                            status.message = "Unable to sync session";
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message = "Unable to sync session";
                    });
            }
        })
        .catch((error) => {
            console.log(error);
            status.done = false;
            status.message = "No session exists in group/server";
        });
    return status;
}
