const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'removercargo',
    description: "Remover cargo de um membro",
    run: async (client, message, args) => {
        
        

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136'

        let prefixoNB= await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB= prefix;

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {

            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem a permissão necessária!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        }

        let membro = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!membro) {

            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, utilize ${prefixoNB}removercargo (@cargo/id) (@usuario/id)`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        }

        let role1 =
            message.guild.roles.cache.find(r => r.name == args[1]) ||
            message.guild.roles.cache.find(r => r.id == args[1]) ||
            message.mentions.roles.first() ||
            args.join(" ");

        if (!role1) return;

        var role = message.guild.roles.cache.find(r => r.name === args[1]) ||
            message.guild.roles.cache.find(r => r.id == args[1]) ||
            message.mentions.roles.first();

        if (!role) return;

        const highest = message.member.roles.highest;

        if (highest.comparePositionTo(role1) <= 0) {

            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não pode remover este cargo!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        }

        if (highest.comparePositionTo(role) <= 0) {

            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não pode remover este cargo!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        }

        const embed1 = new Discord.EmbedBuilder()
            .setDescription(`O cargo ${role} foi removido de ${membro}`)
            .setColor(`${colorNB}`)

        membro.roles.remove(role1);

        message.channel.send({ embeds: [embed1] }).then((msg) => {

            setTimeout(() => msg.delete(), 8000);
        })

    }
};
