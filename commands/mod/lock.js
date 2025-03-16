const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { prefix } = require("../..");
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'lock',
    description: "Trancar o chat",
    run: async (client, message, args) => {

        
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {

            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem a permissão necessária!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        } else {

            const lock = new Discord.EmbedBuilder()
                .setDescription(`Este canal foi bloqueado por ${message.author}!\npara desbloquear este canal, clique no martelo ou use o comando \`${prefixoNB}unlock\`!`)
                .setColor(`${colorNB}`)
                .setTimestamp()

            const rowLock = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setEmoji('🔒')
                        .setCustomId("destrancar")
                        .setStyle(Discord.ButtonStyle.Primary))

            message.channel.permissionOverwrites.edit(message.guild.id,

                {

                    SendMessages: false

                }
            );

            const MESSAGE = await message.channel.send({ embeds: [lock], components: [rowLock] });
            const filter = (i) => i.user.id === message.author.id;
            const collector = MESSAGE.createMessageComponentCollector({ filter });

            collector.on('collect', async (b) => {

                if (b.user.id !== message.author.id) {

                    return b.deferUpdate();
                }

                if (b.customId == 'destrancar') {

                    let embedmsgs = new Discord.EmbedBuilder()
                        .setDescription(`O canal foi desbloqueado com sucesso!`)
                        .setColor(`${colorNB}`)

                    b.reply({ embeds: [embedmsgs], ephemeral: true });

                    const unlock = new Discord.EmbedBuilder()
                        .setDescription(`Este canal foi desbloqueado para todos por ${b.member}!`)
                        .setColor(`${colorNB}`)
                        .setTimestamp()

                    const rowUnlock = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setEmoji('🔓')
                                .setCustomId("trancar")
                                .setStyle(Discord.ButtonStyle.Primary))

                    MESSAGE.edit({ embeds: [unlock], components: [rowUnlock] });

                    b.channel.permissionOverwrites.edit(b.guild.id,

                        {

                            SendMessages: null

                        }
                    )
                };

                if (b.customId == 'trancar') {

                    let embedmsgs = new Discord.EmbedBuilder()
                        .setDescription(`O canal foi bloqueado com sucesso!`)
                        .setColor(`${colorNB}`)

                    b.reply({ embeds: [embedmsgs], ephemeral: true });

                    const lock = new Discord.EmbedBuilder()
                        .setDescription(`Este canal foi bloqueado por ${message.author}!\npara desbloquear este canal, use o comando \`${prefixoNB}unlock\`!`)
                        .setColor(`${colorNB}`)
                        .setTimestamp()

                    const rowLock = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setEmoji('🔒')
                                .setCustomId("destrancar")
                                .setStyle(Discord.ButtonStyle.Primary))

                    MESSAGE.edit({ embeds: [lock], components: [rowLock] });

                    b.channel.permissionOverwrites.edit(b.guild.id,

                        {

                            SendMessages: false

                        }
                    );
                }
            })

        }
    }
}