import firebase from "firebase";
import querystring from "querystring";
import request from "request";
import { Router } from "@feathersjs/express";

const router: any = Router();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
};
firebase.initializeApp(firebaseConfig);

var client_id: string | undefined = process.env.SPOTIFY_CLIENT_ID;
var client_secret: string | undefined = process.env.SPOTIFY_CLIENT_SECRET;

var stateKey = "spotify_auth_state";
var discordConfig = {
    discordServerID: undefined,
    discordUserID: undefined,
};

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString(length: number): string {
    var text: string = "";
    var possible: string =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i: number = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

router.get("/auth", function (req: any, res: any) {
    var redirect_uri = req.protocol + "://" + req.get("host") + "/callback";

    // register discord origin
    discordConfig.discordServerID = req.query.client_id;
    discordConfig.discordUserID = req.query.user_id;

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    var scope = [
        "router.remote-control",
        "streaming",
        "user-read-currently-playing",
        "user-modify-playback-state",
        "user-read-playback-state",
    ].join(" ");

    var authQParams = {
        response_type: "code",
        client_id,
        scope,
        redirect_uri,
        state,
    };
    res.redirect(
        `https://accounts.spotify.com/authorize?${querystring.stringify(
            authQParams
        )}`
    );
});

router.get("/callback", function (req: any, res: any) {
    var code: string = req.query.code || null;
    var state: string = req.query.state || null;
    var storedState: any = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect("/#" + querystring.stringify({ error: "state_mismatch" }));
    } else {
        res.clearCookie(stateKey);
        var redirect_uri: string =
            req.protocol + "://" + req.get("host") + "/callback";
        var authOptions: any = {
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
                var access_token = body.access_token;
                var refresh_token = body.refresh_token;

                const { discordServerID, discordUserID } = discordConfig;

                if (discordServerID && discordUserID) {
                    var loc = `${discordServerID}/${discordUserID}`;
                    firebase.database().ref(loc).update({
                        spotify_access_token: access_token,
                        spotify_refresh_token: refresh_token,
                    });
                }

                res.redirect(
                    "/#" +
                        querystring.stringify({ access_token, refresh_token })
                );
            } else {
                res.redirect(
                    "/#" + querystring.stringify({ error: "invalid_token" })
                );
            }
        });
    }
});

export default router;
