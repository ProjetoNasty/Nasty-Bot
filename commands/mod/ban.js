const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'ban',
    description: "banir membro",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136'

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;


        const Member = message.mentions.members.first() || client.users.cache.find(user => user.username === args.join(" ")) || message.guild.members.cache.get(args[0]);

        var motivo = args[1] ? args.slice(1).join(' ') : 'sem motivo';

        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {

            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem a permissão necessária!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })
        }

        if (!Member) {

            let noMember = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você precisa mencionar um membro.`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noMember] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        }

        if (message.member.roles.highest.position <= Member.roles.highest.position) {

            let permBaixa = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, não pode banir um membro com cargo acima do seu!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [permBaixa] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);

            })

        } else {

            const ban = new Discord.EmbedBuilder()
                .setDescription(`Confirmação para banir ${Member}!\nConfirme clicando no \`Martelo\`!`)
                .setColor(`${colorNB}`)
                .setTimestamp()

            const rowBan = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setEmoji('🔨')
                        .setCustomId("banir")
                        .setStyle(Discord.ButtonStyle.Primary))

            const MESSAGE = await message.channel.send({ embeds: [ban], components: [rowBan] });
            const filter = (i) => i.user.id === message.author.id;
            const collector = MESSAGE.createMessageComponentCollector({ filter });

            collector.on('collect', async (b) => {

                if (b.customId == 'banir') {

                    MESSAGE.delete();

                    var banimentos = await db.get(`bans_${b.user.id}`);
                    if (!banimentos) banimentos = 0;
                    banimentos++;

                    let bn = await db.get(`logBanNB_${b.guild.id}`);
                    const logBan = b.guild.channels.cache.get(bn);

                    let embedBan = new Discord.EmbedBuilder()
                        .setAuthor({ name: `| Banido`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
                        .setThumbnail(Member.user.avatarURL({ dynamic: true }))
                        .addFields(

                            { name: `${client.xx.membro} Membro`, value: `${Member.user.username} \`${Member.user.id}\``, inline: true },
                            { name: `${client.xx.moderador} Moderador`, value: `${b.member} \`${b.user.username}\``, inline: true },
                            { name: `${client.xx.motivo} Motivo`, value: `\`${motivo}\``, inline: false }
                        )
                        .setColor('#ff0000')
                        .setFooter({ text: `${b.member.user.username} já baniu ${banimentos} membros.`, iconURL: b.member.user.avatarURL({ dynamic: true }) })

                    message.channel.send({ embeds: [embedBan] }).then((msg) => {

                        setTimeout(() => msg.delete(), 60000);

                    });

                    await db.add(`bans_${b.user.id}`, 1);

                    let statusAntiRaid = await db.get(`statusAntiraid_${b.guild.id}`);

                    if (statusAntiRaid === true) {

                    await db.add(`limiteBans_${b.user.id}`, 1);
             
                    let limiteBan = await db.get(`limiteBans_${b.user.id}`);
                    let limitebanRaid = await db.get(`limiteBanimentoNB_${b.guild.id}`);

                    if (limiteBan > limitebanRaid) {
                        
                        let p = await db.get(`protecaoNB_${b.guild.id}`);
                        const logProtecao = b.guild.channels.cache.get(p);
        
                        const membro = b.guild.members.cache.get(b.user.id),
                            removendo = membro.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => cargo.id),
                            cargosAdm = membro.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => `<@&${cargo.id}>`).join('\n');
        
                        await membro.roles.remove(removendo).catch(err => { });
        
                        let embedRaid = new Discord.EmbedBuilder()
                            .setAuthor({ name: `| Banimento em massa`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
                            .setDescription(`${client.xx.membro} **Membro**:\n${Member} \`${Member.user.username}\`\n${client.xx.moderador} **Moderador**:\n${b.user} \`${b.user.username}\`\n${client.xx.roleskk} **Cargos removidos**:\n${cargosAdm}`)
                            .setColor('#ff0000')
                            .setTimestamp()
        
                        if (logProtecao) await logProtecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                        if (logProtecao) await logProtecao.send({ embeds: [embedRaid] });
        
                        await db.delete(`limiteBans_${b.user.id}`);
                    }

                }

                    let embedBan2 = new Discord.EmbedBuilder()
                        .setAuthor({ name: `| Banido`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
                        .setDescription(`${client.xx.membro} **Membro**:\n${Member} \`${Member.user.username}\`\n${client.xx.moderador} **Moderador**:\n${b.user} \`${b.user.username}\`\n${client.xx.motivo} **Motivo**:\n\`\`\`${motivo}\`\`\``)
                        .setColor('#ff0000')
                        .setTimestamp()

                    await Member.send({ embeds: [embedBan] }).catch(err => { });

                    if (logBan) await logBan.send({ embeds: [embedBan2] }).catch(err => { });
                    if (logBan) await Member.ban({ reason: `${motivo}` }).catch(err => { });
                }

            })
        }
    }
}