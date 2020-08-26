import { DataHelper } from "../../../data/data_helper";
import { MethodStatus } from "../../../interfaces/global";

module.exports = {
    name: "join",
    description: "Create session",
    async execute(message: any, args: any) {
        const platformInfo = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };
        await DataHelper.joinSession(platformInfo)
            .then((res: MethodStatus) => {
                message.reply(res.message).catch(console.error);
            })
            .catch(console.error);
    },
};
