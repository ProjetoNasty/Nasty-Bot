const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'clear',
    description: "Limpar o chat",
    run: async (client, message, args) => {
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;

        let amount = parseInt(args[0]);

        if (isNaN(amount)) {
            let noAmount = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, informe a quantidade de mensagens que deseja apagar!`)
                .setColor(`${colorNB}`);
            return message.channel.send({ embeds: [noAmount] }).then((msg) => {
                setTimeout(() => msg.delete(), 8000);
            });
        }

        if (amount < 1 || amount > 1000) {
            let noAmount = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, informe um valor entre **1** e **1000**!`)
                .setColor(`${colorNB}`);
            return message.channel.send({ embeds: [noAmount] }).then((msg) => {
                setTimeout(() => msg.delete(), 8000);
            });
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem a permissão necessária!`)
                .setColor(`${colorNB}`);
            return message.channel.send({ embeds: [noPerm] }).then((msg) => {
                setTimeout(() => msg.delete(), 8000);
            });
        }

        let deletedMessagesCount = 0;

        while (amount > 0) {
            // Fetch up to 100 messages from the channel
            const messages = await message.channel.messages.fetch({ limit: 100 });

            // If there are no messages, break the loop
            if (messages.size === 0) break;

            // Determine the number of messages to delete in this batch
            let batchSize = Math.min(amount, messages.size);
            const batch = messages.first(batchSize);

            try {
                // Delete the batch of messages
                const deletedMessages = await message.channel.bulkDelete(batch, true);
                deletedMessagesCount += deletedMessages.size;
                amount -= deletedMessages.size;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error('Erro ao tentar deletar mensagens:', error);
                let errorMsg = new Discord.EmbedBuilder()
                    .setDescription(`${message.author}, ocorreu um erro ao tentar apagar as mensagens.`)
                    .setColor(`${colorNB}`);
                message.channel.send({ embeds: [errorMsg] }).then((msg) => {
                    setTimeout(() => msg.delete(), 8000);
                });
                break;
            }
        }

        const embed = new Discord.EmbedBuilder()
            .setDescription(`Total de mensagens apagadas: **${deletedMessagesCount}**`)
            .setColor(`${colorNB}`);

        message.channel.send({ content: `${message.author}`, embeds: [embed] }).then((msg) => {
            setTimeout(() => msg.delete(), 5000);
        });
    }
}
