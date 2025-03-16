const client = require('..');
const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
const { AuditLogEvent } = require('discord.js');
const moment = require("moment");
moment.locale('pt-br');
require("moment-duration-format");
const ms = require('ms');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const InvitesTracker = require('@androz2091/discord-invites-tracker');

const tracker = InvitesTracker.init(client, {
    fetchGuilds: true,
    fetchVanity: true,
    fetchAuditLogs: true
});

tracker.on('guildMemberAdd', async (member, type, invite) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    let colorNB = await db.get(`colorNB`);
    if (!colorNB) colorNB = '#2f3136';

    let botzin = member.user.bot;
    
    let statusAutoCargo = await db.get(`statusautoCargoNB_${member.guild.id}`);
    let statusAutoCargoBadge = await db.get(`statusautoCargoBadgeNB_${member.guild.id}`);
    let statusBlacklist = await db.get(`statusBlacklist_${member.guild.id}`);
    let statusAntiBot = await db.get(`statusAntibotNB_${member.guild.id}`);
    let limiteAntifakeNB = await db.get(`limiteAntifakeNB_${member.guild.id}`);
    let statusAntifake = await db.get(`statusAntifakeNB_${member.guild.id}`);
    let statusBv = await db.get(`statusBvNB_${member.guild.id}`);
    
    const entradaDb = await db.get(`entradaNB_${member.guild.id}`);

    if (entradaDb) {

        const entrada = member.guild.channels.cache.get(entradaDb);

        if (statusAntifake == true) {

            if (member.user.displayAvatarURL().includes("a_")) return;

            let protecaoDb = await db.get(`protecaoNB_${member.guild.id}`);
            const protecao = member.guild.channels.cache.get(protecaoDb);

            let minAge = ms(`${limiteAntifakeNB} days`);
            let createdAt = new Date(member.user.createdAt).getTime();
            let diff = new Date() - createdAt;
            let dias = Math.floor(diff / 86400000);

            if (minAge > diff) {

                let antiFake = new Discord.EmbedBuilder()
                    .setAuthor({ name: `Você foi expulso(a) | ${member.guild.name}` })
                    .addFields(

                        { name: `${client.xx.purple} Informações:`, value: `Banido por: \`Sistema Antifake\`\nMotivo: \`${dias} de conta criada\`\n\n» Caso não seja fake procure algum membro da Administração.`, inline: true },
                    )
                    .setColor(`${colorNB}`)

                await member.send({ embeds: [antiFake] }).catch(err => { });

                await member.kick({ reason: `| Anti Fake` }).catch(err => { });

                if (protecao) {

                    let antiFake = new Discord.EmbedBuilder()
                        .setAuthor({ name: `| Anti Fake`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
                        .setDescription(`${client.xx.membro} **Membro**: ${member} \`${member.user.username}\`\n${client.xx.duracao} **Dias de conta**: ${dias} dias`)
                        .setColor('#ff0006')
                        .setTimestamp()
                        
                    await protecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                    await protecao.send({ embeds: [antiFake] }).catch(err => { });

                }
            }
        }

        if (statusBlacklist == true) {

            let listado = await db.get(`blacklist_${member.guild.id}.info`);

            if (listado?.includes(member.id)) {

                let bannedInfo = (await db.get(`blacklist_${member.guild.id}.bl`))?.filter(element => element.membroID == member.id);

                let blackList = new Discord.EmbedBuilder()
                    .setAuthor({ name: `Você foi banido(a) | ${member.guild.name}` })
                    .addFields(

                        { name: `${client.xx.purple} Informações:`, value: `**Banido por**: ${bannedInfo[0].mod}\n**Motivo**: \`${bannedInfo[0].motivo}\`\n\n» Caso ache a Blacklist injusta procure algum membro da Administração.`, inline: true },
                    )
                    .setThumbnail(member.guild.iconURL({ dynamic: true }))
                    .setColor(`${colorNB}`)

                await member.send({ embeds: [blackList] }).catch(err => { });

                await member.ban({ reason: `💀 Blacklist | Motivo: ${bannedInfo[0].motivo}` }).catch(err => { });

                let protecaoDb = await db.get(`protecaoNB_${member.guild.id}`);
                const protecao = member.guild.channels.cache.get(protecaoDb);

                if (protecao) {

                    let blackList = new Discord.EmbedBuilder()
                        .setAuthor({ name: `| Blacklist`, iconURL: `https://images.emojiterra.com/google/android-oreo/512px/1f480.png` })
                        .setDescription(`**Membro**:\n${member} \`${member.user.username}\`\n${client.xx.moderador} **Moderador**:\n<@${bannedInfo[0].modID}> \`${bannedInfo[0].modID}\`\n${client.xx.motivo} **Motivo**:\n\`\`\`${bannedInfo[0].mod}\`\`\``)
                        .setColor('#ff0006')
                        .setTimestamp()

                    await protecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                    await protecao.send({ embeds: [blackList] }).catch(err => { });

                }
            }
        }

        if (botzin === true) {

            const fetchedLogs = await member.guild.fetchAuditLogs({
                limite: 1,
                type: AuditLogEvent.IntegrationCreate

            });

            const botAddLog = fetchedLogs.entries.first();
            const { executor, target } = botAddLog;

            let m = member.guild.members.cache.get(executor.id);
            let b = member.guild.members.cache.get(target.account.id);

            if (statusAntiBot == true) {

                let protecaoDb = await db.get(`protecaoNB_${member.guild.id}`);
                const protecao = member.guild.channels.cache.get(protecaoDb);

                await member.kick({ reason: `| Anti Bot` }).catch(err => { });

                const removendo = m.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => cargo.id); // Vamos encontrar os cargos que tem a permissão de administrador no autor
                await m.roles.remove(removendo).catch(err => { });

                if (protecao) {

                    let antiBot = new Discord.EmbedBuilder()
                        .setAuthor({ name: `| Anti Bot`, iconURL: `https://cdn.discordapp.com/emojis/1065300982109581395.png` })
                        .setDescription(`${client.xx.botsadd} **Bot**: ${b} \`${b.user.username}\`\n${client.xx.moderador} **Adicionado por**: ${m} \`${m.user.username}\``)
                        .setColor('#ff0006')
                        .setTimestamp()

                    await protecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                    await protecao.send({ embeds: [antiBot] }).catch(err => { });

                }

            } else {

                let b = await db.get(`botsNB_${member.guild.id}`);
                const botsAdd = member.guild.channels.cache.get(protecaoDb);

                let embedBot = new Discord.EmbedBuilder()
                    .setAuthor({ name: `| Um bot entrou no servidor`, iconURL: `https://cdn.discordapp.com/emojis/1065300982109581395.png` })
                    .setDescription(`${client.xx.botsadd} **Bot**: ${b} \`${b.user.username}\`\n${client.xx.moderador} **Adicionado por**: ${m} \`${m.user.username}\``)
                    .setColor('#00ff00')
                    .setTimestamp()

                await botsAdd.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                await botsAdd.send({ embeds: [embedBot] }).catch(err => { });

            }
        }


        if (type === 'normal') {

            if (botzin === true) return;

            let convidou = await db.get(`convites_${invite.inviter.id}`);
            if (!convidou) convidou = 0;
            convidou++;

            let convidado = new Discord.EmbedBuilder()
                .setAuthor({ name: `| Entrou no servidor`, iconURL: `https://cdn.discordapp.com/emojis/1065175771578105857.png` })
                .setDescription(`${client.xx.membro} **Membro**:\n${member} \`${member.user.username}\`\n${client.xx.duracao} **Criado há**:\n${moment(new Date()).diff(member.user.createdAt, "days")} dias\n${client.xx.sv} **Convidado por**: ${invite.inviter.username}`)
                .setColor('#00ff00')
                .setFooter({ text: `${invite.inviter.username} já convidou ${convidou} membros.`, iconURL: invite.inviter.displayAvatarURL({ dynamic: true }) })
                .setTimestamp()

            await entrada.send({ embeds: [convidado] }).catch(err => { });
            await db.add(`convites_${invite.inviter.id}`, 1);

        } else {

            if (botzin === true) return;

            let vanity = new Discord.EmbedBuilder()
                .setAuthor({ name: `| Entrou no servidor`, iconURL: `https://cdn.discordapp.com/emojis/1065175771578105857.png` })
                .setDescription(`${client.xx.membro} **Membro**:\n${member} \`${member.user.username}\`\n${client.xx.duracao} **Criado há**:\n${moment(new Date()).diff(member.user.createdAt, "days")} dias\n${client.xx.sv} Vanity URL ou convite de uso único.`)
                .setColor('#00ff00')
                .setTimestamp()
                
            await entrada.send({ embeds: [vanity] }).catch(err => { });
        }
    }

    if (statusBv == true) {
        let canalBvId = await db.get(`canalBvNB_${member.guild.id}`);
        let canalBv = member.guild.channels.cache.get(canalBvId);
        let msgBv = await db.get(`msgBvNB_${member.guild.id}`);
    
        const alterado = msgBv
            .replaceAll("@member", `${member}`)
            .replaceAll("@server", `${member.guild.name}`)
            .replaceAll("@username", `${member.user.username}`);
    
        msgBv = `${alterado}`;
    
        if (canalBv) {
            const embed = new Discord.EmbedBuilder()
              .setTitle(`${member.guild.name}`)
                .setDescription(msgBv)
                .setColor('#ffffff')
                .setThumbnail(member.user.displayAvatarURL());
            await canalBv.send({ embeds: [embed] }).then((msg) => {
                setTimeout(() => msg.delete(), 15000);
            });
        }
    }
    

    if (statusAutoCargo == true) {

        let cargo = await db.get(`cargoAutoNB_${member.guild.id}`);
        await member.roles.add(cargo).catch(err => { });
    }

    if (statusAutoCargoBadge == true) {

        let pig = await db.get(`pigCargoBadgeNB_${member.guild.id}`);
        let dev = await db.get(`devCargoBadgeNB_${member.guild.id}`);
        let hype = await db.get(`hypeCargoBadgeNB_${member.guild.id}`);
        let active = await db.get(`activeCargoBadgeNB_${member.guild.id}`);

        const flagToBadgeName = {
            PremiumEarlySupporter: `${pig}`,
            VerifiedDeveloper: `${dev}`,
            Hypesquad: `${hype}`,
            ActiveDeveloper: `${active}`
        };

        if (member.flags == undefined) return;

        const badges = member.flags
            .toArray()
            .map(flag => flagToBadgeName[flag])
            .filter(name => name !== undefined);

        let gangroles = member.guild.roles.cache.filter((role) =>
            badges.includes(role.id)
        );

        gangroles.each(async (r) => {
            await member.roles.add(r.id).catch(err => { });
        });
    }

});