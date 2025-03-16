const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'unban',
    description: "",
    run: async (client, message, args) => {
        

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136'

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;

        let bannedMemberInfo = await message.guild.bans.fetch();

        let bannedMember;
        bannedMember = bannedMemberInfo.find(b => b.user.username.toLowerCase() === args[0].toLocaleLowerCase()) || bannedMemberInfo.get(args[0]) || bannedMemberInfo.find(bm => bm.user.username.toLowerCase() === args[0].toLocaleLowerCase());

        var motivo = args[1] ? args.slice(1).join(' ') : 'sem motivo';

        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {

            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem a permissão necessária!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })
        }

        if (!args[0]) {

            let noMember = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você precisa mencionar um membro.`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noMember] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })
        }
        if (!bannedMember) {

            let noBan = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, o membro não se encontra banido!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noBan] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        } else {

            var desbanimentos = await db.get(`desbans_${message.author.id}`);
            if (!desbanimentos) desbanimentos = 0;
            desbanimentos++;

            let unbn = await db.get(`logUnbanNB_${message.guild.id}`);
            const logunBan = message.guild.channels.cache.get(unbn);

            let embedUnban = new Discord.EmbedBuilder()
                .setDescription(`O membro ${bannedMember.user.username} foi desbanido por ${message.author}!\nMotivo: \`${motivo}\``)
                .setColor(`${colorNB}`)
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })

            message.channel.send({ embeds: [embedUnban] }).then((msg) => {

                setTimeout(() => msg.delete(), 60000);

            })

            if (logunBan) await logunBan.send({ embeds: [embedUnban] }).catch(err => { });

            await db.add(`desbans_${message.author.id}`, 1);

            await message.guild.members.unban(bannedMember.user.id, motivo).catch(err => { });
        }

    }
}