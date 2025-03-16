const { AuditLogEvent } = require('discord.js');
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const client = require('..');

client.on('channelCreate', async (canal) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const user = await canal.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate }).then(auditoria => auditoria.entries.first()), // Aqui vamos indentificar quem é o autor que efetuo a ação
        usuario = canal.guild.members.cache.get(user.executor.id)

    let c = await db.get(`criarCanaisNB_${canal.guild.id}`);
    const canalz = canal.guild.channels.cache.get(c);

    let tipo;

    if (canal.type == '0') {

        tipo = 'Texto'

    }

    if (canal.type == '4') {

        tipo = 'Categoria'

    }

    if (canal.type == '2') {

        tipo = 'Voz'

    }

    let embedel = new Discord.EmbedBuilder()
        .setAuthor({ name: '| Canal criado', iconURL: `https://cdn.discordapp.com/emojis/1048640787354751017.webp?size=44&quality=lossless` })
        .setDescription(`${client.xx.canais} **Canal**:\n<#${canal.id}> \`${canal.name}\`\n**Tipo**:\n${tipo}\n${client.xx.moderador} **Moderador**:\n${usuario} \`${usuario.user.username}\``)
        .setColor('#06f84b')

        if (canalz) await canalz.send({ embeds: [embedel] });

});