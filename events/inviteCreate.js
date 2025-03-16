const { EmbedBuilder, Collection, PermissionsBitField } = require('discord.js')
const ms = require('ms');
const client = require('..');
const config = require('../config.json');
const cooldown = new Collection();
const { QuickDB } = require('quick.db')
const db = new QuickDB();

client.on('inviteCreate', async (invite) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }
    
    let guildId = invite.guild.id;
    let autolimpezaEstado = await db.get(`autolimpezaconvites_${guildId}.estado`);
    if (autolimpezaEstado) {
        let logsChannelId = await db.get(`autolimpezaconvites_${guildId}.logs`);
        if (logsChannelId) {
            let logsChannel = invite.guild.channels.cache.get(logsChannelId);
            if (logsChannel) {
                const inviteEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Convite detectado!')
                    .setDescription(`Um novo convite foi criado.`)
                    .addFields(
                        { name: 'Link do convite', value: invite.url, inline: true },
                        { name: 'Criado por', value: invite.inviter.tag, inline: true }
                    )
                    .setTimestamp();

                logsChannel.send({ embeds: [inviteEmbed] });

                setTimeout(async () => {
                    try {
                        await invite.delete();
                        const deleteEmbed = new EmbedBuilder()
                            .setColor('#ff0000')
                            .setTitle('Convite deletado')
                            .setDescription(`O convite ${invite.url} foi deletado após 10 minutos.`)
                            .setTimestamp();

                        logsChannel.send({ embeds: [deleteEmbed] });
                    } catch (err) {
                        console.error(`Erro ao deletar o convite: ${err}`);
                    }
                }, 10 * 60 * 1000);
            }
        }
    }
});