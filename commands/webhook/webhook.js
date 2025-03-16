const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: "webhook",
    category: "Criar Webhook",
    description: "",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {

            const novip = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não pode utilizar esse comando!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [novip] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })

        };

        let canal = message.mentions.channels.first() || message.guild.channels.cache.get(args[0])

        let embedmsgs = new Discord.EmbedBuilder()
            .setDescription(`${message.author}, por favor execute o comando da maneira correta (${prefixoNB}webhook <#${message.channel.id}>)`)
            .setColor(`${colorNB}`)

        if (!canal) {

            return message.channel.send({ embeds: [embedmsgs] }).then((msg) => {

                setTimeout(() => msg.delete(), 7000);
            })

        }

        const web = new Discord.EmbedBuilder()
            .setAuthor({ name: `Criando no canal: ${canal.name}`, iconURL: `https://cdn.discordapp.com/emojis/1015228066315911230.gif` })
            .setTitle(`Título`)
            .setDescription(`> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`)
            .setThumbnail(`https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png`)
            .setColor(`${colorNB}`)
            .setImage(`https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png`)
            .setFooter({ text: `${message.guild.name} ©` })

        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Definir Título")
                    .setCustomId("title")
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setLabel("Definir Descrição")
                    .setCustomId("desc")
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setLabel("Definir Imagem")
                    .setCustomId("setimage")
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setLabel("Definir Imagem de Canto")
                    .setCustomId("imagemcanto")
                    .setStyle(Discord.ButtonStyle.Secondary))

        const row2 = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Enviar")
                    .setCustomId("enviar")
                    .setStyle(Discord.ButtonStyle.Success),
                new Discord.ButtonBuilder()
                    .setLabel("Fechar o painel de criação")
                    .setCustomId("fechar")
                    .setStyle(Discord.ButtonStyle.Danger))

        const MESSAGE = await message.channel.send({ embeds: [web], components: [row, row2] })
        const filter = (i) => i.user.id === message.author.id;
        const collector = MESSAGE.createMessageComponentCollector({ filter });

        collector.on('collect', async (b) => {

            if (b.customId == 'title') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let title = message.content;

                    if (title == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Título definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`title_${MESSAGE.id}`, title);

                        let titulo = await db.get(`title_${MESSAGE.id}`);
                        if (!titulo) titulo = 'Título';
                        let desc = await db.get(`desc_${MESSAGE.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecanto_${MESSAGE.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimage_${MESSAGE.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] });

                    }
                })
            }

            if (b.customId == 'desc') {

                let tit = await db.get(`title_${MESSAGE.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`desc_${MESSAGE.id}`, descr);

                        let titulo = await db.get(`title_${MESSAGE.id}`);
                        if (!titulo) titulo = 'Título';
                        let desc = await db.get(`desc_${MESSAGE.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecanto_${MESSAGE.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimage_${MESSAGE.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimage") {

                let descri = await db.get(`desc_${MESSAGE.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;

                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimage_${MESSAGE.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`title_${MESSAGE.id}`);
                            if (!titulo) titulo = 'Título';
                            let desc = await db.get(`desc_${MESSAGE.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecanto_${MESSAGE.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimage_${MESSAGE.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                })
            }

            if (b.customId == "imagemcanto") {

                let descri = await db.get(`desc_${MESSAGE.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecanto_${MESSAGE.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`title_${MESSAGE.id}`);
                            if (!titulo) titulo = 'Título';
                            let desc = await db.get(`desc_${MESSAGE.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecanto_${MESSAGE.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimage_${MESSAGE.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookReg = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookReg] });
                        }
                    })
                }
                )

            } // fim imagem de canto

            if (b.customId == 'enviar') {

                let descri = await db.get(`desc_${MESSAGE.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`title_${MESSAGE.id}`);
                    let desc = await db.get(`desc_${MESSAGE.id}`);
                    let thumb = await db.get(`imagemdecanto_${MESSAGE.id}`);
                    let image = await db.get(`setimage_${MESSAGE.id}`);

                    const embedWeb = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${b.guild.name} ©` })

                    await canal.send({ embeds: [embedWeb] }).catch(err => { });

                    MESSAGE.delete();
                    
                    await db.delete(`title_${MESSAGE.id}`);
                    await db.delete(`desc_${MESSAGE.id}`);
                    await db.delete(`imagemdecanto_${MESSAGE.id}`);
                    await db.delete(`setimage_${MESSAGE.id}`);

                }
            } // fim enviar reg

            if (b.customId == 'fechar') {

                b.deferUpdate();

                MESSAGE.delete();
            }

        })
    }
}