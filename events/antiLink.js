const client = require('..');
const { PermissionsBitField } = require("discord.js")
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('messageCreate', async message => {
    const bot = message.author.bot;

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    if (message.channel.type === 1 || bot == true) return;

    if (message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const regex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|club)|discordapp\.com\/invite|discord\.com\/invite)\/.+[a-z]/gi;

    let statusAntilink = await db.get(`statusAntilinkNB_${message.guild.id}`);

    if (statusAntilink === true) {

        if (regex.exec(message.content)) {

            await message.delete().catch(err => { });

            let protecaoDb = await db.get(`protecaoNB_${message.guild.id}`);
            const protecao = message.guild.channels.cache.get(protecaoDb);

            if (protecao) {

                await protecao.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                await protecao.send({ content: `${client.xx.membro} **Membro**:\n${message.author.username} \`${message.author.id}\`\n${message.content}` })
            }
        }
    }
});