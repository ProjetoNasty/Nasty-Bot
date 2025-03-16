const client = require('..');
const Discord = require("discord.js");
const { AuditLogEvent } = require('discord.js');
const { PermissionsBitField } = require("discord.js")
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

    const fetchedLogs = await oM.guild?.fetchAuditLogs({
        limite: 1,
        type: AuditLogEvent.MemberRoleUpdate

    }).catch(err => { });

    const roleAddLog = fetchedLogs?.entries.first();

    const { executor, target } = roleAddLog;
    if (!executor || executor?.id == client.user.id) return;
    
    let cargosProtegidos = await db.get(`cargosProtegidos_${oM.guild.id}.antiCargos`);
    let statusAntiCargo = await db.get(`statusAnticargoNB_${oM.guild.id}`);

    if (!cargosProtegidos || cargosProtegidos.length == 0 || statusAntiCargo == false) return;

    if (roleAddLog.changes[0].key === '$add') {

        let oldRoles = oM.roles.cache.map(c => c);
        let newRoles = nM.roles.cache.map(c => c);

        if (oldRoles !== newRoles) {
            oldRoles.forEach((r, s) => {
                if (newRoles.find(c => c == r)) {
                    newRoles.splice(newRoles.indexOf(newRoles.find(c => c == r)), 1)
                }
            })

            if (newRoles.length > 0) {

                for (let cargo of newRoles) {

                    if (cargosProtegidos.includes(cargo.id)) {

                        await oM.roles.remove(cargo.id).catch(err => { });

                        const usuario = oM.guild.members.cache.get(target.id);
                        const removendo = usuario.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => cargo.id); // Vamos encontrar os cargos que tem a permissão de administrador no autor
                        await usuario.roles.remove(removendo).catch(err => { });

                        let protecaoDb = await db.get(`protecaoNB_${oM.guild.id}`);
                        const protecao = oM.guild.channels.cache.get(protecaoDb);

                        let embedAnti = new Discord.EmbedBuilder()
                            .setAuthor({ name: '| Anti adicionar cargo', iconURL: `https://cdn.discordapp.com/emojis/1048640291546075219.png` })
                            .setDescription(`${client.xx.membro} **Membro**:\n${target} \`${target.username}\`\n${client.xx.moderador} **Moderador**:\n${executor} \`${executor.username}\`\n${client.xx.roleskk} **Cargos removidos**:\n${newRoles.map(c => `${c}`).join('\n')}`)
                            .setColor('#e81e28')
                            .setTimestamp()

                        if (protecao) await protecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                        if (protecao) await protecao.send({ embeds: [embedAnti] });

                    }
                }
            }

        }
    }
});