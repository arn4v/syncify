import { DataHelper } from "../../../data/data_helper";

module.exports = {
    name: "create",
    description: "Create session",
    async execute(message: any, args: any) {
        const platformInfo = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await DataHelper.createSession(platformInfo)
            .then((res: any) => {
                message.reply(res).catch(console.error);
            })
            .catch(() =>
                console.log("ERROR: discord/commands/createsession.ts")
            );
    },
};
