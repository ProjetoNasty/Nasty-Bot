const Discord = require("discord.js");
const client = require('..');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('messageDelete', async (message) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    if (message.channel?.type == 1 || message.author?.id === client.user.id) return;

    let colorNB = await db.get(`colorNB`);
    if (!colorNB) colorNB = '#2f3136';

    let c = await db.get(`mensagensApagadasNB_${message.guild.id}`);
    const channel = message.guild.channels.cache.get(c);
    if (!channel) return;

    if (!message.attachments.size) {

        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `| Mensagem deletada`, iconURL: `https://cdn.discordapp.com/emojis/1065308067174043779.png` })
            .setDescription(`${client.xx.membro} **Membro**:\n${message.author ? message.author : 'Unknown User'} ${message.author ? `\`${message.author.username}\`` : ''}\n${client.xx.canais} **Canal**:\n${message.channel} \`${message.channel.name}\`\n${client.xx.mensagens} **Mensagem deletada**:\n \`\`\`${message.content}\`\`\``)
            .setColor('#ff0000')

        await channel.send({ embeds: [embed] });

    }

    if (message.attachments.size && !message.content) {

        let imagem = new Discord.AttachmentBuilder(`${message.attachments.first().url}`, "image.png");

        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `| Mensagem deletada`, iconURL: `https://cdn.discordapp.com/emojis/1065308067174043779.png` })
            .setDescription(`${client.xx.membro} **Membro**:\n${message.author ? message.author : 'Unknown User'} ${message.author ? `\`${message.author.username}\`` : ''}\n${client.xx.canais} **Canal**:\n${message.channel} \`${message.channel.name}\``)
            .setImage(imagem.attachment)
            .setColor('#ff0000')

        await channel.send({ embeds: [embed] });

    }

    if (message.attachments.size && message.content) {

        let imagem = new Discord.AttachmentBuilder(`${message.attachments.first().url}`, "image.png");

        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `| Mensagem deletada`, iconURL: `https://cdn.discordapp.com/emojis/1065308067174043779.png` })
            .setDescription(`${client.xx.membro} **Membro**:\n${message.author ? message.author : 'Unknown User'} ${message.author ? `\`${message.author.username}\`` : ''}\n${client.xx.canais} **Canal**:\n${message.channel} \`${message.channel.name}\`\n${client.xx.mensagens} **Mensagem deletada**:\n \`\`\`${message.content}\`\`\``)
            .setImage(imagem.attachment)
            .setColor('#ff0000')

        await channel.send({ embeds: [embed] });

    }
});
