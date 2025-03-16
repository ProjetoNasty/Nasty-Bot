

const Discord = require('discord.js');
const { default: axios } = require("axios");
const { PermissionsBitField } = require("discord.js")
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'cargo',
    description: '',
    run: async (client, message, args) => {
        
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return;

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;

        let cargo = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

        if (!cargo) {

            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, utilize ${prefixoNB}cargo (@cargo/id)`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        }

        const lista = message.guild.members.cache.filter(x => x._roles.includes(cargo.id)).map(u => u.user).join("\n")
        const membros = message.guild.members.cache.filter(x => x._roles.includes(cargo.id)).size;

        let embedCargo = new Discord.EmbedBuilder()
            .setAuthor({ name: `${cargo.name}`, iconURL: cargo.iconURL() })
            .setDescription(`**Cargo**: ${cargo}\n**Membros**: ${membros}`)
            .setThumbnail(cargo.iconURL())
            .setTimestamp()

        if (cargo.color) embedCargo.setColor(cargo.color);

        const rowCargo = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Editar Nome")
                    .setCustomId("editarnome")
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setLabel("Editar Cor")
                    .setCustomId("editarcor")
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setLabel("Editar emoji")
                    .setCustomId("editaremoji")
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setLabel("Membros")
                    .setCustomId("membros")
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setLabel("Fechar")
                    .setCustomId("fechar")
                    .setStyle(Discord.ButtonStyle.Danger))

        const MESSAGE = await message.channel.send({ embeds: [embedCargo], components: [rowCargo] });
        const filter = (i) => i.user.id === message.author.id;
        const collector = MESSAGE.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (b) => {

            if (b.customId == 'editarnome') {

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

                        let embedCargo = new Discord.EmbedBuilder()
                            .setAuthor({ name: `${cargo.name}`, iconURL: cargo.iconURL() })
                            .setDescription(`**Cargo**: ${cargo}\n**Membros**: ${membros}`)
                            .setThumbnail(cargo.iconURL())
                            .setTimestamp()

                        if (cargo.color) embedCargo.setColor(cargo.color);

                        MESSAGE.edit({ embeds: [embedCargo] });
                    }
                })

            }

            if (b.customId == 'editarcor') {

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

                        let embedCargo = new Discord.EmbedBuilder()
                            .setAuthor({ name: `${cargo.name}`, iconURL: cargo.iconURL() })
                            .setDescription(`**Cargo**: ${cargo}\n**Membros**: ${membros}`)
                            .setColor(cargo.color)
                            .setThumbnail(cargo.iconURL())
                            .setTimestamp()

                        MESSAGE.edit({ embeds: [embedCargo] });
                    }
                })

            }

            if (b.customId == 'editaremoji') {

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

                            let embedCargo = new Discord.EmbedBuilder()
                                .setAuthor({ name: `${cargo.name}`, iconURL: `${emoji}` })
                                .setDescription(`**Cargo**: ${cargo}\n**Membros**: ${membros}`)
                                .setThumbnail(cargo.iconURL())
                                .setTimestamp()

                            if (cargo.color) embedCargo.setColor(cargo.color);

                            MESSAGE.edit({ embeds: [embedCargo] });
                        }
                    }
                })
            }

            if (b.customId == 'membros') {

                b.reply({ content: `${lista}`, ephemeral: true })
            }

            if (b.customId == 'fechar') {

                b.deferUpdate();

                MESSAGE.delete();
            }

            collector.on('end', async (reason) => {

                if (reason) {

                    await MESSAGE.delete().catch(err => { });
                }

            });
        })
    }
}