import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { MethodStatus, UserInfo } from "../interfaces/global";
import { RequestsHandler } from "./requests_handler";

export async function nextPreviousTrack(
    platformInfo: any,
    requestType: number
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    await DataHelper.doesUserExist(platformInfo)
        .then(async (user: UserInfo) => {
            if (user.exists && user.inSession) {
                await DataHelper.doesSessionExist(platformInfo)
                    .then(async (_res: MethodStatus) => {
                        if (_res.done) {
                            let members: string[] = JSON.parse(
                                _res.data.members
                            );
                            try {
                                for (const member of members) {
                                    let platInfo = platformInfo;
                                    platInfo.type == 1
                                        ? (platInfo.discordUserId = member)
                                        : (platInfo.telegramUserId = member);
                                    await RequestsHandler.nextPreviousTrack(
                                        platInfo,
                                        requestType
                                    )
                                        .then(() => {
                                            status.done = true;
                                            status.message =
                                                requestType == 1
                                                    ? "Skipped to next track for the session"
                                                    : "Went back to previous track for the session";
                                        })
                                        .catch((error) => console.log(error));
                                }
                            } catch (err) {
                                if (err) status.done = false;
                                status.message =
                                    "Unable to skip track for the session";
                            }
                        } else {
                            await RequestsHandler.nextPreviousTrack(
                                platformInfo,
                                requestType
                            )
                                .then((__res: MethodStatus) => {
                                    if (__res.done == true) {
                                        status.done = true;
                                        status.message =
                                            requestType == 1
                                                ? "Skipped to next track."
                                                : "Going back to previous track.";
                                    } else {
                                        status.done = false;
                                        status.message =
                                            "Unable to skip/go back track.";
                                    }
                                })
                                .catch((error) => {
                                    console.log(error);
                                    status.done = false;
                                    status.message =
                                        "Unable to skip/go back track.";
                                });
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
