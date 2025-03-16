
const Discord = require('discord.js');
const { PermissionsBitField } = require("discord.js")
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'bots',
    description: '',
    run: async (client, message, args) => {

        
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#0032ed';

        let bots = await db.get(`cargobotNB_${message.guild.id}`);
        if (!bots) return console.log('sem bots');
        
        let cargosBot = [`${bots}`];

        let d = message.guild.members.cache.filter((member) => member.roles.cache.some(r => cargosBot.includes(r.id)) && !member.voice.channel).map(u => `<@${u.user.id}>`).join('\n');
  
      if (!d) d = `ㅤ`;
  
      let i = message.guild.members.cache.filter((member) => member.roles.cache.some(r => cargosBot.includes(r.id)) && member.voice.channel).map(u => `<@${u.user.id}>`).join('\n');
  
      if (!i) i = `ㅤ`;

        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${message.guild.name} - Bots`, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setDescription('\`・\` Para uma melhor experiência em nosso servidor aproveite os bots de música disponíveis. Saiba como usar e quais comandos necessários:')
            .setColor(`${colorNB}`)
            .addFields(
                { name: "Bots disponíveis:", value: `${d}`, "inline": true },
                { name: "Bots indisponíveis:", value: `${i}`, "inline": true })

            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setTimestamp()

        const MESSAGE = await message.channel.send({ embeds: [embed] });
        await db.set(`msgbotscanal_${message.guild.id}`, `${message.channel.id}`);
        await db.set(`msgbots_${message.guild.id}`, `${MESSAGE.id}`);

    }
};