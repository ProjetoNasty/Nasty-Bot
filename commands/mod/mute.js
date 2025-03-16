const Discord = require("discord.js");
const ms = require("ms");
const moment = require("moment");
moment.locale('pt-br');
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'mute',
    description: "Trancar o chat",
    run: async (client, message, args) => {
        
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;

        const Member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        const time = args[1];

        let motivo = args[2] ? args.slice(2).join(" ") : 'sem motivo';

        if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {

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

        if (!time || isNaN(ms(time))) {

            let noMember = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você esqueceu de colocar o tempo do mute.`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noMember] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        }

        if (message.member.roles.highest.position <= Member.roles.highest.position) {

            let permBaixa = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, não pode mutar um membro com cargo acima do seu!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [permBaixa] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);

            })

        } else {

            const ban = new Discord.EmbedBuilder()
                .setDescription(`Confirmação para mutar ${Member}!\nConfirme clicando no botão ou digitando o comando \`${prefixoNB}mutar\`!`)
                .setColor(`${colorNB}`)
                .setTimestamp()

            const rowBan = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setEmoji('🔇')
                        .setCustomId("mutar")
                        .setStyle(Discord.ButtonStyle.Primary))

            const MESSAGE = await message.channel.send({ embeds: [ban], components: [rowBan] });
            const filter = (i) => i.user.id === message.author.id;
            const collector = MESSAGE.createMessageComponentCollector({ filter });

            collector.on('collect', async (b) => {

                let muterole = b.guild.roles.cache.find(roles => roles.name === "Mutado");
                if (!muterole) {

                    try {

                        muterole = await b.guild.roles.create({
                            name: 'Mutado',
                            color: 'BLACK',
                            permissions: [],
                            reason: 'Cargo mutado criado com sucesso!',

                        }),

                            b.guild.channels.cache.forEach(async (channel) => {
                                await channel.permissionOverwrites.edit(
                                    muterole.id, {

                                    ViewChannel: false,
                                    SendMessages: false,
                                    Speak: false
                                })
                            })
                    } catch (e) { }
                };

                if (b.customId == 'mutar') {

                    let role2 = b.guild.roles.cache.get(muterole.id);

                    const mutado = new Discord.EmbedBuilder()
                        .setDescription(`${Member} já está mutado!`)
                        .setColor(`${colorNB}`)

                    if (Member.roles.cache.has(role2.id)) return b.reply({ embeds: [mutado], ephemeral: true });

                    MESSAGE.delete();

                    await db.set(
                        `silenciado_${Member.user.id}`,
                        muterole.id
                    )

                    await Member.roles.add(role2).catch(err => { });

                    let embedMute = new Discord.EmbedBuilder()
                        .setAuthor({ name: `Membro mutado`, iconURL: 'https://cdn.discordapp.com/emojis/1048641316667543582.png' })
                        .addFields(

                            { name: `${client.xx.moderador} Moderador`, value: `${b.member} \`${b.user.username}\``, inline: true },
                            { name: `${client.xx.membro} Membro`, value: `${Member.user.username} \`${Member.user.id}\``, inline: true },
                            { name: `${client.xx.duracao} Tempo`, value: `${time} \`${time}\``, inline: false },
                            { name: `${client.xx.motivo} Motivo`, value: `\`${motivo}\``, inline: false }
                        )
                        .setColor(`${colorNB}`)

                    await b.channel.send({ embeds: [embedMute] }).then((msg) => {

                        setTimeout(() => msg.delete(), 60000);

                    });

                    let m = await db.get(`silenciadosVozNB_${b.guild.id}`);
                    const logMute = b.guild.channels.cache.get(m);

                    let embedMute2 = new Discord.EmbedBuilder()
                        .setAuthor({ name: `Membro mutado`, iconURL: 'https://cdn.discordapp.com/emojis/1048641316667543582.png' })
                        .addFields(

                            { name: `${client.xx.moderador} Moderador`, value: `${b.member} \`${b.user.username}\``, inline: true },
                            { name: `${client.xx.membro} Membro`, value: `${Member.user.username} \`${Member.user.id}\``, inline: true },
                            { name: `${client.xx.duracao} Tempo`, value: `${time} \`${time}\``, inline: false },
                            { name: `${client.xx.motivo} Motivo`, value: `\`${motivo}\``, inline: false }
                        )
                        .setColor('#ff0000')

                    if (logMute) await logMute.send({ embeds: [embedMute2] }).catch(err => { });

                    const servidorMute = await db.get(`servidorMute`);

                    if (!servidorMute) {

                        await db.set(`servidorMute`, b.guild.id);
                    }
                    let databasemute1 = `{
                        "usuarioID": "${Member.user.id}"
                    }`
                    await db.push(
                        'databasemute',
                        JSON.parse(databasemute1))
                    let databasemute2 = `{
                        "chatID": "${b.channel.id}",
                        "tempo": "${time}",
                        "data": "${new Date().getTime()}",
                        "cargoID": "${muterole.id}"
                    }`
                    await db.set(
                        `mutedatabase_${Member.user.id}`,
                        JSON.parse(databasemute2))

                    setTimeout(async () => {

                        await Member.roles.remove(role2);

                        await db.delete(
                            `silenciado_${Member.user.id}`
                        )
                        await db.delete(
                            `mutedatabase_${Member.user.id}
                            `)

                        await db.set(
                            'databasemute',
                            await db.set('databasemute', (await db.get('databasemute'))?.filter(e => e !== e.usuarioID !== Member.id)));

                        const acabou = new Discord.EmbedBuilder()
                            .setDescription(`${Member.user} seu mute acabou.`)
                            .setColor(`${colorNB}`)

                        await b.channel.send({ embeds: [acabou] }).then((msg) => {

                            setTimeout(() => msg.delete(), 7000);
                        })

                    }, ms(time));

                }

            })
        }
    }
}