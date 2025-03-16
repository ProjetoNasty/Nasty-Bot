const Discord = require("discord.js");
const moment = require("moment");
moment.locale('pt-br');
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'unmute',
    description: "",
    run: async (client, message, args) => {
        
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        const Member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

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

        if (message.member.roles.highest.position <= Member.roles.highest.position) {

            let permBaixa = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, não pode desmutar um membro com cargo acima do seu!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [permBaixa] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);

            })

        } else {

            let idcargo = await db.get(
                `silenciado_${Member.id}`
            )

            let muterole = message.guild.roles.cache.get(idcargo);

            if (!idcargo) {

                let noMute = new Discord.EmbedBuilder()
                    .setDescription(`${message.author}, cargo de \`Mutado\` não foi encontrado!`)
                    .setColor(`${colorNB}`)

                return message.channel.send({ embeds: [noMute] }).then((msg) => {

                    setTimeout(() => msg.delete(), 8000);

                })

            }

            if (!idcargo) {

                let noMute = new Discord.EmbedBuilder()
                    .setDescription(`${message.author}, o membro não está mutado!`)
                    .setColor(`${colorNB}`)

                return message.channel.send({ embeds: [noMute] }).then((msg) => {

                    setTimeout(() => msg.delete(), 8000);

                })

            }

            await Member.roles.remove(muterole.id).catch(err => { });

            await db.delete(`silenciado_${Member.id}`);
            await db.delete(`mutedatabase_${Member.id}`);

            await db.delete('databasemute',
                (await db.get('databasemute'))?.filter(e => e !== e.usuarioID !== Member.id));

            const mutado = new Discord.EmbedBuilder()
                .setDescription(`${message.author} desmutou ${Member}!`)
                .setColor(`${colorNB}`)

            await message.channel.send({ embeds: [mutado] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);

            })

            let u = await db.get(`silenciadosVozNB_${message.guild.id}`);
            const logUnmute = b.guild.channels.cache.get(u);

            let embedel = new Discord.EmbedBuilder()
                .setAuthor({ name: 'Membro desmutado', iconURL: `https://cdn.discordapp.com/emojis/1048641253933326346.png` })
                .setDescription(`${client.xx.moderador} **Moderador**:\n${message.author} \`${message.author.username}\`\n${client.xx.membro} **Membro**:\n${Member} \`${Member.user.username}\``)
                .setColor(`${colorNB}`)
                
            if (logUnmute) await logUnmute.send({ embeds: [embedel] }).catch(err => { });


        }
    }
}