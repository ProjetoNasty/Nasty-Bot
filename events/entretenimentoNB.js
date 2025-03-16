const client = require('..');
const Discord = require("discord.js");
const ms = require('ms');
const fetch = require('node-fetch');
const CanvasUtils = require("../utils/Util");
const { loadImage, createCanvas } = require('canvas');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('interactionCreate', async (interaction) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    let colorNB = await db.get(`colorNB`);
    if (!colorNB) colorNB = '#2f3136';

    if (interaction.customId === "sistemamigracao") {

        if (interaction.values[0] === 'migracao') {

            let ficha = await db.get(`fichamigra_${interaction.user.id}`);

            let embed = new Discord.EmbedBuilder()
                .setDescription(`${interaction.user}, você já possui uma ficha em análise, por favor aguarde!`)
                .setColor(`${colorNB}`)

            if (ficha >= 1) return interaction.reply({ embeds: [embed], ephemeral: true });

            const NBmigracao = new Discord.ModalBuilder()
                .setCustomId('migracaoNBB')
                .setTitle(`Migração`)

            const pessoasMigraNB = new Discord.TextInputBuilder()
                .setCustomId('pessoasMigraNB')
                .setLabel('QUANTAS PESSOAS IRÃO VIR?')
                .setRequired(true)
                .setStyle(Discord.TextInputStyle.Short)

            const urlMigraNB = new Discord.TextInputBuilder()
                .setCustomId('urlMigraNB')
                .setLabel('QUAL A URL DO SERVIDOR?')
                .setRequired(true)
                .setStyle(Discord.TextInputStyle.Short)

            const firstActionRow = new Discord.ActionRowBuilder()
                .addComponents(pessoasMigraNB)

            const secondActionRow = new Discord.ActionRowBuilder()
                .addComponents(urlMigraNB)

            NBmigracao.addComponents(firstActionRow, secondActionRow)
            await interaction.showModal(NBmigracao);
        }

        if (interaction.values[0] === 'recruta') {

            const NBrecruta = new Discord.ModalBuilder()
                .setCustomId('recrutaNB')
                .setTitle(`Recrutamento`)

            const areaRecrutaNB = new Discord.TextInputBuilder()
                .setCustomId('areaRecrutaNB')
                .setLabel('EM QUAL ÁREA DESEJA ENTRAR?')
                .setRequired(true)
                .setStyle(Discord.TextInputStyle.Short)

            const idadeRecrutaNB = new Discord.TextInputBuilder()
                .setCustomId('idadeRecrutaNB')
                .setLabel('QUAL A SUA IDADE?')
                .setRequired(true)
                .setStyle(Discord.TextInputStyle.Short)

            const firstActionRow = new Discord.ActionRowBuilder()
                .addComponents(areaRecrutaNB)

            const secondActionRow = new Discord.ActionRowBuilder()
                .addComponents(idadeRecrutaNB)

            NBrecruta.addComponents(firstActionRow, secondActionRow)
            await interaction.showModal(NBrecruta);

        }
    }

    if (interaction.customId === 'migracaoNBB') {

        const guild = interaction.guild;

        const fichasID = await db.get(`canalfichasMigraNB_${interaction.guild.id}`);
        const logsMigraID = await await db.get(`canallogsMigraNB_${interaction.guild.id}`);

        let fichas = guild.channels.cache.get(fichasID);

        const pessoasMigra = interaction.fields.getTextInputValue('pessoasMigraNB');
        const urlMigra = interaction.fields.getTextInputValue('urlMigraNB');

        let ficha = new Discord.EmbedBuilder()
            .setDescription(`Sua ficha foi criada e enviada a nossa equipe para ser aprovada, boa sorte!`)
            .setColor(`${colorNB}`)

        interaction.reply({ embeds: [ficha], ephemeral: true });

        console.log(pessoasMigra)
        console.log(urlMigra)
        const link = `https://discordapp.com/users/${interaction.user.id}`;

        let embedFicha = new Discord.EmbedBuilder()
            .setAuthor({ name: `${guild.name} - Migração`, iconURL: guild.iconURL({ dynamic: true }) })
            .addFields(
                { name: "Membro:", value: `${interaction.user.username} (${interaction.user.username})`, "inline": true },
                { name: "Pessoas:", value: `\`${pessoasMigra}\``, "inline": false },
                { name: "Url do Servidor:", value: `${urlMigra}`, "inline": false },
                { name: `Clique abaixo para ser redirecionado ao perfil do(a) ${interaction.user.username}`, value: `[Clique Aqui](${link})`, "inline": false })

            .setColor(`${colorNB}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({ text: `${guild.name} ©`, iconURL: guild.iconURL({ dynamic: true }) })

        const rowMigra = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Aceitar")
                    .setEmoji('1119981337596670053')
                    .setCustomId('aceitarMigra')
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setLabel("Recusar")
                    .setEmoji('1119981400012099664')
                    .setCustomId('recusarMigra')
                    .setStyle(Discord.ButtonStyle.Secondary))

        let cargosMigra = await db.get(`cargosMigra_${guild.id}.cargosMigra`);
        let aprovadores = cargosMigra.map(c => `<@&${c}>`).join(' ');

        fichas.send({ content: `${aprovadores}` }).then((msg) => { msg.delete() });

        const MESSAGE = await fichas.send({ embeds: [embedFicha], components: [rowMigra] });
        const filter = (i) => !i.user.bot;
        const collector = MESSAGE.createMessageComponentCollector({ filter });

        await db.add(`fichaMigra_${interaction.user.id}`, 1);

        collector.on('collect', async (b) => {

            let embedPerm = new Discord.EmbedBuilder()
                .setDescription(`${b.member}, você não é um Migrador!`)
                .setColor(`${colorNB}`)

            let cargosMigra2 = await db.get(`cargosMigra_${guild.id}.cargosMigra`);

            if (!b.member.roles.cache.some(r => cargosMigra2.includes(r.id))) return b.reply({ embeds: [embedPerm], ephemeral: true });

            if (b.customId == "recusarMigra") {

                let embed2 = new Discord.EmbedBuilder()
                    .setDescription(`${b.member}, ficha recusada com sucesso!`)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embed2], ephemeral: true });

                MESSAGE.delete();
                db.delete(`fichaMigra_${interaction.user.id}`, 1);
            }

            if (b.customId == "aceitarMigra") {

                let embed2 = new Discord.EmbedBuilder()
                    .setDescription(`${b.member}, ficha aceita com sucesso!`)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embed2], ephemeral: true });

                b.guild.channels.create({
                    name: `🏆・${interaction.user.username}`,
                    parent: b.channel.parent.id,
                    topic: `migracao_${b.user.id}`,
                    type: Discord.ChannelType.GuildText,
                    permissionOverwrites: [

                        {
                            id: b.guild.id,
                            deny: [Discord.PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: b.user.id,
                            allow: [
                                Discord.PermissionFlagsBits.ViewChannel,
                                Discord.PermissionFlagsBits.AddReactions,
                                Discord.PermissionFlagsBits.SendMessages,
                                Discord.PermissionFlagsBits.AttachFiles,
                                Discord.PermissionFlagsBits.EmbedLinks
                            ]
                        },

                        {
                            id: interaction.user.id,
                            allow: [
                                Discord.PermissionFlagsBits.ViewChannel,
                                Discord.PermissionFlagsBits.SendMessages,
                                Discord.PermissionFlagsBits.AttachFiles
                            ]
                        },
                    ]
                }).then(async canalM => {

                    let migracao = new Discord.EmbedBuilder()
                        .setAuthor({ name: `${guild.name} - Migração`, iconURL: guild.iconURL({ dynamic: true }) })
                        .setDescription(`Membro: ${interaction.user}\nCargo: \`Nenhum cargo.\`\nServidor: ${urlMigra}\nQuantidade de pessoas que virão junto: \`${pessoasMigra}\`\n\n> Envie no chat algumas prints do seu **CARGO** no servidor informado no formulário, após isso aguarde que nossa equipe irá confirmar e te responder o mais rápido possível aqui no **TICKET**.`)
                        .setThumbnail(b.guild.iconURL({ dynamic: true }))
                        .setColor(`${colorNB}`)

                    const rowMigra = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Criar call")
                                .setCustomId('callMigra')
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Adicionar membro")
                                .setCustomId('addMigra')
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Remover membro")
                                .setCustomId('removMigra')
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Adicionar cargo")
                                .setCustomId('cargoMigra')
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Finalizar migração")
                                .setCustomId('finalMigra')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowMigra2 = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Excluir canal")
                                .setCustomId('excluirMigra')
                                .setStyle(Discord.ButtonStyle.Danger))

                    canalM.send({ embeds: [migracao], components: [rowMigra, rowMigra2] }).then(async (msg) => {
                        const filter = (i) => !i.user.bot;
                        const collector = msg.createMessageComponentCollector({ filter });

                        let atendimento = new Discord.EmbedBuilder()
                            .setAuthor({ name: `${b.guild.name} - Migração`, iconURL: b.guild.iconURL({ dynamic: true }) })
                            .setDescription(`Moderador: ${b.member}\nMembro: ${interaction.user}`)
                            .setColor(`${colorNB}`)
                            .setThumbnail(guild.iconURL({ dynamic: true }))
                            .setFooter({ text: `${guild.name} ©`, iconURL: guild.iconURL({ dynamic: true }) })

                        let rowUrl = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setLabel("Ir para o atendimento")
                                    .setURL(`https://discord.com/channels/${b.guild.id}/${canalM.id}/${MESSAGE.id}`)
                                    .setStyle(Discord.ButtonStyle.Link))

                        await MESSAGE.edit({ embeds: [atendimento], components: [rowUrl] });

                        canalM.send({ content: `${interaction.user} ${b.member}` }).then((msg) => { msg.delete() });

                        await db.push(`membroMigra_${msg.id}.migra`, interaction.user.id);
                        await db.set(`urlMigra_${msg.id}.migra`, urlMigra);

                        collector.on('collect', async (b) => {

                            let embedPerm = new Discord.EmbedBuilder()
                                .setDescription(`${b.member}, você não é um Migrador!`)
                                .setColor(`${colorNB}`)

                            let cargosMigra2 = await db.get(`cargosMigra_${guild.id}.cargosMigra`);

                            if (!b.member.roles.cache.some(r => cargosMigra2.includes(r.id))) return b.reply({ embeds: [embedPerm], ephemeral: true });


                            if (b.customId == "callMigra") {

                                const canalMigraVoz = await db.get(`canalvozmigra_${b.message.id}`);

                                const embed2 = new Discord.EmbedBuilder()
                                    .setDescription(`${b.membe}, esse ticket já possui um canal de voz criado!`)
                                    .setColor(`${colorNB}`)

                                if (canalMigraVoz) return b.reply({ embeds: [embed2], ephemeral: true });

                                b.guild.channels.create({
                                    name: `🏆・${interaction.user.username}`,
                                    parent: b.channel.parent.id,
                                    type: Discord.ChannelType.GuildVoice,
                                    permissionOverwrites: [

                                        {
                                            id: b.guild.id,
                                            deny: [

                                                Discord.PermissionFlagsBits.ViewChannel,
                                                Discord.PermissionFlagsBits.Connect

                                            ]
                                        },
                                        {
                                            id: b.user.id,
                                            allow: [

                                                Discord.PermissionFlagsBits.ViewChannel,
                                                Discord.PermissionFlagsBits.Connect
                                            ]
                                        },

                                        {
                                            id: interaction.user.id,
                                            allow: [

                                                Discord.PermissionFlagsBits.ViewChannel,
                                                Discord.PermissionFlagsBits.Connect
                                            ]
                                        },
                                    ]
                                }).then(async canalM => {

                                    await db.set(`canalvozmigra_${b.message.id}`, canalM.id);

                                    let embed = new Discord.EmbedBuilder()
                                        .setDescription(`${b.member}, canal de voz criado com sucesso!`)
                                        .setColor(`${colorNB}`)

                                    let rowUrl = new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setLabel("Conectar no canal")
                                                .setURL(`https://discord.com/channels/${b.guild.id}/${canalM.id}`)
                                                .setStyle(Discord.ButtonStyle.Link))

                                    b.reply({ embeds: [embed], components: [rowUrl], ephemeral: true });

                                })

                            }

                            if (b.customId == "addMigra") {

                                let embedCargoWl = new Discord.EmbedBuilder()
                                    .setDescription(`Envie no chat o (@usuario/id) do membro desejado\nPara cancelar a operação digite: \`cancelar\``)
                                    .setColor(`${colorNB}`)

                                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                                coletor.on("collect", async (message) => {

                                    message.delete();

                                    let ee = message.mentions.members.first() || message.guild.members.cache.get(message.content);

                                    if (message.content == "cancelar") {

                                        coletor.stop('Collector stopped manually');

                                        let errado = new Discord.EmbedBuilder()
                                            .setDescription(`Operação cancelada com sucesso.`)
                                            .setColor(`${colorNB}`)

                                        return b.editReply({ embeds: [errado], ephemeral: true })

                                    }

                                    let membro = b.guild.members.cache.get(ee.id);

                                    if (!membro) {

                                        coletor.stop('Collector stopped manually');

                                        let errado = new Discord.EmbedBuilder()
                                            .setDescription(`Por favor mencione um ID válido.`)
                                            .setColor(`${colorNB}`)

                                        return b.editReply({ embeds: [errado], ephemeral: true })

                                    } else {

                                        let embedG = new Discord.EmbedBuilder()
                                            .setDescription(`Membro adicionado com sucesso ao ticket.`)
                                            .setColor(`${colorNB}`)

                                        b.editReply({ embeds: [embedG], ephemeral: true });

                                        await db.push(`membroMigra_${msg.id}.migra`, membro.id);

                                        canalM.permissionOverwrites.edit(membro.id,

                                            {

                                                ViewChannel: true,
                                                AttachFiles: true,
                                                SendMessages: true

                                            }
                                        );

                                        let membroMigra = await db.get(`membroMigra_${msg.id}.migra`);

                                        if (!membroMigra || membroMigra.length == 0) {

                                            membroMigra = `\`Nenhum\``;

                                        } else {

                                            membroMigra = membroMigra.map(c => `<@${c}>`).join(' - ');

                                        }

                                        let cargoMigra = await db.get(`cargoMigra_${msg.id}.migra`);

                                        if (!cargoMigra || cargoMigra.length == 0) {

                                            cargoMigra = `\`Nenhum cargo.\``;

                                        } else {

                                            cargoMigra = cargoMigra.map(c => `<@&${c}>`).join(' - ');

                                        }

                                        let migracao = new Discord.EmbedBuilder()
                                            .setAuthor({ name: `${guild.name} - Migração`, iconURL: guild.iconURL({ dynamic: true }) })
                                            .setDescription(`Membro: ${membroMigra}\nCargo: ${cargoMigra}\nServidor: ${urlMigra}\nQuantidade de pessoas que virão junto: \`${pessoasMigra}\`\n\nEnvie no chat algumas prints do seu **CARGO** no servidor informado no formulário, após isso aguarde que nossa equipe irá confirmar e te responder o mais rápido possível aqui no **TICKET**.`)
                                            .setThumbnail(b.guild.iconURL({ dynamic: true }))
                                            .setColor(`${colorNB}`)

                                        b.message.edit({ embeds: [migracao] });
                                    }

                                })

                            } // fim aq

                            if (b.customId == "removMigra") {

                                let embedCargoWl = new Discord.EmbedBuilder()
                                    .setDescription(`Envie no chat o (@usuario/id) do membro desejado\nPara cancelar a operação digite: \`cancelar\``)
                                    .setColor(`${colorNB}`)

                                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                                coletor.on("collect", async (message) => {

                                    message.delete();

                                    let ee = message.mentions.members.first() || message.guild.members.cache.get(message.content);

                                    if (message.content == "cancelar") {

                                        coletor.stop('Collector stopped manually');

                                        let errado = new Discord.EmbedBuilder()
                                            .setDescription(`Operação cancelada com sucesso.`)
                                            .setColor(`${colorNB}`)

                                        return b.editReply({ embeds: [errado], ephemeral: true })

                                    }

                                    let membro = b.guild.members.cache.get(ee.id);

                                    if (!membro) {

                                        coletor.stop('Collector stopped manually');

                                        let errado = new Discord.EmbedBuilder()
                                            .setDescription(`Por favor mencione um ID válido.`)
                                            .setColor(`${colorNB}`)

                                        return b.editReply({ embeds: [errado], ephemeral: true })

                                    } else {

                                        let embedG = new Discord.EmbedBuilder()
                                            .setDescription(`Membro removido com sucesso ao ticket.`)
                                            .setColor(`${colorNB}`)

                                        b.editReply({ embeds: [embedG], ephemeral: true });

                                        await db.set(`membroMigra_${msg.id}.migra`, (await db.get(`membroMigra_${msg.id}.migra`))?.filter(e => e !== `${membro.id}`));

                                        canalM.permissionOverwrites.edit(membro.id,

                                            {

                                                ViewChannel: false,
                                                AttachFiles: false,
                                                SendMessages: false

                                            }
                                        );

                                        let membroMigra = await db.get(`membroMigra_${msg.id}.migra`);

                                        if (!membroMigra || membroMigra.length == 0) {

                                            membroMigra = `\`Nenhum\``;

                                        } else {

                                            membroMigra = membroMigra.map(c => `<@${c}>`).join(' - ');

                                        }

                                        let cargoMigra = await db.get(`cargoMigra_${msg.id}.migra`);

                                        if (!cargoMigra || cargoMigra.length == 0) {

                                            cargoMigra = `\`Nenhum cargo.\``;

                                        } else {

                                            cargoMigra = cargoMigra.map(c => `<@&${c}>`).join(' - ');

                                        }

                                        let migracao = new Discord.EmbedBuilder()
                                            .setAuthor({ name: `${guild.name} - Migração`, iconURL: guild.iconURL({ dynamic: true }) })
                                            .setDescription(`Membro: ${membroMigra}\nCargo: ${cargoMigra}\nServidor: ${urlMigra}\nQuantidade de pessoas que virão junto: \`${pessoasMigra}\`\n\nEnvie no chat algumas prints do seu **CARGO** no servidor informado no formulário, após isso aguarde que nossa equipe irá confirmar e te responder o mais rápido possível aqui no **TICKET**.`)
                                            .setThumbnail(b.guild.iconURL({ dynamic: true }))
                                            .setColor(`${colorNB}`)

                                        b.message.edit({ embeds: [migracao] });

                                    }

                                })
                            } // final aq

                            if (b.customId == "cargoMigra") {

                                let embedCargoWl = new Discord.EmbedBuilder()
                                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                                    .setColor(`${colorNB}`)

                                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                                coletor.on("collect", async (message) => {

                                    message.delete();

                                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content).catch(err => {
                                    });

                                    if (message.content == "cancelar") {

                                        coletor.stop('Collector stopped manually');

                                        let errado = new Discord.EmbedBuilder()
                                            .setDescription(`Operação cancelada com sucesso.`)
                                            .setColor(`${colorNB}`)

                                        return b.editReply({ embeds: [errado], ephemeral: true })

                                    }

                                    let cargo = b.guild.roles.cache.get(ee?.id);

                                    if (!cargo) {

                                        coletor.stop('Collector stopped manually');

                                        let errado = new Discord.EmbedBuilder()
                                            .setDescription(`Por favor mencione um ID válido.`)
                                            .setColor(`${colorNB}`)

                                        return b.editReply({ embeds: [errado], ephemeral: true })

                                    } else {

                                        let embedG = new Discord.EmbedBuilder()
                                            .setDescription(`Cargo adicionado com sucesso ao ticket.`)
                                            .setColor(`${colorNB}`)

                                        b.editReply({ embeds: [embedG], ephemeral: true });

                                        await db.push(`cargoMigra_${msg.id}.migra`, cargo.id);

                                        let membroMigra = await db.get(`membroMigra_${msg.id}.migra`);

                                        if (!membroMigra || membroMigra.length == 0) {

                                            membroMigra = `\`Nenhum\``;

                                        } else {

                                            membroMigra = membroMigra.map(c => `<@${c}>`).join(' - ');

                                        }

                                        let cargoMigra = await db.get(`cargoMigra_${msg.id}.migra`);

                                        if (!cargoMigra || cargoMigra.length == 0) {

                                            cargoMigra = `\`Nenhum cargo.\``;

                                        } else {

                                            cargoMigra = cargoMigra.map(c => `<@&${c}>`).join(' - ');

                                        }

                                        let migracao = new Discord.EmbedBuilder()
                                            .setAuthor({ name: `${guild.name} - Migração`, iconURL: guild.iconURL({ dynamic: true }) })
                                            .setDescription(`Membro: ${membroMigra}\nCargo: ${cargoMigra}\nServidor: ${urlMigra}\nQuantidade de pessoas que virão junto: \`${pessoasMigra}\`\n\nEnvie no chat algumas prints do seu **CARGO** no servidor informado no formulário, após isso aguarde que nossa equipe irá confirmar e te responder o mais rápido possível aqui no **TICKET**.`)
                                            .setThumbnail(b.guild.iconURL({ dynamic: true }))
                                            .setColor(`${colorNB}`)

                                        b.message.edit({ embeds: [migracao] });

                                    }

                                })

                            } // final aq

                            if (b.customId == "finalMigra") {

                                let logMigra = b.guild.channels.cache.get(logsMigraID);

                                await db.add(`migrou_${b.user.id}`, 1);

                                let migrou = await db.get(`migrou_${b.user.id}`);

                                let membroMigra = await db.get(`membroMigra_${msg.id}.migra`);

                                if (!membroMigra || membroMigra.length == 0) {

                                    membroMigra = `\`Nenhum\``;

                                } else {

                                    membroMigra = membroMigra.map(c => `<@${c}>`).join(' - ');

                                }

                                let cargoMigra = await db.get(`cargoMigra_${msg.id}.migra`);

                                if (!cargoMigra || cargoMigra.length == 0) {

                                    cargoMigra = `\`Nenhum cargo.\``;

                                } else {

                                    cargoMigra = cargoMigra.map(c => `<@&${c}>`).join(' - ');

                                }

                                let urlMigra = await db.get(`urlMigra_${msg.id}.migra`);

                                const embedfinal = new Discord.EmbedBuilder()
                                    .setAuthor({ name: `${guild.name} - Migração`, iconURL: guild.iconURL({ dynamic: true }) })
                                    .setDescription(`> Parece que seu ticket foi concluído pelo(a) moderador ${b.user}, obrigado por querer fazer parte da família ${b.guild.name}.\n\nCaso precise de ajuda estaremos aqui, aproveite bem o servidor!`)
                                    .setColor(`${colorNB}`)
                                    .setFooter({ text: `O canal será deletado em 10 segundos.`, iconURL: `https://cdn.discordapp.com/emojis/1015228066315911230.gif` })

                                b.reply({ embeds: [embedfinal] });

                                let fichamigracao = new Discord.EmbedBuilder()
                                    .setAuthor({ name: `${guild.name} - Migração`, iconURL: guild.iconURL({ dynamic: true }) })
                                    .setDescription(`Moderador: ${b.member}\nMembro: ${membroMigra}\nCargo: ${cargoMigra}\nServidor: ${urlMigra}`)
                                    .setThumbnail(guild.iconURL({ dynamic: true }))
                                    .setColor(`${colorNB}`)
                                    .setFooter({ text: `${b.user.username} já migrou ${migrou} membros.`, iconURL: b.member.user.displayAvatarURL({ dynamic: true }) })

                                logMigra.send({ embeds: [fichamigracao] }).catch(err => { });

                                await db.delete(`membroMigra_${msg.id}`);
                                await db.delete(`cargoMigra_${msg.id}`);
                                await db.delete(`urlMigra_${msg.id}.migra`);
                                await db.delete(`fichaMigra_${interaction.user.id}`);

                                setTimeout(async () => {

                                    canalM.delete().catch(err => { });

                                    MESSAGE.delete().catch(err => { });

                                    let canalMigraID = await db.get(`canalvozmigra_${msg.id}`);

                                    let canal = await b.guild.channels.cache.get(canalMigraID);

                                    if (canal) {

                                        canal.delete().catch(err => { });

                                        await db.delete(`canalvozmigra_${msg.id}`);

                                    }

                                }, 10000);
                            }

                            if (b.customId == "excluirMigra") {

                                await db.delete(`membroMigra_${msg.id}`);
                                await db.delete(`cargoMigra_${msg.id}`);
                                await db.delete(`urlMigra_${msg.id}.migra`);
                                await db.delete(`fichaMigra_${interaction.user.id}`);

                                canalM.delete().catch(err => { });

                                MESSAGE.delete().catch(err => { });

                                let canalMigraID = await db.get(`canalvozmigra_${msg.id}`);

                                let canal = await b.guild.channels.cache.get(canalMigraID);

                                if (canal) {

                                    canal.delete().catch(err => { });

                                    await db.delete(`canalvozmigra_${msg.id}`);

                                }
                            }
                        })

                    })
                })
            }
        })
    }


    if (interaction.customId === 'recrutaNB') {

        const guild = interaction.guild;

        const fichasID = await db.get(`canalfichasMigraNB_${interaction.guild.id}`);
        const logsRecrutaID = await await db.get(`canallogsMigraNB_${interaction.guild.id}`);

        let fichas = guild.channels.cache.get(fichasID);

        const areaRecruta = interaction.fields.getTextInputValue('areaRecrutaNB')
        const idadeRecruta = interaction.fields.getTextInputValue('idadeRecrutaNB')

        let ficha = new Discord.EmbedBuilder()
            .setDescription(`Sua ficha foi criada e enviada a nossa equipe para ser aprovada, boa sorte!`)
            .setColor(`${colorNB}`)

        interaction.reply({ embeds: [ficha], ephemeral: true });

        const link = `https://discordapp.com/users/${interaction.user.id}`;

        let embedFicha = new Discord.EmbedBuilder()
            .setAuthor({ name: `${guild.name} - Recrutamento`, iconURL: guild.iconURL({ dynamic: true }) })
            .addFields(
                { name: "Membro:", value: `${interaction.user.username} (${interaction.user.username})`, "inline": true },
                { name: "Área:", value: `\`${areaRecruta}\``, "inline": false },
                { name: "Idade:", value: `\`${idadeRecruta}\``, "inline": false },
                { name: `Clique abaixo para ser redirecionado ao perfil do(a) ${interaction.user.username}`, value: `[Clique Aqui](${link})`, "inline": false })

            .setColor(`${colorNB}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({ text: `${guild.name} ©`, iconURL: guild.iconURL({ dynamic: true }) })

        const rowMigra = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Aceitar")
                    .setCustomId('aceitarRecruta')
                    .setStyle(Discord.ButtonStyle.Success),
                new Discord.ButtonBuilder()
                    .setLabel("Recusar")
                    .setCustomId('recusarRecruta')
                    .setStyle(Discord.ButtonStyle.Danger))

        let cargosMigra = await db.get(`cargosMigra_${guild.id}.cargosMigra`);
        let aprovadores = cargosMigra.map(c => `<@&${c}>`).join(' ');

        fichas.send({ content: `${aprovadores}` }).then((msg) => { msg.delete() });

        const MESSAGE = await fichas.send({ embeds: [embedFicha], components: [rowMigra] });
        const filter = (i) => !i.user.bot;
        const collector = MESSAGE.createMessageComponentCollector({ filter });

        await db.add(`fichaMigra_${interaction.user.id}`, 1);

        collector.on('collect', async (b) => {

            let embedPerm = new Discord.EmbedBuilder()
                .setDescription(`${b.member}, apenas um membro autorizado pode aceitar ou recusar fichas!`)
                .setColor(`${colorNB}`)

            let cargosMigra2 = await db.get(`cargosMigra_${guild.id}.cargosMigra`);

            if (!b.member.roles.cache.some(r => cargosMigra2.includes(r.id))) return b.reply({ embeds: [embedPerm], ephemeral: true });

            if (b.customId == "recusarRecruta") {

                let embed2 = new Discord.EmbedBuilder()
                    .setDescription(`${b.member}, ficha recusada com sucesso!`)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embed2], ephemeral: true });

                MESSAGE.delete();
                db.delete(`fichaMigra_${interaction.user.id}`, 1);
            }

            if (b.customId == "aceitarRecruta") {

                let embed2 = new Discord.EmbedBuilder()
                    .setDescription(`${b.member}, ficha aceita com sucesso!`)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embed2], ephemeral: true });

                b.guild.channels.create({
                    name: `🏆・${interaction.user.username}`,
                    parent: b.channel.parent.id,
                    topic: `recrutamento_${b.user.id}`,
                    type: Discord.ChannelType.GuildText,
                    permissionOverwrites: [

                        {
                            id: b.guild.id,
                            deny: [Discord.PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: b.user.id,
                            allow: [
                                Discord.PermissionFlagsBits.ViewChannel,
                                Discord.PermissionFlagsBits.AddReactions,
                                Discord.PermissionFlagsBits.SendMessages,
                                Discord.PermissionFlagsBits.AttachFiles,
                                Discord.PermissionFlagsBits.EmbedLinks
                            ]
                        },

                        {
                            id: interaction.user.id,
                            allow: [
                                Discord.PermissionFlagsBits.ViewChannel,
                                Discord.PermissionFlagsBits.SendMessages,
                                Discord.PermissionFlagsBits.AttachFiles
                            ]
                        },
                    ]
                }).then(async canalR => {

                    let recrutamento = new Discord.EmbedBuilder()
                        .setAuthor({ name: `${guild.name} - Recrutamento`, iconURL: guild.iconURL({ dynamic: true }) })
                        .setDescription(`Membro: ${interaction.user}\nCargo: \`Nenhum cargo.\`\nÁrea: \`${areaRecruta}\`\n\n> Envie no chat algumas **INFORMAÇÕES** adicionais sobre você, mostrando um pouco da sua experiência na **ÁREA** em que deseja atuar, após isso aguarde que nossa equipe irá confirmar e te responder o mais rápido possível aqui no **TICKET**.`)
                        .setThumbnail(b.guild.iconURL({ dynamic: true }))
                        .setColor(`${colorNB}`)

                    const rowRecruta = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Criar call")
                                .setCustomId('callRecruta')
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Adicionar cargo")
                                .setCustomId('cargoRecruta')
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Finalizar recrutamento")
                                .setCustomId('finalRecruta')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowRecruta2 = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Excluir canal")
                                .setCustomId('excluirRecruta')
                                .setStyle(Discord.ButtonStyle.Danger))

                    canalR.send({ embeds: [recrutamento], components: [rowRecruta, rowRecruta2] }).then(async (msg) => {
                        const filter = (i) => !i.user.bot;
                        const collector = msg.createMessageComponentCollector({ filter });

                        let atendimento = new Discord.EmbedBuilder()
                            .setAuthor({ name: `${b.guild.name} - Recrutamento`, iconURL: b.guild.iconURL({ dynamic: true }) })
                            .setDescription(`Moderador: ${b.member}\nMembro: ${interaction.user}`)
                            .setColor(`${colorNB}`)
                            .setThumbnail(guild.iconURL({ dynamic: true }))
                            .setFooter({ text: `${guild.name} ©`, iconURL: guild.iconURL({ dynamic: true }) })

                        let rowUrl = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setLabel("Ir para o atendimento")
                                    .setURL(`https://discord.com/channels/${b.guild.id}/${canalR.id}/${MESSAGE.id}`)
                                    .setStyle(Discord.ButtonStyle.Link))

                        await MESSAGE.edit({ embeds: [atendimento], components: [rowUrl] });

                        canalR.send({ content: `${interaction.user} ${b.member}` }).then((msg) => { msg.delete() });

                        await db.set(`areaRecruta_${msg.id}`, areaRecruta);
                        await db.set(`idadeRecruta_${msg.id}`, idadeRecruta);

                        collector.on('collect', async (b) => {

                            let embedPerm = new Discord.EmbedBuilder()
                                .setDescription(`${b.member}, você não é um Migrador!`)
                                .setColor(`${colorNB}`)

                            let cargosMigra2 = await db.get(`cargosMigra_${guild.id}.cargosMigra`);

                            if (!b.member.roles.cache.some(r => cargosMigra2.includes(r.id))) return b.reply({ embeds: [embedPerm], ephemeral: true });


                            if (b.customId == "callRecruta") {

                                const canalMigraVoz = await db.get(`canalvozrecruta_${b.message.id}`);

                                const embed2 = new Discord.EmbedBuilder()
                                    .setDescription(`${b.membe}, esse ticket já possui um canal de voz criado!`)
                                    .setColor(`${colorNB}`)

                                if (canalMigraVoz) return b.reply({ embeds: [embed2], ephemeral: true });

                                b.guild.channels.create({
                                    name: `🏆・${interaction.user.username}`,
                                    parent: b.channel.parent.id,
                                    type: Discord.ChannelType.GuildVoice,
                                    permissionOverwrites: [

                                        {
                                            id: b.guild.id,
                                            deny: [

                                                Discord.PermissionFlagsBits.ViewChannel,
                                                Discord.PermissionFlagsBits.Connect

                                            ]
                                        },
                                        {
                                            id: b.user.id,
                                            allow: [

                                                Discord.PermissionFlagsBits.ViewChannel,
                                                Discord.PermissionFlagsBits.Connect
                                            ]
                                        },

                                        {
                                            id: interaction.user.id,
                                            allow: [

                                                Discord.PermissionFlagsBits.ViewChannel,
                                                Discord.PermissionFlagsBits.Connect
                                            ]
                                        },
                                    ]
                                }).then(async canalR => {

                                    await db.set(`canalvozrecruta_${b.message.id}`, canalR.id);

                                    let embed = new Discord.EmbedBuilder()
                                        .setDescription(`${b.member}, canal de voz criado com sucesso!`)
                                        .setColor(`${colorNB}`)

                                    let rowUrl = new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setLabel("Conectar no canal")
                                                .setURL(`https://discord.com/channels/${b.guild.id}/${canalR.id}`)
                                                .setStyle(Discord.ButtonStyle.Link))

                                    b.reply({ embeds: [embed], components: [rowUrl], ephemeral: true });

                                })
                            }

                            if (b.customId == "cargoRecruta") {

                                let embedCargoWl = new Discord.EmbedBuilder()
                                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                                    .setColor(`${colorNB}`)

                                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                                coletor.on("collect", async (message) => {

                                    message.delete();

                                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content).catch(err => {
                                    });

                                    if (message.content == "cancelar") {

                                        coletor.stop('Collector stopped manually');

                                        let errado = new Discord.EmbedBuilder()
                                            .setDescription(`Operação cancelada com sucesso.`)
                                            .setColor(`${colorNB}`)

                                        return b.editReply({ embeds: [errado], ephemeral: true })

                                    }

                                    let cargo = b.guild.roles.cache.get(ee?.id);

                                    if (!cargo) {

                                        coletor.stop('Collector stopped manually');

                                        let errado = new Discord.EmbedBuilder()
                                            .setDescription(`Por favor mencione um ID válido.`)
                                            .setColor(`${colorNB}`)

                                        return b.editReply({ embeds: [errado], ephemeral: true })

                                    } else {

                                        let embedG = new Discord.EmbedBuilder()
                                            .setDescription(`Cargo adicionado com sucesso ao ticket.`)
                                            .setColor(`${colorNB}`)

                                        b.editReply({ embeds: [embedG], ephemeral: true });

                                        await db.push(`cargoRecruta_${msg.id}.recruta`, cargo.id);

                                        let cargoRecruta = await db.get(`cargoRecruta_${msg.id}.recruta`);

                                        if (!cargoRecruta || cargoRecruta.length == 0) {

                                            cargoRecruta = `\`Nenhum cargo.\``;

                                        } else {

                                            cargoRecruta = cargoRecruta.map(c => `<@&${c}>`).join(' - ');

                                        }

                                        let recrutamento = new Discord.EmbedBuilder()
                                            .setAuthor({ name: `${guild.name} - Recrutamento`, iconURL: guild.iconURL({ dynamic: true }) })
                                            .setDescription(`Membro: ${interaction.user}\nCargo: ${cargoRecruta}\nÁrea: \`${areaRecruta}\`\n\n> Envie no chat algumas **INFORMAÇÕES** adicionais sobre você, mostrando um pouco da sua experiência na **ÁREA** em que deseja atuar, após isso aguarde que nossa equipe irá confirmar e te responder o mais rápido possível aqui no **TICKET**.`)
                                            .setThumbnail(b.guild.iconURL({ dynamic: true }))
                                            .setColor(`${colorNB}`)

                                        b.message.edit({ embeds: [recrutamento] });

                                    }

                                })

                            }

                            if (b.customId == "finalRecruta") {

                                let logRecruta = b.guild.channels.cache.get(logsRecrutaID);

                                await db.add(`recrutou_${b.user.id}`, 1);

                                let recrutou = await db.get(`recrutou_${b.user.id}`);

                                let cargoRecruta = await db.get(`cargoRecruta_${msg.id}.recruta`);

                                if (!cargoRecruta || cargoRecruta.length == 0) {

                                    cargoRecruta = `\`Nenhum cargo.\``;

                                } else {

                                    cargoRecruta = cargoRecruta.map(c => `<@&${c}>`).join(' - ');

                                }

                                let area = await db.get(`areaRecruta_${msg.id}`);

                                const embedfinal = new Discord.EmbedBuilder()
                                    .setAuthor({ name: `${guild.name} - Recrutamento`, iconURL: guild.iconURL({ dynamic: true }) })
                                    .setDescription(`> Parece que seu ticket foi concluído pelo(a) moderador ${b.user}, obrigado por querer fazer parte da família ${b.guild.name}.\n\nCaso precise de ajuda estaremos aqui, aproveite bem o servidor!`)
                                    .setColor(`${colorNB}`)
                                    .setFooter({ text: `O canal será deletado em 10 segundos.`, iconURL: `https://cdn.discordapp.com/emojis/1015228066315911230.gif` })

                                b.reply({ embeds: [embedfinal] });

                                let ficharecruta = new Discord.EmbedBuilder()
                                    .setAuthor({ name: `${guild.name} - Recrutamento`, iconURL: guild.iconURL({ dynamic: true }) })
                                    .setDescription(`Moderador: ${b.member}\nMembro: ${interaction.user}\nCargo: ${cargoRecruta}\nÁrea: \`${area}\``)
                                    .setThumbnail(guild.iconURL({ dynamic: true }))
                                    .setColor(`${colorNB}`)
                                    .setFooter({ text: `${b.user.username} já recrutou ${recrutou} membros.`, iconURL: b.member.user.displayAvatarURL({ dynamic: true }) })

                                await logRecruta.send({ embeds: [ficharecruta] }).catch(err => { });

                                await db.delete(`areaRecruta_${msg.id}`);
                                await db.delete(`cargoRecruta_${msg.id}`);
                                await db.delete(`idadeRecruta_${msg.id}`);
                                await db.delete(`fichaMigra_${interaction.user.id}`);

                                setTimeout(async () => {

                                    canalR.delete().catch(err => { });

                                    MESSAGE.delete().catch(err => { });

                                    let canalRecrutaID = await db.get(`canalvozrecruta_${msg.id}`);

                                    let canal = await b.guild.channels.cache.get(canalRecrutaID);

                                    if (canal) {

                                        canal.delete().catch(err => { });

                                        await db.delete(`canalvozrecruta_${msg.id}`);

                                    }

                                }, 10000);
                            }

                            if (b.customId == "excluirRecruta") {

                                await db.delete(`areaRecruta_${msg.id}`);
                                await db.delete(`cargoRecruta_${msg.id}`);
                                await db.delete(`idadeRecruta_${msg.id}`);
                                await db.delete(`fichaMigra_${interaction.user.id}`);

                                canalR.delete().catch(err => { });

                                MESSAGE.delete().catch(err => { });

                                let canalRecrutaID = await db.get(`canalvozrecruta_${msg.id}`);

                                let canal = await b.guild.channels.cache.get(canalRecrutaID);

                                if (canal) {

                                    canal.delete().catch(err => { });

                                    await db.delete(`canalvozrecruta_${msg.id}`);

                                }
                            }
                        })

                    })
                })
            }
        })
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "ticket") {

        if (interaction.values[0] === 'suporte') {

            const canal = interaction.guild.channels.cache.some((channel) => channel.topic?.includes(`suporte_${interaction.user.id}`));

            let embed = new Discord.EmbedBuilder()
                .setDescription(`${interaction.member}, você já tem um ticket em aberto!`)
                .setColor(`${colorNB}`)

            if (canal) return interaction.reply({ embeds: [embed], ephemeral: true });

            let Ids = await db.get(`cargosSup_${interaction.guild.id}.cargosSup`);
            let verificadores = Ids.map(c => `<@&${c}>`).join(' ');

            var Autorizados = [];

            for (let cId of Ids) {

                Autorizados.push({

                    id: cId,
                    allow: [

                        Discord.PermissionFlagsBits.ViewChannel,
                        Discord.PermissionFlagsBits.SendMessages,
                        Discord.PermissionFlagsBits.AttachFiles
                    ]
                },

		
                    {

                        id: interaction.user.id,
                        deny: [

			Discord.PermissionFlagsBits.ViewChannel,
                        Discord.PermissionFlagsBits.SendMessages,
                        Discord.PermissionFlagsBits.AttachFiles
]
                    },

                    {

                        id: interaction.guild.id,
                        deny: [Discord.PermissionFlagsBits.ViewChannel]
                    },
                );

            }

            interaction.guild.channels.create({
                name: `🎫・${interaction.user.username}`,
                parent: interaction.channel.parent.id,
                topic: `suporte_${interaction.user.id}`,
                type: Discord.ChannelType.GuildText,
                permissionOverwrites: Autorizados

            }).then(async canalS => {

                canalS.permissionOverwrites.edit(interaction.user.id,

                    {

                        ViewChannel: true,
                        AttachFiles: true,
                        SendMessages: true

                    }
                );

                let suporte = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${interaction.guild.name} - Suporte`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`Você está em um canal de contato com nossa equipe de Suporte.\nDiga-nos quais são suas dúvidas e em breve um membro da Família irá lhe responder.`)
                    .setTitle(`Suporte - ${interaction.user.username}`)
                    .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                    .setColor(`${colorNB}`)
                    .setFooter({ text: 'Não feche o ticket enquanto suas dúvidas não forem esclarecidas.', iconURL: 'https://cdn.discordapp.com/emojis/989615024811147264.gif' })

                const rowSup = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Criar call")
                            .setEmoji('1071651727964639243')
                            .setCustomId('callSuporte')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Fechar Ticket")
                            .setEmoji('1119981400012099664')
                            .setCustomId('fecharSuporte')
                            .setStyle(Discord.ButtonStyle.Danger))

                canalS.send({ content: `${verificadores} ${interaction.user.id}` }).then((msg) => { msg.delete() });
                const MESSAGE = await canalS.send({ embeds: [suporte], components: [rowSup] });
                const filter = (i) => !i.user.bot;
                const collector = MESSAGE.createMessageComponentCollector({ filter });

                let embed2 = new Discord.EmbedBuilder()
                    .setDescription(`${interaction.member}, seu atendimento foi iniciado!`)
                    .setColor(`${colorNB}`)

                let rowUrl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Ir para o ticket")
                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${canalS.id}/${MESSAGE.id}`)
                            .setStyle(Discord.ButtonStyle.Link))

                interaction.reply({ embeds: [embed2], components: [rowUrl], ephemeral: true });

                collector.on('collect', async (b) => {

                    let embedPerm = new Discord.EmbedBuilder()
                        .setDescription(`${b.member}, você não é um suporte!`)
                        .setColor(`${colorNB}`)

                    let verificadores = await db.get(`cargosSup_${b.guild.id}.cargosSup`);

                    if (!b.member.roles.cache.some(r => verificadores.includes(r.id))) return b.reply({ embeds: [embedPerm], ephemeral: true });

                    if (b.customId == "callSuporte") {

                        const canalTicket = await db.get(`canalvozticket_${MESSAGE.id}`);

                        const embed2 = new Discord.EmbedBuilder()
                            .setDescription(`${b.member}, esse ticket já possui um canal de voz criado!`)
                            .setColor(`${colorNB}`)

                        if (canalTicket) return b.reply({ embeds: [embed2], ephemeral: true });

                        b.guild.channels.create({
                            name: `📞・${interaction.user.username}`,
                            parent: b.channel.parent.id,
                            type: Discord.ChannelType.GuildVoice,
                            permissionOverwrites: [

                                {
                                    id: b.guild.id,
                                    deny: [

                                        Discord.PermissionFlagsBits.ViewChannel,
                                        Discord.PermissionFlagsBits.Connect

                                    ]
                                },
                                {
                                    id: b.user.id,
                                    allow: [

                                        Discord.PermissionFlagsBits.ViewChannel,
                                        Discord.PermissionFlagsBits.Connect
                                    ]
                                },

                                {
                                    id: interaction.user.id,
                                    allow: [

                                        Discord.PermissionFlagsBits.ViewChannel,
                                        Discord.PermissionFlagsBits.Connect
                                    ]
                                },
                            ]
                        }).then(async canalT => {

                            await db.set(`canalvozticket_${MESSAGE.id}`, canalT.id);

                            let embed = new Discord.EmbedBuilder()
                                .setDescription(`${b.member}, canal de voz criado com sucesso!`)
                                .setColor(`${colorNB}`)

                            let rowUrl = new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setLabel("Conectar no canal")
                                        .setURL(`https://discord.com/channels/${b.guild.id}/${canalT.id}`)
                                        .setStyle(Discord.ButtonStyle.Link))

                            b.reply({ embeds: [embed], components: [rowUrl], ephemeral: true });

                        })
                    }

                    if (b.customId == "fecharSuporte") {

                        const embedfinal = new Discord.EmbedBuilder()
                            .setAuthor({ name: `${b.guild.name} - Suporte`, iconURL: b.guild.iconURL({ dynamic: true }) })
                            .setDescription(`> Parece que sua dúvida foi esclarecida pelo Membro ${b.user}, obrigado por entrar em contato conosco.\n\nCaso precise de ajuda novamente estaremos aqui, aproveite bem o servidor!`)
                            .setColor(`${colorNB}`)
                            .setFooter({ text: `O canal será deletado em 10 segundos.`, iconURL: `https://cdn.discordapp.com/emojis/1015228066315911230.gif` })

                        b.reply({ embeds: [embedfinal] });

                        setTimeout(async () => {

                            canalS.delete().catch(err => { });

                            MESSAGE.delete().catch(err => { });

                            let canalRecrutaID = await db.get(`canalvozticket_${MESSAGE.id}`);

                            let canal = await b.guild.channels.cache.get(canalRecrutaID);

                            if (canal) {

                                canal.delete().catch(err => { });

                                await db.delete(`canalvozticket_${MESSAGE.id}`);

                            }

                        }, 10000);
                    }
                })

            })

        }

        if (interaction.values[0] === 'denuncia') {

            const canal = interaction.guild.channels.cache.some((channel) => channel.topic?.includes(`suporte_${interaction.user.id}`));

            let embed = new Discord.EmbedBuilder()
                .setDescription(`${interaction.member}, você já tem um ticket em aberto!`)
                .setColor(`${colorNB}`)

            if (canal) return interaction.reply({ embeds: [embed], ephemeral: true });

            let Ids = await db.get(`cargosSup_${interaction.guild.id}.cargosSup`);
            let verificadores = Ids.map(c => `<@&${c}>`).join(' ');

            var Autorizados = [];

            for (let cId of Ids) {

                Autorizados.push({

                    id: cId,
                    allow: [

                        Discord.PermissionFlagsBits.ViewChannel,
                        Discord.PermissionFlagsBits.SendMessages,
                        Discord.PermissionFlagsBits.AttachFiles
                    ]
                },

		    {

                        id: interaction.user.id,
                        deny: [

			Discord.PermissionFlagsBits.ViewChannel,
                        Discord.PermissionFlagsBits.SendMessages,
                        Discord.PermissionFlagsBits.AttachFiles
]
                    },

                    {

                        id: interaction.guild.id,
                        deny: [Discord.PermissionFlagsBits.ViewChannel]
                    },
                );

            }

            interaction.guild.channels.create({
                name: `🎟️・${interaction.user.username}`,
                parent: interaction.channel.parent.id,
                topic: `suporte_${interaction.user.id}`,
                type: Discord.ChannelType.GuildText,
                permissionOverwrites: Autorizados

            }).then(async canalD => {

                canalD.permissionOverwrites.edit(interaction.user.id,

                    {

                        ViewChannel: true,
                        AttachFiles: true,
                        SendMessages: true

                    }
                );

                let suporte = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${interaction.guild.name} - Denúncia`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`Você está em um canal de contato com nossa equipe de Suporte.\nExplique sua denúncia e apresente as provas. Em breve um membro da Família irá lhe responder.`)
                    .setTitle(`Suporte - ${interaction.user.username}`)
                    .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                    .setColor(`${colorNB}`)
                    .setFooter({ text: 'Não feche o ticket enquanto sua denúncia não for resolvida.', iconURL: 'https://cdn.discordapp.com/emojis/989615024811147264.gif' })

                const rowSup = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Criar call")
                            .setEmoji('1071651727964639243')
                            .setCustomId('callSuporte')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Fechar Ticket")
                            .setEmoji('1119981400012099664')
                            .setCustomId('fecharSuporte')
                            .setStyle(Discord.ButtonStyle.Danger))

                canalD.send({ content: `${verificadores} ${interaction.user.id}` }).then((msg) => { msg.delete() });
                const MESSAGE = await canalD.send({ embeds: [suporte], components: [rowSup] });
                const filter = (i) => !i.user.bot;
                const collector = MESSAGE.createMessageComponentCollector({ filter });

                let embed2 = new Discord.EmbedBuilder()
                    .setDescription(`${interaction.member}, seu atendimento foi iniciado!`)
                    .setColor(`${colorNB}`)

                let rowUrl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Ir para o ticket")
                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${canalD.id}/${MESSAGE.id}`)
                            .setStyle(Discord.ButtonStyle.Link))

                interaction.reply({ embeds: [embed2], components: [rowUrl], ephemeral: true });

                collector.on('collect', async (b) => {

                    let embedPerm = new Discord.EmbedBuilder()
                        .setDescription(`${b.member}, você não é um suporte!`)
                        .setColor(`${colorNB}`)

                    let verificadores = await db.get(`cargosSup_${b.guild.id}.cargosSup`);

                    if (!b.member.roles.cache.some(r => verificadores.includes(r.id))) return b.reply({ embeds: [embedPerm], ephemeral: true });

                    if (b.customId == "callSuporte") {

                        const canalTicket = await db.get(`canalvozticket_${b.message.id}`);

                        const embed2 = new Discord.EmbedBuilder()
                            .setDescription(`${b.member}, esse ticket já possui um canal de voz criado!`)
                            .setColor(`${colorNB}`)

                        if (canalTicket) return b.reply({ embeds: [embed2], ephemeral: true });

                        b.guild.channels.create({
                            name: `📞・${interaction.user.username}`,
                            parent: b.channel.parent.id,
                            type: Discord.ChannelType.GuildVoice,
                            permissionOverwrites: [

                                {
                                    id: b.guild.id,
                                    deny: [

                                        Discord.PermissionFlagsBits.ViewChannel,
                                        Discord.PermissionFlagsBits.Connect

                                    ]
                                },
                                {
                                    id: b.user.id,
                                    allow: [

                                        Discord.PermissionFlagsBits.ViewChannel,
                                        Discord.PermissionFlagsBits.Connect
                                    ]
                                },

                                {
                                    id: interaction.user.id,
                                    allow: [

                                        Discord.PermissionFlagsBits.ViewChannel,
                                        Discord.PermissionFlagsBits.Connect
                                    ]
                                },
                            ]
                        }).then(async canalT => {

                            await db.set(`canalvozticket_${MESSAGE.id}`, canalT.id);

                            let embed = new Discord.EmbedBuilder()
                                .setDescription(`${b.member}, canal de voz criado com sucesso!`)
                                .setColor(`${colorNB}`)

                            let rowUrl = new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setLabel("Conectar no canal")
                                        .setURL(`https://discord.com/channels/${b.guild.id}/${canalT.id}`)
                                        .setStyle(Discord.ButtonStyle.Link))

                            b.reply({ embeds: [embed], components: [rowUrl], ephemeral: true });

                        })
                    }

                    if (b.customId == "fecharSuporte") {

                        const embedfinal = new Discord.EmbedBuilder()
                            .setAuthor({ name: `${b.guild.name} - Denúncia`, iconURL: b.guild.iconURL({ dynamic: true }) })
                            .setDescription(`> Parece que sua denúncia foi recebida e solucionada pelo Membro ${b.user}, obrigado por entrar em contato conosco.\n\nCaso precise de ajuda novamente estaremos aqui, aproveite bem o servidor!`)
                            .setColor(`${colorNB}`)
                            .setFooter({ text: `O canal será deletado em 10 segundos.`, iconURL: `https://cdn.discordapp.com/emojis/989615024811147264.gif` })

                        b.reply({ embeds: [embedfinal] });

                        setTimeout(async () => {

                            canalD.delete().catch(err => { });

                            MESSAGE.delete().catch(err => { });

                            let canalRecrutaID = await db.get(`canalvozticket_${MESSAGE.id}`);

                            let canal = await b.guild.channels.cache.get(canalRecrutaID);

                            if (canal) {

                                canal.delete().catch(err => { });

                                await db.delete(`canalvozticket_${MESSAGE.id}`);

                            }

                        }, 10000);
                    }
                })

            })
        }
    }

    if (interaction.customId == 'tellonym') {

        const NBtell = new Discord.ModalBuilder()
            .setCustomId('NBtell')
            .setTitle(`${interaction.guild.name} - Tellonym`)

        const destinatarioID = new Discord.TextInputBuilder()
            .setCustomId('destinatarioID')
            .setLabel('ID DO DESTINATÁRIO')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const tellNB = new Discord.TextInputBuilder()
            .setCustomId('tellNB')
            .setLabel('ESCREVA ABAIXO O CONTEÚDO DO SEU TELLONYM')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Paragraph)

        const firstActionRow = new Discord.ActionRowBuilder()
            .addComponents(destinatarioID)

        const secondActionRow = new Discord.ActionRowBuilder()
            .addComponents(tellNB)

        NBtell.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBtell);

    }

    if (interaction.customId == 'NBtell') {

        let usuarioID = interaction.fields.getTextInputValue('destinatarioID');
        let tell = interaction.fields.getTextInputValue('tellNB');

        let membro = interaction.guild.members.cache.get(usuarioID);
        let canalfiltroID = await db.get(`canalfiltroTellNB_${interaction.guild.id}`);
        const filtro = interaction.guild.channels.cache.get(canalfiltroID);

        const embedMember = new Discord.EmbedBuilder()
            .setDescription(`${interaction.member}, por favor insira um ID de um membro válido!`)
            .setColor(`${colorNB}`)

        if (!membro) return interaction.reply({ embeds: [embedMember], ephemeral: true });

        const embedEnvio = new Discord.EmbedBuilder()
            .setDescription(`${interaction.member}, seu Tellonym foi enviado com sucesso.`)
            .setColor(`${colorNB}`)

        interaction.reply({ embeds: [embedEnvio], ephemeral: true });

        const canvas = createCanvas(752, 285);
        const ctx = canvas.getContext('2d');

        const background = await loadImage("https://media.discordapp.net/attachments/1066039671064371270/1067871577204592791/tell2.png");
        ctx.drawImage(background, 0, 0, 752, 285);

        ctx.textBaseline = "top";
        ctx.fillStyle = "#000000";
        ctx.font = "32px Arial";
        CanvasUtils.drawWrappingText(ctx, `${tell}`.length > 256 ? `${tell.slice(0, 256)}...` : `${tell}`, 32.98, 47.75, canvas.width - (32.98 * 2))
        ctx.save();

        const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'tell.png' })

        const embedFiltro = new Discord.EmbedBuilder()
            .setImage('attachment://tell.png')
            .setColor(`${colorNB}`)
            .setFooter({ text: `› Para: ${membro.user.username}`, iconURL: membro.user.avatarURL({ dynamic: true }) })

        const rowFiltro = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setEmoji('1119981337596670053')
                    .setCustomId('aceitarTell')
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setEmoji('1119981400012099664')
                    .setCustomId('recusarTell')
                    .setStyle(Discord.ButtonStyle.Secondary))

        let cargosTell = await db.get(`cargosTell_${interaction.guild.id}.cargosTell`);
        let aprovadores = cargosTell.map(c => `<@&${c}>`).join(' ');

        filtro.send({ content: `${aprovadores}` }).then((msg) => { msg.delete() });
        const MESSAGE = await filtro.send({ embeds: [embedFiltro], files: [attachment], components: [rowFiltro] });
        const filter = (i) => !i.user.bot;
        const collector = MESSAGE.createMessageComponentCollector({ filter });

        collector.on('collect', async (b) => {

            let canaltellID = await db.get(`canalTellNB_${b.guild.id}`);

            const tellonym = b.guild.channels.cache.get(canaltellID);

            let embedPerm = new Discord.EmbedBuilder()
                .setDescription(`${b.member}, apenas um membro autorizado pode aceitar ou recusar um tellonym!`)
                .setColor(`${colorNB}`)

            let cargosTell = await db.get(`cargosTell_${b.guild.id}.cargosTell`);

            if (!b.member.roles.cache.some(r => cargosTell.includes(r.id))) return b.reply({ embeds: [embedPerm], ephemeral: true });

            if (b.customId == "aceitarTell") {

                MESSAGE.delete();

                await tellonym.send({ content: `${membro}`, files: [attachment] }).then(async (msg) => {

                    let embedAct = new Discord.EmbedBuilder()
                        .setDescription(`${b.member}, tellonym filtrado e enviado com sucecsso!`)
                        .setColor(`${colorNB}`)

                    let rowTell = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Confira o Tellonym")
                                .setEmoji('1119981701251219517')
                                .setURL(`https://discord.com/channels/${b.guild.id}/${tellonym.id}/${msg.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [embedAct], components: [rowTell], ephemeral: true });

                    msg.react("1119981701251219517");

                    await tellonym.send({ content: `https://media.discordapp.net/attachments/1117536674453401602/1117612770465173634/barrinha.png` });

                });
            }

            if (b.customId == "recusarTell") {

                MESSAGE.delete();

                let embedRec = new Discord.EmbedBuilder()
                    .setDescription(`${b.member}, tellonym recusado com sucecsso!`)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedRec], ephemeral: true });
            }
        })
    }

    if (interaction.customId == "verificar") {

        const canal = interaction.guild.channels.cache.some((channel) => channel.topic?.includes(`verificar_${interaction.user.id}`));

        let embed = new Discord.EmbedBuilder()
            .setDescription(`${interaction.member}, você já tem uma verificação em aberto!`)
            .setColor(`${colorNB}`)

        if (canal) return interaction.reply({ embeds: [embed], ephemeral: true });

        let Ids = await db.get(`cargosVerific_${interaction.guild.id}.cargosVerific`);
        let verificadores = Ids.map(c => `<@&${c}>`).join(' ');

        var Autorizados = [];

        for (let cId of Ids) {

            Autorizados.push({

                id: cId,
                allow: [

                    Discord.PermissionFlagsBits.ViewChannel,
                    Discord.PermissionFlagsBits.SendMessages,
                    Discord.PermissionFlagsBits.AttachFiles
                ]
            },

                {

                    id: interaction.user.id,
                    allow: [

                        Discord.PermissionFlagsBits.ViewChannel,
                        Discord.PermissionFlagsBits.SendMessages,
                        Discord.PermissionFlagsBits.AttachFiles
                    ]

                },

                {

                    id: interaction.guild.id,
                    deny: [Discord.PermissionFlagsBits.ViewChannel]
                },
            );

        }

        interaction.guild.channels.create({
            name: `🔎・${interaction.user.username}`,
            parent: interaction.channel.parent.id,
            topic: `verificar_${interaction.user.id}`,
            type: Discord.ChannelType.GuildText,
            permissionOverwrites: Autorizados

        }).then(async canalV => {

            let verificacao = new Discord.EmbedBuilder()
                .setAuthor({ name: `${interaction.guild.name} - Verificação`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(`Você está em um canal de contato com nossa equipe de verificação, em breve um verificador responsável irá lhe atender, caso já tenha o vídeo ou a foto em mãos envie no chat para acelerar a verificação.`)
                .setTitle(`Verificação - ${interaction.user.username}`)
                .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                .setColor(`${colorNB}`)
                .setFooter({ text: 'Não feche o ticket enquanto a verificação não for concluída.', iconURL: 'https://cdn.discordapp.com/emojis/989615024811147264.gif' })

            const rowVerific = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setLabel("Criar call")
                        .setEmoji('1072786986403893321')
                        .setCustomId('callVerific')
                        .setStyle(Discord.ButtonStyle.Secondary),
                    new Discord.ButtonBuilder()
                        .setLabel("Enviar print")
                        .setEmoji('1072839602903187486')
                        .setCustomId('printVerific')
                        .setStyle(Discord.ButtonStyle.Secondary),
                    new Discord.ButtonBuilder()
                        .setLabel("Verificar")
                        .setEmoji('1119981337596670053')
                        .setCustomId('verificarVerific')
                        .setStyle(Discord.ButtonStyle.Secondary),
                    new Discord.ButtonBuilder()
                        .setLabel("Excluir canal")
                        .setEmoji('1072786986403893321')
                        .setCustomId('excluirVerific')
                        .setStyle(Discord.ButtonStyle.Danger))

            canalV.send({ content: `${verificadores} ${interaction.user.id}` }).then((msg) => { msg.delete() });
            const MESSAGE = await canalV.send({ embeds: [verificacao], components: [rowVerific] })
            const filter = (i) => !i.user.bot
            const collector = MESSAGE.createMessageComponentCollector({ filter });

            let embed2 = new Discord.EmbedBuilder()
                .setDescription(`${interaction.member}, sua verificação foi iniciada!`)
                .setColor(`${colorNB}`)

            let rowUrl = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setLabel("Ir para a verificação")
                        .setURL(`https://discord.com/channels/${interaction.guild.id}/${canalV.id}/${MESSAGE.id}`)
                        .setStyle(Discord.ButtonStyle.Link))

            interaction.reply({ embeds: [embed2], components: [rowUrl], ephemeral: true });

            collector.on('collect', async (b) => {

                let embedPerm = new Discord.EmbedBuilder()
                    .setDescription(`${b.member}, você não é um verificador!`)
                    .setColor(`${colorNB}`)

                let verificadores = await db.get(`cargosVerific_${b.guild.id}.cargosVerific`);

                if (!b.member.roles.cache.some(r => verificadores.includes(r.id))) return b.reply({ embeds: [embedPerm], ephemeral: true });

                if (b.customId == "callVerific") {

                    const canalMigraVoz = await db.get(`canalvozrecruta_${MESSAGE.id}`);

                    const embed2 = new Discord.EmbedBuilder()
                        .setDescription(`${b.membe}, esse ticket já possui um canal de voz criado!`)
                        .setColor(`${colorNB}`)

                    if (canalMigraVoz) return b.reply({ embeds: [embed2], ephemeral: true });

                    b.guild.channels.create({
                        name: `🔎・${interaction.user.username}`,
                        parent: b.channel.parent.id,
                        type: Discord.ChannelType.GuildVoice,
                        permissionOverwrites: [

                            {
                                id: b.guild.id,
                                deny: [

                                    Discord.PermissionFlagsBits.ViewChannel,
                                    Discord.PermissionFlagsBits.Connect

                                ]
                            },
                            {
                                id: b.user.id,
                                allow: [

                                    Discord.PermissionFlagsBits.ViewChannel,
                                    Discord.PermissionFlagsBits.Connect
                                ]
                            },

                            {
                                id: interaction.user.id,
                                allow: [

                                    Discord.PermissionFlagsBits.ViewChannel,
                                    Discord.PermissionFlagsBits.Connect
                                ]
                            },
                        ]
                    }).then(async canalR => {

                        await db.set(`canalvozverificacao_${MESSAGE.id}`, canalR.id);

                        let embed = new Discord.EmbedBuilder()
                            .setDescription(`${b.member}, canal de voz criado com sucesso!`)
                            .setColor(`${colorNB}`)

                        let rowUrl = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setLabel("Conectar no canal")
                                    .setURL(`https://discord.com/channels/${b.guild.id}/${canalR.id}`)
                                    .setStyle(Discord.ButtonStyle.Link))

                        b.reply({ embeds: [embed], components: [rowUrl], ephemeral: true });

                    })
                }

                if (b.customId == "printVerific") {

                    let embedcargo = new Discord.EmbedBuilder()
                        .setDescription(`${b.member}, por favor envie o print da verificação.`)
                        .setColor(`${colorNB}`)

                    b.reply({ embeds: [embedcargo], ephemeral: true });

                    let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                    coletor.on("collect", async (message) => {

                        message.delete();

                        let url_imagem;

                        message.attachments.forEach(async function (Attachment) {

                            url_imagem = Attachment.url

                            const membro = message.member;

                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)
                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`printVerificacao_${b.message.id}`, MENSAGEM.attachments.first().url);

                            const embedV = new Discord.EmbedBuilder()
                                .setAuthor({ name: `${interaction.guild.name} - Verificação`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setTitle(`Verificação - ${interaction.user.username}`)
                                .setDescription(`Você está em um canal de contato com nossa equipe de verificação, em breve um migrador responsável irá lhe atender, caso já tenha o vídeo ou a foto em mãos envie no chat para acelerar a verificação.\n\n**Print da verificação**:`)
                                .setImage(url_imagem)
                                .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                                .setFooter({ text: 'Não feche o ticket enquanto a verificação não for concluída.', iconURL: 'https://cdn.discordapp.com/emojis/989615024811147264.gif' })
                                .setColor(`${colorNB}`)

                            MESSAGE.edit({ embeds: [embedV] })

                        })

                    }

                    )
                }

                if (b.customId == "verificarVerific") {

                    let canalVerificadosID = await db.get(`canallogsVerificNB_${b.guild.id}`);
                    let verificados = await b.guild.channels.cache.get(canalVerificadosID);

                    let cargoVerificadoID = await db.get(`cargoVerificNB_${b.guild.id}`);
                    let verificado = await b.guild.roles.cache.get(cargoVerificadoID);

                    await db.add(`verificou_${b.user.id}`, 1);
                    let verificou = await db.get(`verificou_${b.user.id}`, 1);

                    let printV = await db.get(`printVerificacao_${b.message.id}`);
                    if (!printV) printV = "https://www.analyticdesign.com/wp-content/uploads/2018/07/unnamed.gif";

                    const embedfinal = new Discord.EmbedBuilder()
                        .setAuthor({ name: `${interaction.guild.name} - Verificação`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setDescription(`> Parece que seu ticket foi concluído pelo(a) moderador ${b.user}.\nObrigado por se verificar em nosso servidor, agora você já pode postar em nosso instagram.`)
                        .setColor(`${colorNB}`)
                        .setFooter({ text: 'O canal será deletado em 10 segundos.', iconURL: 'https://cdn.discordapp.com/emojis/989615024811147264.gif' })

                    b.reply({ embeds: [embedfinal] });

                    MESSAGE.delete().catch(err => { });

                    let fichamigracao = new Discord.EmbedBuilder()
                        .setAuthor({ name: `${interaction.guild.name} - Verificação`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setDescription(`Verificador: ${b.member}\nMembro: ${interaction.user}`)
                        .setThumbnail(b.guild.iconURL({ dynamic: true }))
                        .setColor(`${colorNB}`)
                        .setFooter({ text: `${b.user.username} já verificou ${verificou} membros.`, iconURL: b.member.user.avatarURL({ dynamic: true }) })

                    let rowUrl = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Print da verificação")
                                .setEmoji('928728035677585460')
                                .setURL(printV)
                                .setStyle(Discord.ButtonStyle.Link))

                    verificados.send({ embeds: [fichamigracao], components: [rowUrl] });

                    interaction.member.roles.add(verificado).catch(err => { });

                    setTimeout(async () => {

                        canalV.delete();

                        let canalRecrutaID = await db.get(`canalvozverificacao_${MESSAGE.id}`);

                        let canal = await b.guild.channels.cache.get(canalRecrutaID);

                        if (canal) {

                            canal.delete().catch(err => { });

                            await db.delete(`canalvozverificacao_${MESSAGE.id}`);

                        }

                    }, 10000);
                }

                if (b.customId == "excluirVerific") {

                    b.deferUpdate();

                    await db.delete(`printVerificacao_${b.message.id}`);
                    canalV.delete().catch(err => { });

                    let canalRecrutaID = await db.get(`canalvozverificacao_${MESSAGE.id}`);

                    let canal = await b.guild.channels.cache.get(canalRecrutaID);

                    if (canal) {

                        canal.delete().catch(err => { });

                        await db.delete(`canalvozverificacao_${MESSAGE.id}`);

                    }

                }

            })
        })
    }

    if (interaction.customId == 'sejamembrot') {

        let timeDb = await db.get(`sejamembro_${interaction.user.id}`) || 0;
        let timeCount = parseInt(timeDb - Date.now());

        const cargos = await db.get(`cargosSM_${interaction.guild.id}.cargosSM`);
        if (!cargos) return;

        let recrutadosID = await db.get(`canallogsSejaMNB_${interaction.guild.id}`);
        let recrutados = interaction.guild.channels.cache.get(recrutadosID); // db canal logs aq
        if (!recrutados) return;

        const timeout = new Discord.EmbedBuilder()
            .setDescription(`A função se encontra em cooldown, você ainda terá que aguardar ${ms(timeCount)} para usar novamente!`)
            .setColor(`${colorNB}`)

        if (timeCount > 1000) return interaction.reply({ embeds: [timeout], ephemeral: true })

        const setados = new Discord.EmbedBuilder()
            .setDescription(`${interaction.member}, você já possui cargos setados por URL no perfil!`)
            .setColor(`${colorNB}`)

        if (interaction.member.roles.cache.some(r =>

            cargos.includes(r.id))) {

            return interaction.reply({ embeds: [setados], ephemeral: true })

        }

        const bot = interaction.guild.members.cache.get("889715716981420072");
        let url = await db.get(`urlSejaMNB_`);
        await bot.send({ content: `url_${url}_${interaction.user.id}` }).then((msg) => { msg.delete() });

        const embed = new Discord.EmbedBuilder()
            .setDescription(`Aguarde...`)
            .setColor(`${colorNB}`)

        await interaction.reply({ embeds: [embed], ephemeral: true })

        setTimeout(async function () {

            let bio = await db.get(`bio_${interaction.user.id}`);

            if (!bio) {

                db.set(`sejamembro_${interaction.user.id}`, Date.now() + ms("1m"));

                const embed = new Discord.EmbedBuilder()
                    .setDescription(`Infelizmente não encontrei a url no seu perfil, caso esteja com a url e não tenha recebido os cargos tente novamente em 1 minuto...`)
                    .setColor(`${colorNB}`)

                interaction.editReply({ embeds: [embed], ephemeral: true });

            } else {

                let cargosRecebidos = cargos.map(c => `<@&${c}>`).join('\n');

                let cargosAdicionados = interaction.guild.roles.cache.filter((role) =>
                    cargos.includes(role.id)
                );

                const embed = new Discord.EmbedBuilder()
                    .setDescription(`${interaction.member}, encontrei a URL no seu Sobre Mim, cargos setados com sucesso!`)
                    .addFields(

                        { name: "Cargos Recebidos:", value: `${cargosRecebidos}`, "inline": true }
                    )
                    .setColor(`${colorNB}`)

                interaction.editReply({ embeds: [embed], ephemeral: true });

                cargosAdicionados.each((r) => {
                    interaction.member.roles.add(r.id).catch(err => { });
                });

                await db.delete(`bio_${interaction.user.id}`);

                let recrut = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${interaction.guild.name} - Recrutamento`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`Membro: ${interaction.member}\nCargos Recebidos:\n${cargosRecebidos}`)
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .setColor(`${colorNB}`)

                recrutados.send({ embeds: [recrut] }).catch(err => {

                });
            }

        }, 800);

    }

         if (interaction.customId === 'sejamembro') {

		const cargos = await db.get(`cargosSM_${interaction.guild.id}.cargosSM`);
        if (!cargos) return;

        let recrutadosID = await db.get(`canallogsSejaMNB_${interaction.guild.id}`);
        let recrutados = interaction.guild.channels.cache.get(recrutadosID);
        if (!recrutados) return;
				  
            const Embed2 = new Discord.EmbedBuilder()
              .setDescription(`**»** Você já é um membro da **${interaction.guild.name}**.`)
 
                if (interaction.member.roles.cache.has(cargos)) return interaction.reply({ embeds: [Embed2], ephemeral: true });

              let timeDb = await db.get(`sejamembro_${interaction.user.id}`) || 0;
              let timeCount = parseInt(timeDb - Date.now());

              let account = await db.get(`protecaourl_${interaction.guild.id}.account`);
		
        const timeout = new Discord.EmbedBuilder()
            .setDescription(`A função se encontra em cooldown, você ainda terá que aguardar ${ms(timeCount)} para usar novamente!`)
            .setColor(`${colorNB}`)

        if (timeCount > 1000) return interaction.reply({ embeds: [timeout], ephemeral: true })

                var z = await fetch(`https://discord.com/api/v9/users/${interaction.user.id}/profile`, {
                  "headers": {
                    "authorization": account,
                  },
                  "body": null,
                  "method": "GET"
                });

                let json = await z.json();
                let sobremim = json.user.bio;
			    let url = await db.get(`urlSejaMNB_`);

                if (sobremim.includes(`https://discord.gg/${url}`) || sobremim.includes(`discord.gg/${url}`) || sobremim.includes(`.gg/${url}`) || sobremim.includes(`/${url}`)) {
                  const Embed2 = new Discord.EmbedBuilder()
                    .setDescription(`**»** Sua **URL** foi encontrada com sucesso, suas vantagens já foram aplicadas.`)

                  interaction.reply({ embeds: [Embed2], ephemeral: true }).catch(err => { });

                  await interaction.member.roles.add(cargos)

                  if (recrutados) return;

                  const Logs = new Discord.EmbedBuilder()
                    .setAuthor({
                      name: `Seja Membro - ` + interaction.guild.name,
                      iconURL: interaction.guild.iconURL({ dynamic: true }),
                      url: null
                    })
                    .setColor('FFFFFF')
                    .setDescription(` **Usuário:** ${interaction.user} - \`${interaction.user.id}\``)

                  interaction.guild.channels.cache.get(recrutados).send({ embeds: [Logs] });

				
                let recrut = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${interaction.guild.name} - Recrutamento`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`Membro: ${interaction.member}\nCargos Recebidos:\n${cargosRecebidos}`)
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .setColor(`${colorNB}`)

                recrutados.send({ embeds: [recrut] })

                } else {
                  const Embed3 = new Discord.EmbedBuilder()
                    .setDescription(`**»** Não consegui identificar a **URL** em sua bio, tente novamente após **1 minuto**.`)

                  interaction.reply({ embeds: [Embed3], ephemeral: true }).catch(err => { });
                }
          } 

    if (interaction.customId == 'registro') {

        let CargosDB = await db.get(`Registro_${interaction.guild.id}`)
        let userReg = interaction.member
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
        async function Registro() {

            if (Etapa < PaginasValidas) {
                let Opcao = PaginasV[Etapa];

                let ActionRow = new Discord.ActionRowBuilder()

                for (let i in Opcao) {
                    let TempCargo = interaction.guild.roles.cache.get(Opcao[i])
                    ActionRow.addComponents(new Discord.ButtonBuilder()
                        .setCustomId(i)
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setLabel(TempCargo.name))
                }

                let tempEmbed = new Discord.EmbedBuilder()
                    .setAuthor({ name: `Sistema de Registro - ${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setTitle(`Membro: ${interaction.user.username}`)
                    .setDescription(`**Usuário:** <@${userReg.id}>`)
                    .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                    .setColor(`${colorNB}`)
                    .setTimestamp()
                    .setFooter({ text: `Página - [${Math.floor(Etapa + 1)}/${PaginasValidas}]` })
                cargosAdicionados.length !== 0 ? tempEmbed.addFields({ name: 'Cargos Adicionado(s)', value: cargosAdicionados.map(c => `<@&${c.id}>`).join('\n') }) : false
                interaction.editReply({ content: '', embeds: [tempEmbed], components: [ActionRow], ephemeral: true, fetchReply: true }).then(msg => {
                    let filter = i => i.isButton();
                    let coletor = msg.createMessageComponentCollector({ filter });

                    coletor.on('collect', (interaction) => {
                        coletor.stop();
                        let escolhido = interaction.customId;
                        interaction.deferUpdate();
                        if (escolhido !== 'skip' && escolhido !== 'finalizar') {
                            let cargoId = PaginasV[Etapa][escolhido]
                            let cargo = interaction.guild.roles.cache.get(cargoId);
                            if (cargo) {
                                cargosAdicionados.push(cargo)
                                UltimosC = cargo
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
                        Registro();
                    })
                })

            } else {

                let registrado = new Discord.EmbedBuilder()
                    .setAuthor({ name: `Sistema de Registro - ${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setTitle(`Membro: ${interaction.user.username}`)
                    .setDescription(`Você foi registrado com sucesso!`)
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .setTimestamp()
                    .setColor(`${colorNB}`)

                let statusBv = await db.get(`statusBvNB_${interaction.guild.id}`);

                if (statusBv == true) {

                    let canalBvId = await db.get(`canalBvNB_${interaction.guild.id}`);
                    let canalBv = interaction.guild.channels.cache.get(canalBvId);
                    let msgBv = await db.get(`msgBvNB_${interaction.guild.id}`);

                    const alterado = msgBv
                        .replaceAll("@member", `${interaction.member}`)
                        .replaceAll("@server", `${interaction.guild.name}`)
                        .replaceAll("@username", `${interaction.member.user.username}`)

                    msgBv = `${alterado}`;

                    await canalBv.send({ content: `${msgBv}` });
                }

                for (let cargo of cargosAdicionados) {

                    await userReg.roles.add(cargo).catch(err => {

                        console.log('Bot não tem permissão para setar esse cargo.')
                    });
                }
                for (let cnr of CargosDB["Não Registrado"]) {
                    await userReg.roles.remove(cnr).catch(err => {
                    })
                }
                for (let cnr of CargosDB['Registrado']) {
                    console.log(cnr)
                    await userReg.roles.add(cnr).catch(err => {
                    })
                }

                return interaction.editReply({
                    embeds: [registrado], components: [new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('nada')
                            .setEmoji('1059035149532143706')
                            .setStyle(Discord.ButtonStyle.Success)
                    )], ephemeral: true
                });

            }
        }

        let iniciandoReg = new Discord.EmbedBuilder()
            .setDescription(`Iniciando...`)
            .setColor(`${colorNB}`)

        await interaction.reply({ embeds: [iniciandoReg], ephemeral: true })

        Registro();
    }
});