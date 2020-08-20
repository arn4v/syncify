export default function checkEnv() {
    if (
        process.env.DATABASE_TYPE == "1" ||
        process.env.DATABASE_TYPE == undefined
    ) {
        if (
            process.env.FIREBASE_API_KEY == undefined ||
            process.env.FIREBASE_DATABASE_URL == undefined
        ) {
            console.log(
                "Add FIREBASE_API_KEY and FIREBASE_DATABASE_URL to your .env / environment variables"
            );
            process.exit(1);
        }
    }

    if (
        process.env.SPOTIFY_CLIENT_ID == undefined ||
        process.env.SPOTIFY_CLIENT_SECRET == undefined
    ) {
        console.log(
            "Add your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env / environment variables"
        );
        process.exit(1);
    }

    if (
        process.env.DISCORD_BOT != undefined ||
        process.env.DISCORD_BOT == "true"
    ) {
        if (
            process.env.DISCORD_BOT_PREFIX == undefined ||
            process.env.DISCORD_BOT_TOKEN == undefined
        ) {
            sys.exit(
                "Add DISCORD_BOT_TOKEN and DISCORD_BOT_PREFIX to your .env / environment variables"
            );
        }
    }

    if (
        process.env.TELEGRAM_BOT != undefined ||
        process.env.TELEGRAM_BOT == "true"
    ) {
        if (process.env.TELEGRAM_BOT_TOKEN == undefined) {
            sys.exit(
                "Add TELEGRAM_BOT_TOKEN to your .env / environment variables"
            );
        }
    }
}
