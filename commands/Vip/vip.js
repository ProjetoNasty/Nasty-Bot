
const Discord = require("discord.js");
const { default: axios } = require("axios");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const ms = require('ms');
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'vip',
    description: "Registrar um membro",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136'

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;

        let cargoVipDb = await db.get(`Rcar_${message.guild.id}_${message.author.id}`);
        let callVipDb = await db.get(`cal_${message.guild.id}_${message.author.id}`);
        let acabaovip = await db.get(`acabaovip_${message.guild.id}_${message.author.id}`);

        let cargoVip = message.guild.roles.cache.get(cargoVipDb);
        let callVip = message.guild.channels.cache.get(callVipDb);

        let noVip = new Discord.EmbedBuilder()
            .setDescription(`${message.author}, você não é um membro VIP!`)
            .setColor(`${colorNB}`)

        if (!cargoVip || !callVip) {

            return message.channel.send({ embeds: [noVip] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })
        }

        let rcar;
        let cal;

        if (!cargoVip) {

            rcar = `Nenhum`

        } else {

            rcar = `${cargoVip.name}`
        }

        if (!callVip) {

            cal = `Nenhum`

        } else {

            cal = `${callVip.name}`
        }

        let v = await db.get(`encerravip_${message.author.id}`);
        let encerra = v.map(encerra => encerra.encerra);

        let timeDb = encerra || 0;
        let timeCount = parseInt(timeDb - Date.now());
        let Restam = `${ms(timeCount)}`;

        const conv = Restam.replace(/(?<![A-Z])d(?![A-Z])/gi, ' dias');

        let vip = new Discord.EmbedBuilder()
            .setTitle(`Vip ${message.author.username}\nSeu vip se encerra ${acabaovip}\n(${conv} restantes)`)
            .setDescription(`**Cargo**: ${rcar}\n**Canal**: ${cal}\n\n** *Para adicionar seu cargo vip, use o comando:* **\n${prefixoNB}addvip (@usuario/id)\n** *Para remover seu cargo vip, use o comando:* **\n${prefixoNB}removevip (@usuario/id)`)
            .setThumbnail(message.author.avatarURL({ dynamic: true }))
            .setColor(`${colorNB}`)
            .setTimestamp()

        const rowVip = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Editar Cargo")
                    .setCustomId("editarcargo")
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setLabel("Editar Canal")
                    .setCustomId("editarcanal")
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setLabel("Amigos")
                    .setCustomId("amigos")
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setLabel("Fechar")
                    .setCustomId("fechar")
                    .setStyle(Discord.ButtonStyle.Danger))

        if (!cargoVip) rowVip.components[0].setDisabled(true);
        if (!callVip) rowVip.components[1].setDisabled(true);

        const MESSAGE = await message.channel.send({ embeds: [vip], components: [rowVip] });
        const filter = (i) => i.user.id === message.author.id;
        const collector = MESSAGE.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (b) => {

            if (b.user.id !== message.author.id) {

                return b.deferUpdate();
            }

            if (b.customId == 'editarcargo') {

                b.deferUpdate();

                let editarcargo = new Discord.EmbedBuilder()
                    .setTitle(`Vip ${message.author.username}`)
                    .setDescription(`**Cargo**: ${cargoVip}`)
                    .setColor(`${colorNB}`)
                    .setTimestamp()

                const rowCargo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Editar nome")
                            .setCustomId("editarnomecargo")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Editar cor")
                            .setCustomId("editarcorcargo")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Editar emoji")
                            .setCustomId("editaremojicargo")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Voltar")
                            .setCustomId("voltar")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [editarcargo], components: [rowCargo] })
            }

            if (b.customId == 'editarnomecargo') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o nome desejado para o cargo\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (ee == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Nome definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        cargoVip.setName(ee);

                        let editarcargo = new Discord.EmbedBuilder()
                            .setTitle(`Vip ${message.author.username}`)
                            .setDescription(`**Cargo**: ${cargoVip}`)
                            .setColor(`${colorNB}`)
                            .setTimestamp()

                        MESSAGE.edit({ embeds: [editarcargo] });
                    }
                })

            }

            if (b.customId == 'editarcorcargo') {

                const rowSite = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Site para buscar cor")
                            .setURL('https://html-color-codes.info/Codigos-de-Cores-HTML')
                            .setStyle(Discord.ButtonStyle.Link))

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a cor que deseja alterar\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], components: [rowSite], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (ee == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Cor definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        cargoVip.setColor(ee);

                        let editarcargo = new Discord.EmbedBuilder()
                            .setTitle(`Vip ${message.author.username}`)
                            .setDescription(`**Cargo**: ${cargoVip}`)
                            .setColor(`${colorNB}`)
                            .setTimestamp()

                        MESSAGE.edit({ embeds: [editarcargo] });
                    }
                })

            }

            if (b.customId == 'editaremojicargo') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o emoji desejado para o cargo\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    const getEmoji = Discord.parseEmoji(ee);
                    const emoji = b.guild.emojis.cache.get(getEmoji.id);

                    if (ee == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    if (!emoji) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Emoji não encontrado no servidor.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        if (getEmoji.id) {

                            const type = await axios.get(`https://cdn.discordapp.com/emojis/${getEmoji.id}.gif`)
                                .then(image => {

                                    if (image) return 'gif';
                                    else return 'png';

                                }).catch(err => {

                                    return 'png'

                                });

                            const emoji = `https://cdn.discordapp.com/emojis/${getEmoji.id}.${type}?quality=lossless`;

                            cargoVip.setIcon(emoji);

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Emoji definido com sucesso.`)
                                .setImage(emoji)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            let editarcargo = new Discord.EmbedBuilder()
                                .setTitle(`Vip ${message.author.username}`)
                                .setDescription(`**Cargo**: ${cargoVip}`)
                                .setColor(`${colorNB}`)
                                .setTimestamp()

                            MESSAGE.edit({ embeds: [editarcargo] });
                        }
                    }
                })

            }

            if (b.customId == 'editarcanal') {

                b.deferUpdate();

                let editarcanal = new Discord.EmbedBuilder()
                    .setTitle(`Vip ${message.author.username}`)
                    .setDescription(`**Canal**: ${callVip}\n**Limite de usuários**: ${callVip.userLimit}`)
                    .setColor(`${colorNB}`)
                    .setTimestamp()

                const rowCanal = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Editar nome")
                            .setCustomId("editarnomecanal")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Editar limite de usuários")
                            .setCustomId("editarlimitecanal")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Voltar")
                            .setCustomId("voltar")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [editarcanal], components: [rowCanal] })

            }

            if (b.customId == 'editarnomecanal') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o nome desejado para o canal\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (ee == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Nome definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        callVip.setName(ee);

                        let editarcanal = new Discord.EmbedBuilder()
                            .setTitle(`Vip ${message.author.username}`)
                            .setDescription(`**Canal**: ${callVip}\n**Limite de usuários**: ${callVip.userLimit}`)
                            .setColor(`${colorNB}`)
                            .setTimestamp()

                        MESSAGE.edit({ embeds: [editarcanal] });
                    }

                })

            }

            if (b.customId == 'editarlimitecanal') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o limite desejado para o canal\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (ee == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    if (isNaN(ee)) {

                        let nonumber = new Discord.EmbedBuilder()
                            .setDescription(`Por favor utilize apenas números`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [nonumber], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Nome definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        callVip.setUserLimit(ee);

                        let editarcanal = new Discord.EmbedBuilder()
                            .setTitle(`Vip ${message.author.username}`)
                            .setDescription(`**Canal**: ${callVip}\n**Limite de usuários**: ${ee}`)
                            .setColor(`${colorNB}`)
                            .setTimestamp()

                        MESSAGE.edit({ embeds: [editarcanal] });
                    }

                })

            }

            if (b.customId == 'voltar') {

                b.deferUpdate();

                let vip = new Discord.EmbedBuilder()
                    .setTitle(`Vip ${message.author.username}\nSeu vip se encerra ${acabaovip}\n(${conv} restantes)`)
                    .setDescription(`**Cargo**: ${rcar}\n**Canal**: ${cal}\n\n** *Para adicionar seu cargo vip, use o comando:* **\n${prefixoNB}addvip (@usuario/id)\n** *Para remover seu cargo vip, use o comando:* **\n${prefixoNB}removevip (@usuario/id)`)
                    .setThumbnail(message.author.avatarURL({ dynamic: true }))
                    .setColor(`${colorNB}`)
                    .setTimestamp()

                const rowVip = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Editar Cargo")
                            .setCustomId("editarcargo")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Editar Canal")
                            .setCustomId("editarcanal")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Amigos")
                            .setCustomId("amigos")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Fechar")
                            .setCustomId("fechar")
                            .setStyle(Discord.ButtonStyle.Danger))

                if (!cargoVip) rowVip.components[0].setDisabled(true);
                if (!callVip) rowVip.components[1].setDisabled(true);

                MESSAGE.edit({ embeds: [vip], components: [rowVip] });

            }

            if (b.customId == 'amigos') {

                const strFilter = b.guild.members.cache.filter(x => x._roles.includes(cargoVipDb))
                let amigos = strFilter.map(m => `**${m.user.username} [ ${m.user.id} ]**`).join("\n")

                let amg

                if (strFilter.size == 1) {

                    amg = `${strFilter.size} amigo no total.`;

                } else {

                    amg = `${strFilter.size} amigos no total.`;

                }

                for (let i = 0; i < amigos.length; i += 1995) {

                    let strContent = amigos.substring(i, Math.floor(amigos.length, i + 1995));

                    let amigosEmbed = new Discord.EmbedBuilder()
                        .setTitle(`amigos de ${message.author.username}!`)
                        .setDescription(`${strContent}`)
                        .setColor(`${colorNB}`)
                        .setFooter({ text: `${amg}` })

                    b.reply({ embeds: [amigosEmbed], ephemeral: true });
                }

            }

            if (b.customId == 'fechar') {

                b.deferUpdate();

                MESSAGE.delete();

            }

            collector.on('end', async (reason) => {

                if (reason) await MESSAGE.delete().catch(err => { });

            });

        })
    }
}