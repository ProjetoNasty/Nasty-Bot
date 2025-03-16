const client = require('..');
const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
const { AuditLogEvent } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('guildBanAdd', async (member) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const fetchedLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
    });

    const banLog = fetchedLogs?.entries.first();

    const { executor, target, reason } = banLog;
   
    if (reason == null) {

        motivo = 'sem motivo';

    } else {

        motivo = `${executor.reason}`;
    }

    let bn = await db.get(`logBanNB_${member.guild.id}`);
    let logBan = member.guild.channels.cache.get(bn);

        let embedBan = new Discord.EmbedBuilder()
            .setAuthor({ name: `| Banido`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
            .setDescription(`${client.xx.membro} **Membro**:\n${target} \`${target.username}\`\n${client.xx.moderador} **Moderador**:\n${executor} \`${executor.username}\`\n${client.xx.roleskk} **Motivo**:\n\`\`\`${motivo}\`\`\``)
            .setColor('#ff0000')
            .setTimestamp()

        await db.add(`bans_${executor.id}`, 1);

        if (logBan && !executor.bot) await logBan.send({ embeds: [embedBan] }).catch(err => { });

        let statusAntiRaid = await db.get(`statusAntiraid_${member.guild.id}`);

        if (statusAntiRaid === true) {

            let limiteBans = await db.get(`limiteBans_${executor.id}`);
            let limiteBansRaid = await db.get(`limiteBanimentoNB_${member.guild.id}`);
            if (!limiteBansRaid) return;

            if (limiteBans > limiteBansRaid) {

                let p = await db.get(`protecaoNB_${member.guild.id}`);
                const logProtecao = member.guild.channels.cache.get(p);

                const membro = member.guild.members.cache.get(executor.id),
                    removendo = membro.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => cargo.id),
                    cargosAdm = membro.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => `<@&${cargo.id}>`).join('\n');

                await membro.ban({reason: 'sai daqui tribufu'})

                let embedRaid = new Discord.EmbedBuilder()
                    .setAuthor({ name: `| Banimento em massa`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
                    .setDescription(`${client.xx.membro} **Membro**:\n${target} \`${target.username}\`\n${client.xx.moderador} **Moderador**:\n${executor} \`${executor.username}\`\n${client.xx.roleskk} **Cargos removidos**:\n${cargosAdm}`)
                    .setColor('#ff0000')
                    .setTimestamp()

                if (logProtecao) await logProtecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                if (logProtecao) await logProtecao.send({ embeds: [embedRaid] });

                await db.delete(`limiteBans_${executor.id}`);
            }
        }
});