const client = require('..');
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('voiceStateUpdate', async (oldMember, newMember) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    let dataBase = await db.get(`vips_${newMember.guild.id}.vip`);
    if (!dataBase || dataBase.length == 0) return;

    let fael = await dataBase.map(x => x.categ);

        let oldVoice = oldMember.channel;
        let newVoice = newMember.channel;

        if (!oldVoice) {

            if (fael.includes(newVoice?.parent?.id)) {

            if (newVoice.members.size == 1) {

                newVoice.permissionOverwrites.edit(
                    newMember.guild.id,
                    { ViewChannel: null },
                )
            }

        }

        } else if (!newVoice) {

            if (fael.includes(oldVoice?.parent?.id)) {

                if (!oldVoice.members.size) {
    
                    oldVoice.permissionOverwrites.edit(
                        oldMember.guild.id,
                        { ViewChannel: false },
                    )
                }
            }    

        } else {

            if (!newMember.channelId) {

            } else {

                if (!oldVoice.members.size) {

                    if (fael.includes(oldVoice?.parent?.id)) {
    
                        oldVoice.permissionOverwrites.edit(
                            oldMember.guild.id,
                            { ViewChannel: false },
                        )
                    }
    
                }
    
                if (newVoice.members.size == 1) {
    
                    if (fael.includes(newVoice?.parent?.id)) {
    
                        newVoice.permissionOverwrites.edit(
                            newMember.guild.id,
                            { ViewChannel: null },
                        )
                    }
                } 
            }
        }

    });
