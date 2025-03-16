const client = require('..');
const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
const config = require('../config.json');
const { QuickDB } = require('quick.db')
const db = new QuickDB();

client.on('messageCreate', async message => {
    if (!message.guild || !message.member) return; 

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) return;

    let prefixoNB = await db.get(`prefixoNB`);
    if (!prefixoNB) prefixoNB = config.prefix;

    if (message.channel.type !== 0) return;
    if (message.author.id === client.user.id) return;
    if (message.content.startsWith(prefixoNB)) return;

    let msgsMissao = await db.get(`msgsMembroAtivoNB_${message.guild.id}`);
    let cargoMissaoId = await db.get(`cargoMembroAtivoNB_${message.guild.id}`);

    if (!msgsMissao || !cargoMissaoId) return;

    if (!message.member.roles || !message.member.roles.cache) return; // Verifica se roles e roles.cache existem

    if (!message.member.roles.cache.some(r =>
        cargoMissaoId.includes(r.id) || message.member.permissions.has(PermissionsBitField.Flags.Administrator))) {

        await db.add(`msgMembroA_${message.author.id}`, 1);

        let msgs = await db.get(`msgMembroA_${message.author.id}`);

        if (msgs >= msgsMissao) {

            let colorNB = await db.get(`colorNB`);
            if (!colorNB) colorNB = '#2f3136';

            let embedRecompensa = new Discord.EmbedBuilder()
                .setAuthor({ name: `${message.author.username}`, iconURL: `https://cdn.discordapp.com/emojis/1073711075582812241.png` })
                .setDescription(`${message.author}, você se tornou um membro ativo!\nVocê recebeu suas vantagens de Membro Ativo!`)
                .addFields(
                    { name: "Cargo Recebido:", value: `<@&${cargoMissaoId}>`, "inline": false })
                .setThumbnail(message.author.avatarURL({ dynamic: true }))
                .setColor(`${colorNB}`)
                .setTimestamp()
                .setFooter({ text: `${message.guild.name}`, iconURL: message.guild.iconURL({ dynamic: true }) });

            message.channel.send({ embeds: [embedRecompensa] }).then((msg) => {
                setTimeout(() => msg.delete(), 360000);
            });

            await message.member.roles.add(cargoMissaoId).catch(err => { console.error('Erro ao adicionar cargo:', err); });
            await db.delete(`msgMembroA_${message.author.id}`);
        }
    }
});
