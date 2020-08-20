import DataHelper from "../../data/data_helper";

module.exports = {
    name: "joinsession",
    description: "Create session",
    async execute(message: any, args: any) {
        const platformInfo = {
            type: 1,
            discordServerId: message.guild.id,
            userId: message.member.id,
        };
        await DataHelper.joinSession(platformInfo)
            .then((res) => {
                message.reply(res);
            })
            .catch(console.error);
    },
};
