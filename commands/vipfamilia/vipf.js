
const Discord = require("discord.js");
const { default: axios } = require("axios");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'vipf',
    description: "Registrar um membro",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let prefixoR4 = await db.get(`prefixoR4`);
        if (!prefixoR4) prefixoR4 = prefix;

        let vipFamilia = await db.get(`vipfml_${message.guild.id}_${message.author.id}`);
        let cargo = message.guild.roles.cache.get(vipFamilia);

        const Membros = message.guild.members.cache.filter(x => x._roles.includes(cargo.id)).size;

        let noVip = new Discord.EmbedBuilder()
            .setDescription(`${message.author}, você não tem um VIP família!`)
            .setColor(`${colorNB}`)

        if (!cargo) {

            return message.channel.send({ embeds: [noVip] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })
        }

        let vip = new Discord.EmbedBuilder()
            .setAuthor({ name: `${message.guild.name} - Painel de Família`, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setDescription(`**»** Seja bem vindo ao painel de Família.\nAqui, você poderá ver e editar informações importantes.\n\n${client.xx.purple} **Informações**:\n> **Dono**: ${message.author}\n> **Cargo:** ${cargo}\n> **Membros**: ${Membros} ao Total\n\n${client.xx.purple} **Ações**:\n> \`1\` Editar Cargo\n> \`2\` Ver Membros\n> \`3\` Fechar Painel`)
            .setThumbnail(cargo.iconURL({ dynamic: true }))
            .setColor(cargo.color)

        const rowVip = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Editar Cargo")
                    .setCustomId("editarcargof")
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setLabel("Ver Membros")
                    .setCustomId("vermembrosf")
                    .setStyle(Discord.ButtonStyle.Primary),              
                new Discord.ButtonBuilder()
                    .setLabel("Fechar")
                    .setCustomId("fecharf")
                    .setStyle(Discord.ButtonStyle.Danger))

        const MESSAGE = await message.channel.send({ embeds: [vip], components: [rowVip] });
        const filter = (i) => i.user.id === message.author.id;
        const collector = MESSAGE.createMessageComponentCollector({ filter });

        collector.on('collect', async (b) => {

            if (b.customId == 'editarcargof') {

                b.deferUpdate();

                let editarcargo = new Discord.EmbedBuilder()
                    .setTitle(`Vip família ${cargo.name}`)
                    .setDescription(`**Cargo**: ${cargo}\n\n** *Para adicionar seu cargo vip, use o comando:* **\n${prefixoR4}addvipf (@usuario/id)\n** *Para remover seu cargo vip, use o comando:* **\n${prefixoR4}removevipf (@usuario/id)`)
                    .setColor(cargo.color)
                    .setThumbnail(cargo.iconURL({ dynamic: true }))
                    .setTimestamp()

                const rowCargo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Editar nome")
                            .setCustomId("editarnomecargof")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Editar cor")
                            .setCustomId("editarcorcargof")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Editar emoji")
                            .setCustomId("editaremojicargof")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Voltar")
                            .setCustomId("voltarf")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [editarcargo], components: [rowCargo] })
            }

            if (b.customId == 'editarnomecargof') {

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

                        cargo.setName(ee);

                        let editarcargo = new Discord.EmbedBuilder()
                            .setTitle(`Vip família ${cargo.name}`)
                            .setDescription(`**Cargo**: ${cargo}\n\n** *Para adicionar seu cargo vip, use o comando:* **\n${prefixoR4}addvipf (@usuario/id)\n** *Para remover seu cargo vip, use o comando:* **\n${prefixoR4}removevipf (@usuario/id)`)
                            .setColor(cargo.color)
                            .setThumbnail(cargo.iconURL({ dynamic: true }))
                            .setTimestamp()

                        MESSAGE.edit({ embeds: [editarcargo] });
                    }
                })

            }

            if (b.customId == 'editarcorcargof') {

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

                        cargo.setColor(ee);

                        let editarcargo = new Discord.EmbedBuilder()
                            .setTitle(`Vip família ${cargo.name}`)
                            .setDescription(`**Cargo**: ${cargo}\n\n** *Para adicionar seu cargo vip, use o comando:* **\n${prefixoR4}addvipf (@usuario/id)\n** *Para remover seu cargo vip, use o comando:* **\n${prefixoR4}removevipf (@usuario/id)`)
                            .setColor(cargo.color)
                            .setThumbnail(cargo.iconURL({ dynamic: true }))
                            .setTimestamp()

                        MESSAGE.edit({ embeds: [editarcargo] });
                    }
                })

            }

            if (b.customId == 'editaremojicargof') {

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

                            cargo.setIcon(emoji);

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Emoji definido com sucesso.`)
                                .setImage(emoji)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            let editarcargo = new Discord.EmbedBuilder()
                                .setTitle(`Vip família ${cargo.name}`)
                                .setDescription(`**Cargo**: ${cargo}\n\n** *Para adicionar seu cargo vip, use o comando:* **\n${prefixoR4}addvipf (@usuario/id)\n** *Para remover seu cargo vip, use o comando:* **\n${prefixoR4}removevipf (@usuario/id)`)
                                .setColor(cargo.color)
                                .setThumbnail(cargo.iconURL({ dynamic: true }))
                                .setTimestamp()

                            MESSAGE.edit({ embeds: [editarcargo] });
                        }
                    }
                })

            }

            if (b.customId == 'voltarf') {

                b.deferUpdate();

                let vipf = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${message.guild.name} - Painel de Família`, iconURL: message.guild.iconURL({ dynamic: true }) })
                    .setDescription(`**»** Seja bem vindo ao painel de Família.\nAqui, você poderá ver e editar informações importantes.\n\n${client.xx.purple} **Informações**:\n> **Dono**: ${message.author}\n> **Cargo:** ${cargo}\n> **Membros**: ${Membros} ao Total\n\n${client.xx.purple} **Ações**:\n> \`1\` Editar Cargo\n> \`2\` Ver Membros\n> \`3\` Fechar Painel`)
                    .setThumbnail(cargo.iconURL({ dynamic: true }))
                    .setColor(cargo.color)

                const rowVipf = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Editar Cargo")
                            .setCustomId("editarcargof")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Ver Membros")
                            .setCustomId("vermembrosf")
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Fechar")
                            .setCustomId("fecharf")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [vipf], components: [rowVipf] });

            }

            if (b.customId == 'vermembrosf') {

                const strFilter = b.guild.members.cache.filter(x => x._roles.includes(cargo.id))
                let membros = strFilter.map(m => `**${m.user.username} [ ${m.user.id} ]**`).join("\n")

                let mb

                if (strFilter.size == 1) {

                    mb = `${strFilter.size} membro no total.`;

                } else {

                    mb = `${strFilter.size} membros no total.`;

                }

                for (let i = 0; i < membros.length; i += 1995) {

                    let strContent = membros.substring(i, Math.floor(membros.length, i + 1995));

                    let membrosEmbed = new Discord.EmbedBuilder()
                        .setTitle(`membros da família ${cargo.name}!`)
                        .setDescription(`${strContent}`)
                        .setColor(cargo.color)
                        .setFooter({ text: `${mb}` })

                    b.reply({ embeds: [membrosEmbed], ephemeral: true });
                }

            }

            if (b.customId == 'fecharf') {

                b.deferUpdate();

                MESSAGE.delete();

            }
        })
    }
}