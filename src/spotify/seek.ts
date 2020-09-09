import { DataHelper } from "../data/data_helper";
import {
    MethodStatus,
    PlatformInfo,
    SpotifyInfo,
    UserInfo,
    RequestStatus,
} from "../interfaces";
import { RequestsHandler } from "./requests_handler";

// This function serves to fetch spotify access/refresh token for
// seekRequestFunc to use to carry out the call to the Spotify
// Web API
async function fetchAndRequest(
    platformInfo: PlatformInfo,
    position_ms: number
): Promise<boolean> {
    let done: boolean = false;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
            await RequestsHandler.seek(spotifyInfo, position_ms)
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

export async function seek(request_type: number, platformInfo: any) {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };
    let unsuccessful = "Unable to seek to position";
    let successfull = "Succesfully seeked to position";

    await DataHelper.doesUserExist(platformInfo)
        .then(async (user?: UserInfo) => {
            let doesSessionExist: MethodStatus = await DataHelper.doesSessionExist(
                platformInfo
            );

            return { userInfo: user, sessionInfo: doesSessionExist };
        })
        .then(async (res: any) => {
            const doesSessionExist: MethodStatus = res.sessionInfo;
            const sessionInfo = doesSessionExist.data;
            const user: UserInfo = res.userInfo;

            if (user.exists) {
                if (doesSessionExist.done) {
                    if (user.inSession) {
                        if (user?.sessionInfo?.id === sessionInfo?.id) {
                            let members: string[] =
                                JSON.parse(sessionInfo.members) ?? [];
                            if (members.length >= 1) {
                                if (sessionInfo.members != undefined) {
                                    try {
                                        for (const member of members) {
                                            let platInfo = platformInfo;
                                            platInfo.type == 1
                                                ? (platInfo.discordUserId = member)
                                                : (platInfo.telegramUserId = member);
                                            await fetchAndRequest(
                                                platInfo,
                                                request_type
                                            ).catch((error) =>
                                                console.log(error)
                                            );
                                        }
                                        status.done = true;
                                        status.message = successfull;
                                    } catch {
                                        status.done = false;
                                        status.message = unsuccessful;
                                    }
                                }
                            }
                        } else {
                            status.done = false;
                            status.message =
                                "You are in a different session, please use the leave command to leave it.";
                        }
                    } else {
                        status.done = false;
                        status.message = "Please join the session first.";
                    }
                } else {
                    status.done = false;
                    status.message = "Please create a session first.";
                }
            } else {
                status.done = false;
                status.message =
                    "Unable to find you in database, please register first.";
            }
        })
        .catch(() => {
            status.done = false;
            status.message = "Unable to execute function.";
        });
    return status;
}
