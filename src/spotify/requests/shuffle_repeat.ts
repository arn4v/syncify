import axios from 'axios'
import { ShuffleRepeatState } from '../../interfaces/spotify';
import { SpotifyInfo, MethodStatus } from "../../interfaces/global";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";

export async function toggleShuffleRepeatRequest(
    requestType: number,
    state: ShuffleRepeatState,
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
        params: { state: state.toggleState },
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
                            params: { state: state.toggleState },
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
