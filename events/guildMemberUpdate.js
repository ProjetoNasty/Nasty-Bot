const client = require('..');
const Discord = require("discord.js");
const { AuditLogEvent } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('guildMemberUpdate', async (oM, nM) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const fetchedLogs = await oM.guild.fetchAuditLogs({
        limite: 1,
        type: AuditLogEvent.MemberRoleUpdate
    });

    const roleAddLog = fetchedLogs.entries.first();

    const { executor, target } = roleAddLog;
    if (!executor) return;

    if (roleAddLog.changes[0].key === '$add') {

        let oldRoles = oM.roles.cache.map(c => c);
        let newRoles = nM.roles.cache.map(c => c);

        if (oldRoles !== newRoles) {
            oldRoles.forEach((r, s) => {
                if (newRoles.find(c => c == r)) {
                    newRoles.splice(newRoles.indexOf(newRoles.find(c => c == r)), 1);
                }
            });

            if (newRoles.length > 0) {

                let c = await db.get(`AddCargosNB_${oM.guild.id}`);
                const canalz = oM.guild.channels.cache.get(c);
                if (!canalz) return;

                let embedel = new Discord.EmbedBuilder()
                    .setAuthor({ name: '| Cargo adicionado', iconURL: `https://cdn.discordapp.com/emojis/1048640361091825674.webp?size=44&quality=lossless` })
                    .setDescription(`${client.xx.membro} **Membro**:\n${target} \`${target.id}\`\n${client.xx.addcargos} **Cargos adicionados**:\n${newRoles.map(c => `${c}`).join('\n')}\n${client.xx.moderador} **Moderador**:\n${executor} \`${executor.id}\``)
                    .setColor('#06f84b')
                    .setTimestamp()

                await canalz.send({ embeds: [embedel] });

            }
        }
    }

    if (roleAddLog.changes[0].key === '$remove') {

        let oldRoles = oM.roles.cache.map(c => c)
        let newRoles = nM.roles.cache.map(c => c)
        if (oldRoles !== newRoles) {
            newRoles.forEach((r, s) => {
                if (oldRoles.find(c => c !== r)) {
                    oldRoles.splice(oldRoles.indexOf(oldRoles.find(c => c == r)), 1)
                }
            })

            if (oldRoles.length > 0) {

                let c = await db.get(`RemovCargosNB_${oM.guild.id}`);
                const canalz = oM.guild.channels.cache.get(c);

                if (!canalz) return;
                let embedel = new Discord.EmbedBuilder()
                    .setAuthor({ name: '| Cargo removido', iconURL: `https://cdn.discordapp.com/emojis/1048640441966415962.webp?size=44&quality=lossless` })
                    .setDescription(`${client.xx.membro} **Membro**:\n${target} \`${target.id}\`\n${client.xx.roleskk} **Cargos removidos**:\n${oldRoles.map(c => `${c}`).join('\n')}\n${client.xx.moderador} **Moderador**:\n${executor} \`${executor.id}\``)
                    .setColor('#e81e28')
                    .setTimestamp()

                await canalz.send({ embeds: [embedel] });

            }
        }
    }

    if (!oM.roles.cache.has('1071224585430777869') && nM.roles.cache.has('1071224585430777869')) {

        const sejaB = nM.guild.channels.cache.get('1071258813321199726');

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: `${nM.user.username}`, iconURL: `https://cdn.discordapp.com/emojis/957474378633859103.webp` })
            .setDescription(`Obrigado por impulsionar o servidor.\nVocê recebeu suas vantages de <#1071124516870291547>`)
            .addFields(
                { name: "Cargo Recebido:", value: `<@&1071224585430777869>`, "inline": false })
            .setColor(`${colorNB}`)
            .setTimestamp()
            .setThumbnail(nM.user.avatarURL({ dynamic: true }))
            .setFooter(nM.guild.name, nM.guild.iconURL({ dynamic: true }))

        if (sejaB) sejaB.send({ embeds: [embed] }).catch(err => { });

    }
});