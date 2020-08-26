import { DataHelper } from "../../../data/data_helper";
import { MethodStatus } from "../../../types/status";

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
            .then((res: MethodStatus) => {
                message.reply(res.message).catch(console.error);
            })
            .catch(() =>
                console.log("ERROR: discord/commands/createsession.ts")
            );
    },
};
