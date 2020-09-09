import { DataHelper } from "../../../data/data_helper";
import { PlatformInfo, UserInfo } from "../../../interfaces";

module.exports = {
    name: "info",
    description: "Create session",
    async execute(message: any, args: any) {
        const platformInfo: PlatformInfo = {
            type: 1,
            discordUserId: message.member.id,
            discordServerId: message.guild.id,
        };

        await DataHelper.doesUserExist(platformInfo).then((user: UserInfo) => {
            let response: string;
            if (user.exists && user.inSession) {
                response = `\n**SessionInfo**:\nid: ${user.sessionInfo?.id}\n\n**User info**:\nid: ${message.member.id}\nserver_id: ${message.guild.id}`;
            } else if (user.exists) {
                response = `\n**User info**:\nid: ${message.member.id}\nserver_id: ${message.guild.id}`;
            } else {
                response = `Please register first.`;
            }
            message.reply(response);
        });
    },
};
