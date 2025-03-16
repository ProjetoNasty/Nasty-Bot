const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'kick',
    description: "Expulsar o membro",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136'

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;

        const Member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        var motivo = args[1] ? args.slice(1).join(' ') : 'sem motivo';

        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {

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
                .setDescription(`${message.author}, não pode expulsar um membro com cargo acima do seu!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [permBaixa] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);

            })

        } else {

            const ban = new Discord.EmbedBuilder()
                .setDescription(`Confirmação para expulsar ${Member}!\nConfirme clicando no \`Tênis\`!`)
                .setColor(`${colorNB}`)
                .setTimestamp()

            const rowBan = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setEmoji('👟')
                        .setCustomId("expulsar")
                        .setStyle(Discord.ButtonStyle.Primary))

            const MESSAGE = await message.channel.send({ embeds: [ban], components: [rowBan] });
            const filter = (i) => i.user.id === message.author.id;
            const collector = MESSAGE.createMessageComponentCollector({ filter });

            collector.on('collect', async (b) => {

                if (b.customId == 'expulsar') {

                    MESSAGE.delete();

                    var expulsoes = await db.get(`expulsoes_${b.user.id}`);
                    if (!expulsoes) expulsoes = 0;
                    expulsoes++;

                    let ex = await db.get(`expulsoesNB_${b.guild.id}`);
                    const logExpulsao = b.guild.channels.cache.get(ex);

                    let embedExpulsao = new Discord.EmbedBuilder()
                        .setAuthor({ name: `| Expulso`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
                        .addFields(

                            { name: `${client.xx.membro} Membro`, value: `${Member.user.username} \`${Member.user.id}\``, inline: true },
                            { name: `${client.xx.moderador} Moderador`, value: `${b.member} \`${b.user.username}\``, inline: true },
                            { name: `${client.xx.motivo} Motivo`, value: `\`${motivo}\``, inline: false }
                        )
                        .setColor(`${colorNB}`)
                        .setFooter({ text: `${b.member.user.username} já expulsou ${expulsoes} membros.`, iconURL: b.member.user.avatarURL({ dynamic: true }) })

                    await b.channel.send({ embeds: [embedExpulsao] }).then((msg) => {

                        setTimeout(() => msg.delete(), 60000);

                    });

                    await Member.kick({ reason: `${motivo}` }).catch(err => { });

                    await db.add(`expulsoes_${b.user.id}`, 1);
                    await db.add(`limiteExpulsoes_${b.user.id}`, 1);
             
                    let statusAntiRaid = await db.get(`statusAntiraid_${b.guild.id}`);

                    if (statusAntiRaid === true) {

                        let limiteExpulsoes = await db.get(`limiteExpulsoes_${b.user.id}`);

                        let limiteExpulsoesRaid = await db.get(`limiteExpulsaoNB_${b.guild.id}`);
                        if (!limiteExpulsoesRaid) return;
                        
                        if (limiteExpulsoes > limiteExpulsoesRaid) {
            
                            let p = await db.get(`protecaoNB_${b.guild.id}`);
                            const logProtecao = b.guild.channels.cache.get(p);
            
                            const membro = b.guild.members.cache.get(b.user.id),
                                removendo = membro.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => cargo.id),
                                cargosAdm = membro.roles.cache.filter(cargo => cargo.permissions.has(PermissionsBitField.Flags.Administrator)).map(cargo => `<@&${cargo.id}>`).join('\n');
            
                            await membro.roles.remove(removendo).catch(err => { });
            
                            let embedRaid = new Discord.EmbedBuilder()
                                .setAuthor({ name: `| Expulsão em massa`, iconURL: `https://cdn.discordapp.com/emojis/1048643583437197333.png` })
                                .setDescription(`${client.xx.membro} **Membro**:\n${Member} \`${Member.user.username}\`\n${client.xx.moderador} **Moderador**:\n${b.user} \`${b.user.username}\`\n${client.xx.roleskk} **Cargos removidos**:\n${cargosAdm}`)
                                .setColor('#ff0000')
                                .setTimestamp()
            
                            if (logProtecao) await logProtecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                            if (logProtecao) await logProtecao.send({ embeds: [embedRaid] });
            
                            await db.delete(`limiteExpulsoes_${b.user.id}`);
                    }
                }

                    let embedExpulsao2 = new Discord.EmbedBuilder()
                        .setAuthor({ name: `| Expulso`, iconURL: `https://cdn.discordapp.com/emojis/1060262142395306094.png` })
                        .setDescription(`${client.xx.membro} **Membro**:\n${Member} \`${Member.user.username}\`\n${client.xx.moderador} **Moderador**:\n${b.user} \`${b.user.username}\`\n${client.xx.motivo} **Motivo**:\n\`\`\`${motivo}\`\`\``)
                        .setColor('#ff0000')

                    await Member.send({embeds: [embedExpulsao]}).catch(err => { });

                    if (logExpulsao) await logExpulsao.send({embeds: [embedExpulsao2]}).catch(err => { });
                }

            })
        }
    }
}