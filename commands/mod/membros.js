const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'membros',
    description: "Listar todos os adm's do servidor",

    run: async (client, message, args) => {
        
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

       let cargo = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

        const lista = message.guild.members.cache.filter(x => x._roles.includes(cargo.id)).map(u => u.user).join("\n")

        let embed = new Discord.EmbedBuilder()
            .setAuthor({name: `${cargo.name}`, iconURL: cargo.iconURL()})
            .setDescription(`*Confira abaixo a lista de usu�rios que possuem o cargo:* \n> *${cargo}.*`)
            .setColor(cargo.color)

        let embed2 = new Discord.EmbedBuilder()
            .setDescription(`*Fim da lista.*`)
            .setColor(cargo.color)
            .setFooter({ text:`Requisitado por: ${message.author.username}`})

        await message.channel.send({embeds: [embed]}),
            await message.channel.send({ content: `${lista}`}),
            await message.channel.send({ embeds: [embed2]})

    }

    }
