
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'removevipc',
    description: "Remover membro do canal vip",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let membro = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!membro) {

            const nomembro = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, por favor mencione alguém.`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [nomembro] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })
        }

        let canalVipDb = await db.get(`cal_${message.guild.id}_${message.author.id}`);

        const canal = message.guild.channels.cache.get(canalVipDb);
        if (!canal) return;

        canal.permissionOverwrites.edit([{

            id: membro.id,

            null: [

                Discord.PermissionFlagsBits.ViewChannel,
                Discord.PermissionFlagsBits.Connect
            ],
        }
        ]);

        let princ = new Discord.EmbedBuilder()
            .setAuthor({ name: 'Permissão Adicionada!', iconURL: message.author.avatarURL({ dynamic: true }) })
            .setDescription(`**Canal**: ${canal}\n **Membro**: ${membro}`)
            .setColor(`${colorNB}`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setTimestamp()

        message.channel.send({ embeds: [princ] }).then((msg) => {

            setTimeout(() => msg.delete(), 7000);
        });

    }

}