
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
    name: 'setvipf',
    description: "Setar vip em um membro",
    run: async (client, message, args) => {
        
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        let userReg = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!userReg) return;

        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.SelectMenuBuilder()
                    .setCustomId('vipf')
                    .setPlaceholder('Nada selecionado.')
                    .addOptions(
                        {
                            label: 'Vip família',
                            emoji: '1071507569467731968',
                            value: 'vipfamilia',
                        }
                    ))

        const MESSAGE = await message.channel.send({ content: '**Escolha o vip para adicionar:**', components: [row], ephemeral: true });
        const iFilter = (i) => i.user.id === message.author.id;
        const collector = MESSAGE.createMessageComponentCollector({ filter: iFilter });

        collector.on("collect", async b => {

            let colorNB = await db.get(`colorNB`);
            if (!colorNB) colorNB = '#2f3136';

            if (b.user.id !== message.author.id) return;

            let nam = "VIP Família - " + userReg.user.username;

            if (b.isStringSelectMenu() && b.customId === "vipf") {

                switch (b.values[0]) {

                    case `vipfamilia`: {

                        b.deferUpdate();

                        let setadoVip = new Discord.EmbedBuilder()
                            .setDescription(`${userReg} recebeu o VIP família!`)
                            .setColor(`${colorNB}`)

                        MESSAGE.delete();

                        message.channel.send({ embeds: [setadoVip] }).then((msg) => {

                            setTimeout(() => msg.delete(), 9000);
                        })

                        await b.guild.roles.create({
                            name: `${nam}`,
                            color: '#c1c2c2',
                            position: 99,
                            permissions: [],
                            reason: 'Vip setado com sucesso',

                        }).then(async r => {
                            await db.set(`vipfml_${message.guild.id}_${userReg.id}`, r.id);
                            userReg.roles.add(r.id)
                            r.setMentionable(true)

                        })
                    }
                }
            }
        })
    }
}