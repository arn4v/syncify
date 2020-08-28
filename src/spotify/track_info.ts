import { DataHelper } from "../data/data_helper";
import { MethodStatus } from "../interfaces/global";
import { RequestStatus } from "../interfaces/spotify";
import { RequestsHandler } from "./requests_handler";

async function fetchAndRequest(platformInfo: any): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
        data: undefined,
        rawData: undefined,
    };

    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo) => {
            await RequestsHandler.trackInfo(spotifyInfo)
                .then((res: RequestStatus) => {
                    if (res.successfull) {
                        status.done = res.successfull;
                        if (res.trackInfo !== undefined)
                            status.data = res.trackInfo;
                    } else {
                        status.done = false;
                    }
                })
                .catch(() => (status.done = false));
        })
        .catch(() => {
            status.done = false;
        });
    return status;
}

export async function getTrackInfo(platformInfo: any): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: false,
        data: undefined,
    };

    await DataHelper.doesSessionExist(platformInfo)
        .then(async (res: MethodStatus) => {
            if (res.done) {
                let admin: string = res.data.createdBy;
                let platInfo = platformInfo;
                platInfo.type == 1
                    ? (platInfo.discordUserId = admin)
                    : (platInfo.telegramUserId = admin);

                try {
                    let platInfo = platformInfo;
                    platInfo.type == 1
                        ? (platInfo.discordUserId = admin)
                        : (platInfo.telegramUserId = admin);
                    await fetchAndRequest(platInfo)
                        .then((_res: MethodStatus) => {
                            if (_res.done && _res.data !== undefined) {
                                status.data = _res.data;
                                status.done = true;
                            } else {
                                status.message =
                                    "An error occured while trying to query Spotify.";
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            status.done = false;
                            status.message = `Unable to pause for all session members`;
                        });
                } catch {
                    status.done = false;
                    status.message = `Unable to pause for all session members`;
                }
            } else {
                status.done = false;
                status.message = "Please start a session first.";
            }
        })
        .catch((error) => {
            console.log(error);
            status.done = false;
            status.message = `Unable to pause`;
        });

    return status;
}
