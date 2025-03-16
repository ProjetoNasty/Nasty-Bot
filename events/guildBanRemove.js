const client = require('..');
const Discord = require("discord.js");
const { AuditLogEvent } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('guildBanRemove', async (member) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const fetchedLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanRemove,
    });

    const banLog = fetchedLogs?.entries.first();

    const { executor, target } = banLog;

    let unbn = await db.get(`logUnbanNB_${member.guild.id}`);
    let logunBan = member.guild.channels.cache.get(unbn);

    let colorNB = await db.get(`colorNB`);
    if (!colorNB) colorNB = '#2f3136';

    let embedUnban = new Discord.EmbedBuilder()
        .setDescription(`O membro ${target.username} foi desbanido por ${executor}!`)
        .setColor('#00ff00')
        .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) })

    if (logunBan && !executor.bot) await logunBan.send({ embeds: [embedUnban] }).catch(err => { });
});