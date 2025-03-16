const Discord = require("discord.js");
const { ActionRowBuilder, SelectMenuBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: "pdr",
    category: "Remova uma primeira dama",
    description: "",
    run: async (client, message, args) => {
    
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#ffffff';

        let dataBase = await db.get(`pd_${message.author.id}.pd`);
        if (!dataBase || dataBase.length == 0) return;
       
        let cargosPd = await db.get(`sistemaPD_${message.guild.id}.cargospd`);
        if (!cargosPd || cargosPd.length == 0) return;

        let cargosAutorizados = await cargosPd.map(x => x.cargoId);

        if (!message.member.roles.cache.some(r => cargosAutorizados.includes(r.id))) {

            const semperm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem permissão para remover dama!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [semperm] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('pd')
                    .setPlaceholder('Nada selecionado')
                    .addOptions((await db.get(`pd_${message.author.id}.pd`))?.map(pd => ({
                        label: pd.damatag,
                        emoji: "1145367971800297602",
                        value: pd.dama
                    }))


                    )

            )

        const MESSAGE = await message.channel.send({ content: '**Escolha uma dama para remover:**', components: [row], ephemeral: true });
        const iFilter = (i) => i.user.id === message.author.id;
        const collector = MESSAGE.createMessageComponentCollector({ filter: iFilter });

        collector.on("collect", async b => {

            (await db.get(`pd_${message.author.id}.pd`))?.map(async mp => {

                if (b.isStringSelectMenu() && b.customId === "pd") {

                    switch (b.values[0]) {

                        case `${mp.dama}`: {

                            b.deferUpdate();

                            const filterComment = (await db.get(`pd_${b.user.id}.pd`))?.filter(element => element.dama !== mp.dama);
                            await db.set(`pd_${b.user.id}.pd`, filterComment);

                            await db.set(`pd_${b.user.id}.listapds`, (await db.get(`pd_${b.user.id}.listapds`))?.filter(e => e !== `${mp.damatag}`));
                            await db.set(`pd_${b.user.id}.pds`, (await db.get(`pd_${b.user.id}.pds`))?.filter(e => e !== `${mp.dama}`));
                            await db.delete(`dama_${mp.dama}`);
                            await db.sub(`contadorpd_${message.author.id}`, 1);

                            let dataBase = await db.get(`pd_${b.user.id}.pd`);

                            if (!dataBase || dataBase.length == 0) {

                                await db.delete(`pd_${b.user.id}`);
                            }

                            MESSAGE.delete();

                            let dama = b.guild.members.cache.get(mp.dama);
                            let cargoPd = await db.get(`cargopdNB_${b.guild.id}`);

                           await dama.roles.remove(cargoPd).catch(err => { });

                            let damaEmbed = new Discord.EmbedBuilder()
                                .setAuthor({ name: `Primeira Dama Removida!`, iconURL: message.author.avatarURL({ dynamic: true }) })
                                .setDescription(`${client.xx.anel} **Dama**: <@${mp.dama}>\n${client.xx.id} **ID**: ${mp.dama}\n\n${client.xx.anel} **Removida por**: ${b.member}\n${client.xx.id} **ID**: ${b.user.id}`)
                                .setColor(`${colorNB}`)

                            message.channel.send({ embeds: [damaEmbed] }).then((msg) => {

                                setTimeout(() => msg.delete(), 7000);
                            })
                        }
                    }
                }
            })
        })
    }
};