import { DataHelper } from "../data/data_helper";
import { MethodStatus, UserInfo, SpotifyInfo } from "../interfaces/global";
import { trackLinkValidator } from "../helpers/spotify_link_validator";
import { getPlaylistOrAlbumItems } from "./playlist_helper";
import { RequestsHandler } from "./requests_handler";
 
async function playTrack() {


    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
            let access_token: string = spotifyInfo.spotifyAccessToken;

            await toggleShuffleRepeatRequest(1, { toggleState: false }, spotifyInfo)
                .then(async () => {

}
export async function playOrAddToQueue(
    platformInfo: any,
    songLink: string[]
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };
    let successful_play_session: string = "Playing song for the session";
    let successful_queue_session: string =
        "Added song to queue for the session";
    let unsuccessful_play_session: string;
    let unsuccessful_queue_session: string =
        "Unable to add song to queue for the session";
    let start_session: string = "Please start a session first";
    let register: string = "Please register first.";

    const rawUris: string[] = trackLinkValidator(songLink).data.uris;
    const trackUris: string[] = rawUris.filter(
        (e) => !e.includes("album") && !e.includes("playlist")
    );
    const playlistAndAlbumUris: string[] = rawUris.filter(
        (e) => e.includes("album") || e.includes("playlist")
    );
    let uris: string[] = trackUris;

    await DataHelper.doesUserExist(platformInfo)
        .then(async (user?: UserInfo) => {
            if (user?.exists) {
                await DataHelper.doesSessionExist(platformInfo)
                    .then(async (res: MethodStatus) => {
                        if (res.done) {
                            let members: string[] = JSON.parse(
                                res.data.members
                            );
                            try {
                                for (const member of members) {
                                    let platInfo = platformInfo;
                                    platInfo.type == 1
                                        ? (platInfo.discordUserId = member)
                                        : (platInfo.telegramUserId = member);
                                    if (playlistAndAlbumUris.length >= 1) {
                                        await getPlaylistOrAlbumItems(
                                            platformInfo,
                                            playlistAndAlbumUris
                                        ).then((_res: MethodStatus) => {
                                            if (_res.data.length >= 1) {
                                                _res.data.forEach(
                                                    (track: string) => {
                                                        uris.push(track);
                                                    }
                                                );
                                            }
                                        });
                                    }
                                    if (res.data.playInstant) {
                                        await RequestsHandler.playTrack(platInfo, uris)
                                            .then((_res: boolean) => {
                                                status.done = _res;
                                                status.message = successful_play_session;
                                            })
                                            .catch((error: string) => {
                                                console.log(error);
                                                status.done = false;
                                                status.message = unsuccessful_play_session;
                                            });

                                        await DataHelper.updatePlayInstantStatus(
                                            platformInfo
                                        ).catch((error: string) =>
                                            console.log(
                                                "ERROR: addToSessionQueue: " +
                                                error
                                            )
                                        );
                                    } else {
                                        for (const uri of uris) {
                                            await RequestsHandler.queue(platInfo, uri)
                                                .then((_res: boolean) => {
                                                    status.done = _res;
                                                    status.message = successful_queue_session;
                                                })
                                                .catch((error: string) => {
                                                    console.log("ERROR", error);
                                                    status.done = false;
                                                    status.message = unsuccessful_queue_session;
                                                });
                                        }
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                                status.done = false;
                                status.message =
                                    "Unable to play requested track";
                            }
                        } else {
                            status.done = false;
                            status.message = "Please create a session first";
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message = start_session;
                    });
            } else {
                status.done = false;
                status.message = register;
            }
        })
        .catch(() => {
            status.done = false;
            status.message = register;
        });
    return status;
}
