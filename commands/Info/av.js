const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'av',
    description: "Avatar",
    run: async (client, message, args) => {
        
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        const m = message.mentions.users.first() ||
            client.users.cache.get(args[0]) ||
            message.author;

        let member = await message.guild.members.fetch(m.id);

        let AvatarPorBalah = m.displayAvatarURL({ dynamic: true, extension: 'png', size: 4096 })
        let SavatarPorBalah = member.displayAvatarURL({ dynamic: true, extension: 'png', size: 4096 }) //Avatar do servidor.

        let Avatar

        if (SavatarPorBalah) {

            Avatar = SavatarPorBalah

        } else {

            Avatar = AvatarPorBalah
        }

        let todoscargos = member.roles.cache.sort((a, b) => b.position - a.position)
        const id = todoscargos.filter(cargo => cargo.iconURL()).map(cargo => cargo.name);
        let idzada = id.slice(0, 1);

        let cargo = message.guild.roles.cache.find(role => role.name === `${idzada}`);

        let icon;
        let color;

        if (cargo) {

            icon = cargo.iconURL();
            color = cargo.color;

        } else {

            icon = `https://cdn.discordapp.com/attachments/857366599072874536/861296479561973780/3kmx0L9.png`
            color = '#191918';
        }

        let embedAv = new Discord.EmbedBuilder()
            .setAuthor({ name: `${m.username}`, iconURL: `${icon}` })
            .setImage(Avatar)
            .setColor(color)

        message.channel.send({ embeds: [embedAv] });
    }
}