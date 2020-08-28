import { DataHelper } from "../data/data_helper";
import {
    PlatformInfo,
    MethodStatus,
    SpotifyInfo,
    UserInfo,
} from "../interfaces/global";
import { RequestsHandler } from "./requests_handler";
import { ShuffleRepeatState, RequestStatus } from "../interfaces/spotify";

async function fetchAndQuery(
    platformInfo: PlatformInfo,
    toggleState: ShuffleRepeatState,
    requestType: number
): Promise<boolean> {
    let done: boolean = false;
    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo: SpotifyInfo) => {
            await RequestsHandler.toggleShuffleRepeat(
                requestType,
                toggleState,
                spotifyInfo
            )
                .then(async (res: RequestStatus) => {
                    done = res.successfull;
                })
                .catch((error: Error) =>
                    console.log(
                        `ERROR: toggleShuffle: Last catch block: ${error}`
                    )
                );
        }
    );
    return done;
}

export async function toggleShuffleRepeat(
    platformInfo: PlatformInfo,
    toggleState: ShuffleRepeatState,
    requestType: number
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: false,
        message: undefined,
    };

    await DataHelper.doesUserExist(platformInfo).then(
        async (user: UserInfo) => {
            if (user.exists) {
                if (user.inSession) {
                    await DataHelper.doesSessionExist(platformInfo)
                        .then(async (res: MethodStatus) => {
                            if (res.done) {
                                if (
                                    user.sessionInfo &&
                                    user.sessionInfo.id == res.data.sessionId
                                ) {
                                    let members: string[] = JSON.parse(
                                        res.data.members
                                    );
                                    try {
                                        for (const member of members) {
                                            let platInfo: any = platformInfo;
                                            platInfo.type == 1
                                                ? (platInfo.discordUserId = member)
                                                : (platInfo.telegramUserId = member);
                                            await fetchAndQuery(
                                                platInfo,
                                                toggleState,
                                                requestType
                                            ).catch((error) =>
                                                console.log(error)
                                            );
                                        }
                                        status.done = true;
                                        status.message =
                                            requestType == 1
                                                ? "Shuffled playback for this session"
                                                : "Put playback on repeat for the session.";
                                    } catch (err) {
                                        if (err) status.done = false;
                                        status.message =
                                            requestType == 1
                                                ? `Unable to shuffle playback for session`
                                                : "Unable to put playback on repeat for session";
                                    }
                                } else {
                                    status.done = false;
                                    status.message =
                                        "You're enrolled in a different session, please use the leave command to leave the session";
                                }
                            } else {
                                status.done = false;
                                status.message =
                                    "Please start a session first.";
                            }
                        })
                        .catch((error: Error) => {
                            console.log(error);
                            status.done = false;
                            status.message = `Unable to pause`;
                        });
                } else {
                    status.done = false;
                    status.message = "Please start/join a session first.";
                }
            } else {
                status.done = false;
                status.message = "Please register first.";
            }
        }
    );
    return status;
}
