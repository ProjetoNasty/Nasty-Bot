const client = require('..');
const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
const { AuditLogEvent } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('guildMemberRemove', async (member) => {

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
        type: AuditLogEvent.MemberKick,
    });

    const kickLog = fetchedLogs?.entries.first();

    const { executor, target, reason } = kickLog;

    if (target.id === member.id) {

        let motivo;

        if (reason == null) {

            motivo = 'sem motivo';
    
        } else {
    
            motivo = `${executor.reason}`;
        }

        let embedExpulsao2 = new Discord.EmbedBuilder()
            .setAuthor({ name: `| Expulso`, iconURL: `https://cdn.discordapp.com/emojis/1048643583437197333.png` })
            .setDescription(`${client.xx.membro} **Membro**:\n${target} \`${target.username}\`\n${client.xx.moderador} **Moderador**:\n${executor} \`${executor.username}\`\n${client.xx.roleskk} **Motivo**:\n\`\`\`${motivo}\`\`\``)
            .setColor('#ff0000')
            .setTimestamp()

        await db.add(`expulsoes_${executor.id}`, 1);

        let ex = await db.get(`expulsoesNB_${member.guild.id}`);
        let logExpulsao = member.guild.channels.cache.get(ex);

        if (logExpulsao) await logExpulsao.send({ embeds: [embedExpulsao2] }).catch(err => { });

        let statusAntiRaid = await db.get(`statusAntiraid_${member.guild.id}`);

        if (statusAntiRaid === true) {

            let limiteExpulsoes = await db.get(`limiteExpulsoes_${executor.id}`);

            let limiteExpulsoesRaid = await db.get(`limiteExpulsaoNB_${member.guild.id}`);
            if (!limiteExpulsoesRaid) return;

            if (limiteExpulsoes > limiteExpulsoesRaid) {

                let p = await db.get(`protecaoNB_${member.guild.id}`);
                const logProtecao = member.guild.channels.cache.get(p);

                const membro = member.guild.members.cache.get(executor.id),
                    removendo = membro.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => cargo.id),
                    cargosAdm = membro.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => `<@&${cargo.id}>`).join('\n');

                await membro.roles.remove(removendo).catch(err => { });

                let embedRaid = new Discord.EmbedBuilder()
                    .setAuthor({ name: `| Expulsão em massa`, iconURL: `https://cdn.discordapp.com/emojis/1048643583437197333.png` })
                    .setDescription(`${client.xx.membro} **Membro**:\n${target} \`${target.username}\`\n${client.xx.moderador} **Moderador**:\n${executor} \`${executor.username}\`\n${client.xx.roleskk} **Cargos removidos**:\n${cargosAdm}`)
                    .setColor('#ff0000')
                    .setTimestamp()

                if (logProtecao) await logProtecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                if (logProtecao) await logProtecao.send({ embeds: [embedRaid] });

                await db.delete(`limiteExpulsoes_${executor.id}`);
            }
        }

    } else {

        let s = await db.get(`saidaNB_${member.guild.id}`);

        if (s) {

            const saida = member.guild.channels.cache.get(s);

            let normal = new Discord.EmbedBuilder()
                .setAuthor({ name: `| Saiu do servidor`, iconURL: `https://cdn.discordapp.com/emojis/1048642106677276732.webp?size=44&quality=lossless` })
                .setDescription(`${client.xx.memberemov} **Membro**:\n${member} \`${member.user.username}\``)
                .setColor('#ff0000')
                .setTimestamp()

            await saida.send({ embeds: [normal] }).catch(err => { });

        }
    }



});