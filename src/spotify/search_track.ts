import axios from "axios";
import { endpoints } from "./endpoints";
import { DataHelper } from "../data/data_helper";
import { refreshAccessToken } from "./refresh_access_token";

async function searchSpotify(platformInfo: any, query: string) {
    let userId: string | undefined =
        platformInfo.type == 1
            ? platformInfo.discordUserId
            : platformInfo.telegramUserId;
    let queryFunc = async (access_token: string) => {
        let result;
        await axios({
            method: "get",
            url: endpoints.search.url,
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            params: {
                q: query,
                type: "track",
            },
        })
            .then((res) => {
                result = res;
            })
            .catch((error) => (result = error.response));
        return result;
    };

    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo: any) => {
            if (typeof spotifyInfo != "undefined") {
                await queryFunc(spotifyInfo?.spotifyAccessToken)
                    .then(async (res: any) => {
                        if (res.status == (200 || 201)) {
                        } else {
                            await refreshAccessToken(
                                spotifyInfo?.spotifyRefreshToken
                            ).then(async (new_access_token) => {
                                await queryFunc(new_access_token)
                                    .then(async (_res) => {})
                                    .catch((_error) => {});
                            });
                        }
                    })
                    .catch(async (error) => {
                        console.log(`ERROR: searchSpotify QueryFunc: ${error}`);
                    });
            }
        }
    );
}
