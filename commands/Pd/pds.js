const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');

module.exports = {
    name: "pds",
    category: "",
    description: "",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#ffffff';

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        let resp = (await db.all()).filter(data => data.id.startsWith('pd_', { sort: '.data' })).sort((a, b) => b.data - a.data);

        if (!resp.length) {

            let sempd = new Discord.EmbedBuilder()
                .setAuthor({ name: `Tabela de Damas - ${message.guild.name}`, iconURL: 'https://cdn.discordapp.com/emojis/1067880374073573407.png' })
                .setDescription(`Minha Database não encontrou nenhuma Dama.`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [sempd] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })

        }

        let cargoPd = await db.get(`cargopdNB_${message.guild.id}`);

        const topembed = new Discord.EmbedBuilder()
            .setAuthor({ name: `Tabela de Damas - ${message.guild.name}`, iconURL: 'https://cdn.discordapp.com/emojis/1067880374073573407.png' })
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setColor(`${colorNB}`)
            .setTimestamp()

        let msg = await message.channel.send({ embeds: [topembed] });

        setInterval(async () => {
            // Atualizar as informações da embed
            let rankMensagem = "";

            for (let i in resp) {
                let nick = resp[i].id.replace("pd_", "");

                if (message.guild.members.cache.get(nick)) {
                    let member = message.guild.members.cache.get(nick);

                    rankMensagem += `<:anel:1150150874308563046> **@${member.user.username}**\n${(await db.get(`pd_${member.id}`))?.listapds.join(`\n`)}\nㅤ\n`;
                }
            }

            topembed.setDescription(`Confira abaixo a lista de <@&${cargoPd}>.\n⠀⠀\n${rankMensagem}`);

            // Editar a embed com as informações atualizadas
            await msg.edit({ embeds: [topembed] });
        }, 60000); // 1 minutos = 100000 em milissegundos

    }
}
