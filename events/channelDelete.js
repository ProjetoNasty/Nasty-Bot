const { AuditLogEvent } = require('discord.js');
const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const client = require('..');

client.on('channelDelete', async (canal) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const user = await canal.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete }).then(auditoria => auditoria.entries.first()), // Aqui vamos indentificar quem é o autor que efetuo a ação
        usuario = canal.guild.members.cache.get(user.executor.id)

    let c = await db.get(`deletarCanaisNB_${canal.guild.id}`);
    const canalz = canal.guild.channels.cache.get(c);
    if (!canalz) return;

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
        .setAuthor({ name: '| Canal deletado', iconURL: `https://cdn.discordapp.com/emojis/1048640787354751017.webp?size=44&quality=lossless` })
        .setColor('#ff0000')
        .setDescription(`${client.xx.canais} **Canal**:\n<#${canal.id}> \`${canal.name}\`\n**Tipo**:\n${tipo}\n${client.xx.moderador} **Moderador**:\n${usuario} \`${usuario.user.username}\``)

    await canalz.send({ embeds: [embedel] });

    let statusAntiRaid = await db.get(`statusAntiraid_${canal.guild.id}`);

    if (statusAntiRaid === true) {

        await db.add(`limiteExclusao_${usuario.id}`, 1);

        let limiteExclusao = await db.get(`limiteExclusao_${usuario.id}`);
        if (!limiteExclusao) limiteExclusao = 0;

        let limiteExclusaoRaid = await db.get(`limiteExclusaoNB_${canal.guild.id}`);
        if (!limiteExclusaoRaid) return;

        if (limiteExclusao >= limiteExclusaoRaid) {

            let p = await db.get(`protecaoNB_${canal.guild.id}`);
            const logProtecao = canal.guild.channels.cache.get(p);

            const removendo = usuario.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => cargo.id),
                cargosAdm = usuario.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => `<@&${cargo.id}>`).join('\n');

            await usuario.roles.remove(removendo).catch(err => { });

            let embedRaid = new Discord.EmbedBuilder()
                .setAuthor({ name: `| Deletando canais em massa`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
                .setDescription(`${client.xx.moderador} **Moderador**:\n${usuario} \`${usuario.user.username}\`\n${client.xx.roleskk} **Cargos removidos**:\n${cargosAdm}`)
                .setColor('#ff0000')
                .setTimestamp()

            if (logProtecao) await logProtecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
            if (logProtecao) await logProtecao.send({ embeds: [embedRaid] });

            await db.delete(`limiteExclusao_${usuario.id}`);
        }
    }

});