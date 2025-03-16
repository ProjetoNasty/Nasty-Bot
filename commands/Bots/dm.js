const Discord = require('discord.js');
const { PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require('../../index')
const config = require('./../../config.json');
const serverId = config.serverId;
const authorizedUserID = ['1150820434690977882', '1150820434690977882'];

module.exports = {
    name: 'dm',
    description: 'Mande mensagem na dm da pessoa',
    run: async (client, message, args) => {

        if (!authorizedUserID.includes(message.author.id)) return;
        try {
            let row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Abrir modal (ADM)")
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`modalDM`)
            )
            // const member = await client.users.fetch(yy.user.id)
            // await message.reply({ components: [row] })
            message.channel.send({ components: [row] })
        } catch (error) {
            console.error(`${error}`);
        }

    }
};
