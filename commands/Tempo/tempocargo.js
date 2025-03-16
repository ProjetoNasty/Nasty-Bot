const Discord = require('discord.js')
const moment = require('moment')
const { PermissionsBitField } = require("discord.js")
moment.locale('pt-BR')
var ms = require('milliseconds'); // usei o milisseconds para transformas os segundos em milliseconds
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'tempoc',
    description: "Remover cargo de um membro",
    run: async (client, message, args) => {
        
       const cargos = [
            "998416235245096990",
            "1078663282170286172"
        ];

        if (!message.member.permissions.has(PermissionsBitField.Administrator) && !message.member.roles.cache.some(r => cargos.includes(r.id))) return;

        let cargo = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!cargo) return;

        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${cargo.name}`, iconURL: cargo.iconURL() })
            .setDescription(`Confira abaixo o Tempo do cargo: ${cargo}`)
            .setColor(cargo.color)

        await message.channel.send({ embeds: [embed] })

        cargo.members.forEach(async (member) => {

            let temponocargo = await db.get(`temponocargo_${member.id}`);

            let tempin

            if (temponocargo) {

                tempin = `\`${moment(temponocargo).fromNow()} no cargo.\``

            } else {

                tempin = "Tempo não encontrado."
            }

            let tempo = await db.get(`tempocall_${member.id}`);

            if (!tempo) {

            } else {

                tempo = tempo.toString().replace("-", "")

            }
            if (tempo === 0 || !tempo) {

                tempo = "Não possui nenhum tempo salvo."

            } else {

                let totalSeconds = (ms.seconds(tempo) / 1000);
                let hours = Math.floor(totalSeconds / 3600);
                totalSeconds %= 86400;
                totalSeconds %= 3600;
                let minutes = Math.floor(totalSeconds / 60);
                let seconds = Math.floor(totalSeconds % 60);

                tempo = hours + 'h, ' + minutes + 'm e ' + seconds + 's.';
            }

            await message.channel.send({ content: `${member} \`(${member.id})\` **|** ${tempo}` });

        })
    }
}