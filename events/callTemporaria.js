const client = require('..');
const Discord = require("discord.js");

const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('voiceStateUpdate', async (oldState, newState) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    let statusautocallTemp = await db.get(`statusautocallTempNB_${newState.guild.id}`);

    if (statusautocallTemp === true) {

        const membro = await newState.guild.members.cache.get(newState.id);
        let canalDb = await db.get(`canalTempNB_${newState.guild.id}`);

        const canal = await newState.guild.channels.cache.get(canalDb);
        if (!canal) return;

        if (newState.channel?.id == canal.id) {

            await newState.guild.channels.create({
                name: `🚀・${membro.user.username}`,
                parent: canal.parentId,
                type: Discord.ChannelType.GuildVoice,
                permissionOverwrites: [

                    {
                        id: membro.id,
                        null: [Discord.PermissionFlagsBits.ViewChannel],
                        allow: [Discord.PermissionFlagsBits.Connect, Discord.PermissionFlagsBits.ManageRoles, Discord.PermissionFlagsBits.ManageChannels]

                    },
                    {
                        id: newState.guild.id,
                        null: [Discord.PermissionFlagsBits.ViewChannel],
                        deny: [Discord.PermissionFlagsBits.Connect]
                    },
                ]
            }).then(async channel => {

                membro.voice.setChannel(channel.id);

            })

        }

        if (oldState.channel?.id != canal.id && oldState.channel?.parent?.id == canal?.parentId && !oldState.channel?.members.size) await oldState.channel?.delete();

    }
});