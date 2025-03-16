
const Discord = require("discord.js");
const { ActionRowBuilder, SelectMenuBuilder } = require('discord.js');
const { PermissionsBitField } = require("discord.js")
let parse = require("parse-duration");
const moment = require("moment");
moment.locale('pt-br');
require("moment-duration-format");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'setvip',
    description: "Setar vip em um membro",
    run: async (client, message, args) => {
        
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let userReg = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!userReg) {

            const nomembro = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, por favor mencione alguém.`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [nomembro] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })
        }

        let encerraovip = await db.get(`encerravip_${userReg.id}`);

        if (encerraovip) {

            const temVip = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, o membro já possui VIP!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [temVip] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })

        }

        let dataBase = await db.get(`vips_${message.guild.id}.vip`);
        if (!dataBase || dataBase.length == 0) return;

        const row = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('vips')
                    .setPlaceholder('Nada selecionado')
                    .addOptions((await db.get(`vips_${message.guild.id}.vip`))?.map(pd => ({
                        label: pd.vipnome,
                        description: `Duração: ${pd.diasvip} dias`,
                        emoji: "1071507569467731968",
                        value: pd.vipID
                    }))
                    )
            )

        const MESSAGE = await message.channel.send({ content: '**Escolha um vip para adicionar:**', components: [row], ephemeral: true });
        const iFilter = (i) => i.user.id === message.author.id;
        const collector = MESSAGE.createMessageComponentCollector({ filter: iFilter });

        collector.on("collect", async b => {

            let nam = "VIP - " + userReg.user.username;

            (await db.get(`vips_${b.guild.id}.vip`))?.map(async mp => {

                if (b.isStringSelectMenu() && b.customId === "vips") {

                    switch (b.values[0]) {

                        case `${mp.vipID}`: {

                            b.deferUpdate();

                            parse["e"] = 0;
                            parse["dia"] = parse["day"];
                            parse["dias"] = parse["days"];

                            let tempo = parse(`${mp.diasvip} dias`) + Date.now();

                            let object1 = `{
                                "usuarioID": "${userReg.id}"
                            }`

                            const object2 = `{
                                
                                "encerra": "${tempo}",
                                "usuarioID": "${userReg.id}",
                                "cargoVip": "${mp.vipID}"
                            }`

                            await db.push('databasevip', JSON.parse(object1));
                            await db.push(`encerravip_${userReg.id}`, JSON.parse(object2));

                            const vip = b.guild.roles.cache.get(mp.vipID);

                            let setadoVip = new Discord.EmbedBuilder()
                                .setDescription(`${userReg} recebeu o VIP ${mp.vipnome} por ${mp.diasvip} dias!`)
                                .setColor(`${colorNB}`)

                            MESSAGE.delete();

                            message.channel.send({ embeds: [setadoVip] }).then((msg) => {

                                setTimeout(() => msg.delete(), 9000);
                            })

                            await userReg.roles.add(vip);

                            await db.set(`acabaovip_${b.guild.id}_${userReg.id}`, `${moment(tempo).format("LLL")}`);
                            await db.set(`limitevip_${b.guild.id}_${userReg.id}`, mp.limite);
                            await db.set(`vipdomembro_${userReg.id}`, mp.vipID);

                            let cargoPersonalizado = b.guild.roles.cache.get(mp.cargo);
                            let posicao = Number(cargoPersonalizado.rawPosition) - 1;

                            await b.guild.roles.create({
                                name: `${nam}`,
                                color: '#c1c2c2',
                                position: posicao,
                                permissions: [],
                                reason: 'Vip setado com sucesso',

                            }).then(async r => {
                                await db.set(`Rcar_${message.guild.id}_${userReg.id}`, r.id)
                                await userReg.roles.add(r.id);
                                r.setMentionable(true)

                                await b.guild.channels.create({
                                    name: `${nam}`,
                                    parent: `${mp.categ}`,
                                    type: Discord.ChannelType.GuildVoice,
                                    permissionOverwrites: [

                                        {
                                            id: r.id,
                                            allow:

                                                [

                                                    Discord.PermissionFlagsBits.ViewChannel,
                                                    Discord.PermissionFlagsBits.Connect

                                                ]

                                        },
                                        {
                                            id: b.guild.id,
                                            deny:

                                                [

                                                    Discord.PermissionFlagsBits.ViewChannel,
                                                    Discord.PermissionFlagsBits.Connect

                                                ]
                                        },
                                    ]

                                }).then(async c => {

                                    await db.set(`cal_${b.guild.id}_${userReg.id}`, c.id);

                                    const embed = new Discord.EmbedBuilder()
                                        .setAuthor({ name: `Vip adicionado` })
                                        .addFields(

                                            { name: `${client.xx.purple} Informações Principais`, value: `${client.xx.membro} **Membro**:\n${userReg} \`${userReg.id}\`\n${client.xx.vips}  **Vip**:\n${vip}\n${client.xx.duracao} **Vip termina em**:\n\`${moment(tempo).format("LLL")}\``, inline: true },
                                            { name: `${client.xx.purpleowner} Informações de Autoria`, value: `${client.xx.moderador} **Moderador**:\n${message.author}\n📅 **Setado em**:\n\`${moment(Date.now()).format('LLLL')}\``, inline: false }

                                        )
                                        .setColor(`${colorNB}`)


                                    let l = await db.get(`logsvipNB_`);
                                    let logs = b.guild.channels.cache.get(l);

                                    if (logs) await logs.send({ embeds: [embed] });

                                });
                            }

                            )
                        }
                    }
                }

            }


            )
        })
    }
}
