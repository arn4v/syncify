import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { MethodStatus } from "../interfaces/global";
import { Track, Artist } from '../interfaces/spotify'
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
            await RequestsHandler.trackInfo(platformInfo, spotifyInfo)
                .then((res: any) => {
                    if (res.done) {
                        status = res;
                    } else {
                        status = res;
                    }
                })
                .catch(() => (status.done = false));
        })
        .catch(() => {
            status.done = false;
        });
    return status;
}

export async function getTrackInfo(platformInfo: any) {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
        data: undefined,
        rawData: undefined,
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
                        .then((res: MethodStatus) => {
                            status.data = res.data;
                            status.rawData = res.rawData;
                            status.done = true;
                            status.message =
                                `Currently playing [${res.data?.name}](${res.data?.link}) by ` +
                                res.data?.artists
                                    .map((artist: Artist) => {
                                        `[${artist.name}](${artist.link})`;
                                    })
                                    .join(", ");
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
                status.message = "Please fetch";
            }
        })
        .catch((error) => {
            console.log(error);
            status.done = false;
            status.message = `Unable to pause`;
        });

    return status;
}
