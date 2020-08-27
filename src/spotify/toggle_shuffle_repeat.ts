import { DataHelper } from "../data/data_helper";
import { PlatformInfo, MethodStatus, SpotifyInfo } from "../interfaces/global";
import { RequestsHandler } from "./requests_handler";
import { ShuffleRepeatState } from "../interfaces/spotify";


async function fetchAndQuery(
    platformInfo: PlatformInfo,
    toggleState: ShuffleRepeatState,
    requestType: number
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
    };
    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo: SpotifyInfo) => {
            await RequestsHandler.toggleShuffleRepeat(
                requestType,
                toggleState,
                spotifyInfo
            )
                .then(async (res: MethodStatus) => {
                    if (res.done) {
                        status = res;
                    } else {
                        status.done = false;
                    }
                })
                .catch((error: Error) =>
                    console.log(
                        `ERROR: toggleShuffle: Last catch block: ${error}`
                    )
                );
        }
    );
    return status;
}

export async function toggleShuffleRepeat(
    platformInfo: PlatformInfo,
    toggleState: ShuffleRepeatState,
    request_type: number
) {
    let status: MethodStatus = {
        done: false,
    };

    await DataHelper.doesSessionExist(platformInfo)
        .then(async (res: MethodStatus) => {
            console.log(res);
            if (res.done) {
                console.log(res);
                let members: string[] = JSON.parse(res.data.members);
                try {
                    for (const member of members) {
                        let platInfo: any = platformInfo;
                        platInfo.type == 1
                            ? (platInfo.discordUserId = member)
                            : (platInfo.telegramUserId = member);
                        await fetchAndQuery(
                            platInfo,
                            toggleState,
                            request_type
                        ).catch((error) => console.log(error));
                    }
                    status.done = true;
                    status.message =
                        request_type == 1
                            ? "Shuffled playback for this session"
                            : "Put playback on repeat for the session.";
                } catch (err) {
                    if (err) status.done = false;
                    status.message =
                        request_type == 1
                            ? `Unable to shuffle playback for session`
                            : "Unable to put playback on repeat for session";
                }
            } else {
                await fetchAndQuery(platformInfo, toggleState, request_type)
                    .then((_res: any) => {
                        if (_res == true) {
                            status.done = true;
                            status.message =
                                request_type == 1
                                    ? `Shuffled playback`
                                    : `Put playback on repeat`;
                        } else {
                            status.done = false;
                            status.message =
                                request_type == 1
                                    ? "Unable to shuffle playback"
                                    : "Unable to put playback on repeat.";
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message =
                            request_type == 1
                                ? "Unable to shuffle playback."
                                : "Unable to put playback on repeat.";
                    });
            }
        })
        .catch((error) => {
            console.log(error);
            status.done = false;
            status.message = `Unable to pause`;
        });
    return status;
}
