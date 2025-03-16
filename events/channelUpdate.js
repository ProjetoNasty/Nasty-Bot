const { AuditLogEvent } = require('discord.js');
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const client = require('..');

client.on('channelUpdate', async (oldChannel, newChannel) => {
    try {

        const botE = await db.get(`botex_${client.user.id}`);
        const encerrar = new Date(botE);
        const hoje = new Date();
        const diferencaMs = encerrar - hoje;
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    
        if (diferencaDias <= 0) {
            return;
        }
        
        const auditLogs = await oldChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate });
        const user = auditLogs.entries.first();

        if (!user || !user.executor) {
            console.error('Audit log entry or executor not found.');
            return;
        }

        const usuario = oldChannel.guild.members.cache.get(user.executor.id);
        
        let c = await db.get(`editarCanaisNB_${newChannel.guild.id}`);
        const canal = newChannel.guild.channels.cache.get(c);
        if (!canal) return;

        if (oldChannel.rawPosition !== newChannel.rawPosition) return;

        let tipo;

        if (newChannel.type === '0') {
            tipo = 'Texto';
        } else if (newChannel.type === '4') {
            tipo = 'Categoria';
        } else if (newChannel.type === '2') {
            tipo = 'Voz';
        }

        let att;

        if (oldChannel.userLimit !== newChannel.userLimit) {
            att = `> **Limite**: ${oldChannel.userLimit} ${client.xx.sync} ${newChannel.userLimit}`;
        }

        if (oldChannel.name !== newChannel.name) {
            att = `> **Nome**: ${oldChannel.name} ${client.xx.sync} ${newChannel.name}`;
        }

        let embedel = new Discord.EmbedBuilder()
            .setAuthor({ name: '| Canal Atualizado', iconURL: `https://cdn.discordapp.com/emojis/1048640787354751017.webp?size=44&quality=lossless` })
            .setColor('#fd7324')
            .setDescription(`${client.xx.canais} **Canal**:\n<#${newChannel.id}> \`${newChannel.name}\`\n**Tipo**:\n${tipo}\n${client.xx.moderador} **Moderador**:\n${usuario} \`${usuario.user.username}\`\n${att}`);

        if (oldChannel.name !== newChannel.name || oldChannel.userLimit !== newChannel.userLimit) {
            await canal.send({ embeds: [embedel] });
        }
    } catch (error) {
        console.error('Error in channelUpdate event handler:', error);
    }
});
