import DataHelper from "../../data/data_helper";

module.exports = {
    name: "createsession",
    description: "Create session",
    async execute(message: any, args: any) {
        const platformInfo = {
            type: 1,
            discordServerId: message.guild.id,
            userId: message.member.id,
        };

        await DataHelper.createSession(platformInfo)
            .then((res) => {
                message.reply(res).catch(console.error);
            })
            .catch(() =>
                console.log("ERROR: discord/commands/createsession.ts")
            );
    },
};
