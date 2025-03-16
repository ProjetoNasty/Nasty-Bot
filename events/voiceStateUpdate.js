const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const client = require('..');

client.on('voiceStateUpdate', async (oldMember, newMember) => {
    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    let usuario = newMember.guild.members.cache.get(newMember.id);
    let oldVoice = oldMember.channel;
    let newVoice = newMember.channel;

    let t = await db.get(`trafegovozNB_${newMember.guild.id}`);
    let chx = newMember.guild.channels.cache.get(t);
    if (!chx) return;

    // Filtro: Apenas reage se o canal realmente mudou
    if (oldVoice === newVoice) return;

    if (!oldVoice && newVoice) { // Entrou no canal
        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: '| Entrou no canal', iconURL: `https://cdn.discordapp.com/emojis/1048643688508690583.png` })
            .setDescription(`Entrou no canal <#${newVoice.id}> \`${newVoice.name}\`\n${client.xx.membro} **Membro**: ${usuario} \`${usuario.user.username}\``)
            .setColor('#00ff00');

        await chx.send({ embeds: [embed] });

    } else if (oldVoice && !newVoice) { // Saiu do canal
        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: '| Saiu do canal', iconURL: `https://cdn.discordapp.com/emojis/1048643688508690583.png` })
            .setDescription(`<@${oldMember.id}> saiu do canal de voz <#${oldVoice.id}> \`${oldVoice.name}\`\n${client.xx.membro} **Membro**: ${usuario} \`${usuario.user.username}\``)
            .setColor('#ff0000');

        await chx.send({ embeds: [embed] });

    } else if (oldVoice && newVoice) { // Trocou de canal
        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: '| Trocou de canal', iconURL: `https://cdn.discordapp.com/emojis/1048643688508690583.png` })
            .setDescription(`Mudou de <#${oldVoice.id}> \`${oldVoice.name}\` para <#${newVoice.id}> \`${newVoice.name}\`\n${client.xx.membro} **Membro**: ${usuario} \`${usuario.user.username}\``)
            .setColor('#ffff00');

        await chx.send({ embeds: [embed] });
    }
});
