
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const { UserSelectMenuBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    name: "pda",
    category: "Adicionar primeira dama",
    description: "",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#ffffff';

		    
		 const damaSelectMenu = new UserSelectMenuBuilder()
               .setCustomId('selectDama')
               .setPlaceholder('Utilize este menu.');

           const actionRow = new ActionRowBuilder().addComponents(damaSelectMenu);

   		 const semTempo = new UserSelectMenuBuilder()
               .setCustomId('selectDama')
               .setPlaceholder('Utilize este menu.')
			   .setDisabled(true);

           const disableDama = new ActionRowBuilder().addComponents(semTempo);
		
        let cargosPd = await db.get(`sistemaPD_${message.guild.id}.cargospd`);
        if (!cargosPd || cargosPd.length == 0) return;

        let cargosAutorizados = await cargosPd.map(x => x.cargoId);

        if (!message.member.roles.cache.some(r => cargosAutorizados.includes(r.id))) {

            const semperm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem permissão para adicionar dama!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [semperm] }).then((msg) => {
                setTimeout(() => msg.delete(), 5000);
            });
        }

        const damaEmbed = new Discord.EmbedBuilder()
            .setDescription(`${message.author}, selecione uma dama usando o menu abaixo.`)
            .setColor(colorNB);

        const damaMessage = await message.channel.send({ embeds: [damaEmbed], components: [actionRow] });

               const filter = (interaction) => interaction.customId === 'selectDama';
        const collector = damaMessage.createMessageComponentCollector({ filter, time: 200000 });

        collector.on('collect', async (interaction) => {
            const damaId = interaction.values[0];
            const dama = interaction.guild.members.cache.get(damaId);

            if (!dama) {
                const nomembro = new Discord.EmbedBuilder()
                    .setDescription(`${message.author}, selecione uma dama válida.`)
                    .setColor(colorNB);

                return interaction.reply({ embeds: [nomembro], ephemeral: true });
            }

            if (message.author.id === dama.id) {
                const carente = new Discord.EmbedBuilder()
                    .setDescription(`${message.author}, você não pode se setar como primeira dama.`)
                    .setColor(colorNB);

                return interaction.reply({ embeds: [carente], ephemeral: true });
            }

            if (dama.id === client.user.id) {
                const bot = new Discord.EmbedBuilder()
                    .setDescription(`${message.author}, está carente, parceiro?`)
                    .setColor(colorNB);

                return interaction.reply({ embeds: [bot], ephemeral: true });
            }

            let limite = await db.get(`limitepdNB_${message.author.id}`);
            let contador = await db.get(`contadorpd_${message.author.id}`);
            if (!contador) contador = 0;

            if (!limite) {
                const limite = new Discord.EmbedBuilder()
                    .setDescription(`${message.author}, seu limite não foi definido corretamente, entre em contato com um responsável!`)
                    .setColor(colorNB);

                return interaction.reply({ embeds: [limite], ephemeral: true });
            }

            if (contador >= limite) {
                const limite = new Discord.EmbedBuilder()
                    .setDescription(`${message.author}, você atingiu o seu limite de damas!`)
                    .setColor(colorNB);

                return interaction.reply({ embeds: [limite], ephemeral: true });
            }

            let cargoPd = await db.get(`cargopdNB_${message.guild.id}`);
            let dama_existe = await db.get(`dama_${dama.id}`);
            let dono_pd = await client.users.fetch(dama_existe).catch(err => false);
        
            if (dama_existe) {
                return interaction.reply({ content: `${dama_existe == message.author ? `${dama} já é sua dama` : `${dama} já é dama de **${dono_pd.username}**`}`, ephemeral: true });
            }

            await dama.roles.add(cargoPd).catch(err => { console.log(err) });

            const object = {
                dama: dama.id,
                damatag: dama.user.username
                        };

            await db.push(`pd_${message.author.id}.pd`, object);
            await db.push(`pd_${message.author.id}.listapds`, dama.user.username);
            await db.push(`pd_${message.author.id}.pds`, dama.id);
            await db.set(`dama_${dama.id}`, message.author.id);
            await db.add(`contadorpd_${message.author.id}`, 1);

            const damaAddedEmbed = new Discord.EmbedBuilder()
                .setAuthor({ name: `Primeira Dama Adicionada!`, iconURL: message.author.avatarURL({ dynamic: true })})
                .setDescription(`${client.xx.anel} **Dama**: ${dama}\n${client.xx.id} **ID**: ${dama.id}\n\n${client.xx.anel} **Adicionada por**: ${message.author}\n${client.xx.id} **ID**: ${message.author.id}`)
                .setColor(colorNB);

            interaction.reply({ embeds: [damaAddedEmbed] });
        });

        collector.on('end', () => {
            damaMessage.edit({ components: [disableDama] });
        });
    }
}
