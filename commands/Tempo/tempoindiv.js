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
    name: 'tempoi',
    description: "",
    run: async (client, message, args) => {
        
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136'

        const membro = message.mentions.users.first() ||
            message.guild.members.cache.get(args[0])

        const fael = message.guild.members.cache.get(membro?.id)

        let inicio = await db.get(`inicio_${membro.id}`)

        let tempo = await db.get(`tempocall_${membro.id}`)

        if (!tempo) {

        } else {

            tempo = tempo.toString().replace("-", "")

        }

        if (tempo === 0 || !tempo) {

            tempo = "Você não possui nenhum tempo salvo."

        } else {

            let totalSeconds = (ms.seconds(tempo) / 1000);
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 86400;
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = Math.floor(totalSeconds % 60);

            tempo = hours + 'h, ' + minutes + 'm e ' + seconds + 's.';
        }

        let every = (await db.all()).filter(data => data.id.startsWith('tempocall_', { sort: '.data' })).sort((a, b) => b.value - a.value);
        let rank = every.map(x => x.id).indexOf(`tempocall_${membro.id}`) + 1;

        let penis

        if (rank.toString() == "0") {

            penis = "Sem Rank."

        } else {

            penis = `#**${rank.toString()}**`
        }

        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${message.guild.name}・Tempo`, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setTitle(`Membro: ${fael.user.username}`)
            .addFields(
                { name: "🏆 Rank", value: `${penis}`, "inline": false },
                { name: "🕗 Tempo:", value: `${tempo}`, "inline": true }
            )
            .setThumbnail(fael.user.avatarURL({ dynamic: true }))
            .setColor(`${colorNB}`)
            .setTimestamp()
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })

        let infos1 = await db.get(`contando_${membro.id}`)
        if (infos1 == false) {

        } else {

            if (fael.voice.channel) { // Checando se o usuário está em uma call (acreditamos que isto estava contribuindo para a falha na contagem de horas.)

                let infos = JSON.parse(infos1)
                const tempo_acumulado = await db.get(`call_${membro.id}`)
                const start_acumulado = new Date().getTime();

                const diff_acumulado = Math.abs(tempo_acumulado - start_acumulado);
                const tempo2_acumulado = Math.ceil(diff_acumulado / 1000)

                let tempo_acumulado_total = (ms.seconds(tempo2_acumulado) / 1000);

                tempo_acumulado_total %= 86400;
                let hours2 = Math.floor(tempo_acumulado_total / 3600);
                tempo_acumulado_total %= 86400;
                tempo_acumulado_total %= 3600;
                let minutes2 = Math.floor(tempo_acumulado_total / 60);
                let seconds2 = Math.floor(tempo_acumulado_total % 60);

                tempo_acumulado_total = hours2 + 'h, ' + minutes2 + 'm e ' + seconds2 + 's.';

                embed.addFields(
                    { name: "🕗 Tempo Acumulando:", value: `${tempo_acumulado_total}`, "inline": false },
                    { name: "Canal:", value: `\`${fael.voice.channel.name}\``, "inline": true },
                    { name: "Início:", value: `\`${inicio == null ? 'a call não conta tempo' : `Hoje ás ${inicio}`} \``, "inline": true })

                embed.setTimestamp()

            }
        }

        await message.channel.send({ embeds: [embed]});
    }
}