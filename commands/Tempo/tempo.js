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
    name: 'tempo',
    description: "Remover cargo de um membro",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let cargosTempo = await db.get(`sistemaTempo_${message.guild.id}.cargos`);
        if (!cargosTempo) cargosTempo = [''];

        if (!message.member.roles.cache.some(r => cargosTempo.includes(r.id))) return;

        let inicio = await db.get(`inicio_${message.author.id}`);
        let tempo = await db.get(`tempocall_${message.author.id}`);

        const resp = (await db.all()).filter(data => data.id.startsWith('tempocall_', { sort: '.data' })).sort((a, b) => b.value - a.value);
        paginatedItems = resp.slice(0, 30);
        var rankMensagem = "";

        for (var i in paginatedItems) {

            if (paginatedItems[i].value == undefined || paginatedItems[i].value == "") {

            } else {

                let tempo = paginatedItems[i].value
                let totalSeconds = (ms.seconds(tempo) / 1000);
                let hours = Math.floor(totalSeconds / 3600);
                totalSeconds %= 86400;
                totalSeconds %= 3600;
                let minutes = Math.floor(totalSeconds / 60);
                let seconds = Math.floor(totalSeconds % 60);

                tempo = hours + ' horas ' + minutes + ' minutos e ' + seconds + ' segundos.';
                let nick = paginatedItems[i].id.replace("tempocall_", "")

                if (message.guild.members.cache.get(nick)) {

                    nick = message.guild.members.cache.get(nick)
                    rankMensagem += `${paginatedItems.indexOf(paginatedItems[i]) + 1}. <@${nick.user.id}> | ${tempo}\n⠀\n`;

                } else {

                    // Se o usuário não for encontrado no servidor, ele não retornará nada!
                }
            }
        }

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

            tempo = hours + ' horas ' + minutes + ' minutos e ' + seconds + ' segundos';
        }

        let every = (await db.all()).filter(data => data.id.startsWith('tempocall_', { sort: '.data' })).sort((a, b) => b.value - a.value);
        let rank = every.map(x => x.id).indexOf(`tempocall_${message.author.id}`) + 1;

        let penis

        if (rank.toString() == "0") {

            penis = "Sem Rank.";

        } else {

            penis = `#**${rank.toString()}**`;
        }

        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${message.guild.name}・Tempo`, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setTitle(`Membro: ${message.author.username}`)
            .setThumbnail(message.author.avatarURL({ dynamic: true }))
            .addFields(
                { name: `🏆 Rank:`, value: `${penis}` },
                { name: `🕗 Tempo Salvo:`, value: `${tempo}` })

            .setColor(`${colorNB}`)
            .setTimestamp()
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })

        let infos1 = await db.get(`contando_${message.author.id}`);
        if (infos1 == false) {

        } else {

            if (message.member.voice.channel) { // Checando se o usuário está em uma call (acreditamos que isto estava contribuindo para a falha na contagem de horas.)

                let infos = JSON.parse(infos1)
                const tempo_acumulado = await db.get(`call_${message.author.id}`)
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
                tempo_acumulado_total = hours2 + ' horas ' + minutes2 + ' minutos e ' + seconds2 + ' segundos';

                embed.addFields(
                    { name: "🕗 Tempo Acumulando:", value: `${tempo_acumulado_total}`, "inline": false },
                    { name: "Canal:", value: `\`${message.member.voice.channel.name}\``, "inline": true },
                    { name: "Início:", value: `\`Hoje ás ${inicio}\``, "inline": true })

                embed.setTimestamp()
            }
        }

        let row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel('Ver Rank')
                    .setCustomId("rank")
                    .setStyle(Discord.ButtonStyle.Primary))

        const MESSAGE = await message.channel.send({ embeds: [embed], components: [row], fetchReply: true })
        const iFilter = i => i.user.id;
        const collector = MESSAGE.createMessageComponentCollector({ iFilter, time: 60000 });

        collector.on('collect', async (b) => {

            if (b.customId == "rank") {

                if (b.user.id !== message.author.id) return;

                let semRank = new Discord.EmbedBuilder()
                .setDescription(`${b.member}, o Rank se encontra zerado!`)
                .setColor(`${colorNB}`)

                if (!resp.length) return b.reply({ embeds: [semRank] });

                let embedRank = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${message.guild.name} - Rank`, iconURL: message.guild.iconURL({ dynamic: true }) })
                    .setDescription(`› Confira abaixo o nosso rank de Tempocall.\n⠀⠀\n${rankMensagem}`)
                    .setThumbnail(message.guild.iconURL({ dynamic: true }))
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedRank], ephemeral: true });

            }

            collector.on('end', async (reason) => {

                if (reason) await MESSAGE.delete().catch(err => { });

            });
            
        })
    }
};