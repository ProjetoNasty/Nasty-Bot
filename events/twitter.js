const client = require('..');
const Discord = require("discord.js");
const CanvasUtils = require("../utils/Util");
const { loadImage, createCanvas } = require('canvas');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('ready', async () => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    let twitterId = await db.get(`canaltwitter_`);
    if (!twitterId) return;

    const tt = await client.channels.cache.get(twitterId)
    const filter = (msg) => !msg.author.bot;

    if (!tt) return;

    await tt.createMessageCollector({ filter }).on('collect', async (collect) => {
        console.log(`[Twitter] Nova mensagem recebida`)
        if (collect.attachments.size > 1) return collect.delete().catch(err => { });
        console.log(`[Twitter] Mensagem cumpre os requisitos`)
        let Posts = await client.db.get(`${collect.member.id}.tt`)
        if (!Posts) Posts = []
        let IdPost = Posts.length + 1

        const object = {
            "Id": IdPost,
            "userId": collect.member.id,
            "data": new Date().toLocaleDateString(),
            "tweet": collect.content,
            "likes": [],
            "rts": [],
            "comment": []
        }

        collect.delete().catch(err => { });

        const rowTwitter = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel('0')
                    .setEmoji(client.xx.curtidatt.split(/[:>]/)[2])
                    .setCustomId(`like:${collect.member.id}:${IdPost}`)
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setLabel('0')
                    .setEmoji(client.xx.rtt.split(/[:>]/)[2])
                    .setCustomId(`rt:${collect.member.id}:${IdPost}`)
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setLabel('0')
                    .setEmoji(client.xx.comentt.split(/[:>]/)[2])
                    .setCustomId(`comentar:${collect.member.id}:${IdPost}`)
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setEmoji(client.xx.morett.split(/[:>]/)[2])
                    .setCustomId(`info:${collect.member.id}:${IdPost}`)
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setEmoji(client.xx.reset.split(/[:>]/)[2])
                    .setCustomId(`excluir:${collect.member.id}:${IdPost}`)
                    .setStyle(Discord.ButtonStyle.Secondary))

        const canvas = createCanvas(752, 285);
        const ctx = canvas.getContext('2d');

        let template = await loadImage('https://files.catbox.moe/4pcwpf.png');
        ctx.drawImage(template, 0, 0, 752, 285);

        ctx.save();
        ctx.beginPath();
        ctx.arc(30.87 + 32.285, 22 + 32.285, 32.285, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        let avatar = collect.member.user.avatarURL({ forceStatic: true, extension: "png", size: 1024 });
        if (!avatar) avatar = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
        let image = await loadImage(avatar);
        ctx.drawImage(image, 30.87, 22, 64.57, 64.57);

        ctx.restore();

        ctx.textBaseline = "top";


        ctx.save();
        ctx.font = "bold 18px Arial";
        ctx.fillStyle = "#ffffff";
        
        // Acessando o globalName do usuário
        const globalName = collect.member.user.globalName || collect.member.user.username; // Fallback para username se globalName não existir
        ctx.fillText(globalName, 105.14, 34.96);
        ctx.font = "16px Arial";
        ctx.fillStyle = "#8899a6";
        ctx.fillText(`@${collect.member.user.username}`, 105.14, 56.48);
        ctx.fillStyle = "#ffffff";
        ctx.font = "25px Arial";
        CanvasUtils.drawWrappingText(ctx, collect.content.length > 256 ? `${collect.content.slice(0, 256)}...` : collect.content, 32.98, 103.75, canvas.width - (32.98 * 2));

        var d = new Date();
        ctx.save();
        ctx.font = "bold 18px Arial";
        ctx.textBaseline = "top";
        ctx.textAlign = "right";
        ctx.fillStyle = "#8899a6";
        
        // Formatando a data para o padrão brasileiro (dia/mês/ano)
        ctx.fillText(`${d.toLocaleDateString('pt-BR')}`, 712.87, 241);
        

        // CURTIDAS
        ctx.save();
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "#8899a6";
        ctx.textAlign = "center";
        ctx.fillText("Likes", 75, 220); // Posição para o título
        ctx.font = "bold 21px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`0`, 75, 241); // Número das curtidas
        ctx.restore();

        // RETWEETS
        ctx.save();
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "#8899a6";
        ctx.textAlign = "center";
        ctx.fillText("Retweets", 151, 220); // Posição para o título
        ctx.font = "bold 21px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`0`, 151, 241); // Número dos retweets
        ctx.restore();

        // COMENTÁRIOS
        ctx.save();
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "#8899a6";
        ctx.textAlign = "center";
        ctx.fillText("Comments", 248, 220); // Posição para o título
        ctx.font = "bold 21px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`0`, 248, 241); // Número dos comentários
        ctx.restore();

        const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'twitter.png' })

        let hook = await tt.fetchWebhooks();
        let webhook = hook.first();

        webhook.send({ username: 'Twitter', avatarURL: 'https://media.discordapp.net/attachments/1024812700351606906/1036007127153655911/twitter-logo-5476203-4602454.png', files: [attachment], components: [rowTwitter] }).then(r => {
            Posts.push(object)
            client.db.set(`${collect.member.id}.tt`, Posts);
        })
    })
});

client.on('interactionCreate', async (btwitter) => {

    let twitterId = await db.get(`canaltwitter_`);

    if (btwitter.isButton()) {

        const tt = btwitter.guild.channels.cache.get(twitterId);
        if (btwitter.channel.id !== twitterId) return;

        let hook = await tt.fetchWebhooks();
        let webhook = hook.first();

        if (btwitter.channel.id == twitterId) {

            let operaId = btwitter.customId.split(":")[0];
            let userId = btwitter.customId.split(":")[1];
            let postId = btwitter.customId.split(":")[2];

            let allPosts = await client.db.get(`${userId}.tt`)
            let dataBase = allPosts.find(c => c.Id == postId)

            let dono = btwitter.guild.members.cache.get(dataBase.userId);

            if (operaId == "like") {

                var objectLikes = dataBase

                if (dataBase.likes.some(likes => btwitter.user.id === likes)) {

                    btwitter.deferUpdate();

                    objectLikes.likes = dataBase.likes.filter(element => element !== btwitter.user.id);
                    allPosts[allPosts.indexOf(allPosts.find(c => c.Id == postId))] = objectLikes
                    await client.db.set(`${userId}.tt`, allPosts)

                    objectLikes = dataBase

                    const rowTwitter = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.likes.length.toString())
                                .setEmoji(client.xx.curtidatt.split(/[:>]/)[2])
                                .setCustomId(`like:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.rts.length.toString())
                                .setEmoji(client.xx.rtt.split(/[:>]/)[2])
                                .setCustomId(`rt:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.comment.length.toString())
                                .setEmoji(client.xx.comentt.split(/[:>]/)[2])
                                .setCustomId(`comentar:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.morett.split(/[:>]/)[2])
                                .setCustomId(`info:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.reset.split(/[:>]/)[2])
                                .setCustomId(`excluir:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const canvas = createCanvas(752, 285);
                    const ctx = canvas.getContext('2d');

                    let template = await loadImage('https://files.catbox.moe/4pcwpf.png');
                    ctx.drawImage(template, 0, 0, 752, 285);

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(30.87 + 32.285, 22 + 32.285, 32.285, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    let avatar = dono.user.avatarURL({ forceStatic: true, extension: "png", size: 1024 });
                    if (!avatar) avatar = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
                    let image = await loadImage(avatar);
                    ctx.drawImage(image, 30.87, 22, 64.57, 64.57);

                    ctx.restore();

                    ctx.textBaseline = "top";

                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${dono.user.username}`, 105.14, 34.96);
                    ctx.font = "16px Arial";
                    ctx.fillStyle = "#d5d5d5";
                    ctx.fillText(`@${dono.user.username}`, 105.14, 56.48);
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "25px Arial";
                    CanvasUtils.drawWrappingText(ctx, `${dataBase.tweet}`.length > 256 ? `${dataBase.tweet}.slice(0, 256)}...` : `${dataBase.tweet}`, 32.98, 103.75, canvas.width - (32.98 * 2));

                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.textBaseline = "top";
                    ctx.textAlign = "right";
                    ctx.fillStyle = "#8899a6";
                    ctx.fillText(`${dataBase.data}`, 712.87, 241);

                    // CURTIDAS

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.likes.length.toString()}`, 75, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.rts.length.toString()}`, 151, 241);
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.comment.length.toString()}`, 228, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'twitter.png' })

                    await webhook.editMessage(`${btwitter.message.id}`, {

                        components: [rowTwitter],
                        files: [attachment]

                    })

                } else {

                    btwitter.deferUpdate();

                    objectLikes.likes.push(btwitter.user.id);
                    allPosts[allPosts.indexOf(allPosts.find(c => c.Id == postId))] = objectLikes

                    await client.db.set(`${userId}.tt`, allPosts)

                    objectLikes = dataBase;

                    const rowTwitter = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.likes.length.toString())
                                .setEmoji(client.xx.curtidatt.split(/[:>]/)[2])
                                .setCustomId(`like:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.rts.length.toString())
                                .setEmoji(client.xx.rtt.split(/[:>]/)[2])
                                .setCustomId(`rt:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.comment.length.toString())
                                .setEmoji(client.xx.comentt.split(/[:>]/)[2])
                                .setCustomId(`comentar:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.morett.split(/[:>]/)[2])
                                .setCustomId(`info:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.reset.split(/[:>]/)[2])
                                .setCustomId(`excluir:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary))


                    const canvas = createCanvas(752, 285);
                    const ctx = canvas.getContext('2d');

                    let template = await loadImage('https://files.catbox.moe/4pcwpf.png');
                    ctx.drawImage(template, 0, 0, 752, 285);

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(30.87 + 32.285, 22 + 32.285, 32.285, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    let avatar = dono.user.avatarURL({ forceStatic: true, extension: "png", size: 1024 });
                    if (!avatar) avatar = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
                    let image = await loadImage(avatar);
                    ctx.drawImage(image, 30.87, 22, 64.57, 64.57);

                    ctx.restore();

                    ctx.textBaseline = "top";

                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${dono.user.username}`, 105.14, 34.96);
                    ctx.font = "16px Arial";
                    ctx.fillStyle = "#8899a6";
                    ctx.fillText(`@${dono.user.username}`, 105.14, 56.48);
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "25px Arial";
                    CanvasUtils.drawWrappingText(ctx, `${dataBase.tweet}`.length > 256 ? `${dataBase.tweet}.slice(0, 256)}...` : `${dataBase.tweet}`, 32.98, 103.75, canvas.width - (32.98 * 2));

                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.textBaseline = "top";
                    ctx.textAlign = "right";
                    ctx.fillStyle = "#8899a6";
                    ctx.fillText(`${dataBase.data}`, 712.87, 241);

                    // CURTIDAS

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.likes.length.toString()}`, 75, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.rts.length.toString()}`, 151, 241);
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.comment.length.toString()}`, 228, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'twitter.png' })

                    await webhook.editMessage(`${btwitter.message.id}`, {

                        components: [rowTwitter],
                        files: [attachment]

                    })

                }
            }

            if (operaId == "rt") {

                let noPerm = new Discord.EmbedBuilder()
                    .setDescription(`› ${btwitter.member}, você não pode se dar Retweet!`)
                    .setColor('#40b4fe')

                if (btwitter.user.id == dataBase.userId) return btwitter.reply({ embeds: [noPerm], ephemeral: true });

                var objectLikes = dataBase

                if (dataBase.rts.some(rts => btwitter.user.id === rts)) {

                    btwitter.deferUpdate();

                    objectLikes.rts = dataBase.rts.filter(element => element !== btwitter.user.id);
                    allPosts[allPosts.indexOf(allPosts.find(c => c.Id == postId))] = objectLikes
                    await client.db.set(`${userId}.tt`, allPosts)

                    objectLikes = dataBase

                    const rowTwitter = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.likes.length.toString())
                                .setEmoji(client.xx.curtidatt.split(/[:>]/)[2])
                                .setCustomId(`like:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.rts.length.toString())
                                .setEmoji(client.xx.rtt.split(/[:>]/)[2])
                                .setCustomId(`rt:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.comment.length.toString())
                                .setEmoji(client.xx.comentt.split(/[:>]/)[2])
                                .setCustomId(`comentar:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.morett.split(/[:>]/)[2])
                                .setCustomId(`info:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.reset.split(/[:>]/)[2])
                                .setCustomId(`excluir:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary))


                    const canvas = createCanvas(752, 285);
                    const ctx = canvas.getContext('2d');

                    let template = await loadImage('https://files.catbox.moe/4pcwpf.png');
                    ctx.drawImage(template, 0, 0, 752, 285);

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(30.87 + 32.285, 22 + 32.285, 32.285, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    let avatar = dono.user.avatarURL({ forceStatic: true, extension: "png", size: 1024 })
                    if (!avatar) avatar = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'
                    let image = await loadImage(avatar);
                    ctx.drawImage(image, 30.87, 22, 64.57, 64.57);

                    ctx.restore();

                    ctx.textBaseline = "top";
                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${dono.user.username}`, 105.14, 34.96);
                    ctx.font = "16px Arial";
                    ctx.fillStyle = "#8899a6";
                    ctx.fillText(`@${dono.user.username}`, 105.14, 56.48);
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "25px Arial";
                    CanvasUtils.drawWrappingText(ctx, `${dataBase.tweet}`.length > 256 ? `${dataBase.tweet}.slice(0, 256)}...` : `${dataBase.tweet}`, 32.98, 103.75, canvas.width - (32.98 * 2));

                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.textBaseline = "top";
                    ctx.textAlign = "right";
                    ctx.fillStyle = "#8899a6";
                    ctx.fillText(`${dataBase.data}`, 712.87, 241);

                    // CURTIDAS

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.likes.length.toString()}`, 75, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.rts.length.toString()}`, 151, 241);
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.comment.length.toString()}`, 228, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'twitter.png' })

                    await webhook.editMessage(`${btwitter.message.id}`, {

                        components: [rowTwitter],
                        files: [attachment]

                    })

                } else {

                    btwitter.deferUpdate();

                    objectLikes.rts.push(btwitter.user.id);
                    allPosts[allPosts.indexOf(allPosts.find(c => c.Id == postId))] = objectLikes

                    await client.db.set(`${userId}.tt`, allPosts)

                    objectLikes = dataBase

                    const rowTwitter = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.likes.length.toString())
                                .setEmoji(client.xx.curtidatt.split(/[:>]/)[2])
                                .setCustomId(`like:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.rts.length.toString())
                                .setEmoji(client.xx.rtt.split(/[:>]/)[2])
                                .setCustomId(`rt:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.comment.length.toString())
                                .setEmoji(client.xx.comentt.split(/[:>]/)[2])
                                .setCustomId(`comentar:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.morett.split(/[:>]/)[2])
                                .setCustomId(`info:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.reset.split(/[:>]/)[2])
                                .setCustomId(`excluir:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary))


                    const canvas = createCanvas(752, 285);
                    const ctx = canvas.getContext('2d');

                    let template = await loadImage('https://files.catbox.moe/4pcwpf.png');
                    ctx.drawImage(template, 0, 0, 752, 285);

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(30.87 + 32.285, 22 + 32.285, 32.285, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    let avatar = dono.user.avatarURL({ forceStatic: true, extension: "png", size: 1024 });
                    if (!avatar) avatar = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
                    let image = await loadImage(avatar);
                    ctx.drawImage(image, 30.87, 22, 64.57, 64.57);

                    ctx.restore();

                    ctx.textBaseline = "top";


                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${dono.user.username}`, 105.14, 34.96);
                    ctx.font = "16px Arial";
                    ctx.fillStyle = "#8899a6";
                    ctx.fillText(`@${dono.user.username}`, 105.14, 56.48);
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "25px Arial";
                    CanvasUtils.drawWrappingText(ctx, `${dataBase.tweet}`.length > 256 ? `${dataBase.tweet}.slice(0, 256)}...` : `${dataBase.tweet}`, 32.98, 103.75, canvas.width - (32.98 * 2));

                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.textBaseline = "top";
                    ctx.textAlign = "right";
                    ctx.fillStyle = "#8899a6";
                    ctx.fillText(`${dataBase.data}`, 712.87, 241);

                    // CURTIDAS

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.likes.length.toString()}`, 75, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.rts.length.toString()}`, 151, 241);
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.comment.length.toString()}`, 228, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'twitter.png' })

                    await webhook.editMessage(`${btwitter.message.id}`, {

                        components: [rowTwitter],
                        files: [attachment]

                    })

                    let rowRt = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Confira o Tweet")
                                .setEmoji('1119766793360252928')
                                .setURL(`https://discord.com/channels/${btwitter.guild.id}/${btwitter.channel.id}/${btwitter.message.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    webhook.send({ username: 'Twitter', avatarURL: 'https://media.discordapp.net/attachments/1024812700351606906/1036007127153655911/twitter-logo-5476203-4602454.png', content: `> <:blue_twitter:1133501303499268266> ${btwitter.member} deu Retweet no Tweet de <@${dataBase.userId}>.`, files: [attachment], components: [rowRt] });
                }
            }

            if (operaId == "likes") {

                let likezada;

                if (dataBase.likes) likezada = dataBase.likes.map((likes) => `<@${likes}>`).join('\n')

                if (!dataBase.likes.length) likezada = "Sem curtidas.";

                const like = new Discord.EmbedBuilder()
                    .setAuthor({ name: 'Comentários:', iconURL: 'https://cdn.discordapp.com/emojis/1067882574350909440.webp' })
                    .setDescription(`${likezada}`)
                    .setColor(`${colorNB}`)

                await btwitter.reply({ embeds: [like], ephemeral: true });
            }

            if (operaId == 'comentar') {

                const NBcomentInsta = new Discord.ModalBuilder()
                    .setCustomId('NBcomentInsta')
                    .setTitle(`${btwitter.guild.name} - Twitter`)

                const canaiswlNB = new Discord.TextInputBuilder()
                    .setCustomId('comentarioInsta')
                    .setLabel('ESCREVA SEU COMENTÁRIO ABAIXO')
                    .setRequired(true)
                    .setStyle(Discord.TextInputStyle.Paragraph)

                const firstActionRow = new Discord.ActionRowBuilder()
                    .addComponents(canaiswlNB)

                NBcomentInsta.addComponents(firstActionRow)
                await btwitter.showModal(NBcomentInsta);

                let filter = (inter) => inter.customId == 'NBcomentInsta'
                await btwitter.awaitModalSubmit({ filter, time: 3e6 }).then(async (resp) => {
                    let comentario = resp.fields.getTextInputValue('comentarioInsta')
                    dataBase.comment.push({ userId: resp.user.id, comment: comentario })
                    allPosts[allPosts.indexOf(allPosts.find(c => c.Id == postId))] = dataBase
                    await client.db.set(`${userId}.tt`, allPosts)

                    resp.deferUpdate();

                    const canvas = createCanvas(752, 285);
                    const ctx = canvas.getContext('2d');

                    let template = await loadImage('https://files.catbox.moe/4pcwpf.png');
                    ctx.drawImage(template, 0, 0, 752, 285);

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(30.87 + 32.285, 22 + 32.285, 32.285, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    let avatar = dono.user.avatarURL({ forceStatic: true, extension: "png", size: 1024 });
                    if (!avatar) avatar = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
                    let image = await loadImage(avatar);
                    ctx.drawImage(image, 30.87, 22, 64.57, 64.57);

                    ctx.restore();

                    ctx.textBaseline = "top";


                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${dono.user.username}`, 105.14, 34.96);
                    ctx.font = "16px Arial";
                    ctx.fillStyle = "#8899a6";
                    ctx.fillText(`@${dono.user.username}`, 105.14, 56.48);
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "25px Arial";
                    CanvasUtils.drawWrappingText(ctx, `${dataBase.tweet}`.length > 256 ? `${dataBase.tweet}.slice(0, 256)}...` : `${dataBase.tweet}`, 32.98, 103.75, canvas.width - (32.98 * 2));

                    ctx.save();
                    ctx.font = "bold 18px Arial";
                    ctx.textBaseline = "top";
                    ctx.textAlign = "right";
                    ctx.fillStyle = "#8899a6";
                    ctx.fillText(`${dataBase.data}`, 712.87, 241);

                    // CURTIDAS

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.likes.length.toString()}`, 75, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.rts.length.toString()}`, 151, 241);
                    ctx.restore();

                    ctx.save();
                    ctx.font = "bold 21px Arial";
                    ctx.fillText(`${dataBase.comment.length.toString()}`, 228, 241);
                    ctx.fillStyle = "#8899a6";
                    ctx.restore();

                    const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'twitter.png' })

                    const rowTwitter = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.likes.length.toString())
                                .setEmoji(client.xx.curtidatt.split(/[:>]/)[2])
                                .setCustomId(`like:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.rts.length.toString())
                                .setEmoji(client.xx.rtt.split(/[:>]/)[2])
                                .setCustomId(`rt:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel(dataBase.comment.length.toString())
                                .setEmoji(client.xx.comentt.split(/[:>]/)[2])
                                .setCustomId(`comentar:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.morett.split(/[:>]/)[2])
                                .setCustomId(`info:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setEmoji(client.xx.reset.split(/[:>]/)[2])
                                .setCustomId(`excluir:${userId}:${postId}`)
                                .setStyle(Discord.ButtonStyle.Secondary))


                    await webhook.editMessage(`${btwitter.message.id}`, {

                        components: [rowTwitter],
                        files: [attachment]

                    })
                })
            }

            if (operaId == "info") {

                if (dataBase.likes) likes = dataBase.likes.map((likes) => `› <@${likes}>`).join('\n')
                if (!dataBase.likes.length) likes = "0";

                if (dataBase.rts) rts = dataBase.likes.map((rts) => `› <@${rts}>`).join('\n')
                if (!dataBase.rts.length) rts = "0";

                if (dataBase.comment.length) comments = await dataBase.comment.map((comment) => `› <@${comment.userId}>: ${comment.comment}`).join('\n');
                if (!dataBase.comment.length) comments = 'Nenhum comentário encontrado.';

                const comentarios = new Discord.EmbedBuilder()
                    .setAuthor({ name: 'INFORMAÇÕES DO TWEET', iconURL: 'https://cdn.discordapp.com/emojis/1170846621240676383.png' })
                    .addFields(
                        { name: `${client.xx.curtidatt} Curtidas`, value: `${likes}`, "inline": true },
                        { name: `${client.xx.rtt} Retweet's`, value: `${rts}`, "inline": true },
                        { name: `${client.xx.comentt} Comentários`, value: `${comments}`, "inline": false }
                    )
                    .setColor('#40b4fe')

                await btwitter.reply({ embeds: [comentarios], ephemeral: true })
            }

            if (operaId == "excluir") {

                if (btwitter.user.id !== dataBase.userId) return btwitter.reply({ content: `Apenas <@${dataBase.userId}> pode excluir a publicação.`, ephemeral: true })

                await btwitter.deferUpdate();

                const msg = await client.channels.cache.get(twitterId).messages.fetch(btwitter.message.id)
                await msg.delete().catch((error) => error)
                allPosts.splice(allPosts.indexOf(allPosts.find(c => c.Id == postId)), 1)
                await client.db.set(`${userId}.tt`, allPosts)
            }
        }
    }
});