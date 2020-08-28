import { DataHelper } from "./data/data_helper";
import qs from "qs";
import request from "request";
import { Router } from "express";

const router: any = Router();

let client_id: string = process.env.SPOTIFY_CLIENT_ID as string;
let client_secret: string = process.env.SPOTIFY_CLIENT_SECRET as string;

let stateKey: string = "spotify_auth_state";
let discordConfig: any = {
    discordServerID: undefined,
    discordUserID: undefined,
};

/**
 * generateRandomString.
 *
 * @param {number} length
 * @returns {string}
 */
function generateRandomString(length: number): string {
    let text: string = "";
    let possible: string =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i: number = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

router.get("/auth", function (req: any, res: any) {
    let redirect_uri = req.protocol + "://" + req.get("host") + "/callback";

    // register discord origin
    discordConfig.discordServerID = req.query.client_id;
    discordConfig.discordUserID = req.query.user_id;

    let state: string = generateRandomString(16);
    res.cookie(stateKey, state);

    var scope = [
        "app-remote-control",
        "streaming",
        "user-read-currently-playing",
        "user-modify-playback-state",
        "user-read-playback-state",
    ].join(" ");

    let authQParams = {
        response_type: "code",
        client_id,
        scope,
        redirect_uri,
        state,
    };

    res.redirect(
        `https://accounts.spotify.com/authorize?${qs.stringify(authQParams)}`
    );
});

router.get("/callback", function (req: any, res: any) {
    let code: string = req.query.code || null;
    let state: string = req.query.state || null;
    let storedState: any = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect("/#" + qs.stringify({ error: "state_mismatch" }));
    } else {
        res.clearCookie(stateKey);
        let redirect_uri: string =
            req.protocol + "://" + req.get("host") + "/callback";
        let authOptions: any = {
            url: "https://accounts.spotify.com/api/token",
            form: { code, redirect_uri, grant_type: "authorization_code" },
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(client_id + ":" + client_secret).toString(
                        "base64"
                    ),
            },
            json: true,
        };

        request.post(authOptions, function (
            error: any,
            response: any,
            body: any
        ) {
            if (!error && response.statusCode === 200) {
                let access_token = body.access_token;
                let refresh_token = body.refresh_token;

                const discordUserID = discordConfig.discordUserID;

                if (discordUserID) {
                    DataHelper.addUser(access_token, refresh_token, {
                        type: 1,
                        discordUserId: discordUserID,
                    });
                }
                res.redirect(
                    "/#" +
                        qs.stringify({ access_token, refresh_token })
                );
            } else {
                res.redirect(
                    "/#" + qs.stringify({ error: "invalid_token" })
                );
            }
        });
    }
});

export default router;
