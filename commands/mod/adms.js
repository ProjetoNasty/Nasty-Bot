const { PermissionsBitField } = require("discord.js")
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'adms',
    description: "Listar todos os adm's do servidor",

    run: async (client, message, args) => {
        
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        const adms = message.guild.members.cache.filter((member) => !member.user.bot && member.permissions.has(PermissionsBitField.Flags.Administrator)).map(u => u.user).join(" **|** ");

        message.channel.send({ content: `${adms}` });

    }
}