const { AuditLogEvent } = require('discord.js');
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const client = require('..');

client.on('roleUpdate', async (oldRole, newRole) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const user = await newRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate }).then(auditoria => auditoria.entries.first()), // Aqui vamos indentificar quem é o autor que efetuo a ação
        usuario = newRole.guild.members.cache.get(user.executor.id)

    let c = await db.get(`editarCargosNB_${newRole.guild.id}`);
    const canal = newRole.guild.channels.cache.get(c);
    if (!canal) return;

    let att;

    if (oldRole.name !== newRole.name) {

        att = `> **Nome**: ${oldRole.name} ${client.xx.sync} ${newRole.name}`
    }
    if (oldRole.color !== newRole.color) {

        att = `> **Cor**: ${oldRole.hexColor} ${client.xx.sync} ${newRole.hexColor}`
    }

    let embed = new Discord.EmbedBuilder()
        .setAuthor({ name: '| Cargo atualizado', iconURL: `https://cdn.discordapp.com/emojis/1069814871522295891.png` })
        .setColor('#fd7324')
        .setDescription(`${client.xx.atualizados} **Cargo**: ${newRole} ${oldRole.name}\n${client.xx.moderador} **Moderador**: ${usuario} ${usuario.user.username}\n${att}`)

    if (oldRole.name !== newRole.name || oldRole.color !== newRole.color) {

     await canal.send({ embeds: [embed] });

    }


});