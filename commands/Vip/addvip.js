
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'addvip',
    description: "Adicionar a tag personalizada em um membro",
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

        let cargoVipDb = await db.get(`Rcar_${message.guild.id}_${message.author.id}`);
        if (!cargoVipDb) return

        let limite = await db.get(`limitevip_${message.guild.id}_${message.author.id}`)

        let limiteVip = new Discord.EmbedBuilder()
            .setDescription(`${message.author}, você atingiu o limite de amigos!`)
            .setColor(`${colorNB}`)

        if (limite == 0) {

            return message.channel.send({ embeds: [limiteVip] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })
        }

        let princ = new Discord.EmbedBuilder()
            .setAuthor({ name: 'VIP Adicionado!', iconURL: message.author.avatarURL({ dynamic: true }) })
            .setDescription(`**Cargo**: <@&${cargoVipDb}>\n **Membro**: ${membro}`)
            .setColor(`${colorNB}`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setTimestamp()

        message.channel.send({ embeds: [princ] }).then((msg) => {

            setTimeout(() => msg.delete(), 7000);
        });

        await membro.roles.add(cargoVipDb);
        await db.sub(`limitevip_${message.guild.id}_${message.author.id}`, 1);

    }

}