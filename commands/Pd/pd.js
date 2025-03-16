const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: "pd",
    category: "Ver suas damas",
    description: "",
    run: async (client, message, args) => {

        let dataBase = await db.get(`pd_${message.author.id}.pd`);
        if (!dataBase || dataBase.length == 0) return;

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#ffffff';
        
        let cargosPd = await db.get(`sistemaPD_${message.guild.id}.cargospd`);
        if (!cargosPd || cargosPd.length == 0) return;

        let cargosAutorizados = await cargosPd.map(x => x.cargoId);

        if (!message.member.roles.cache.some(r => cargosAutorizados.includes(r.id))) {

            const semperm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem permissão para ver damas!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [semperm] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })

        }

        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `Pds - ${message.guild.name}`, iconURL: `https://cdn.discordapp.com/emojis/1067880374073573407` })
            .setTitle(`Damas de ${message.author.username}`)
            .addFields(

                { name: `${client.xx.anel} Damas`, value: `${(await db.get(`pd_${message.author.id}`)).listapds.join('\n')}`, inline: true }
            )
            .setThumbnail(message.author.avatarURL({ dynamic: true }))
            .setColor(`${colorNB}`)

        message.channel.send({ embeds: [embed] }).then((msg) => {

            setTimeout(() => msg.delete(), 7000);
        })
    }
}