import axios from 'axios';
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";

export async function getActiveDevices(platformInfo: object) {
    let request_url = endpoints.active_devices.url;
    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo: object) => {
            await axios({
                method: "get",
                url: request_url,
                headers: {
                    // @ts-ignore
                    Authorization: `Bearer ${spotifyInfo.spotifyAccessToken}`,
                },
            }).then((res: any) => {
                console.log(res.data);
            });
        }
    );
}
