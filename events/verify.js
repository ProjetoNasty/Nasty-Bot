const client = require('..');
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('interactionCreate', async (interaction) => {
    try {
        const botE = await db.get(`botex_${client.user.id}`);
        const encerrar = new Date(botE);
        const hoje = new Date();
        const diferencaMs = encerrar - hoje;
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));


        if (diferencaDias <= 0) return;

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        // Comando para apagar whitelists pendentes
        if (interaction.customId === 'apagar-wl-pendentes') {
            try {
                // Verifica se o usuário tem permissão para executar o comando
                if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                    return interaction.reply({ content: 'Você não tem permissão para executar esse comando.', ephemeral: true });
                }

                // Apaga as whitelists pendentes
                await db.delete(`fichawltt_${interaction.user.id}`); // Certifique-se de que o banco tem essa chave

                return interaction.reply({ content: 'Todas as whitelists pendentes foram apagadas com sucesso.', ephemeral: true });
            } catch (err) {
                console.error("Erro ao apagar as whitelists pendentes:", err);
                return interaction.reply({ content: 'Houve um erro ao tentar apagar as whitelists pendentes.', ephemeral: true });
            }
        }

        if (interaction.customId === 'whitelistNB') {
            let ficha = await db.get(`fichawltt_${interaction.user.id}`);

            if (ficha >= 1) {
                const embed = new Discord.EmbedBuilder()
                    .setDescription(`${interaction.member}, você já possui uma ficha em análise, por favor aguarde.`)
                    .setColor(colorNB);
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const linkWlNB = new Discord.UserSelectMenuBuilder()
                .setCustomId('linkWlNB')
                .setPlaceholder('QUEM VOCÊ CONHECE AQUI?');

            const actionRow = new Discord.ActionRowBuilder().addComponents(linkWlNB);

            const damaMessage = await interaction.reply({
                content: 'Selecione uma opção usando o menu abaixo.',
                components: [actionRow],
                fetchReply: true,
                ephemeral: true
            });

            setTimeout(() => damaMessage.delete(), 7000);

            const filter = (i) => i.customId === 'linkWlNB' && i.user.id === interaction.user.id;
            const collector = damaMessage.createMessageComponentCollector({ filter, time: 20000 });

            collector.on('collect', async (menuInteraction) => {
                await damaMessage.delete().catch(() => { });
                const selectedOption = menuInteraction.values[0];
                const escolhido2 = menuInteraction.guild.members.cache.get(selectedOption);
                menuInteraction.reply({ content: `Você escolheu: ${escolhido2}`, ephemeral: true });

                oi(menuInteraction, selectedOption);
            });

            return;
        }

        async function oi(interaction, selectedOption) {
            try {
                const guild = interaction.guild;
                const canalfichasWlID = await db.get(`canalfichasWlNB_${guild.id}`);
                const canalfichasWl = guild.channels.cache.get(canalfichasWlID);
                const escolhido = guild.members.cache.get(selectedOption);
                const link = `https://discordapp.com/users/${interaction.user.id}`;
                const aceitarWl = '1332705924334227508'; // ID do emoji Aceitar
                const recusarWl = '1332705927811432499'; // ID do emoji Negar
                const perfil = '1327398609007939664'; // ID do emoji Perfil


                const embedFicha = new Discord.EmbedBuilder()
                    .setAuthor({ name: `Verificação - ${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) })
                    .addFields(
                        { name: "Usuário(a):", value: `${interaction.member} \`${interaction.id}\``, inline: false },
                        { name: "Informações:", value: ` Conhece : ${escolhido} \`${escolhido.id}\``, inline: false }
                    )

                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setColor(colorNB);

                const rowWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Aceitar')
                            .setEmoji(aceitarWl) // Usando o ID do emoji 'Aceitar'
                            .setCustomId('aceitarWl')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Recusar')
                            .setEmoji(recusarWl) // Usando o ID do emoji 'Negar'
                            .setCustomId('recusarWl')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Perfil')
                            .setEmoji(perfil) // Usando o ID do emoji 'Negar'
                            .setURL(link)
                            .setStyle(Discord.ButtonStyle.Link)
                    );

                await db.add(`fichawltt_${interaction.user.id}`, 1);

                const MESSAGE = await canalfichasWl.send({ embeds: [embedFicha], components: [rowWl] });

                const filter = (i) => !i.user.bot;
                const collector = MESSAGE.createMessageComponentCollector({ filter });

                collector.on('collect', async (buttonInteraction) => {
                    const aprovador = buttonInteraction.member;
                    const membro = guild.members.cache.get(interaction.user.id);

                    const aprovadoWlID = await db.get(`aprovadoWlNB_${guild.id}`);
                    const aprovadoRole = guild.roles.cache.get(aprovadoWlID);

                    const logChannelID = await db.get(`canallogsWlNB_${guild.id}`);
                    const logChannel = guild.channels.cache.get(logChannelID);

                    try {
                        if (buttonInteraction.customId === 'aceitarWl') {
                            try {
                                const membro = guild.members.cache.get(interaction.user.id);
                                if (!membro) {
                                    return buttonInteraction.reply({ content: "Membro não encontrado.", ephemeral: true });
                                }

                                // Verifica se o cargo existe antes de adicioná-lo
                                const aprovadoWlID = await db.get(`aprovadoWlNB_${guild.id}`);
                                const aprovadoRole = guild.roles.cache.get(aprovadoWlID);
                                if (!aprovadoRole) {
                                    return buttonInteraction.reply({ content: "Cargo aprovado não encontrado.", ephemeral: true });
                                }

                                await membro.roles.add(aprovadoRole); // Atribui o cargo ao membro
                                await db.delete(`fichawltt_${interaction.user.id}`);
                                buttonInteraction.reply({ content: `Membro aprovado por ${aprovador.user.tag}!`, ephemeral: true });

                                // Log de aprovação
                                if (logChannel) {
                                    const logEmbed = new Discord.EmbedBuilder()
                                        .setAuthor({ name: `Verificação - ${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) })
                                        .addFields(
                                            { name: 'Usuário(a):', value: `${membro} \`${membro.id}\``, inline: false },
                                            { name: 'Informações:', value: `Aceito por: ${aprovador} \`${aprovador.id}\``, inline: false }
                                        )
                                        .setTimestamp()
                                        .setThumbnail(membro.user.displayAvatarURL({ dynamic: true }))
                                        .setColor('#00FF00');
                                    await logChannel.send({ embeds: [logEmbed] });
                                }
                            } catch (err) {
                                console.error("Erro ao aceitar WL:", err);
                                buttonInteraction.reply({ content: "Houve um erro ao aceitar a WL.", ephemeral: true });
                            }
                        }
                        else if (buttonInteraction.customId === 'recusarWl') {
                            await db.delete(`fichawltt_${interaction.user.id}`);
                            buttonInteraction.reply({ content: `Membro recusado por ${aprovador.user.tag}.`, ephemeral: true });

                            // Expulsa o usuário (opcional)
                            membro.kick('Recusado na whitelist').catch(() => { });
                        }

                        // Apaga a mensagem após o processamento
                        await MESSAGE.delete().catch(() => { });
                    } catch (err) {
                        console.error("Erro ao processar a interação do botão:", err);
                    }
                });

            } catch (err) {
                console.error("Erro na função 'oi':", err);
            }
        }
        if (interaction.customId === 'usarcodigo') {
            // Configura o modal para inserir o código
            const modal = new Discord.ModalBuilder()
                .setCustomId('modalCodigo')
                .setTitle('Use o código para passar na verificação');

            const inputCodigo = new Discord.TextInputBuilder()
                .setCustomId('inputCodigo')
                .setLabel('Código')
                .setPlaceholder('Insira o código recebido aqui')
                .setRequired(true)
                .setStyle(Discord.TextInputStyle.Short);

            const row = new Discord.ActionRowBuilder().addComponents(inputCodigo);

            modal.addComponents(row);
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'modalCodigo') {
            try {
                const codigo = interaction.fields.getTextInputValue('inputCodigo');
                console.log(`Código inserido: ${codigo}`);

                // Recupera o donoId usando o código
                const donoData = await db.get(`codigo_${codigo}`);
                console.log(`Valor retornado de donoData:`, donoData);

                if (!donoData) {
                    return interaction.reply({
                        content: `O código **${codigo}** não é válido.`,
                        flags: Discord.MessageFlags.Ephemeral,
                    });
                }

                let donoId;
                if (typeof donoData === 'object' && donoData !== null) {
                    donoId = donoData.donoId; // Acessa a propriedade específica
                } else {
                    return interaction.reply({
                        content: "Formato incorreto para o código ou dados associados.",
                        flags: Discord.MessageFlags.Ephemeral,
                    });
                }

                // Recupera o membro no servidor
                const membro = interaction.guild.members.cache.get(interaction.user.id);
                if (!membro) {
                    return interaction.reply({
                        content: "Membro não encontrado no servidor.",
                        flags: Discord.MessageFlags.Ephemeral,
                    });
                }

                // Verifica se o cargo de aprovado existe
                const aprovadoWlID = await db.get(`aprovadoWlNB_${interaction.guild.id}`);
                const aprovadoRole = interaction.guild.roles.cache.get(aprovadoWlID);
                if (!aprovadoRole) {
                    return interaction.reply({
                        content: "Cargo de aprovado não encontrado.",
                        flags: Discord.MessageFlags.Ephemeral,
                    });
                }

                // Remove todas as roles do membro
                await Promise.all(
                    membro.roles.cache.map((role) =>
                        membro.roles.remove(role).catch((err) =>
                            console.error(`Erro ao remover role: ${role.name}`, err)
                        )
                    )
                );

                // Adiciona a role de aprovado
                await membro.roles.add(aprovadoRole);

                // Envia log para o canal de logs
                const logsWlID = await db.get(`canallogsWlNB_${interaction.guild.id}`);
                const logsChannel = interaction.guild.channels.cache.get(logsWlID);

                if (logsChannel) {
                    const embedLog = new Discord.EmbedBuilder()
                        .setAuthor({
                            name: `Código de Verificação - ${interaction.guild.name}`, // Certifique-se de usar o `interaction.guild`
                            iconURL: interaction.guild.iconURL({ dynamic: true }) || null, // Verifica se há um ícone da guilda
                        })
                        .setDescription(`O membro **${interaction.member}** foi aprovado no sistema de verificação.`) // Mostra o nome do membro corretamente
                        .addFields(
                            { name: 'Código usado:', value: `\`${codigo}\``, inline: false },
                            { name: 'Responsável pela aprovação:', value: `<@${donoId}> (\`${donoId}\`)`, inline: true } // Marca e exibe o ID do dono
                        )
                        .setColor('#00FF00') // Cor verde para aprovação
                        .setThumbnail(interaction.member.user.displayAvatarURL({ dynamic: true })) // Mostra o avatar do membro aprovado
                        .setTimestamp(); // Adiciona o horário do evento
                    await logsChannel.send({ embeds: [embedLog] });
                }



                return interaction.reply({
                    content: `Você foi aprovado com o código: **${codigo}**`,
                    flags: Discord.MessageFlags.Ephemeral,
                });
            } catch (err) {
                console.error('Erro no processo de verificação com código:', err);
                return interaction.reply({
                    content: 'Houve um erro durante a verificação. Por favor, tente novamente mais tarde.',
                    flags: Discord.MessageFlags.Ephemeral,
                });
            }
        }






    } catch (err) {
        console.error("Erro geral no bot:", err);
    }
});
