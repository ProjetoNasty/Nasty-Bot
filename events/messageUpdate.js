const Discord = require("discord.js");
const client = require('..');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('messageUpdate', async (oM, nM) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    if (nM.channel?.type == 1 || nM.author?.id == client.user.id) return;

    let c = await db.get(`mensagensAtualizadasNB_${nM.guild.id}`);
    const channel = nM.guild.channels.cache.get(c);
    if (!channel) return;

    const embed = new Discord.EmbedBuilder()
        .setAuthor({ name: `| Mensagem atualizada`, iconURL: `https://cdn.discordapp.com/emojis/1048643929064615986.png` })
        .setDescription(`${client.xx.membro} **Membro**:\n${oM.author} \`${oM.author.username}\`\n${client.xx.canais} **Canal**:\n${oM.channel} \`${oM.channel.name}\`\n${client.xx.msgedit} **Antiga**:\n \`\`\`${oM}\`\`\`\n${client.xx.novamsg} **Nova**:\n \`\`\`${nM}\`\`\``)
        .setColor('#fd7324')
        
   await channel.send({ embeds: [embed] });

})