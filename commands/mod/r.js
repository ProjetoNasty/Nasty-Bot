const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: 'r',
    description: "Registrar um membro",
    run: async (client, message, args) => {
        
        

        const cargos = [
            "1091791544522117291",
	    "1037397418901245952"
        ];

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles) && !message.member.roles.cache.some(r => cargos.includes(r.id))) {

            let noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem a permissão necessária!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {

                setTimeout(() => msg.delete(), 8000);
            })

        }

        let userReg = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!userReg) return;
        let CargosDB = await db.get(`Registro_${message.guild.id}`)

        if (!CargosDB) return;

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136'

        let cargosAdicionados = []
        let UltimosC = []
        let Etapa = 0
        let PaginasValidas = 0
        let PaginasV = []
        for (let i in CargosDB) {
            if (CargosDB[i].length > 0 && i !== 'Não Registrado' && i !== 'Registrado') {
                PaginasValidas++
                PaginasV.push(CargosDB[i])
            }
        }
        async function Registro(message, newMsg) {

            if (Etapa < PaginasValidas) {
                let Opcao = PaginasV[Etapa];

                let ActionRow = new Discord.ActionRowBuilder()

                for (let i in Opcao) {
                    let TempCargo = message.guild.roles.cache.get(Opcao[i])
                    ActionRow.addComponents(new Discord.ButtonBuilder()
                        .setCustomId(i)
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setLabel(TempCargo.name))
                }
                let extraOpcoes = []
                Etapa > 0 ? extraOpcoes.push({ nome: 'Voltar', id: 'voltar', estilo: Discord.ButtonStyle.Danger }) : false
                extraOpcoes.push({ nome: 'Concluir', id: 'finalizar', estilo: Discord.ButtonStyle.Success })
                extraOpcoes.push({ nome: 'Avançar', id: 'skip', estilo: Discord.ButtonStyle.Secondary })

                let ExtraRow = new Discord.ActionRowBuilder()

                for (let i of extraOpcoes) {
                    ExtraRow.addComponents(new Discord.ButtonBuilder()
                        .setCustomId(i.id)
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setLabel(i.nome)
                        .setStyle(i.estilo))
                }
                let canal = newMsg
                if (canal == false) canal = message.channel
                let operation = 'edit'
                if (!newMsg) operation = 'send'
                let tempEmbed = new Discord.EmbedBuilder()
                    .setAuthor({ name: `Registrador: ${message.author.username}`, iconURL: message.author.avatarURL() })
                    .setTitle(`Sistema de Registro`)
                    .setDescription(`**Usuário:** <@${userReg.id}>`)
                    .setFooter({ text: `Página - [${Math.floor(Etapa + 1)}/${PaginasValidas}]` })
                cargosAdicionados.length !== 0 ? tempEmbed.addFields({ name: 'Cargos Adicionado(s)', value: cargosAdicionados.map(c => `<@&${c.id}>`).join('\n') }) : false
                canal[operation]({ embeds: [tempEmbed], components: [ActionRow, ExtraRow], fetchReply: true }).then(msg => {

                    let filter = (i) => i.user.id === message.author.id;
                    let coletor = msg.createMessageComponentCollector({ filter });

                    coletor.on('collect', (interaction) => {
                        coletor.stop();
                        let escolhido = interaction.customId;
                        interaction.deferUpdate();
                        if (escolhido !== 'skip' && escolhido !== 'finalizar') {
                            let cargoId = PaginasV[Etapa][escolhido]
                            let cargo = message.guild.roles.cache.get(cargoId);
                            if (cargo) {
                                cargosAdicionados.push(cargo)
                                UltimosC = cargo
                            } else {

                            }
                        }
                        Etapa++
                        if (escolhido == 'finalizar') {
                            Etapa *= 10
                        }
                        if (escolhido == 'voltar') {
                            Etapa -= 2
                            cargosAdicionados.splice(cargosAdicionados.indexOf(UltimosC), 1)
                        }
                        Registro(message, msg);
                    })
                })

            } else {

                let AllMessages = message.channel.messages.fetch();
                const FilteredMessages = (await AllMessages).filter(((m) => m.author.id == userReg.id));
                let deletedMessages = 0

                FilteredMessages.forEach(msg => {
                    msg.delete()
                    deletedMessages++
                });

                let registrados = await db.get(`registrados_${message.author.id}`)
                if (!registrados) registrados = 0
                registrados++;

                let registrado = new Discord.EmbedBuilder()
                    .setAuthor({ name: `| Usuário Registrado!`, url: `https://cdn.discordapp.com/emojis/981710311943966810.gif` })
                    .setDescription(`**Usuário**: ${userReg}\n**Registrador**:\n${message.author}\n**Cargos adicionados**:\n${cargosAdicionados.map(m => `<@&${m.id}>`).join('\n')}`)
                    .setThumbnail(message.guild.iconURL({ dynamic: true }))
                    .setColor(`${colorNB}`)
                    .setFooter({ text: `Registro | ${message.guild.name}`, url: `${message.guild.iconURL({ dynamic: true })}` })

                let registrado2 = new Discord.EmbedBuilder()
                    .setAuthor({ name: `| Usuário Registrado!`, url: `https://cdn.discordapp.com/emojis/981710311943966810.gif` })
                    .setDescription(`**Usuário**:\n${userReg}\n**Registrador**:\n${message.author}\n> **Cargos adicionados**:\n> \`${cargosAdicionados.map(c => c.name).join('\n')}\``)
                    .setThumbnail(message.guild.iconURL({ dynamic: true }))
                    .setColor(`${colorNB}`)
                    .setFooter({ text: `Registro | ${message.guild.name}`, url: `${message.guild.iconURL({ dynamic: true })}` })

                const embedReg = new Discord.EmbedBuilder()
                    .setAuthor({ name: `Usuário registrado!`, iconURL: 'https://cdn.discordapp.com/emojis/1071237913624465571.webp?size=44&quality=lossless' })
                    .setDescription(`**Registrador**:\n${message.author}\n**Membro**: ${userReg}\n**Registrou**: \`${registrados}\``)
                    .setThumbnail(message.guild.iconURL({ dynamic: true }))
                    .setColor(`${colorNB}`)
                    .setFooter({ text: `Registro | ${message.guild.name}`, url: `${message.guild.iconURL({ dynamic: true })}` })

		await db.add(`registrados_${message.author.id}`, 1);

                let logReg = message.guild.channels.cache.get('1069025733189582949');

                if (logReg) await logReg.send({ embeds: [embedReg] }).then(async msg => {
                    msg.react('1072677687786733608')

                });

                await userReg.send({ embeds: [registrado2] }).catch(err => { });

                let statusBv = await db.get(`statusBvNB_${message.guild.id}`);

                if (statusBv == true) {

                    let canalBvId = await db.get(`canalBvNB_${message.guild.id}`);
                    let canalBv = message.guild.channels.cache.get(canalBvId);
                    let msgBv = await db.get(`msgBvNB_${message.guild.id}`);

                    const alterado = msgBv
                        .replaceAll("@member", `${userReg}`)
                        .replaceAll("@server", `${message.guild.name}`)
                        .replaceAll("@username", `${userReg.user.username}`)

                    msgBv = `${alterado}`;

                    await canalBv.send({ content: `${msgBv}` });
                }

                for (let cargo of cargosAdicionados) {
                    await userReg.roles.add(cargo).catch(err => {

                    });
                }
                for (let cnr of CargosDB["Não Registrado"]) {
                    await userReg.roles.remove(cnr).catch(err => {
                    })
                }
                for (let cnr of CargosDB['Registrado']) {
                    await userReg.roles.add(cnr).catch(err => {
                    })
                }
                return newMsg.edit({ embeds: [registrado], components: [] }).then((nmsg) => {
                    setTimeout(() => nmsg.delete(), 6000);
                });

            }
        }

        Registro(message, false);

    }
}