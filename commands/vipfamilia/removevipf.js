const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'removevipf',
    description: "Remove a tag personalizada em um membro",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let membro = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!membro) return;

        let cargoVipDb = await db.get(`vipfml_${message.guild.id}_${message.author.id}`);
        let cargo = message.guild.roles.cache.get(cargoVipDb);
        if (!cargo) return;

        let princ = new Discord.EmbedBuilder()
            .setAuthor({ name: 'Cargo família removido!', iconURL: message.author.avatarURL({ dynamic: true }) })
            .setDescription(`**Cargo**: ${cargo}\n **Membro**: ${membro}`)
            .setColor(cargo.color)
            .setThumbnail(cargo.iconURL({ dynamic: true }))
            .setTimestamp()

        message.channel.send({ embeds: [princ] }).then((msg) => {

            setTimeout(() => msg.delete(), 7000);
        });

        await membro.roles.remove(cargo);


    }

}