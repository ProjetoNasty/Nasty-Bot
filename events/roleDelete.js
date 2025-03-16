const { AuditLogEvent } = require('discord.js');
const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const client = require('..');

client.on('roleDelete', async (cargo) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const user = await cargo.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete }).then(auditoria => auditoria.entries.first()), // Aqui vamos indentificar quem é o autor que efetuo a ação
        usuario = cargo.guild.members.cache.get(user.executor.id)

    let c = await db.get(`deletarCargosNB_${cargo.guild.id}`);
    const canal = cargo.guild.channels.cache.get(c);
    if (!canal) return;

    let embed = new Discord.EmbedBuilder()
        .setAuthor({ name: '| Cargo deletado', iconURL: `https://cdn.discordapp.com/emojis/1048640291546075219.png` })
        .setColor('#ff0000')
        .setDescription(`${client.xx.atualizados} **Cargo**:\n${cargo.name} \`${cargo.id}\`\n${client.xx.moderador} **Moderador**:\n${usuario} \`${usuario.user.username}\``)

    if (canal) await canal.send({ embeds: [embed] });

    let statusAntiRaid = await db.get(`statusAntiraid_${cargo.guild.id}`);

    if (statusAntiRaid === true) {

        await db.add(`limiteExclusao_${usuario.id}`, 1);

        let limiteExclusao = await db.get(`limiteExclusao_${usuario.id}`);
        if (!limiteExclusao) limiteExclusao = 0;

        let limiteExclusaoRaid = await db.get(`limiteExclusaoNB_${cargo.guild.id}`);
        if (!limiteExclusaoRaid) return;

        if (limiteExclusao >= limiteExclusaoRaid) {

            let p = await db.get(`protecaoNB_${cargo.guild.id}`);
            const logProtecao = cargo.guild.channels.cache.get(p);

            const removendo = usuario.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => cargo.id),
                cargosAdm = usuario.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => `<@&${cargo.id}>`).join('\n');

            await usuario.roles.remove(removendo).catch(err => { });

            let embedRaid = new Discord.EmbedBuilder()
                .setAuthor({ name: `| Deletando cargos em massa`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
                .setDescription(`${client.xx.moderador} **Moderador**:\n${usuario} \`${usuario.user.username}\`\n${client.xx.roleskk} **Cargos removidos**:\n${cargosAdm}`)
                .setColor('#ff0000')
                .setTimestamp()

            if (logProtecao) await logProtecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
            if (logProtecao) await logProtecao.send({ embeds: [embedRaid] });

            await db.delete(`limiteExclusao_${usuario.id}`);
        }
    }
});