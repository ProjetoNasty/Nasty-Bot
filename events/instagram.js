const client = require('..');
const Discord = require("discord.js");
const moment = require("moment");
moment.locale('pt-br');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const likee = '1266580277527056424';
const llike = '1266582685816586333';
const comment = '1266582577414934593';
const lcomment = '1266582577414934593';
const delet = '1266576507078185084';

let collectorActive = false;
let instaChannel = null;
let collector = null;

const checkBotStatus = async () => {
    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    return Math.floor(diferencaMs / (1000 * 60 * 60 * 24)) > 0;
};

const checkChannel = async () => {
    let instaId = await db.get(`canaldoinsta_`);
    if (!instaId) return;

    instaChannel = await client.channels.cache.get(instaId);
    if (!instaChannel) {
        console.error("Instagram channel not found.");
        return;
    }

    if (!collectorActive) {
        collector = instaChannel.createMessageCollector({ filter: msg => !msg.author.bot });

        collector.on('collect', async (collect) => {
            if (collect.attachments.size !== 1) {
                return collect.delete().catch(err => { });
            }

            let attachment = collect.attachments.first();
            const fileType = attachment.contentType;

            if (fileType && (fileType.startsWith('image/') || fileType.startsWith('video/') || fileType === 'video/quicktime')) {
                let Posts = await db.get(`${collect.member.id}.instagram`) || [];
                let IdPost = Posts.length + 1;
                const object = {
                    "Id": IdPost,
                    "userId": collect.member.id,
                    "likes": [],
                    "comment": []
                };
                Posts.push(object);
                await db.set(`${collect.member.id}.instagram`, Posts);

                const rowInsta = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder().setLabel('0').setEmoji(likee).setCustomId(`like:${collect.member.id}:${IdPost}`).setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder().setLabel('0').setEmoji(comment).setCustomId(`comentar:${collect.member.id}:${IdPost}`).setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder().setEmoji(llike).setCustomId(`likes:${collect.member.id}:${IdPost}`).setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder().setEmoji(lcomment).setCustomId(`comentarios:${collect.member.id}:${IdPost}`).setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder().setEmoji(delet).setCustomId(`excluir:${collect.member.id}:${IdPost}`).setStyle(Discord.ButtonStyle.Secondary)
                    );

                let hook = await instaChannel.fetchWebhooks();
                let webhook = hook.first();
                if (!webhook) {
                    webhook = await instaChannel.createWebhook({
                        name: 'Instagram Bot',
                        avatar: 'https://i.imgur.com/AfFp7pu.png',
                    });
                }

                webhook.send({
                    content: `> ${collect.member.toString()}:
        ${collect.content}`,
                    username: collect.member.user.username,
                    avatarURL: collect.member.user.avatarURL({ dynamic: true }),
                    files: [attachment],
                    components: [rowInsta]
                }).then(() => {
                    collect.delete().catch(err => { });
                }).catch(err => {
                    console.error("Erro ao enviar para o webhook:", err);
                });
            } else {
                collect.delete().catch(err => { });
                collect.reply("O anexo não é uma imagem ou vídeo válido. Tente novamente com um formato suportado.");
            }
        });

        collectorActive = true;
    }
};

client.on('ready', async () => {
    if (!(await checkBotStatus())) return;

    await checkChannel();
    setInterval(checkChannel, 5000);
});

client.on('interactionCreate', async (instab) => {
    if (!(await checkBotStatus())) return;

    let colorNB = await db.get(`colorNB`) || '#ffffff';
    let instaId = await db.get(`canaldoinsta_`);

    if (instab.isButton()) {
        const [operaId, userId, postId] = instab.customId.split(":");
        let allPosts = await db.get(`${userId}.instagram`) || [];
        let dataBase = allPosts.find(c => c.Id == postId);

        if (!dataBase) return;

        const updatePost = async () => {
            const rowInsta2 = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder().setLabel(dataBase.likes.length.toString()).setEmoji(likee).setCustomId(`like:${userId}:${postId}`).setStyle(Discord.ButtonStyle.Secondary),
                    new Discord.ButtonBuilder().setLabel(dataBase.comment.length.toString()).setEmoji(comment).setCustomId(`comentar:${userId}:${postId}`).setStyle(Discord.ButtonStyle.Secondary),
                    new Discord.ButtonBuilder().setEmoji(llike).setCustomId(`likes:${userId}:${postId}`).setStyle(Discord.ButtonStyle.Secondary),
                    new Discord.ButtonBuilder().setEmoji(lcomment).setCustomId(`comentarios:${userId}:${postId}`).setStyle(Discord.ButtonStyle.Secondary),
                    new Discord.ButtonBuilder().setEmoji(delet).setCustomId(`excluir:${userId}:${postId}`).setStyle(Discord.ButtonStyle.Secondary)
                );

            let insta = client.channels.cache.get(instaId);
            let hook = await insta.fetchWebhooks();
            let webhook = hook.first();

            if (webhook) {
                await webhook.editMessage(instab.message.id, { components: [rowInsta2] });
            }
        };

        if (operaId === "like") {
            if (dataBase.likes.includes(instab.user.id)) {
                dataBase.likes = dataBase.likes.filter(like => like !== instab.user.id);
            } else {
                dataBase.likes.push(instab.user.id);
            }

            await db.set(`${userId}.instagram`, allPosts);
            await instab.deferUpdate();
            await updatePost();
        }

        if (operaId === "likes") {
            let likezada = dataBase.likes.map((like) => `› <@${like}>`).join('\n') || "Sem curtidas.";
            const likeEmbed = new Discord.EmbedBuilder()
                .setAuthor({ name: 'Curtidas', iconURL: 'https://cdn.discordapp.com/emojis/1147224588594450542.png?size=2048' })
                .setDescription(likezada)
                .setColor(colorNB);
            await instab.reply({ embeds: [likeEmbed], ephemeral: true });
        }

        if (operaId === 'comentar') {
            const NBcomentInsta = new Discord.ModalBuilder()
                .setCustomId('NBcomentInsta')
                .setTitle(`${instab.guild.name} - Instagram`);

            const canaiswlNB = new Discord.TextInputBuilder()
                .setCustomId('comentarioInsta')
                .setLabel('ESCREVA SEU COMENTÁRIO ABAIXO')
                .setRequired(true)
                .setStyle(Discord.TextInputStyle.Paragraph);

            const firstActionRow = new Discord.ActionRowBuilder().addComponents(canaiswlNB);
            NBcomentInsta.addComponents(firstActionRow);
            await instab.showModal(NBcomentInsta);

            const filter = (inter) => inter.customId == 'NBcomentInsta' && inter.user.id == instab.user.id;
            await instab.awaitModalSubmit({ filter, time: 3e6 }).then(async (resp) => {
                let comentario = resp.fields.getTextInputValue('comentarioInsta');
                dataBase.comment.push({ userId: resp.user.id, comment: comentario });
                await db.set(`${userId}.instagram`, allPosts);
                await resp.deferUpdate();
                await updatePost();
            });
        }

        if (operaId === 'comentarios') {
            let comentadas = dataBase.comment.map((comment) => `› <@${comment.userId}>: ${comment.comment}`).join('\n') || "Sem comentários.";
            const commentEmbed = new Discord.EmbedBuilder()
                .setAuthor({ name: 'Comentários', iconURL: 'https://cdn.discordapp.com/emojis/1147224588594450542.png?size=2048' })
                .setDescription(comentadas)
                .setColor(colorNB);
            await instab.reply({ embeds: [commentEmbed], ephemeral: true });
        }

        if (operaId === 'excluir') {
            allPosts = allPosts.filter(post => post.Id != postId);
            await db.set(`${userId}.instagram`, allPosts);
            await instab.deferUpdate();
            await instab.message.delete();
        }
    }
});