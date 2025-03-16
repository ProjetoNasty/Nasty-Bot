const { AuditLogEvent } = require('discord.js');
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const client = require('..');

client.on('roleCreate', async (cargo) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const user = await cargo.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate }).then(auditoria => auditoria.entries.first()), // Aqui vamos indentificar quem é o autor que efetuo a ação
        usuario = cargo.guild.members.cache.get(user.executor.id)

        let c = await db.get(`criarCargosNB_${cargo.guild.id}`);
        const canal = cargo.guild.channels.cache.get(c);
        if (!canal) return;

    let embed = new Discord.EmbedBuilder()
        .setAuthor({ name: '| Cargo criado', iconURL: `https://cdn.discordapp.com/emojis/1014736030269702234.webp` })
        .setColor('#00ff00')
        .setDescription(`**Cargo**:\n${cargo.name} \`${cargo.id}\`\n**Moderador**:\n${usuario} \`${usuario.user.username}\``)

    await canal.send({ embeds: [embed] });

});