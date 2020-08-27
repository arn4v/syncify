import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import { PlatformInfo, MethodStatus, SpotifyInfo } from "../interfaces/global";

export async function toggleShuffleRepeatRequest(
    requestType: number,
    toggleState: boolean | string,
    spotifyInfo: SpotifyInfo
) {
    let requestUrl: string =
        requestType == 1
            ? endpoints.shuffle_playback.url
            : endpoints.repeat_playback.url;

    let status: MethodStatus = {
        done: undefined,
        rawData: undefined,
    };

    await axios({
        method: "put",
        url: requestUrl,
        headers: {
            Authorization: `Bearer ${spotifyInfo.spotifyAccessToken}`,
        },
        params: { state: toggleState },
    })
        .then(async (res: any) => {
            if (res.status == (200 || 201 || 204)) {
                status.done = true;
                status.rawData = res.data;
            } else if (res.status == (400 || 401)) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        await axios({
                            method: "put",
                            url: requestUrl,
                            headers: {
                                Authorization: `Bearer ${newAccessToken}`,
                            },
                            params: { state: toggleState },
                        })
                            .then(async (_res: any) => {
                                if (_res.status == (200 || 201)) {
                                    status.done = true;
                                    status.rawData = _res.data;
                                } else {
                                    status.done = false;
                                    status.rawData = _res.data;
                                }
                            })
                            .catch((error: Error) => {
                                status.done = false;
                                status.error = error;
                                console.log(
                                    `ERROR: toggleShuffle: axiosFunc: Catch Block ${error}`
                                );
                            });
                    }
                );
            } else {
                status.done = true;
            }
        })
        .catch((error) => {
            status.done = false;
            status.error = error;
            console.log(`ERROR: toggleShuffle: ${error}`);
        });
    return status;
}

async function fetchAndQuery(
    platformInfo: PlatformInfo,
    toggleState: boolean | string,
    requestType: number
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
    };
    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo: SpotifyInfo) => {
            await toggleShuffleRepeatRequest(
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
    toggleState: boolean | string,
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
