const Discord = require("discord.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { QuickDB } = require('quick.db');
let parse = require("parse-duration");
const moment = require("moment");
moment.locale('pt-br');
require("moment-duration-format");
const ms = require('ms');
const { prefix } = require("../..");
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;
const axios = require('axios')

module.exports = {
    name: "menu",
    category: "",
    description: "",
    run: async (client, message, args) => {

        let perm2 = await db.get(`perm_${message.guild.id}.cargos`);

        const allowedUserIds = ["ALTERAR PARA ID DO DEV", "ALTERAR PARA ID DO DEV"];

        if (
            !allowedUserIds.includes(message.author.id) &&
            message.guild.ownerId !== message.author.id && 
            !message.member.roles.cache.some(r => perm2.includes(r.id)) 
        ) {
            return;
        }        

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let prefixCurrent = await db.get(`prefixCurrent`);
        if (!prefixCurrent) prefixCurrent = prefix;

        let conviteNB = await db.get(`conviteNB`);

        if (conviteNB) {
            conviteNB = `https://discord.gg/${conviteNB}`;
        } else {
            conviteNB = `\`Não foi definido.\``;
        }

        let dias = Math.floor(client.uptime / 86400000);
        const botE = await db.get(`botex_${client.user.id}`)
        const encerrar = new Date(botE);
        const hoje = new Date();
        
        const diferencaMs = encerrar - hoje; 
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24)); 
        
        if (diferencaDias <= 0) {
            const embed = new EmbedBuilder()
                .setColor(colorNB)
                .setAuthor({ name: `${client.user.username} | Expirado`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                .setDescription("A versão premium não está mais disponível neste servidor.\nMotivo: `Tempo expirado`")
                .setFooter({ text: `© ${client.user.username}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();
        
            let row;
        
            if (allowedUserIds.includes(message.author.id)) {
                row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("Renovar")
                        .setCustomId("renovar")
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setLabel("Adicionar Dias")
                        .setCustomId("adddiasbot")
                        .setStyle(ButtonStyle.Secondary)
                );
            } else {
                row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("Renovar")
                        .setCustomId("renovar")
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Secondary)
                );
            }
        
            const MESSAGE = await message.channel.send({ embeds: [embed], components: [row] });
            const filter = (i) => i.user.id === message.author.id;
            const collector = MESSAGE.createMessageComponentCollector({ filter, time: 60000 });
        
            collector.on('collect', async (b) => {
                if (b.customId === 'renovar') {
                    const embedRenovar = new EmbedBuilder()
                        .setTitle('Renovar Dias')
                        .setDescription('Para renovar seu bot, um pagamento será gerado no valor de R$ 15, deseja continuar?')
                        .setTimestamp();
        
                    const button = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Sim')
                            .setStyle(ButtonStyle.Success)
                            .setCustomId('continuarpagamento')
                    );
        
                    await b.reply({ embeds: [embedRenovar], components: [button] });
                }
        
                if (b.customId === 'adddiasbot') {
                    await b.reply({ content: 'Quantos dias você deseja adicionar? Por favor, responda com um número.', ephemeral: true });
        
                    const messageFilter = (response) => response.author.id === message.author.id;
                    const messageCollector = message.channel.createMessageCollector({ filter: messageFilter, time: 60000, max: 1 });
        
                    messageCollector.on('collect', async (msg) => {
                        const daysToAdd = parseInt(msg.content);
                        if (isNaN(daysToAdd) || daysToAdd <= 0) {
                            await b.followUp({ content: 'Número de dias inválido. Por favor, tente novamente.', ephemeral: true });
                            return;
                        }
        
                        const newExpirationDate = new Date();
                        newExpirationDate.setDate(newExpirationDate.getDate() + daysToAdd);
                 
                        await db.set(`botex_${client.user.id}`, newExpirationDate)
        
                        await b.followUp({ content: `Dias adicionados com sucesso! O bot agora expirará em ${newExpirationDate.toLocaleDateString()}.`, ephemeral: true })
                    });
        
                    messageCollector.on('end', (collected) => {
                        if (collected.size === 0) {
                            b.followUp({ content: 'Tempo esgotado. Nenhum dia foi adicionado.', ephemeral: true });
                        }
                    });
                }
            });
        
            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    MESSAGE.edit({ components: [] });
                }
            });
        
            return;
        } 

        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${client.user.username} | Informações`, iconURL: client.user.displayAvatarURL({ dynamic: true })})
            .addFields(
                { name: 'Admnistrador', value: `\n${message.author}`, inline: true },
                { name: 'Prefixo', value: `\`\`\`fix\n${prefixCurrent}\`\`\``, inline: true },
                { name: `<:time:1327398608122675353> Tempo Restante`, value: `\`${diferencaDias} dias\``, inline: false },
                { name: `<:stats:1327398601881813128> Status`, value: `Online \`(${dias} Dias)\``, inline: false },
            )            
            .setColor(`${colorNB}`)
            .setThumbnail(client.user.avatarURL({ size: 4096 }))

        const menu = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId('menu')
                    .setPlaceholder('Nenhum item selecionado.')
                    .addOptions(
                        {
                            label: 'Personalizar',
                            description: 'Ajuste as configurações e personalize seu bot de acordo com suas necessidades.',
                            emoji: '1265358426423164951',
                            value: 'perso',
                        },
                        {
                            label: 'Segurança',
                            description: 'Gerencie e Ajuste as Configurações de Segurança.',
                            emoji: 'security:1265358420974764143',
                            value: 'security',
                        },
                        {
                            label: 'Servidor',
                            description: 'Painel de Administração do Servidor.',
                            emoji: '1265357715992219749',
                            value: 'server',
                        },
                        {
                            label: 'Staff',
                            description: 'Painel de Administração da Equipe',
                            emoji: '1265358422904275128',
                            value: 'staff',
                        },
                        {
                            label: 'Entretenimento',
                            description: 'Área de Entretenimento e Atividades',
                            emoji: '1265358417959325829',
                            value: 'entre',
                        },
                        {
                            label: 'Vips',
                            description: 'Gerencie e Administre os Usuários VIP',
                            emoji: 'vips:1265358415081766964',
                            value: 'vips',
                        }

                    )
            );

        let rowMenu;

        if (message.author.id == '1318983059994968127' || message.author.id == '1318983059994968127') {

            rowMenu = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setLabel("Comandos do BOT")
                        .setEmoji('1119988296219643935')
                        .setCustomId("commands")
                        .setStyle(Discord.ButtonStyle.Primary),
                    new Discord.ButtonBuilder()
                        .setLabel("Link do Suporte")
                        .setEmoji('1119988090942009455')
                        .setURL("https://discord.gg/sync")
                        .setStyle(Discord.ButtonStyle.Link))
        } else {

            rowMenu = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setLabel("Comandos do BOT")
                        .setEmoji('1119988296219643935')
                        .setCustomId("commands")
                        .setStyle(Discord.ButtonStyle.Primary),
                    new Discord.ButtonBuilder()
                        .setLabel("Link do Suporte")
                        .setEmoji('1119988090942009455')
                        .setURL("https://discord.gg/sync")
                        .setStyle(Discord.ButtonStyle.Link))
        }

        const MESSAGE = await message.channel.send({ embeds: [embed], components: [rowMenu, menu] });
        const filter = (i) => i.user.id === message.author.id;
        const collector = MESSAGE.createMessageComponentCollector({ filter });

        collector.on('collect', async (b) => {

            parse["e"] = 0;
            parse["dia"] = parse["day"];
            parse["dias"] = parse["days"];
            parse["d"] = parse["day"];

            let v = await db.get(`diasbot_${client.user.id}`);

            let data;

            if (v) {

                data = await v.map(x => x.diasBot);

            } else {

                data = Date.now();
            }

            if (b.customId == 'commands') {
                b.reply({
                    embeds: [
                        {
                            title: '📜 Lista de Comandos',
                            color: 0x0099FF, // Cor do embed (opcional)
                            fields: [
                                {
                                    name: '📌 Comandos de Informações',
                                    value: `\`${prefixCurrent}avatar\` \`${prefixCurrent}banner\` \`${prefixCurrent}userinfo\``,
                                    inline: false
                                },
                                {
                                    name: '<:sejamembro:1327398609007939664> Comandos de Moderação',
                                    value: `> \`${prefixCurrent}addemoji\`\n> \`${prefixCurrent}addcargo\`\n> \`${prefixCurrent}adms\`\n> \`${prefixCurrent}ban\`\n> \`${prefixCurrent}unban\`\n> \`${prefixCurrent}mute\`\n> \`${prefixCurrent}unmute\`\n> \`${prefixCurrent}clear\`\n> \`${prefixCurrent}kick\`\n> \`${prefixCurrent}unlock\`\n> \`${prefixCurrent}lock\`\n> \`${prefixCurrent}embed\``,
                                    inline: false
                                },
                                {
                                    name: '<:vips:1327398614091436155> Comandos VIPs',
                                    value: `> \`${prefixCurrent}setvip\`\n> \`${prefixCurrent}vip\`\n> \`${prefixCurrent}addvip\`\n> \`${prefixCurrent}removervip\``,
                                    inline: false
                                },
                                {
                                    name: '<:firstlady:1327398571288428564> Comandos Primeira Dama',
                                    value: `> \`${prefixCurrent}pd\`\n> \`${prefixCurrent}pda\`\n> \`${prefixCurrent}pdr\``,
                                    inline: false
                                },
                                {
                                    name: '<:info:1327398603207217187> Comandos de Tempo',
                                    value: `> \`${prefixCurrent}tempo\`\n> \`${prefixCurrent}tempoi\``,
                                    inline: false
                                }
                            ],
                            footer: {
                                text: 'Bot desenvolvido por Sync Developments' // Substitua pelo seu nome ou créditos
                            }
                        }
                    ],
                    ephemeral: true
                });
            }
                  

            if (b.customId == 'voltarMenu') { 

                b.deferUpdate();

                let colorNB = await db.get(`colorNB`);
                if (!colorNB) colorNB = '#2f3136';

                let prefixCurrent = await db.get(`prefixCurrent`);
                if (!prefixCurrent) prefixCurrent = prefix;


                let embedd = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${client.user.username} | Informações`, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                    .addFields(
                        { name: 'Admnistrador', value: `\n${message.author}`, inline: true },
                        { name: 'Prefixo', value: `\`\`\`fix\n${prefixCurrent}\`\`\``, inline: true },
                        { name: `<:time:1327398608122675353> Tempo Restante`, value: `\`${diferencaDias} dias\``, inline: false },
                        { name: `<:stats:1327398601881813128> Status`, value: `Online \`(${dias} Dias)\``, inline: false },
                    )      
                    .setColor(`${colorNB}`)
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))

                MESSAGE.edit({ embeds: [embedd], components: [rowMenu, menu] });
            }

            if (b.customId == 'menu') {

                if (b.values[0] === 'security') {

                    b.deferUpdate()

                    let embedSeguranca = new Discord.EmbedBuilder()
                        .setAuthor({
                            name: `${client.user.username} | Segurança`,
                            iconURL: client.user.displayAvatarURL({ dynamic: true })
                        })
                        .addFields(
                            { 
                                name: `<:menu:1327398586333266144> Configurações`, 
                                value: [
                                    `> **Logs** - Registro de atividades e eventos no servidor`,
                                    `> **Anti Raid** - Proteção contra ataques de invasores`,
                                    `> **Anti Fake** - Bloqueio de contas falsas`,
                                    `> **Anti Bot** - Prevenção contra bots não autorizados`,
                                    `> **Anti Link** - Bloqueio de links indesejados`,
                                    `> **Anti Cargos** - Controle sobre a atribuição de cargos`,
                                    `> **Auto Limpeza Convites** - Limpeza automática de convites`,
                                    `> **Auto Limpeza Imagens** - Limpeza automática de imagens`,
                                    `> **Proteção de URL** - Proteção contra roubo de URLs do servidor`,
                                    `> **Blacklist** - Lista negra de usuários e termos proibidos`
                                ].join('\n'), 
                                inline: true 
                            }
                        )                                              
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setColor(`${colorNB}`)

                    const rowSeguranca = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Logs")
                                .setCustomId("logsNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Anti Raid")
                                .setCustomId("antiraidNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Anti Fake")
                                .setCustomId("antifakeNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Anti Bot")
                                .setCustomId("antibotNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Anti Link")
                                .setCustomId("antilinkNB")
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowSeguranca2 = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Anti Cargos")
                                .setCustomId("anticargoNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Limpeza de Convite")
                                .setCustomId("autodeleteconvites")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Limpeza de Imagens")
                                .setCustomId("autodeleteimagens")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Protecao de URL")
                                .setCustomId("protecaourl")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Blacklist")
                                .setCustomId("blacklistNB")
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowBackSec2 = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setEmoji('1120039338923794432')
                                .setCustomId("voltarMenu")
                                .setStyle(Discord.ButtonStyle.Danger))

                    await MESSAGE.edit({ embeds: [embedSeguranca], components: [rowSeguranca, rowSeguranca2, rowBackSec2] })

                }

                if (b.values[0] === 'perso') {

                    b.deferUpdate();

                    let embedAparencia = new Discord.EmbedBuilder()
                        .setAuthor({ name: `${client.user.username} | Personalizar`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                        .addFields(
                            { name: `<:menu:1327398586333266144> Configurações`, value: `> Aparência\n> Permissão`, inline: true }
                        )
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setColor(`${colorNB}`)

                    const rowAparencia = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Aparência")
                                .setCustomId("aparence")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Permissão")
                                .setCustomId("perm")
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowBackStaff = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setEmoji('1120039338923794432')
                                .setCustomId("voltarMenu")
                                .setStyle(Discord.ButtonStyle.Danger))

                    MESSAGE.edit({ embeds: [embedAparencia], components: [rowAparencia, rowBackStaff] });

                }

                if (b.values[0] === 'server') {

                    b.deferUpdate()

                    let embed = new Discord.EmbedBuilder()
                        .setAuthor(
                            { name: `${client.user.username} | Configurações`, iconURL: client.user.displayAvatarURL({ dynamic: true }) }
                        )
                        .addFields(
                            { 
                                name: `<:menu:1327398586333266144> Configurações`, 
                                value: `> **Auto Cargos** - Configura cargos automáticos para novos membros.
                                > **Bem vindo** - Define mensagens de boas-vindas para novos membros.
                                > **Contador** - Mostra um contador de membros no servidor.
                                > **Auto reações** - Adiciona reações automáticas às mensagens.
                                > **Membro Ativo** - Identifica e premia membros ativos no servidor.
                                > **Bots** - Gerencia configurações e permissões de bots.
                                > **Tempocall** - Registra o tempo que os membros passam em chamadas.
                                > **Call Temporária** - Cria chamadas de voz temporárias conforme a necessidade.`, 
                                inline: true 
                            }
                        )                        
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setColor(`${colorNB}`)

                    const rowServidor = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Auto cargos")
                                .setCustomId("autocargosNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Bem vindo")
                                .setCustomId("bemvindoNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Contador")
                                .setCustomId("contadorNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Auto reações")
                                .setCustomId("autoReacoesNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Membro ativo")
                                .setCustomId("membroativoNB")
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowServidor2 = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Bots")
                                .setCustomId("botsNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Tempocall")
                                .setCustomId("tempocallNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Call temporária")
                                .setCustomId("callTempmenu")
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowBackServ = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setEmoji('1120039338923794432')
                                .setCustomId("voltarMenu")
                                .setStyle(Discord.ButtonStyle.Danger))

                    await MESSAGE.edit({ embeds: [embed], components: [rowServidor, rowServidor2, rowBackServ] })

                }

                if (b.values[0] === 'staff') {

                    b.deferUpdate()

                    let embed = new Discord.EmbedBuilder()
                        .setAuthor({ name: `${client.user.username} | Staff`,  iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                        .addFields(
                            { 
                                name: `<:menu:1327398586333266144> Configurações`, 
                                value: `> **Whitelist** - Gerencia a lista de permissões para acesso.
                                > **Registro** - Configura o processo de registro de novos membros.
                                > **Seja Membro** - Define as opções para novos membros se tornarem participantes.
                                > **Migração** - Facilita a migração de cargos entre servidores.
                                > **Verificação** - Configura o sistema de verificação de identidade.
                                > **Suporte** - Define as opções para suporte e ajuda aos membros.`, 
                                inline: true 
                            }
                        )                        
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setColor(`${colorNB}`)

                    const rowStaff = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Whitelist")
                                .setCustomId("whitelistNBB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                                new Discord.ButtonBuilder()
                                .setLabel("Apagar Whitelists Pendentes")
                                .setCustomId("apagar-wl-pendentes")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Registro")
                                .setCustomId("registroNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Seja Membro")
                                .setCustomId("sejamembroNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Migração")
                                .setCustomId("migracaoNB")
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowStaff2 = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Verificação")
                                .setCustomId("verificarNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Suporte")
                                .setCustomId("suporteNB")
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowBackStaff = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setEmoji('1120039338923794432')
                                .setCustomId("voltarMenu")
                                .setStyle(Discord.ButtonStyle.Danger))

                    await MESSAGE.edit({ embeds: [embed], components: [rowStaff, rowStaff2, rowBackStaff] })

                }

                if (b.values[0] === 'entre') {

                    b.deferUpdate()

                    let embedEntre = new Discord.EmbedBuilder()
                        .setAuthor({  name: `${client.user.username} | Entretenimento`, iconURL: client.user.displayAvatarURL() })
                        .addFields(
                            { name: `<:menu:1327398586333266144> Configurações`, value: `> Instagram\n> Twitter\n> Tellonym`, inline: true }
                        )
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setColor(`${colorNB}`)

                    const rowEntre = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Instagram")
                                .setCustomId("instaNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Twitter")
                                .setCustomId("ttNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Tellonym")
                                .setCustomId("tellNB")
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowBackEntre = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setEmoji('1120039338923794432')
                                .setCustomId("voltarMenu")
                                .setStyle(Discord.ButtonStyle.Danger))

                    await MESSAGE.edit({ embeds: [embedEntre], components: [rowEntre, rowBackEntre] })
                }


                if (b.values[0] === 'vips') {

                    b.deferUpdate();

                    let embedVip = new Discord.EmbedBuilder()
                       .setAuthor({  name: `${client.user.username} | Vips`, iconURL: client.user.displayAvatarURL() })
                        .addFields(
                            { name: `<:menu:1327398586333266144> Configurações`, value: `> Vip\n> Primeira dama`, inline: true }
                        )

                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setColor(`${colorNB}`)

                    const rowVips = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Vip")
                                .setCustomId("vipNB")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Primeira dama")
                                .setCustomId("pdNB")
                                .setStyle(Discord.ButtonStyle.Secondary))

                    const rowBackVips = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setEmoji('1120039338923794432')
                                .setCustomId("voltarMenu")
                                .setStyle(Discord.ButtonStyle.Danger))

                    MESSAGE.edit({ embeds: [embedVip], components: [rowVips, rowBackVips] });

                }

            }

            async function updateEmbed(b) {
                let stat = await db.get(`autolimpezaimagens_${message.guild.id}.estado`);
                let logChannelId = await db.get(`autolimpezaimagens_${message.guild.id}.logs`);
                let channelsIm = await db.get(`autolimpezaimagens_${message.guild.id}.canais`)
                let log = logChannelId ? `<#${logChannelId}>` : `\`\`\`Nenhum.\`\`\``;

                let channelMentions = channelsIm && channelsIm.length > 0 
                ? channelsIm.map(id => `<#${id}>`).join('\n ') 
                : `\`\`\`Nenhum.\`\`\``;        

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({
                        name: `${client.user.username} | AutoLimpeza Imagens`,
                        iconURL: `${client.user.avatarURL({ dynamic: true })}`
                    })
                    .addFields(
                        { name: `Estado Atual`, value: `\`\`\`\n${stat ? "Ativado": "Desativado"}\`\`\`` },
                        { name: `Canais`, value: channelMentions },
                        { name: `Canal de Logs`, value: `${log}` },
                        {
                            name: `Explicativo`, 
                            value: [
                                `Quando o sistema estiver ativado, cada imagem enviada será deletado após um período de **10 minutos**.`,
                                `Isso ajuda a manter os convites limpos e organizados, prevenindo o acúmulo de imagens desnecessárias.`
                            ].join('\n')
                        }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`);
            
                let row;
            
                if (stat) {
                    row = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Desativar Sistema")
                                .setCustomId("autolimpezasystem")
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setLabel("Adicionar canal")
                                .setCustomId("addautolimpezac")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Remover canal")
                                .setCustomId("removeautolimpezac")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Configurar Canal Logs")
                                .setCustomId("logsautolimpeza")
                                .setStyle(Discord.ButtonStyle.Secondary)
                        );
                } else {
                    row = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Ativar Sistema")
                                .setCustomId("autolimpezasystem")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Adicionar canal")
                                .setCustomId("addautolimpezac")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Remover canal")
                                .setCustomId("removeautolimpezac")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Configurar Canal Logs")
                                .setCustomId("logsautolimpeza")
                                .setStyle(Discord.ButtonStyle.Secondary)
                        );
                }
            
                const rowBackAparencia = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger)
                    );
            
                await MESSAGE.edit({ embeds: [embed], components: [row, rowBackAparencia] });
            }   

            if (b.customId == 'autodeleteimagens') {
                b.deferUpdate();
                updateEmbed(b);
            }
            
            if (b.customId == 'autolimpezasystem') {
                let stat = await db.get(`autolimpezaimagens_${message.guild.id}.estado`);
                
                if (!stat) {
                    stat = true;
                    await db.set(`autolimpezaimagens_${message.guild.id}.estado`, stat);
                    
                    const embed = new Discord.EmbedBuilder()
                        .setTitle(`${client.user.username} - Autodelete de imagens`)
                        .setDescription(`O sistema de limpeza de imagens foi ativado`)
                        .setColor(`${colorNB}`)
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setFooter({ text: `© ${client.xx.autodelete}`, iconURL: client.user.avatarURL({ size: 4096 }) })
                        .setTimestamp();
            
                    await b.reply({ embeds: [embed], ephemeral: true });
                } else {
                    stat = false;
                    await db.set(`autolimpezaimagens_${message.guild.id}.estado`, stat);
            
                    const embed = new Discord.EmbedBuilder()
                        .setTitle(`${client.user.username} - Autodelete de imagens`)
                        .setDescription("O sistema de limpeza de imagens foi desativado")
                        .setColor(`${colorNB}`)
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setFooter({ text: `© ${client.user.username}`, iconURL: client.user.avatarURL({ size: 4096 }) })
                        .setTimestamp();
            
                    await b.reply({ embeds: [embed], ephemeral: true });
                }
            
                updateEmbed(b);
            }
            
            if (b.customId == 'addautolimpezac') {
                await b.reply({ content: "Por favor, mencione o canal que você gostaria de adicionar.", ephemeral: true });
            
                const filter = m => m.author.id === b.user.id;
                const collector = b.channel.createMessageCollector({ filter, time: 30000 });
            
                collector.on('collect', async m => {
                    const channel = m.mentions.channels.first();
                    if (channel) {
                        let channels = await db.get(`autolimpezaimagens_${message.guild.id}.canais`) || [];
                        if (!channels.includes(channel.id)) {
                            channels.push(channel.id);
                            await db.set(`autolimpezaimagens_${message.guild.id}.canais`, channels);
                            await b.followUp({ content: `Canal ${channel} adicionado com sucesso!`, ephemeral: true });
                        } else {
                            await b.followUp({ content: `Canal ${channel} já está na lista.`, ephemeral: true });
                        }
                    } else {
                        await b.followUp({ content: "Nenhum canal mencionado. Por favor, tente novamente.", ephemeral: true });
                    }
                    collector.stop();
                    updateEmbed(b);
                });
            
                collector.on('end', collected => {
                    if (collected.size === 0) {
                        b.followUp("Tempo esgotado. Nenhum canal foi adicionado.");
                    }
                });
            }
            
            if (b.customId == 'removeautolimpezac') {
                await b.reply({ content: "Por favor, mencione o canal que você gostaria de remover.", ephemeral: true });
            
                const filter = m => m.author.id === b.user.id;
                const collector = b.channel.createMessageCollector({ filter, time: 30000 });
            
                collector.on('collect', async m => {
                    const channel = m.mentions.channels.first();
                    if (channel) {
                        let channels = await db.get(`autolimpezaimagens_${message.guild.id}.canais`) || [];
                        if (channels.includes(channel.id)) {
                            channels = channels.filter(id => id !== channel.id);
                            await db.set(`autolimpezaimagens_${message.guild.id}.canais`, channels);
                            await b.followUp({ content: `Canal ${channel} removido com sucesso!`, ephemeral: true });
                        } else {
                            await b.followUp({ content: `Canal ${channel} não está na lista.`, ephemeral: true });
                        }
                    } else {
                        await b.followUp({ content: "Nenhum canal mencionado. Por favor, tente novamente.", ephemeral: true });
                    }
                    collector.stop();
                    updateEmbed(b);
                });
            
                collector.on('end', collected => {
                    if (collected.size === 0) {
                        b.followUp("Tempo esgotado. Nenhum canal foi removido.");
                    }
                });
            }
            
            if (b.customId == 'logsautolimpeza') {
                await b.reply({ content: "Por favor, mencione o canal que você gostaria de configurar.", ephemeral: true });
            
                const filter = m => m.author.id === b.user.id;
                const collector = b.channel.createMessageCollector({ filter, time: 30000 });
            
                collector.on('collect', async m => {
                    const channel = m.mentions.channels.first();
                    if (channel) {
                        await db.set(`autolimpezaimagens_${message.guild.id}.logs`, channel.id);
                        await b.followUp({ content: `Canal ${channel} configurado com sucesso!`, ephemeral: true });
                    } else {
                        await b.followUp({ content: "Nenhum canal mencionado. Por favor, tente novamente.", ephemeral: true });
                    }
                    collector.stop();
                    updateEmbed(b);
                });
            
                collector.on('end', collected => {
                    if (collected.size === 0) {
                        b.followUp("Tempo esgotado. Nenhum canal foi adicionado.");
                    }
                });
            }

            if (b.customId == 'protecaourl') {
                b.deferUpdate();
                updateEmbedURL(b);
            }

            if (b.customId == 'protecaourlsystem') {
                let stat = await db.get(`protecaourl_${message.guild.id}.estado`);
                
                if (!stat) {
                    stat = true;
                    await db.set(`protecaourl_${message.guild.id}.estado`, stat);
                    
                    const embed = new Discord.EmbedBuilder()
                        .setTitle(`${client.user.username} - Proteção de URL`)
                        .setDescription(`O sistema de proteção de url foi ativado`)
                        .setColor(`${colorNB}`)
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setFooter({ text: `© ${client.xx.autodelete}`, iconURL: client.user.avatarURL({ size: 4096 }) })
                        .setTimestamp();
            
                    await b.reply({ embeds: [embed], ephemeral: true });
                } else {
                    stat = false;
                    await db.set(`protecaourl_${message.guild.id}.estado`, stat);
            
                    const embed = new Discord.EmbedBuilder()
                        .setTitle(`${client.user.username} - Proteção de URL`)
                        .setDescription("O sistema de proteção de url foi desativado")
                        .setColor(`${colorNB}`)
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setFooter({ text: `© ${client.user.username}`, iconURL: client.user.avatarURL({ size: 4096 }) })
                        .setTimestamp();
            
                    await b.reply({ embeds: [embed], ephemeral: true });
                }
            
                updateEmbedURL(b);
            }

            if (b.customId == 'protecaourllogs') {
                await b.reply({ content: "Por favor, mencione o canal que você gostaria de configurar.", ephemeral: true });
            
                const filter = m => m.author.id === b.user.id;
                const collector = b.channel.createMessageCollector({ filter, time: 30000 });
            
                collector.on('collect', async m => {
                    const channel = m.mentions.channels.first();
                    if (channel) {
                        await db.set(`protecaourl_${message.guild.id}.logs`, channel.id);
                        await b.followUp({ content: `Canal ${channel} configurado com sucesso!`, ephemeral: true });
                    } else {
                        await b.followUp({ content: "Nenhum canal mencionado. Por favor, tente novamente.", ephemeral: true });
                    }
                    collector.stop();
                    updateEmbedURL(b);
                });
            
                collector.on('end', collected => {
                    if (collected.size === 0) {
                        b.followUp("Tempo esgotado. Nenhum canal foi adicionado.");
                    }
                });
            }

            if (b.customId == 'protecaourlaccount') {
                await b.reply({ content: "Por favor, forneca o token que você gostaria de configurar.", ephemeral: true });
            
                const filter = m => m.author.id === b.user.id;
                const collector = b.channel.createMessageCollector({ filter, time: 30000 });
            
                collector.on('collect', async m => {
                    await db.set(`protecaourl_${message.guild.id}.account`, m.content);
                    await b.followUp({ content: `Configurada com sucesso!`, ephemeral: true });
                   
                    collector.stop();
                    updateEmbedURL(b);
                });
            
                collector.on('end', collected => {
                    if (collected.size === 0) {
                        b.followUp("Tempo esgotado. Nenhum canal foi adicionado.");
                    }
                });
            }
            
            async function updateEmbedURL(b) {
                let stat = await db.get(`protecaourl_${message.guild.id}.estado`);
                let logChannelId = await db.get(`protecaourl_${message.guild.id}.logs`);
                let log = logChannelId ? `<#${logChannelId}>` : `\`\`\`Nenhum.\`\`\``;
                let account = await db.get(`protecaourl_${message.guild.id}.account`);

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({
                        name: `${client.user.username} | Proteção de URL`,
                        iconURL: `${client.user.avatarURL({ dynamic: true })}`
                    })
                    .addFields(
                        { name: `Estado Atual`, value: `\`\`\`\n${stat ? "Ativado": "Desativado"}\`\`\`` },
                        { name: `Canal de Logs`, value: `${log}` },
                        { name: `Token de Conta`, value: `\`\`\`\n${account ? "Configurada" : "Nenhuma"}\`\`\`` },
                        {
                            "name": "Explicativo",
                            "value": [
                                "Quando o sistema estiver ativado, se a URL for alterada, o bot irá remover o cargo da pessoa que mudou a URL e restaurar a URL no servidor.",
                                "Isso ajuda a manter a integridade e segurança das URLs configuradas no servidor."
                            ].join('\n')
                        }                        
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`);
            
                let row;
            
                if (stat) {
                    row = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Desativar Sistema")
                                .setCustomId("protecaourlsystem")
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setLabel("Configurar Conta")
                                .setCustomId("protecaourlaccount")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Configurar Canal Logs")
                                .setCustomId("protecaourllogs")
                                .setStyle(Discord.ButtonStyle.Secondary)
                        );
                } else {
                    row = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Ativar Sistema")
                                .setCustomId("protecaourlsystem")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Configurar Conta")
                                .setCustomId("protecaourlaccount")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Configurar Canal Logs")
                                .setCustomId("protecaourllogs")
                                .setStyle(Discord.ButtonStyle.Secondary)
                        );
                }
            
                const rowBackAparencia = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger)
                    );
            
                await MESSAGE.edit({ embeds: [embed], components: [row, rowBackAparencia] });
            }
            
            if (b.customId == 'autodeleteconvites') {
                b.deferUpdate();
                updateEmbedConvite(b);
            }
            
            if (b.customId == 'autolimpezasystemconvites') {
                let stat = await db.get(`autolimpezaconvites_${message.guild.id}.estado`);
                
                if (!stat) {
                    stat = true;
                    await db.set(`autolimpezaconvites_${message.guild.id}.estado`, stat);
                    
                    const embed = new Discord.EmbedBuilder()
                        .setTitle(`${client.user.username} - Autodelete de Convites`)
                        .setDescription(`O sistema de limpeza de convites foi ativado`)
                        .setColor(`${colorNB}`)
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setFooter({ text: `© ${client.xx.autodelete}`, iconURL: client.user.avatarURL({ size: 4096 }) })
                        .setTimestamp();
            
                    await b.reply({ embeds: [embed], ephemeral: true });
                } else {
                    stat = false;
                    await db.set(`autolimpezaconvites_${message.guild.id}.estado`, stat);
            
                    const embed = new Discord.EmbedBuilder()
                        .setTitle(`${client.user.username} - Autodelete de Convites`)
                        .setDescription("O sistema de limpeza de convites foi desativado")
                        .setColor(`${colorNB}`)
                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                        .setFooter({ text: `© ${client.user.username}`, iconURL: client.user.avatarURL({ size: 4096 }) })
                        .setTimestamp();
            
                    await b.reply({ embeds: [embed], ephemeral: true });
                }
            
                updateEmbedConvite(b);
            }

            if (b.customId == 'logsautolimpezaconvites') {
                await b.reply({ content: "Por favor, mencione o canal que você gostaria de configurar.", ephemeral: true });
            
                const filter = m => m.author.id === b.user.id;
                const collector = b.channel.createMessageCollector({ filter, time: 30000 });
            
                collector.on('collect', async m => {
                    const channel = m.mentions.channels.first();
                    if (channel) {
                        await db.set(`autolimpezaconvites_${message.guild.id}.logs`, channel.id);
                        await b.followUp({ content: `Canal ${channel} configurado com sucesso!`, ephemeral: true });
                    } else {
                        await b.followUp({ content: "Nenhum canal mencionado. Por favor, tente novamente.", ephemeral: true });
                    }
                    collector.stop();
                    updateEmbedConvite(b);
                });
            
                collector.on('end', collected => {
                    if (collected.size === 0) {
                        b.followUp("Tempo esgotado. Nenhum canal foi adicionado.");
                    }
                });
            }
            
            async function updateEmbedConvite(b) {
                let stat = await db.get(`autolimpezaconvites_${message.guild.id}.estado`);
                let logChannelId = await db.get(`autolimpezaconvites_${message.guild.id}.logs`);
                let log = logChannelId ? `<#${logChannelId}>` : `\`\`\`Nenhum.\`\`\``;

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({
                        name: `${client.user.username} | AutoLimpeza Convite`,
                        iconURL: `${client.user.avatarURL({ dynamic: true })}`
                    })
                    .addFields(
                        { name: `Estado Atual`, value: `\`\`\`\n${stat ? "Ativado": "Desativado"}\`\`\`` },
                        { name: `Limite de Tempo`, value: `\`\`\`\n10 Minutos\`\`\`` },
                        { name: `Canal de Logs`, value: `${log}` },
                        {
                            name: `Explicativo`, 
                            value: [
                                `Quando o sistema estiver ativado, cada convite criado será deletado após um período de **10 minutos**.`,
                                `Isso ajuda a manter os convites limpos e organizados, prevenindo o acúmulo de convites desnecessárias.`
                            ].join('\n')
                        }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`);
            
                let row;
            
                if (stat) {
                    row = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Desativar Sistema")
                                .setCustomId("autolimpezasystemconvites")
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setLabel("Configurar Canal Logs")
                                .setCustomId("logsautolimpezaconvites")
                                .setStyle(Discord.ButtonStyle.Secondary)
                        );
                } else {
                    row = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Ativar Sistema")
                                .setCustomId("autolimpezasystemconvites")
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setLabel("Configurar Canal Logs")
                                .setCustomId("logsautolimpezaconvites")
                                .setStyle(Discord.ButtonStyle.Secondary)
                        );
                }
            
                const rowBackAparencia = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger)
                    );
            
                await MESSAGE.edit({ embeds: [embed], components: [row, rowBackAparencia] });
            }         
            
            if (b.customId == 'perm') {

                b.deferUpdate();

                const guild = client.guilds.cache.get(b.guild.id);
                const roles = guild.roles.cache;
                let perm = await db.get(`perm_${message.guild.id}.cargos`);
                const filteredRoles = perm ? perm.map(id => roles.get(id)).filter(role => role) : null;
                const rolesInfo = filteredRoles ? filteredRoles.map(role => `${role} - ${role.name} | ${role.id}`).join('\n') : "Nenhuma.";

                let embedAparencia = new Discord.EmbedBuilder()
                    .setAuthor({
                        name: `${client.user.username} | Permissão`,
                        iconURL: `${client.user.avatarURL({ dynamic: true })}`
                    })
                    .addFields(
                        { name: `Cargos Permitidos`, value: `\n${rolesInfo}`, inline: true },
                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const row = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar Permissão")
                            .setCustomId("addpermrole")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover Permissão")
                            .setCustomId("removepermrole")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAparencia = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedAparencia], components: [row, rowBackAparencia] });
            }

            if (b.customId == 'addpermrole') {
                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`);
            
                b.reply({ embeds: [embedCargoWl], ephemeral: true });
            
                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 });
            
                coletor.on("collect", async (message) => {
                    message.delete();
            
                    if (message.content.toLowerCase() == "cancelar") {
                        coletor.stop('Collector stopped manually');
            
                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`);
            
                        return b.editReply({ embeds: [errado], ephemeral: true });
                    }
            
                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);
                    let cargo = b.guild.roles.cache.get(ee?.id);
            
                    if (!cargo) {
                        coletor.stop('Collector stopped manually');
            
                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`);
            
                        return b.editReply({ embeds: [errado], ephemeral: true });
                    } else {
                        await db.push(`perm_${b.guild.id}.cargos`, cargo.id);

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`);
            
                        await b.editReply({ embeds: [embedG], ephemeral: true });

                        const guild = client.guilds.cache.get(b.guild.id);
                        const roles = guild.roles.cache;
                        let perm = await db.get(`perm_${message.guild.id}.cargos`);
                        const filteredRoles = perm ? perm.map(id => roles.get(id)).filter(role => role) : null;
            
                        const rolesInfo = filteredRoles ? filteredRoles.map(role => `${role} - ${role.name} | ${role.id}`).join('\n') : "Nenhum.";
            
                        let embedAparencia = new Discord.EmbedBuilder()
                            .setAuthor({
                                name: `${client.user.username} | Permissão`,
                                iconURL: `${client.user.avatarURL({ dynamic: true })}`
                            })
                            .addFields(
                                { name: `Cargos Permitidos`, value: `\n${rolesInfo}`, inline: true }
                            )
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`);
            
                        const row = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setLabel("Adicionar Permissão")
                                    .setCustomId("addpermrole")
                                    .setStyle(Discord.ButtonStyle.Secondary),
                                new Discord.ButtonBuilder()
                                    .setLabel("Remover Permissão")
                                    .setCustomId("removepermrole")
                                    .setStyle(Discord.ButtonStyle.Secondary)
                            );
            
                        const rowBackAparencia = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setEmoji('1120039338923794432')
                                    .setCustomId("voltarMenu")
                                    .setStyle(Discord.ButtonStyle.Danger)
                            );
        
                        await MESSAGE.edit({ embeds: [embedAparencia], components: [row, rowBackAparencia] });
                    }
                });
            }            

            if (b.customId == 'removepermrole') {
                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`);
            
                b.reply({ embeds: [embedCargoWl], ephemeral: true });
            
                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 });
            
                coletor.on("collect", async (message) => {
                    message.delete();
            
                    if (message.content.toLowerCase() == "cancelar") {
                        coletor.stop('Collector stopped manually');
            
                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`);
            
                        return b.editReply({ embeds: [errado], ephemeral: true });
                    }
            
                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);
                    let cargo = b.guild.roles.cache.get(ee?.id);
            
                    if (!cargo) {
                        coletor.stop('Collector stopped manually');
            
                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`);
            
                        return b.editReply({ embeds: [errado], ephemeral: true });
                    } else {
                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`);
            
                        await b.editReply({ embeds: [embedG], ephemeral: true });
            
                        await db.set(`perm_${b.guild.id}.cargos`, (await db.get(`perm_${b.guild.id}.cargos`))?.filter(e => e !== `${cargo.id}`));
            
                        const guild = client.guilds.cache.get(b.guild.id);
                        const roles = guild.roles.cache;
                        let perm = await db.get(`perm_${message.guild.id}.cargos`);
                        const filteredRoles = perm ? perm.map(id => roles.get(id)).filter(role => role) : null;
                        const rolesInfo = filteredRoles ? filteredRoles.map(role => `${role} - ${role.name} | ${role.id}`).join('\n') : "Nenhum";
            
                        let embedAparencia = new Discord.EmbedBuilder()
                            .setAuthor({
                                name: `${client.user.username} | Permissão`,
                                iconURL: `${client.user.avatarURL({ dynamic: true })}`
                            })
                            .addFields(
                                { name: `Cargos Permitidos`, value: `\n${rolesInfo}`, inline: true }
                            )
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`);
            
                        const row = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setLabel("Adicionar Permissão")
                                    .setCustomId("addpermrole")
                                    .setStyle(Discord.ButtonStyle.Secondary),
                                new Discord.ButtonBuilder()
                                    .setLabel("Remover Permissão")
                                    .setCustomId("removepermrole")
                                    .setStyle(Discord.ButtonStyle.Secondary)
                            );
            
                        const rowBackAparencia = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setEmoji('1120039338923794432')
                                    .setCustomId("voltarMenu")
                                    .setStyle(Discord.ButtonStyle.Danger)
                            );
            
                        await MESSAGE.edit({ embeds: [embedAparencia], components: [row, rowBackAparencia] });
                    }
                });
            }            

            if (b.customId == 'aparence') {

                b.deferUpdate();

                let embedAparencia = new Discord.EmbedBuilder()
                    .setAuthor({
                        name: `${client.user.username} | Personalizar`,
                        iconURL: `${client.user.avatarURL({ dynamic: true })}`
                    })
                    .addFields(
                        { name: `Nome do BOT`, value: `\`\`\`fix\n${client.user.username}\`\`\``, inline: true },
                        { name: `Prefixo`, value: `\`\`\`fix\n${prefixCurrent}\`\`\``, inline: true },
                        { name: `Cor`, value: `\`\`\`fix\n${colorNB}\`\`\``, inline: true },
                        { name: `Convite público`, value: `${conviteNB}`, inline: false }
                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAparencia = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Prefixo")
                            .setCustomId("prefix")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Cor")
                            .setCustomId("colorbot")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Status")
                            .setCustomId("statsbot")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowAparencia2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Alterar nome do bot")
                            .setCustomId("namebot")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Alterar avatar do bot")
                            .setCustomId("avatarbot")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Alterar banner do bot")
                            .setCustomId("bannerbot")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAparencia = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedAparencia], components: [rowAparencia, rowAparencia2, rowBackAparencia] });
            }

            if (b.customId == 'prefix') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o prefixo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true });

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Prefixo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`prefixCurrent`, ee);

                        let embedAparencia = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Personalizar`, iconURL: client.user.displayAvatarURL() })
                            .addFields(
                                { name: `Nome do BOT`, value: `\`\`\`fix\n${client.user.username}\`\`\``, inline: true },
                                { name: `Prefixo`, value: `\`\`\`fix\n${ee}\`\`\``, inline: true },
                                { name: `Cor`, value: `\`\`\`fix\n${colorNB}\`\`\``, inline: true },
                                { name: `Convite público`, value: `${conviteNB}`, inline: false }
                            )
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)


                        MESSAGE.edit({ embeds: [embedAparencia] });
                    }

                }
                )
            }

            if (b.customId == 'colorbot') { 

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a cor desejada\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                const rowSite = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Site para buscar cor")
                            .setURL('https://html-color-codes.info/Codigos-de-Cores-HTML')
                            .setStyle(Discord.ButtonStyle.Link))

                b.reply({ embeds: [embedCargoWl], components: [rowSite], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Cor definida com sucesso.`)
                            .setColor(`${ee}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`colorNB`, ee);

                        let embedAparencia = new Discord.EmbedBuilder()
.setAuthor({  name: `${client.user.username} | Personalizar`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Nome do BOT`, value: `\`\`\`fix\n${client.user.username}\`\`\``, inline: true },
                                { name: `Prefixo`, value: `\`\`\`fix\n${prefixCurrent}\`\`\``, inline: true },
                                { name: `Cor`, value: `\`\`\`fix\n${colorNB}\`\`\``, inline: true },
                                { name: `Convite público`, value: `${conviteNB}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${ee}`)


                        MESSAGE.edit({ embeds: [embedAparencia] });
                    }

                }
                )
            }

            if (b.customId == 'statsbot') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o novo status do bot\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Status setado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`statusNB`, ee);

                    }

                })
            }

            if (b.customId == 'namebot') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o novo nome do bot\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Nome setado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await b.client.user.setUsername(message.content);

                        let embedAparencia = new Discord.EmbedBuilder()
.setAuthor({  name: `${client.user.username} | Personalizar`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Nome do BOT`, value: `\`\`\`fix\n${client.user.username}\`\`\``, inline: true },
                                { name: `Prefixo`, value: `\`\`\`fix\n${prefixCurrent}\`\`\``, inline: true },
                                { name: `Cor`, value: `\`\`\`fix\n${colorNB}\`\`\``, inline: true },
                                { name: `Convite público`, value: `${conviteNB}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedAparencia] });

                    }

                })
            }

            if (b.customId == 'avatarbot') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a nova foto do bot em anexo\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Avatar definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        let imagem = new Discord.AttachmentBuilder(`${message.attachments.first().url}`);
                        await b.client.user.setAvatar(imagem.attachment).catch(err => { });

                        let embedAparencia = new Discord.EmbedBuilder()
.setAuthor({  name: `${client.user.username} | Personalizar`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Nome do BOT`, value: `\`\`\`fix\n${client.user.username}\`\`\``, inline: true },
                                { name: `Prefixo`, value: `\`\`\`fix\n${prefixCurrent}\`\`\``, inline: true },
                                { name: `Cor`, value: `\`\`\`fix\n${colorNB}\`\`\``, inline: true },
                                { name: `Convite público`, value: `${conviteNB}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)


                        MESSAGE.edit({ embeds: [embedAparencia] });

                    }

                })
            }

            if (b.customId == 'bannerbot') {
                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o novo banner do bot em anexo\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`);
            
                b.reply({ embeds: [embedCargoWl], ephemeral: true });
            
                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 });
            
                coletor.on("collect", async (message) => {
                    message.delete();
            
                    if (message.content == "cancelar") {
                        coletor.stop('Collector stopped manually');
            
                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`);
            
                        return b.editReply({ embeds: [errado], ephemeral: true });
                    } else {
                        let imageUrl = message.attachments.first().url;
            
                        try {
            
                            let response = await fetch(imageUrl);
                            let arrayBuffer = await response.arrayBuffer();
                            let base64Image = Buffer.from(arrayBuffer).toString('base64');
            
                            await client.rest.patch("/users/@me", {
                                method: 'PATCH',
                                headers: { Authorization: `Bot ${client.token}`, 'Content-Type': 'application/json' },
                                body: {
                                    banner: "data:image/gif;base64," + base64Image
                                }
                            });
            
                            let embedG = new Discord.EmbedBuilder()
                                .setDescription(`Banner definido com sucesso.`)
                                .setColor(`${colorNB}`);
            
                            b.editReply({ embeds: [embedG], ephemeral: true });
            
                            let embedAparencia = new Discord.EmbedBuilder()
                                .setAuthor({ name: `${client.user.username} | Personalizar`, iconURL: client.user.displayAvatarURL() })
                                .addFields(
                                    { name: `Nome do BOT`, value: `\`\`\`fix\n${client.user.username}\`\`\``, inline: true },
                                    { name: `Prefixo`, value: `\`\`\`fix\n${prefixCurrent}\`\`\``, inline: true },
                                    { name: `Cor`, value: `\`\`\`fix\n${colorNB}\`\`\``, inline: true },
                                    { name: `Convite público`, value: `${conviteNB}`, inline: false }
                                )
                                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                                .setColor(`${colorNB}`);
            
                            MESSAGE.edit({ embeds: [embedAparencia] });
            
                        } catch (error) {
                            console.error("Erro ao atualizar o banner do bot:", error);
            
                            let embedErro = new Discord.EmbedBuilder()
                                .setDescription(`Houve um erro ao definir o banner. Tente novamente.`)
                                .setColor(`RED`);
            
                            b.editReply({ embeds: [embedErro], ephemeral: true });
                        }
                    }
                });
            }            

            if (b.customId == 'logsNB') {

                b.deferUpdate();

                let banimentos = await db.get(`logBanNB_${b.guild.id}`);
                let desbanimentos = await db.get(`logUnbanNB_${b.guild.id}`);
                let expulsoes = await db.get(`expulsoesNB_${b.guild.id}`);

                let criarCargos = await db.get(`criarCargosNB_${b.guild.id}`);
                let deletarCargos = await db.get(`deletarCargosNB_${b.guild.id}`);
                let editarCargos = await db.get(`editarCargosNB_${b.guild.id}`);
                let addCargos = await db.get(`AddCargosNB_${b.guild.id}`);
                let removCargos = await db.get(`RemovCargosNB_${b.guild.id}`);

                let criarCanais = await db.get(`criarCanaisNB_${b.guild.id}`);
                let deletarCanais = await db.get(`deletarCanaisNB_${b.guild.id}`);
                let editarCanais = await db.get(`editarCanaisNB_${b.guild.id}`);

                let silenciadosChat = await db.get(`silenciadosChatNB_${b.guild.id}`);
                let silenciadosVoz = await db.get(`silenciadosVozNB_${b.guild.id}`);

                let botsAdd = await db.get(`botsNB_${b.guild.id}`);
                let entrada = await db.get(`entradaNB_${b.guild.id}`);
                let saida = await db.get(`saidaNB_${b.guild.id}`);

                let mensagensApagadas = await db.get(`mensagensApagadasNB_${b.guild.id}`);
                let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${b.guild.id}`);

                let trafegoVoz = await db.get(`trafegovozNB_${b.guild.id}`);
                let protecao = await db.get(`protecaoNB_${b.guild.id}`);

                if (!banimentos) {
                    banimentos = "`Nenhum canal`"
                } else {
                    banimentos = `<#${banimentos}>`
                }

                if (!desbanimentos) {
                    desbanimentos = "`Nenhum canal`"
                } else {
                    desbanimentos = `<#${desbanimentos}>`
                }

                if (!expulsoes) {

                    expulsoes = "`Nenhum canal`"
                } else {
                    expulsoes = `<#${expulsoes}>`
                }

                if (!criarCargos) {

                    criarCargos = "`Nenhum canal`"
                } else {
                    criarCargos = `<#${criarCargos}>`
                }

                if (!deletarCargos) {

                    deletarCargos = "`Nenhum canal`"
                } else {
                    deletarCargos = `<#${deletarCargos}>`
                }

                if (!editarCargos) {

                    editarCargos = "`Nenhum canal`"
                } else {
                    editarCargos = `<#${editarCargos}>`
                }

                if (!addCargos) {

                    addCargos = "`Nenhum canal`"
                } else {
                    addCargos = `<#${addCargos}>`
                }

                if (!removCargos) {

                    removCargos = "`Nenhum canal`"
                } else {
                    removCargos = `<#${removCargos}>`
                }

                if (!criarCanais) {

                    criarCanais = "`Nenhum canal`"
                } else {
                    criarCanais = `<#${criarCanais}>`
                }

                if (!deletarCanais) {

                    deletarCanais = "`Nenhum canal`"
                } else {
                    deletarCanais = `<#${deletarCanais}>`
                }

                if (!editarCanais) {

                    editarCanais = "`Nenhum canal`"
                } else {
                    editarCanais = `<#${editarCanais}>`
                }

                if (!silenciadosChat) {

                    silenciadosChat = "`Nenhum canal`";
                } else {
                    silenciadosChat = `<#${silenciadosChat}>`
                }

                if (!silenciadosVoz) {

                    silenciadosVoz = "`Nenhum canal`"
                } else {
                    silenciadosVoz = `<#${silenciadosVoz}>`
                }

                if (!botsAdd) {

                    botsAdd = "`Nenhum canal`"
                } else {
                    botsAdd = `<#${botsAdd}>`
                }

                if (!entrada) {

                    entrada = "`Nenhum canal`"
                } else {
                    entrada = `<#${entrada}>`
                }

                if (!saida) {

                    saida = "`Nenhum canal`"
                } else {
                    saida = `<#${saida}>`
                }

                if (!mensagensApagadas) {

                    mensagensApagadas = "`Nenhum canal`"
                } else {
                    mensagensApagadas = `<#${mensagensApagadas}>`
                }

                if (!mensagensAtualizadas) {

                    mensagensAtualizadas = "`Nenhum canal`"
                } else {
                    mensagensAtualizadas = `<#${mensagensAtualizadas}>`
                }

                if (!trafegoVoz) {

                    trafegoVoz = "`Nenhum canal`"
                } else {
                    trafegoVoz = `<#${trafegoVoz}>`
                }

                if (!protecao) {

                    protecao = "`Nenhum canal`"
                } else {
                    protecao = `<#${protecao}>`
                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Logs`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                        { name: `${client.xx.atualizados} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
                        { name: `${client.xx.canais} Canais`, value: `> Criar canais » ${criarCanais}\n> Deletar canais » ${deletarCanais}\n> Atualizar canais » ${editarCanais}`, inline: false },
                        { name: `${client.xx.membros} Membros silenciados`, value: `> Silenciados chat » ${silenciadosChat}\n> Silenciados voz » ${silenciadosVoz} `, inline: false },
                        { name: `${client.xx.botsadd} Bots adicionados`, value: `> Bots adicionados » ${botsAdd}`, inline: false },
                        { name: `${client.xx.entrada} Entrada e Saída`, value: `> Entrada de membros » ${entrada}\n> Saída de membros » ${saida}`, inline: false },
                        { name: `${client.xx.mensagens} Mensagens`, value: `> Mensagens apagadas » ${mensagensApagadas}\n> Mensagens atualizadas » ${mensagensAtualizadas}`, inline: false },
                        { name: `${client.xx.trafego} Tráfego de voz`, value: `> Tráfego de voz » ${trafegoVoz}`, inline: false },
                        { name: `${client.xx.protecao} Proteção`, value: `> Proteção » ${protecao}`, inline: false }
                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowLogs = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Banimentos")
                            .setCustomId("banimentosNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Expulsões")
                            .setCustomId("expulsoesNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Cargos")
                            .setCustomId("cargosNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Canais")
                            .setCustomId("canaisNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Membros Silenciados")
                            .setCustomId("silenciadosNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowLogs2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Bots Adicionados")
                            .setCustomId("botsNBB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Entrada de membros")
                            .setCustomId("entradaNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Saída de membros")
                            .setCustomId("saidaNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowLogs3 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Mensagens")
                            .setCustomId("mensagensNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Tráfego de voz")
                            .setCustomId("trafegovozNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Proteção")
                            .setCustomId("protecaoNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                           /* new Discord.ButtonBuilder()
                            .setLabel("Gerar canais automaticamente")
                            .setCustomId("gerar_logsNB")
                            .setStyle(Discord.ButtonStyle.Success)*/)

                const rowBackLogs = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowLogs, rowLogs2, rowLogs3, rowBackLogs] });
            }
            if (b.customId == 'antiraidNB') {

                b.deferUpdate();

                let limiteExclusaoNB = await db.get(`limiteExclusaoNB_${b.guild.id}`);
                if (!limiteExclusaoNB) limiteExclusaoNB = 'Não foi definido.'
                let limiteExpulsaoNB = await db.get(`limiteExpulsaoNB_${b.guild.id}`);
                if (!limiteExpulsaoNB) limiteExpulsaoNB = 'Não foi definido.'
                let limiteBanimentoNB = await db.get(`limiteBanimentoNB_${b.guild.id}`);
                if (!limiteBanimentoNB) limiteBanimentoNB = 'Não foi definido.'

                let status = await db.get(`statusAntiraid_${b.guild.id}`);

                let emojiStatusRaid;
                let emojiStatusRaidEmbed;

                if (status === true) {

                    emojiStatusRaid = `1119444704178745464`;
                    emojiStatusRaidEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojiStatusRaid = `1119452618394177626`;
                    emojiStatusRaidEmbed = `> ${client.xx.desativado} Desativado`;
                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Anti Raid`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Limite de exclusão`, value: `\`\`\`diff\n- ${limiteExclusaoNB}\`\`\``, inline: true },
                        { name: `Limite de expulsão`, value: `\`\`\`diff\n- ${limiteExpulsaoNB}\`\`\``, inline: true },
                        { name: `Limite de banimento`, value: `\`\`\`diff\n- ${limiteBanimentoNB}\`\`\``, inline: true },
                        { name: `Status`, value: `${emojiStatusRaidEmbed}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowRaid = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir limites")
                            .setCustomId("limitesRaidNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusRaid}`)
                            .setCustomId("statusRaidNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAntiRaid = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowRaid, rowBackAntiRaid] });
            }

            if (b.customId == 'statusRaidNB') { // aq

                b.deferUpdate()

                let limiteExclusaoNB = await db.get(`limiteExclusaoNB_${b.guild.id}`);
                if (!limiteExclusaoNB) limiteExclusaoNB = 'Não foi definido.'
                let limiteExpulsaoNB = await db.get(`limiteExpulsaoNB_${b.guild.id}`);
                if (!limiteExpulsaoNB) limiteExpulsaoNB = 'Não foi definido.'
                let limiteBanimentoNB = await db.get(`limiteBanimentoNB_${b.guild.id}`);
                if (!limiteBanimentoNB) limiteBanimentoNB = 'Não foi definido.'

                let statusAntiraid = await db.get(`statusAntiraid_${b.guild.id}`);

                let emojiStatusAntiraid;
                let emojiStatusRaidEmbed;

                if (statusAntiraid === true) {

                    emojiStatusAntiraid = `1119452618394177626`;
                    emojiStatusRaidEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusAntiraid_${b.guild.id}`, false);

                } else {

                    emojiStatusAntiraid = `1119444704178745464`;
                    emojiStatusRaidEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusAntiraid_${b.guild.id}`, true);
                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Anti Raid`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Limite de exclusão`, value: `\`\`\`diff\n- ${limiteExclusaoNB}\`\`\``, inline: true },
                        { name: `Limite de expulsão`, value: `\`\`\`diff\n- ${limiteExpulsaoNB}\`\`\``, inline: true },
                        { name: `Limite de banimento`, value: `\`\`\`diff\n- ${limiteBanimentoNB}\`\`\``, inline: true },
                        { name: `Status`, value: `${emojiStatusRaidEmbed}`, inline: false }


                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowRaid = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir limites")
                            .setCustomId("limitesRaidNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusAntiraid}`)
                            .setCustomId("statusRaidNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAntiRaid = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowRaid, rowBackAntiRaid] })

            }

            if (b.customId == 'antifakeNB') {

                b.deferUpdate();

                let limiteAntifake = await db.get(`limiteAntifakeNB_${b.guild.id}`);
                if (!limiteAntifake) limiteAntifake = 'Não foi definido.'

                let statusAntifake = await db.get(`statusAntifakeNB_${b.guild.id}`);

                let emojiStatusAntifake;
                let emojiStatusAntifakeEmbed;

                if (statusAntifake === true) {

                    emojiStatusAntifake = `1119444704178745464`;
                    emojiStatusAntifakeEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojiStatusAntifake = `1119452618394177626`;
                    emojiStatusAntifakeEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Anti Fake`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Limite de criação de conta`, value: `\`\`\`diff\n- ${limiteAntifake}\`\`\``, inline: true },
                        { name: `Status`, value: `${emojiStatusAntifakeEmbed}`, inline: false }

                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAntifake = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir limite")
                            .setCustomId("limitesAntifake")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusAntifake}`)
                            .setCustomId("statusAntifakeNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAntifake = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowAntifake, rowBackAntifake] });

            }

            if (b.customId == 'statusAntifakeNB') {

                b.deferUpdate()

                let limiteAntifake = await db.get(`limiteAntifakeNB_${b.guild.id}`);
                if (!limiteAntifake) limiteAntifake = 'Não foi definido.'

                let statusAntifake = await db.get(`statusAntifakeNB_${b.guild.id}`);

                let emojiStatusAntifake;
                let emojiStatusAntifakeEmbed;

                if (statusAntifake === true) {

                    emojiStatusAntifake = `1119452618394177626`;
                    emojiStatusAntifakeEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusAntifakeNB_${b.guild.id}`, false);

                } else {

                    emojiStatusAntifake = `1119444704178745464`;
                    emojiStatusAntifakeEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusAntifakeNB_${b.guild.id}`, true);
                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Anti Fake`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Limite de criação de conta`, value: `\`\`\`diff\n- ${limiteAntifake}\`\`\``, inline: true },
                        { name: `Status`, value: `${emojiStatusAntifakeEmbed}`, inline: false }

                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAntifake = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir limite")
                            .setCustomId("limitesAntifake")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusAntifake}`)
                            .setCustomId("statusAntifakeNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAntifake = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowAntifake, rowBackAntifake] })

            }

            if (b.customId == 'limitesAntifake') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o limite mínimo de dias\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    if (isNaN(dias)) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor envie apenas números`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Limite setado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`limiteAntifakeNB_${b.guild.id}`, ee);

                        let statusAntifake = await db.get(`statusAntifakeNB_${b.guild.id}`);

                        let emojiStatusAntifakeEmbed;

                        if (statusAntifake === true) {

                            emojiStatusAntifakeEmbed = `> <:stats:1265363896038850621> Ativado`;

                        } else {

                            emojiStatusAntifakeEmbed = `> ${client.xx.desativado} Desativado`;

                        }

                        let embed = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Anti Fake`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Limite de criação de conta`, value: `\`\`\`diff\n- ${ee}\`\`\``, inline: true },
                                { name: `Status`, value: `${emojiStatusAntifakeEmbed}`, inline: false }

                            )

                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embed] });

                    }
                })

            }

            if (b.customId == 'antibotNB') {

                b.deferUpdate();

                let statusEmbed = await db.get(`statusAntibotNB_${b.guild.id}`);

                let emojiStatusAntibot;
                let emojiStatusAntibotEmbed;

                if (statusEmbed === true) {

                    emojiStatusAntibot = `1119444704178745464`;
                    emojiStatusAntibotEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojiStatusAntibot = `1119452618394177626`;
                    emojiStatusAntibotEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Anti Bot`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Status`, value: `${emojiStatusAntibotEmbed}`, inline: false }

                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAntibot = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusAntibot}`)
                            .setCustomId("statusAntibot")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAntibot = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowAntibot, rowBackAntibot] })

            }

            if (b.customId == 'statusAntibot') {

                b.deferUpdate()

                let statusAntibot = await db.get(`statusAntibotNB_${b.guild.id}`);

                let emojiStatusAntibot;
                let emojiStatusAntibotEmbed;

                if (statusAntibot === true) {

                    emojiStatusAntibot = `1119452618394177626`;
                    emojiStatusAntibotEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusAntibotNB_${b.guild.id}`, false);

                } else {

                    emojiStatusAntibot = `1119444704178745464`;
                    emojiStatusAntibotEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusAntibotNB_${b.guild.id}`, true);
                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Anti Bot`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Status`, value: `${emojiStatusAntibotEmbed}`, inline: false }

                    )

    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAntibot = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusAntibot}`)
                            .setCustomId("statusAntibot")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAntibot = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowAntibot, rowBackAntibot] })

            }

            if (b.customId == 'antilinkNB') {

                b.deferUpdate();

                let statusEmbed = await db.get(`statusAntilinkNB_${b.guild.id}`);

                let emojiStatusAntilink;
                let emojiStatusAntilinkEmbed;

                if (statusEmbed === true) {

                    emojiStatusAntilink = `1119444704178745464`;
                    emojiStatusAntilinkEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojiStatusAntilink = `1119452618394177626`;
                    emojiStatusAntilinkEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Anti Link`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Status`, value: `${emojiStatusAntilinkEmbed}`, inline: false }

                    )

                 
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAnticargo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusAntilink}`)
                            .setCustomId("statusAntilink")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAnti = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowAnticargo, rowBackAnti] })

            }

            if (b.customId == 'statusAntilink') {

                b.deferUpdate()

                let statusAntiLink = await db.get(`statusAntilinkNB_${b.guild.id}`);

                let emojiStatusAntilink;
                let emojiStatusAntilinkEmbed;

                if (statusAntiLink === true) {

                    emojiStatusAntilink = `1119452618394177626`;
                    emojiStatusAntilinkEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusAntilinkNB_${b.guild.id}`, false);

                } else {

                    emojiStatusAntilink = `1119444704178745464`;
                    emojiStatusAntilinkEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusAntilinkNB_${b.guild.id}`, true);
                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Anti Raid`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Status`, value: `${emojiStatusAntilinkEmbed}`, inline: false }

                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAntilink = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusAntilink}`)
                            .setCustomId("statusAntilink")
                            .setStyle(Discord.ButtonStyle.Secondary))


                const rowBackAntilink = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowAntilink, rowBackAntilink] })

            }

            if (b.customId == 'voltarServidor') {

                b.deferUpdate()

                let embed = new Discord.EmbedBuilder()
                    .setAuthor(
                        { name: `${client.user.username} | Configurações`, iconURL: client.user.displayAvatarURL({ dynamic: true }) }
                    )
                    .addFields(
                        { name: `<:menu:1327398586333266144> Configurações`, value: `> Auto Cargos\n> Bem vindo\n> Contador\n> Auto reações\n> Membro Ativo\n> Bots\n> Tempocall\n> Call Temporária\n> Booster`, inline: true }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowServidor = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Auto cargos")
                            .setCustomId("autocargosNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Bem vindo")
                            .setCustomId("bemvindoNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Contador")
                            .setCustomId("contadorNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Auto reações")
                            .setCustomId("autoReacoesNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Membro ativo")
                            .setCustomId("membroativoNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowServidor2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Bots")
                            .setCustomId("botsNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Tempocall")
                            .setCustomId("tempocallNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Call temporária")
                            .setCustomId("callTempmenu")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Booster")
                            .setCustomId("boosterNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackServ = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowServidor, rowServidor2, rowBackServ] })
            }

            if (b.customId == 'autocargosNB') {

                b.deferUpdate();

                let embedAuto = new Discord.EmbedBuilder()
                    .setAuthor(
                        { name: client.user.username + ' | Auto cargos', iconURL: client.user.avatarURL({ dynamic: true }) }
                    )
                    .addFields(
                        { name: `<:menu:1327398586333266144> Configurações`, value: `> Auto cargo\n> Auto cargo por badge`, inline: true }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Auto cargo")
                            .setCustomId("autocargoNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Auto cargo por badge")
                            .setCustomId("autocargoBadgeNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedAuto], components: [rowAuto, rowBackAuto] });

            }

            if (b.customId == 'autocargoNB') {

                b.deferUpdate();

                let statusAutoCargo = await db.get(`statusautoCargoNB_${b.guild.id}`);

                let emojiStatusautoCargoNB;
                let emojiStatusautoCargoNBEmbed;

                if (statusAutoCargo === true) {

                    emojiStatusautoCargoNB = `1119444704178745464`;
                    emojiStatusautoCargoNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojiStatusautoCargoNB = `1119452618394177626`;
                    emojiStatusautoCargoNBEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let cargo = await db.get(`cargoAutoNB_${b.guild.id}`);

                if (!cargo) {

                    cargo = `\`Não foi definido.\``

                } else {

                    cargo = `<@&${cargo}>`
                }

                let embedCargo = new Discord.EmbedBuilder()
                    .setAuthor(
                        { name: client.user.username + ' | Auto cargos', iconURL: client.user.avatarURL({ dynamic: true }) }
                    )
                    .addFields(

                        { name: `Cargo automático`, value: `${cargo}`, inline: false },
                        { name: `Status`, value: `${emojiStatusautoCargoNBEmbed}`, inline: false }

                    )

                   
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowCargo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir cargo automático")
                            .setCustomId("addautocargoNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusautoCargoNB}`)
                            .setCustomId("statusAutoCargoNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedCargo], components: [rowCargo, rowBackAuto] });

            }

            if (b.customId == 'bemvindoNB') {

                b.deferUpdate();

                let statusEmbed = await db.get(`statusBvNB_${b.guild.id}`);

                let emojiStatusNB;
                let emojiStatusNBEmbed;

                if (statusEmbed === true) {
                    emojiStatusNB = `1119444704178745464`;
                    emojiStatusNBEmbed = `> Ativado`;
                } else {
                    emojiStatusNB = `1119452618394177626`;
                    emojiStatusNBEmbed = `> Desativado`;
                }

                let msgBv = await db.get(`msgBvNB_${b.guild.id}`);

                if (!msgBv) {

                    msgBv = ` | Mensagem não definida`

                } else {

                    const alterado = msgBv
                        .replaceAll("@member", `${message.author}`)
                        .replaceAll("@server", message.guild.name)
                        .replaceAll("@username", message.author.username)
                        .replaceAll("@id", message.author.id)

                    msgBv = `\`\`\`fix\n${alterado}\`\`\``
                }

                let canalBv = await db.get(`canalBvNB_${b.guild.id}`);

                if (!canalBv) {

                    canalBv = `\`Não foi definido.\``

                } else {

                    canalBv = `<#${canalBv}>`
                }

                let embedBemvindo = new Discord.EmbedBuilder()
                    .setAuthor(
                        { name: client.user.username + ' | Bem Vindo', iconURL: client.user.avatarURL({ dynamic: true }) }
                    )
                    .addFields(
                        { name: `Canal de boas vindas`, value: `${canalBv}`, inline: false },
                        { name: `Mensagem de boas vindas`, value: `${msgBv}`, inline: true },
                        { name: `Status`, value: `${emojiStatusNBEmbed}`, inline: false }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowBemvindo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir mensagem de boas vindas")
                            .setCustomId("mensagemBvNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal de boas vindas")
                            .setCustomId("canalBvNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Pré-visualizar")
                            .setCustomId("previewBvNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusNB}`)
                            .setCustomId("statusBvNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedBemvindo], components: [rowBemvindo, rowBackAuto] });

            }

            if (b.customId == 'mensagemBvNB') {

                let embedCanalReg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a mensagem de boas vindas desejada\nPara cancelar a operação digite: \`cancelar\`\n`)
                    .setColor(`${colorNB}`)
                    .addFields(
                        {name: 'Variável', value: ':small_blue_diamond: \`@member\` - **mencionar usuário.**\n:small_blue_diamond: \`@server\` - **nome do servidor.**\n:small_blue_diamond: \`@username\` - **nome de usuário.**\n:small_blue_diamond: \`@id\` - **id do usuário.**'}
                    )

                b.reply({ embeds: [embedCanalReg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Mensagem definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`msgBvNB_${b.guild.id}`, ee);

                        let statusEmbed = await db.get(`statusBvNB_${b.guild.id}`);

                        let emojiStatusNBEmbed;

                        if (statusEmbed === true) {

                            emojiStatusNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                        } else {

                            emojiStatusNBEmbed = `> ${client.xx.desativado} Desativado`;

                        }

                        let msgBv = await db.get(`msgBvNB_${b.guild.id}`);

                        if (!msgBv) {

                            msgBv = `\`\`\`fix\n@member Mencionar o membro\n@username Exibir o nome do membro\n@server Exibir o nome do server\`\`\``

                        } else {

                            const alterado = msgBv
                                .replaceAll("@member", `${message.author}`)
                                .replaceAll("@server", message.guild.name)
                                .replaceAll("@username", message.author.username)
                                .replaceAll("@id", message.author.id)

                            msgBv = `\`\`\`fix\n${alterado}\`\`\``
                        }

                        let canalBv = await db.get(`canalBvNB_${b.guild.id}`);

                        if (!canalBv) {

                            canalBv = `\`Não foi definido.\``

                        } else {

                            canalBv = `<#${canalBv}>`
                        }

                        let embedBemvindo = new Discord.EmbedBuilder()
                            .setAuthor(
                                { name: client.user.username + ' | Auto cargos', iconURL: client.user.avatarURL({ dynamic: true }) }
                            )
                            .addFields(

                                { name: `Canal de boas vindas`, value: `${canalBv}`, inline: false },
                                { name: `Mensagem de boas vindas`, value: `${msgBv}`, inline: true },
                                { name: `Status`, value: `${emojiStatusNBEmbed}`, inline: false }

                            )

                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedBemvindo] });
                    }

                })

            }

            if (b.customId == 'canalBvNB') {

                let embedCanalReg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (#canal/id) do canal desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCanalReg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let canal = b.guild.channels.cache.get(ee.id);

                    if (!canal) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Canal adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`canalBvNB_${b.guild.id}`, canal.id);

                        let statusEmbed = await db.get(`statusBvNB_${b.guild.id}`);

                        let emojiStatusNBEmbed;

                        if (statusEmbed === true) {

                            emojiStatusNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                        } else {

                            emojiStatusNBEmbed = `> ${client.xx.desativado} Desativado`;

                        }

                        let msgBv = await db.get(`msgBvNB_${b.guild.id}`);

                        if (!msgBv) {

                            msgBv = `\`\`\`fix\n@member Mencionar o membro\n@username Exibir o nome do membro\n@server Exibir o nome do server\`\`\``

                        } else {

                            const alterado = msgBv
                                .replaceAll("@member", `${message.author}`)
                                .replaceAll("@server", message.guild.name)
                                .replaceAll("@username", message.author.username)

                            msgBv = `\`\`\`fix\n${alterado}\`\`\``
                        }

                        let canalBv = await db.get(`canalBvNB_${b.guild.id}`);

                        if (!canalBv) {

                            canalBv = `\`Não foi definido.\``

                        } else {

                            canalBv = `<#${canalBv}>`
                        }

                        let embedBemvindo = new Discord.EmbedBuilder()
                            .setAuthor(
                                { name: client.user.username + ' | Auto cargos', iconURL: client.user.avatarURL({ dynamic: true }) }
                            )
                            .addFields(

                                { name: `Canal de boas vindas`, value: `${canalBv}`, inline: false },
                                { name: `Mensagem de boas vindas`, value: `${msgBv}`, inline: true },
                                { name: `Status`, value: `${emojiStatusNBEmbed}`, inline: false }

                            )


                    
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedBemvindo] })

                    }
                })
            }

            if (b.customId == 'previewBvNB') {

                let msgBv = await db.get(`msgBvNB_${b.guild.id}`);

                let embed = new Discord.EmbedBuilder()
                    .setDescription(`Por favor defina a \`mensagem\` de boas vindas primeiro`)
                    .setColor(`${colorNB}`)

                if (!msgBv) return b.reply({ embeds: [embed], ephemeral: true })

                const alterado = msgBv
                    .replaceAll("@member", `${message.author}`)
                    .replaceAll("@server", message.guild.name)
                    .replaceAll("@username", message.author.username)

                let embedBemvindo = new Discord.EmbedBuilder()
                    .setDescription(`${alterado}`)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedBemvindo], ephemeral: true })

            }

            if (b.customId == 'statusBvNB') {

                b.deferUpdate();

                let status = await db.get(`statusBvNB_${b.guild.id}`);

                let emojiStatusBv;
                let emojiStatusBvEmbed;

                if (status === true) {

                    emojiStatusBv = `1119452618394177626`;
                    emojiStatusBvEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusBvNB_${b.guild.id}`, false);

                } else {

                    emojiStatusBv = `1119444704178745464`;
                    emojiStatusBvEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusBvNB_${b.guild.id}`, true);
                }

                let msgBv = await db.get(`msgBvNB_${b.guild.id}`);

                if (!msgBv) {

                    msgBv = `\`\`\`fix\n@member Mencionar o membro\n@username Exibir o nome do membro\n@server Exibir o nome do server\`\`\``

                } else {

                    const alterado = msgBv
                        .replaceAll("@member", `${message.author}`)
                        .replaceAll("@server", message.guild.name)
                        .replaceAll("@username", message.author.username)

                    msgBv = `\`\`\`fix\n${alterado}\`\`\``
                }

                let msgApagarBv = await db.get(`msgApagarBvNB_${b.guild.id}`);

                if (!msgApagarBv) {

                    msgApagarBv = `\`Não foi definido.\``

                } else {

                    msgApagarBv = `\`${msgApagarBv} segundos\``
                }

                let canalBv = await db.get(`canalBvNB_${b.guild.id}`);

                if (!canalBv) {

                    canalBv = `\`Não foi definido.\``

                } else {

                    canalBv = `<#${canalBv}>`
                }

                let embedBemvindo = new Discord.EmbedBuilder()
                    .setAuthor(
                        { name: client.user.username + ' | Auto cargos', iconURL: client.user.avatarURL({ dynamic: true }) }
                    )
                    .addFields(

                        { name: `Canal de boas vindas`, value: `${canalBv}`, inline: false },
                        { name: `Mensagem de boas vindas`, value: `${msgBv}`, inline: true },
                        { name: `Status`, value: `${emojiStatusBvEmbed}`, inline: false }

                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                MESSAGE.edit({ embeds: [embedBemvindo] })

                const rowBemvindo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir mensagem de boas vindas")
                            .setCustomId("mensagemBvNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal de boas vindas")
                            .setCustomId("canalBvNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Pré-visualizar")
                            .setCustomId("previewBvNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusBv}`)
                            .setCustomId("statusBvNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedBemvindo], components: [rowBemvindo, rowBackAuto] });

            }

            if (b.customId == 'addautocargoNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargoAutoNB_${b.guild.id}`, cargo.id);

                        let statusAutoCargo = await db.get(`statusautoCargoNB_${b.guild.id}`);

                        let emojiStatusautoCargoNBEmbed;

                        if (statusAutoCargo === true) {

                            emojiStatusautoCargoNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                        } else {

                            emojiStatusautoCargoNBEmbed = `> ${client.xx.desativado} Desativado`;

                        }

                        let cargoAuto = await db.get(`cargoAutoNB_${b.guild.id}`);

                        if (!cargoAuto) {

                            cargoAuto = `\`Não foi definido.\``

                        } else {

                            cargoAuto = `<@&${cargoAuto}>`
                        }

                        let embedCargo = new Discord.EmbedBuilder()
                            .setAuthor(
                                { name: client.user.username + ' | Auto cargos', iconURL: client.user.avatarURL({ dynamic: true }) }
                            )
                            .addFields(

                                { name: `Cargo automático`, value: `${cargoAuto}`, inline: false },
                                { name: `Status`, value: `${emojiStatusautoCargoNBEmbed}`, inline: false }

                            )

           
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedCargo] });
                    }

                })
            }

            if (b.customId == 'statusAutoCargoNB') { // aq

                b.deferUpdate()

                let statusAutoCargo = await db.get(`statusautoCargoNB_${b.guild.id}`);

                let emojiStatusautoCargoNB;
                let emojiStatusautoCargoNBEmbed;

                if (statusAutoCargo === true) {

                    emojiStatusautoCargoNB = `1119452618394177626`;
                    emojiStatusautoCargoNBEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusautoCargoNB_${b.guild.id}`, false);

                } else {

                    emojiStatusautoCargoNB = `1119444704178745464`;
                    emojiStatusautoCargoNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusautoCargoNB_${b.guild.id}`, true);
                }

                let cargoAuto = await db.get(`cargoAutoNB_${b.guild.id}`);

                if (!cargoAuto) {

                    cargoAuto = `\`Não foi definido.\``

                } else {

                    cargoAuto = `<@&${cargoAuto}>`
                }

                let embedCargo = new Discord.EmbedBuilder()
                    .setAuthor(
                        { name: client.user.username + ' | Auto cargos', iconURL: client.user.avatarURL({ dynamic: true }) }
                    )
                    .addFields(

                        { name: `Cargo automático`, value: `${cargoAuto}`, inline: false },
                        { name: `Status`, value: `${emojiStatusautoCargoNBEmbed}`, inline: false }

                    )


                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowCargo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir cargo automático")
                            .setCustomId("addautocargoNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusautoCargoNB}`)
                            .setCustomId("statusAutoCargoNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedCargo], components: [rowCargo, rowBackAuto] });

            }

            if (b.customId == 'autocargoBadgeNB') { // aq

                b.deferUpdate()

                let statusAutoCargoBadge = await db.get(`statusautoCargoBadgeNB_${b.guild.id}`);

                let emojiStatusautoCargoBadgeNB;
                let emojiStatusautoCargoBadgeNBEmbed;

                if (statusAutoCargoBadge === true) {

                    emojiStatusautoCargoBadgeNB = `1119444704178745464`;
                    emojiStatusautoCargoBadgeNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojiStatusautoCargoBadgeNB = `1119452618394177626`;
                    emojiStatusautoCargoBadgeNBEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let pig = await db.get(`pigCargoBadgeNB_${b.guild.id}`);
                let dev = await db.get(`devCargoBadgeNB_${b.guild.id}`);
                let hype = await db.get(`hypeCargoBadgeNB_${b.guild.id}`);
                let active = await db.get(`activeCargoBadgeNB_${b.guild.id}`);

                if (!pig) {

                    pig = `\`Não foi definido.\``

                } else {

                    pig = `<@&${pig}>`
                }

                if (!dev) {

                    dev = `\`Não foi definido.\``

                } else {

                    dev = `<@&${dev}>`
                }

                if (!hype) {

                    hype = `\`Não foi definido.\``

                } else {

                    hype = `<@&${hype}>`
                }

                if (!active) {

                    active = `\`Não foi definido.\``

                } else {

                    active = `<@&${active}>`
                }

                let embedCargos = new Discord.EmbedBuilder()
                    .setAuthor({
                        name: `${client.user.username} | Auto cargo por badge`,
                        iconURL: client.user.avatarURL({ dynamic: true })
                    })
                    .addFields(

                        { name: `<:pigbadge:1327398572311842888> Early Supporter`, value: `${pig}`, inline: false },
                        { name: `<:BotDev:1327398579450548245> Early Verified Bot Developer`, value: `${dev}`, inline: false },
                        { name: `<:HypeSquad:1327398576208478371> HypeSquad Events`, value: `${hype}`, inline: false },
                        { name: `<:activedev:1265705146042683453> Active Developer`, value: `${active}`, inline: false },
                        { name: `Status`, value: `${emojiStatusautoCargoBadgeNBEmbed}`, inline: false }

                    )


                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowCargos = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1061308244787728434')
                            .setCustomId("autoCargosBadgeNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusautoCargoBadgeNB}`)
                            .setCustomId("statusAutoCargoBadgeNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedCargos], components: [rowCargos, rowBackAuto] });

            }

            if (b.customId == 'statusAutoCargoBadgeNB') { // aq

                b.deferUpdate()

                let statusAutoCargoBadge = await db.get(`statusautoCargoBadgeNB_${b.guild.id}`);

                let emojiStatusautoCargoBadgeNB;
                let emojiStatusautoCargoBadgeNBEmbed;

                if (statusAutoCargoBadge === true) {

                    emojiStatusautoCargoBadgeNB = `1119452618394177626`;
                    emojiStatusautoCargoBadgeNBEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusautoCargoBadgeNB_${b.guild.id}`, false);

                } else {

                    emojiStatusautoCargoBadgeNB = `1119444704178745464`;
                    emojiStatusautoCargoBadgeNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusautoCargoBadgeNB_${b.guild.id}`, true);
                }

                let pig = await db.get(`pigCargoBadgeNB_${b.guild.id}`);
                let dev = await db.get(`devCargoBadgeNB_${b.guild.id}`);
                let hype = await db.get(`hypeCargoBadgeNB_${b.guild.id}`);
                let active = await db.get(`activeCargoBadgeNB_${b.guild.id}`);

                if (!pig) {

                    pig = `\`Não foi definido.\``

                } else {

                    pig = `<@&${pig}>`
                }

                if (!dev) {

                    dev = `\`Não foi definido.\``

                } else {

                    dev = `<@&${dev}>`
                }

                if (!hype) {

                    hype = `\`Não foi definido.\``

                } else {

                    hype = `<@&${hype}>`
                }

                if (!active) {

                    active = `\`Não foi definido.\``

                } else {

                    active = `<@&${active}>`
                }

                let embedCargos = new Discord.EmbedBuilder()
                    .setAuthor({
                        name: `${client.user.username} | Auto cargo por badge`,
                        iconURL: client.user.avatarURL({ dynamic: true })
                    })
                    .addFields(

                        { name: `<:pigbadge:1327398572311842888>  Early Supporter`, value: `${pig}`, inline: false },
                        { name: `<:BotDev:1327398579450548245> Early Verified Bot Developer`, value: `${dev}`, inline: false },
                        { name: `<:HypeSquad:1327398576208478371> HypeSquad Events`, value: `${hype}`, inline: false },
                        { name: `<:activedev:1265705146042683453> Active Developer`, value: `${active}`, inline: false },
                        { name: `Status`, value: `${emojiStatusautoCargoBadgeNBEmbed}`, inline: false }

                    )

      
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowCargos = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1061308244787728434')
                            .setCustomId("autoCargosBadgeNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusautoCargoBadgeNB}`)
                            .setCustomId("statusAutoCargoBadgeNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedCargos], components: [rowCargos, rowBackAuto] });
            }

            if (b.customId == 'contadorNB') {

                b.deferUpdate();

                let canalContador = await db.get(`canalContadorMembrosCallNB_${b.guild.id}`);

                if (!canalContador) {
                    canalContador = `\`Não foi definido.\``
                } else {
                    canalContador = `<#${canalContador}>`
                }

                let embedContador = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${client.user.username} | Contador`, iconURL: client.user.avatarURL({ size: 4096 }) })
                    .addFields(
                        { name: `Canal`, value: `${canalContador}`, inline: false }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowContador = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal do contador")
                            .setCustomId("canalContadorMembrosCallNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackContador = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedContador], components: [rowContador, rowBackContador] });

            }

            if (b.customId == 'membroativoNB') { 

                b.deferUpdate();

                let msgsMembroA = await db.get(`msgsMembroAtivoNB_${b.guild.id}`);

                if (!msgsMembroA) {

                    msgsMembroA = `\`Não foi definido.\``

                } else {

                    msgsMembroA = `\`${msgsMembroA}\``
                }

                let recompensaMembroA = await db.get(`cargoMembroAtivoNB_${b.guild.id}`);

                if (!recompensaMembroA) {

                    recompensaMembroA = `\`Não foi definido.\``

                } else {

                    recompensaMembroA = `<@&${recompensaMembroA}>`
                }

                let embedMembroA = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${client.user.username} | Membro ativo`, iconURL: client.user.displayAvatarURL() }
                    )
                    .addFields(
                        { name: `Número de mensagens`, value: `${msgsMembroA}`, inline: false },
                        { name: `Cargo de recompensa`, value: `${recompensaMembroA}`, inline: false }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowMembroA = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar membro ativo")
                            .setCustomId("cfgmembroativoNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackContador = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedMembroA], components: [rowMembroA, rowBackContador] });

            }

            if (b.customId == 'botsNB') { 

                b.deferUpdate();

                let cargoBot = await db.get(`cargobotNB_${b.guild.id}`);

                if (!cargoBot) {
                    cargoBot = `\`Não foi definido.\``
                } else {
                    cargoBot = `<@&${cargoBot}>`
                }

                let embedMembroA = new Discord.EmbedBuilder()
                    .setAuthor(
                    { name: `${client.user.username} | Bots`, iconURL: client.user.displayAvatar
                    }
                    )
                    .addFields(
                        { name: `Cargo dos Bots`, value: `${cargoBot}`, inline: false },
                        {
                          name: 'Explicativo',
                          value: `Quando o sistema estiver configurado, use \`${prefixCurrent}bots\` para exibir a lista de bots do servidor, indicando se estão disponíveis ou não.`
                        }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowMembroA = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir cargo dos Bots")
                            .setCustomId("cargobotNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackContador = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedMembroA], components: [rowMembroA, rowBackContador] });


            }

            if (b.customId == 'cargobotNB') {

                let embedBot = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedBot], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargobotNB_${b.guild.id}`, cargo.id);

                        let embedMembroA = new Discord.EmbedBuilder()
                            .setAuthor(
                               { name: `${client.user.username} | Bots`, iconURL: client.user.displayAvatar }
                            )
                            .addFields(
                               { name: `Cargo dos Bots`, value: `${cargoBot}`, inline: false },
                               {
                                 name: 'Explicativo',
                                 value: `Quando o sistema estiver configurado, use \`${prefixCurrent}bots\` para exibir a lista de bots do servidor, indicando se estão disponíveis ou não.`
                               }
                            )
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        const rowMembroA = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setLabel("Definir cargo dos Bots")
                                        .setCustomId("cargobotNB")
                                    .setStyle(Discord.ButtonStyle.Secondary))

                        const rowBackContador = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setEmoji('1120039338923794432')
                                    .setCustomId("voltarServidor")
                                    .setStyle(Discord.ButtonStyle.Danger))

                        await MESSAGE.edit({ embeds: [embedMembroA], components: [rowMembroA, rowBackContador] });
                    }
                })

            }

            if (b.customId == 'voltarWl') {

                b.deferUpdate()

                let canalWl = await db.get(`canalWlNB_${b.guild.id}`);
                let canalfichasWl = await db.get(`canalfichasWlNB_${b.guild.id}`);
                let canallogsWl = await db.get(`canallogsWlNB_${b.guild.id}`);

                if (!canalWl) {

                    canalWl = `\`Não foi definido.\``

                } else {

                    canalWl = `<#${canalWl}>`
                }

                if (!canalfichasWl) {

                    canalfichasWl = `\`Não foi definido.\``

                } else {

                    canalfichasWl = `<#${canalfichasWl}>`
                }

                if (!canallogsWl) {

                    canallogsWl = `\`Não foi definido.\``

                } else {

                    canallogsWl = `<#${canallogsWl}>`
                }

                let aprovadoWl = await db.get(`aprovadoWlNB_${b.guild.id}`);

                if (!aprovadoWl) {

                    aprovadoWl = `\`Não foi definido.\``

                } else {

                    aprovadoWl = `<@&${aprovadoWl}>`
                }

                let cargosWl = await db.get(`cargosWl_${b.guild.id}.cargosWl`);

                if (!cargosWl || cargosWl.length == 0) {

                    cargosWl = `\`Nenhum\``;

                } else {

                    cargosWl = cargosWl.map(c => `<@&${c}>`).join('\n');

                }

                let embedWl = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${client.user.username} | Whitelist`, iconURL: client.user.displayAvatarURL() })
                    .addFields(
                        { name: `Canal da whitelist`, value: `${canalWl}`, inline: false },
                        { name: `Canal de fichas`, value: `${canalfichasWl}`, inline: false },
                        { name: `Canal dos logs`, value: `${canallogsWl}`, inline: false },
                        { name: `Cargo aprovado`, value: `${aprovadoWl}`, inline: false },
                        { name: `Cargos responsáveis`, value: `${cargosWl}`, inline: true },
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais da wl")
                            .setCustomId("canaisWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir cargo aprovado")
                            .setCustomId("cargoaprovadoWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed da wl")
                            .setCustomId("embedWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedWl], components: [rowWl, rowBackWl] })

            }

            if (b.customId == 'whitelistNBB') {

                b.deferUpdate()

                let canalWl = await db.get(`canalWlNB_${b.guild.id}`);
                let canalfichasWl = await db.get(`canalfichasWlNB_${b.guild.id}`);
                let canallogsWl = await db.get(`canallogsWlNB_${b.guild.id}`);

                if (!canalWl) {
                    canalWl = `\`Não foi definido.\``
                } else {
                    canalWl = `<#${canalWl}>`
                }

                if (!canalfichasWl) {

                    canalfichasWl = `\`Não foi definido.\``

                } else {

                    canalfichasWl = `<#${canalfichasWl}>`
                }

                if (!canallogsWl) {

                    canallogsWl = `\`Não foi definido.\``

                } else {

                    canallogsWl = `<#${canallogsWl}>`
                }

                let aprovadoWl = await db.get(`aprovadoWlNB_${b.guild.id}`);

                if (!aprovadoWl) {

                    aprovadoWl = `\`Não foi definido.\``

                } else {

                    aprovadoWl = `<@&${aprovadoWl}>`
                }

                let cargosWl = await db.get(`cargosWl_${b.guild.id}.cargosWl`);

                if (!cargosWl || cargosWl.length == 0) {

                    cargosWl = `\`Nenhum\``;

                } else {

                    cargosWl = cargosWl.map(c => `<@&${c}>`).join('\n');

                }

                let embedWl = new Discord.EmbedBuilder()
                    .setAuthor({ name: `${client.user.username} | Whitelist`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal da whitelist`, value: `${canalWl}`, inline: false },
                        { name: `Canal de fichas`, value: `${canalfichasWl}`, inline: false },
                        { name: `Canal dos logs`, value: `${canallogsWl}`, inline: false },
                        { name: `Cargo aprovado`, value: `${aprovadoWl}`, inline: false },
                        { name: `Cargos responsáveis`, value: `${cargosWl}`, inline: true },

                    )

                   
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais da wl")
                            .setCustomId("canaisWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir cargo aprovado")
                            .setCustomId("cargoaprovadoWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed da wl")
                            .setCustomId("embedWlNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedWl], components: [rowWl, rowBackWl] })

            }

            if (b.customId == 'cargoaprovadoWlNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`aprovadoWlNB_${b.guild.id}`, cargo.id);

                        let canalWl = await db.get(`canalWlNB_${b.guild.id}`);
                        let canalfichasWl = await db.get(`canalfichasWlNB_${b.guild.id}`);
                        let canallogsWl = await db.get(`canallogsWlNB_${b.guild.id}`);

                        if (!canalWl) {

                            canalWl = `\`Não foi definido.\``

                        } else {

                            canalWl = `<#${canalWl}>`
                        }

                        if (!canalfichasWl) {

                            canalfichasWl = `\`Não foi definido.\``

                        } else {

                            canalfichasWl = `<#${canalfichasWl}>`
                        }

                        if (!canallogsWl) {

                            canallogsWl = `\`Não foi definido.\``

                        } else {

                            canallogsWl = `<#${canallogsWl}>`
                        }

                        let aprovadoWl = await db.get(`aprovadoWlNB_${b.guild.id}`);

                        if (!aprovadoWl) {

                            aprovadoWl = `\`Não foi definido.\``

                        } else {

                            aprovadoWl = `<@&${aprovadoWl}>`
                        }

                        let cargosWl = await db.get(`cargosWl_${b.guild.id}.cargosWl`);

                        if (!cargosWl || cargosWl.length == 0) {

                            cargosWl = `\`Nenhum\``;

                        } else {

                            cargosWl = cargosWl.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedWl = new Discord.EmbedBuilder()
                            .setAuthor({ name: `${client.user.username} | Whitelist`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal da whitelist`, value: `${canalWl}`, inline: false },
                                { name: `Canal de fichas`, value: `${canalfichasWl}`, inline: false },
                                { name: `Canal dos logs`, value: `${canallogsWl}`, inline: false },
                                { name: `Cargo aprovado`, value: `${aprovadoWl}`, inline: false },
                                { name: `Cargos responsáveis`, value: `${cargosWl}`, inline: true },

                            )

                           
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedWl] })

                    }

                })
            }

            if (b.customId == 'addcargosWlNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.push(`cargosWl_${b.guild.id}.cargosWl`, cargo.id);

                        let canalWl = await db.get(`canalWlNB_${b.guild.id}`);
                        let canalfichasWl = await db.get(`canalfichasWlNB_${b.guild.id}`);
                        let canallogsWl = await db.get(`canallogsWlNB_${b.guild.id}`);

                        if (!canalWl) {

                            canalWl = `\`Não foi definido.\``

                        } else {

                            canalWl = `<#${canalWl}>`
                        }

                        if (!canalfichasWl) {

                            canalfichasWl = `\`Não foi definido.\``

                        } else {

                            canalfichasWl = `<#${canalfichasWl}>`
                        }

                        if (!canallogsWl) {

                            canallogsWl = `\`Não foi definido.\``

                        } else {

                            canallogsWl = `<#${canallogsWl}>`
                        }

                        let aprovadoWl = await db.get(`aprovadoWlNB_${b.guild.id}`);

                        if (!aprovadoWl) {

                            aprovadoWl = `\`Não foi definido.\``

                        } else {

                            aprovadoWl = `<@&${aprovadoWl}>`
                        }

                        let cargosWl = await db.get(`cargosWl_${b.guild.id}.cargosWl`);

                        if (!cargosWl || cargosWl.length == 0) {

                            cargosWl = `\`Nenhum\``;

                        } else {

                            cargosWl = cargosWl.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedWl = new Discord.EmbedBuilder()
                            .setAuthor({ name: `${client.user.username} | Whitelist`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal da whitelist`, value: `${canalWl}`, inline: false },
                                { name: `Canal de fichas`, value: `${canalfichasWl}`, inline: false },
                                { name: `Canal dos logs`, value: `${canallogsWl}`, inline: false },
                                { name: `Cargo aprovado`, value: `${aprovadoWl}`, inline: false },
                                { name: `Cargos responsáveis`, value: `${cargosWl}`, inline: true },

                            )

                           
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedWl] })

                    }

                })

            }

            if (b.customId == 'removcargosWlNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargosWl_${b.guild.id}.cargosWl`, (await db.get(`cargosWl_${b.guild.id}.cargosWl`))?.filter(e => e !== `${cargo.id}`));

                        let canalWl = await db.get(`canalWlNB_${b.guild.id}`);
                        let canalfichasWl = await db.get(`canalfichasWlNB_${b.guild.id}`);
                        let canallogsWl = await db.get(`canallogsWlNB_${b.guild.id}`);

                        if (!canalWl) {

                            canalWl = `\`Não foi definido.\``

                        } else {

                            canalWl = `<#${canalWl}>`
                        }

                        if (!canalfichasWl) {

                            canalfichasWl = `\`Não foi definido.\``

                        } else {

                            canalfichasWl = `<#${canalfichasWl}>`
                        }

                        if (!canallogsWl) {

                            canallogsWl = `\`Não foi definido.\``

                        } else {

                            canallogsWl = `<#${canallogsWl}>`
                        }

                        let aprovadoWl = await db.get(`aprovadoWlNB_${b.guild.id}`);

                        if (!aprovadoWl) {

                            aprovadoWl = `\`Não foi definido.\``

                        } else {

                            aprovadoWl = `<@&${aprovadoWl}>`
                        }

                        let cargosWl = await db.get(`cargosWl_${b.guild.id}.cargosWl`);

                        if (!cargosWl || cargosWl.length == 0) {

                            cargosWl = `\`Nenhum\``;

                        } else {

                            cargosWl = cargosWl.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedWl = new Discord.EmbedBuilder()
                            .setAuthor({ name: `${client.user.username} | Whitelist`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal da whitelist`, value: `${canalWl}`, inline: false },
                                { name: `Canal de fichas`, value: `${canalfichasWl}`, inline: false },
                                { name: `Canal dos logs`, value: `${canallogsWl}`, inline: false },
                                { name: `Cargo aprovado`, value: `${aprovadoWl}`, inline: false },
                                { name: `Cargos responsáveis`, value: `${cargosWl}`, inline: true },

                            )

                           
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedWl] })

                    }

                })

            }

            if (b.customId == 'embedWlNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloWl_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descWl_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoWl_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageWl_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookWl = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloWl')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descWl')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageWl')
                            .setStyle(Discord.ButtonStyle.Primary))

                let rowEmbedWl2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoWl')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarWl')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarWl")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookWl], components: [rowEmbedWl, rowEmbedWl2, rowBackWl] })

            }

            if (b.customId == 'tituloWl') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let title = message.content;

                    if (title == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Título definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`tituloWl_${b.guild.id}`, title);

                        let titulo = await db.get(`tituloWl_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descWl_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoWl_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageWl_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] });

                    }
                })
            }

            if (b.customId == 'descWl') {

                let tit = await db.get(`tituloWl_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descWl_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloWl_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descWl_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoWl_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageWl_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })

                    }
                })
            }

            if (b.customId == "setimageWl") {

                let descri = await db.get(`descWl_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;

                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimageWl_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloWl_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descWl_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoWl_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageWl_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })

                })
            }

            if (b.customId == "imagemcantoWl") {

                let descri = await db.get(`descWl_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;

                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoWl_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloWl_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descWl_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoWl_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageWl_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });
                        }
                    })
                }
                )
            }

            if (b.customId == 'enviarWl') {

                let descri = await db.get(`descWl_${b.guild.id}`);
                let canalReg = await db.get(`canalWlNB_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalReg);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal da whitelist\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloWl_${b.guild.id}`);
                    let desc = await db.get(`descWl_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoWl_${b.guild.id}`);
                    let image = await db.get(`setimageWl_${b.guild.id}`);

                    const embedWl = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    let rowWl = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Verificar")
                                .setCustomId('whitelistNB')
                                .setStyle(Discord.ButtonStyle.Secondary), 
                            new Discord.ButtonBuilder()
                                .setLabel("Usar Codigo")
                                .setCustomId('usarcodigo')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    await canal.send({ embeds: [embedWl], components: [rowWl] }).catch(err => { });

                }
            } // fim enviar

            if (b.customId == 'voltarReacoesNB') {

                b.deferUpdate();

                let statusAutoReacoes = await db.get(`statusautoReacoesNB_${b.guild.id}`);

                let emojistatusautoReacoesNB;
                let emojistatusautoReacoesNBEmbed;

                if (statusAutoReacoes === true) {

                    emojistatusautoReacoesNB = `1119444704178745464`;
                    emojistatusautoReacoesNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojistatusautoReacoesNB = `1119452618394177626`;
                    emojistatusautoReacoesNBEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let canalReacao1 = await db.get(`canalautoReacao1NB_${b.guild.id}`);
                let canalReacao2 = await db.get(`canalautoReacao2NB_${b.guild.id}`);
                let canalReacao3 = await db.get(`canalautoReacao3NB_${b.guild.id}`);

                if (!canalReacao1) {

                    canalReacao1 = `\`Não foi definido.\``

                } else {

                    canalReacao1 = `<#${canalReacao1}>`
                }

                if (!canalReacao2) {

                    canalReacao2 = `\`Não foi definido.\``

                } else {

                    canalReacao2 = `<#${canalReacao2}>`
                }

                if (!canalReacao3) {

                    canalReacao3 = `\`Não foi definido.\``

                } else {

                    canalReacao3 = `<#${canalReacao3}>`
                }

                let embedReacoes = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                    .addFields(
                        { name: `Canal 1`, value: `${canalReacao1}`, inline: false },
                        { name: `Canal 2`, value: `${canalReacao2}`, inline: false },
                        { name: `Canal 3`, value: `${canalReacao3}`, inline: false },
                        { name: `Status`, value: `${emojistatusautoReacoesNBEmbed}`, inline: false }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowReacoes = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Canal 1')
                            .setCustomId("reacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Canal 2')
                            .setCustomId("reacaoAuto2NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Canal 3')
                            .setCustomId("reacaoAuto3NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojistatusautoReacoesNB}`)
                            .setCustomId("statusautoReacoesNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackMenu = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedReacoes], components: [rowReacoes, rowBackMenu] });
            }


            if (b.customId == 'autoReacoesNB') {

                b.deferUpdate();

                let statusAutoReacoes = await db.get(`statusautoReacoesNB_${b.guild.id}`);

                let emojistatusautoReacoesNB;
                let emojistatusautoReacoesNBEmbed;

                if (statusAutoReacoes === true) {

                    emojistatusautoReacoesNB = `1119444704178745464`;
                    emojistatusautoReacoesNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojistatusautoReacoesNB = `1119452618394177626`;
                    emojistatusautoReacoesNBEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let canalReacao1 = await db.get(`canalautoReacao1NB_${b.guild.id}`);
                let canalReacao2 = await db.get(`canalautoReacao2NB_${b.guild.id}`);
                let canalReacao3 = await db.get(`canalautoReacao3NB_${b.guild.id}`);

                if (!canalReacao1) {

                    canalReacao1 = `\`Não foi definido.\``

                } else {

                    canalReacao1 = `<#${canalReacao1}>`
                }

                if (!canalReacao2) {

                    canalReacao2 = `\`Não foi definido.\``

                } else {

                    canalReacao2 = `<#${canalReacao2}>`
                }

                if (!canalReacao3) {

                    canalReacao3 = `\`Não foi definido.\``

                } else {

                    canalReacao3 = `<#${canalReacao3}>`
                }

                let embedReacoes = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                    .addFields(
                        { name: `Canal 1`, value: `${canalReacao1}`, inline: false },
                        { name: `Canal 2`, value: `${canalReacao2}`, inline: false },
                        { name: `Canal 3`, value: `${canalReacao3}`, inline: false },
                        { name: `Status`, value: `${emojistatusautoReacoesNBEmbed}`, inline: false }
                    )
               
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowReacoes = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Canal 1')
                            .setCustomId("reacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Canal 2')
                            .setCustomId("reacaoAuto2NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Canal 3')
                            .setCustomId("reacaoAuto3NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojistatusautoReacoesNB}`)
                            .setCustomId("statusautoReacoesNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackMenu = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedReacoes], components: [rowReacoes, rowBackMenu] });
            }

            if (b.customId == 'reacaoAuto1NB') {

                b.deferUpdate();

                let canalReacao1 = await db.get(`canalautoReacao1NB_${b.guild.id}`);

                if (!canalReacao1) {

                    canalReacao1 = `\`Não foi definido.\``

                } else {

                    canalReacao1 = `<#${canalReacao1}>`
                }

                let autoReacoes = await db.get(`autoReacao1NBEmbed_${b.guild.id}.reacoes`);

                if (!autoReacoes || !autoReacoes.length) {

                    autoReacoes = "ㅤ";

                } else {

                    autoReacoes = `${(await db.get(`autoReacao1NBEmbed_${b.guild.id}`))?.reacoes.join(`\n`)}`;

                }

                let embedReacoes = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal 1`, value: `${canalReacao1}`, inline: false },
                        { name: `Reações`, value: `${autoReacoes}`, inline: false },

                    )

               
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)


                const rowReacoes = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Definir canal das reações')
                            .setCustomId("canalreacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Adicionar Reação')
                            .setCustomId("addreacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Remover Reação')
                            .setCustomId("removreacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarReacoesNB")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedReacoes], components: [rowReacoes, rowBackAuto] });

            }

            if (b.customId == 'canalreacaoAuto1NB') {

                let embedCanalReg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (#canal/id) do canal desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCanalReg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let canal = b.guild.channels.cache.get(ee?.id);

                    if (!canal) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Canal adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`canalautoReacao1NB_${b.guild.id}`, canal.id);

                        let canalReacao1 = await db.get(`canalautoReacao1NB_${b.guild.id}`);

                        if (!canalReacao1) {

                            canalReacao1 = `\`Não foi definido.\``

                        } else {

                            canalReacao1 = `<#${canalReacao1}>`
                        }

                        let autoReacoes = await db.get(`autoReacao1NBEmbed_${b.guild.id}.reacoes`);

                        if (!autoReacoes || !autoReacoes.length) {

                            autoReacoes = "ㅤ";

                        } else {

                            autoReacoes = `${(await db.get(`autoReacao1NBEmbed_${b.guild.id}`))?.reacoes.join(`\n`)}`;

                        }

                        let embedReacoes = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal 1`, value: `${canalReacao1}`, inline: false },
                                { name: `Reações`, value: `${autoReacoes}`, inline: false },

                            )

                       
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)


                        MESSAGE.edit({ embeds: [embedReacoes] });
                    }
                })

            }

            if (b.customId == 'statusautoReacoesNB') {

                b.deferUpdate();

                let statusautoReacoes = await db.get(`statusautoReacoesNB_${b.guild.id}`);

                let emojistatusautoReacoesNB;
                let emojistatusautoReacoesNBEmbed;

                if (statusautoReacoes === true) {

                    emojistatusautoReacoesNB = `1119452618394177626`;
                    emojistatusautoReacoesNBEmbed = `${client.xx.desativado} Desativado`;

                    await db.set(`statusautoReacoesNB_${b.guild.id}`, false);

                } else {

                    emojistatusautoReacoesNB = `1119444704178745464`;
                    emojistatusautoReacoesNBEmbed = `<:stats:1265363896038850621> Ativado`;

                    await db.set(`statusautoReacoesNB_${b.guild.id}`, true);
                }

                let canalReacao1 = await db.get(`canalautoReacao1NB_${b.guild.id}`);
                let canalReacao2 = await db.get(`canalautoReacao2NB_${b.guild.id}`);
                let canalReacao3 = await db.get(`canalautoReacao3NB_${b.guild.id}`);

                if (!canalReacao1) {

                    canalReacao1 = `\`Não foi definido.\``

                } else {

                    canalReacao1 = `<#${canalReacao1}>`
                }

                if (!canalReacao2) {

                    canalReacao2 = `\`Não foi definido.\``

                } else {

                    canalReacao2 = `<#${canalReacao2}>`
                }

                if (!canalReacao3) {

                    canalReacao3 = `\`Não foi definido.\``

                } else {

                    canalReacao3 = `<#${canalReacao3}>`
                }

                let embedReacoes = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal 1`, value: `${canalReacao1}`, inline: false },
                        { name: `Canal 2`, value: `${canalReacao2}`, inline: false },
                        { name: `Canal 3`, value: `${canalReacao3}`, inline: false },
                        { name: `Status`, value: `${emojistatusautoReacoesNBEmbed}`, inline: false }

                    )

               
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowReacoes = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Canal 1')
                            .setCustomId("reacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Canal 2')
                            .setCustomId("reacaoAuto2NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Canal 3')
                            .setCustomId("reacaoAuto3NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojistatusautoReacoesNB}`)
                            .setCustomId("statusautoReacoesNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackMenu = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedReacoes], components: [rowReacoes, rowBackMenu] });

            }

            if (b.customId == 'addreacaoAuto1NB') {

                let react = new Discord.EmbedBuilder()
                    .setDescription(` Envie no chat o emoji desejado para reagir automaticamente\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [react], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ID = message.content;

                    const getEmoji = Discord.parseEmoji(ID);

                    let fael = b.guild.emojis.cache.get(getEmoji.id)

                    if (ID == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let cancel = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [cancel], ephemeral: true });

                    }

                    if (!fael) {

                        let noEmoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji não encontrado no server.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [noEmoji], ephemeral: true });

                    } else {

                        let Emoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [Emoji], ephemeral: true });

                        await db.push(`autoReacao1NBEmbed_${b.guild.id}.reacoes`, `${ID}`);
                        await db.push(`autoReacao1NB_${b.guild.id}.reacoes`, `${getEmoji.id}`);

                        let canalReacao1 = await db.get(`canalautoReacao1NB_${b.guild.id}`);

                        if (!canalReacao1) {

                            canalReacao1 = `\`Não foi definido.\``

                        } else {

                            canalReacao1 = `<#${canalReacao1}>`
                        }

                        let autoReacoes = await db.get(`autoReacao1NBEmbed_${b.guild.id}.reacoes`);

                        if (!autoReacoes || !autoReacoes.length) {

                            autoReacoes = "ㅤ";

                        } else {

                            autoReacoes = `${(await db.get(`autoReacao1NBEmbed_${b.guild.id}`))?.reacoes.join(` `)}`;

                        }

                        let embedReacoes = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal 1`, value: `${canalReacao1}`, inline: false },
                                { name: `Reações`, value: `${autoReacoes}`, inline: false },

                            )

                       
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedReacoes] });

                    }
                }

                )

            }

            if (b.customId == 'removreacaoAuto1NB') {

                let react = new Discord.EmbedBuilder()
                    .setDescription(` Envie no chat o emoji desejado para remover da reação automática\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [react], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ID = message.content;

                    const getEmoji = Discord.parseEmoji(ID);

                    let fael = b.guild.emojis.cache.get(getEmoji.id)

                    if (ID == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let cancel = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [cancel], ephemeral: true });

                    }

                    if (!fael) {

                        let noEmoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji não encontrado no server.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [noEmoji], ephemeral: true });

                    } else {

                        let Emoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [Emoji], ephemeral: true });


                        await db.set(`autoReacao1NBEmbed_${b.guild.id}.reacoes`, (await db.get(`autoReacao1NBEmbed_${b.guild.id}.reacoes`))?.filter(e => e !== `${ID}`));
                        await db.set(`autoReacao1NB_${b.guild.id}.reacoes`, (await db.get(`autoReacao1NB_${b.guild.id}.reacoes`))?.filter(e => e !== `${getEmoji.id}`));

                        let canalReacao1 = await db.get(`canalautoReacao1NB_${b.guild.id}`);

                        if (!canalReacao1) {

                            canalReacao1 = `\`Não foi definido.\``

                        } else {

                            canalReacao1 = `<#${canalReacao1}>`
                        }

                        let autoReacoes = await db.get(`autoReacao1NBEmbed_${b.guild.id}.reacoes`);

                        if (!autoReacoes || !autoReacoes.length) {

                            autoReacoes = "ㅤ";

                        } else {

                            autoReacoes = `${(await db.get(`autoReacao1NBEmbed_${b.guild.id}`))?.reacoes.join(` `)}`;

                        }

                        let embedReacoes = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal 1`, value: `${canalReacao1}`, inline: false },
                                { name: `Reações`, value: `${autoReacoes}`, inline: false },

                            )

                       
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedReacoes] });

                    }
                }

                )

            }

            if (b.customId == 'reacaoAuto2NB') {

                b.deferUpdate();

                let canalReacao1 = await db.get(`canalautoReacao2NB_${b.guild.id}`);

                if (!canalReacao1) {

                    canalReacao1 = `\`Não foi definido.\``

                } else {

                    canalReacao1 = `<#${canalReacao1}>`
                }

                let autoReacoes = await db.get(`autoReacao2NBEmbed_${b.guild.id}.reacoes`);

                if (!autoReacoes || !autoReacoes.length) {

                    autoReacoes = "ㅤ";

                } else {

                    autoReacoes = `${(await db.get(`autoReacao2NBEmbed_${b.guild.id}`))?.reacoes.join(`\n`)}`;

                }

                let embedReacoes = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal 1`, value: `${canalReacao1}`, inline: false },
                        { name: `Reações`, value: `${autoReacoes}`, inline: false },

                    )

               
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowReacoes = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Definir canal das reações')
                            .setCustomId("canalreacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Adicionar Reação')
                            .setCustomId("addreacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Remover Reação')
                            .setCustomId("removreacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarReacoesNB")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedReacoes], components: [rowReacoes, rowBackAuto] });

            }

            if (b.customId == 'canalreacaoAuto2NB') {

                let embedCanalReg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (#canal/id) do canal desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCanalReg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let canal = b.guild.channels.cache.get(ee.id);

                    if (!canal) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Canal adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`canalautoReacao2NB_${b.guild.id}`, canal.id);

                        let canalReacao2 = await db.get(`canalautoReacao2NB_${b.guild.id}`);

                        if (!canalReacao2) {

                            canalReacao2 = `\`Não foi definido.\``

                        } else {

                            canalReacao2 = `<#${canalReacao2}>`
                        }

                        let autoReacoes = await db.get(`autoReacao2NBEmbed_${b.guild.id}.reacoes`);

                        if (!autoReacoes || !autoReacoes.length) {

                            autoReacoes = "ㅤ";

                        } else {

                            autoReacoes = `${(await db.get(`autoReacao2NBEmbed_${b.guild.id}`))?.reacoes.join(`\n`)}`;

                        }

                        let embedReacoes = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal 2`, value: `${canalReacao2}`, inline: false },
                                { name: `Reações`, value: `${autoReacoes}`, inline: false },

                            )

                       
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)


                        MESSAGE.edit({ embeds: [embedReacoes] });
                    }
                })

            }

            if (b.customId == 'addreacaoAuto2NB') {

                let react = new Discord.EmbedBuilder()
                    .setDescription(` Envie no chat o emoji desejado para reagir automaticamente\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [react], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ID = message.content;

                    const getEmoji = Discord.parseEmoji(ID);

                    let fael = b.guild.emojis.cache.get(getEmoji.id)

                    if (ID == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let cancel = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [cancel], ephemeral: true });

                    }

                    if (!fael) {

                        let noEmoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji não encontrado no server.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [noEmoji], ephemeral: true });

                    } else {

                        let Emoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [Emoji], ephemeral: true });

                        await db.push(`autoReacao2NBEmbed_${b.guild.id}.reacoes`, `${ID}`);
                        await db.push(`autoReacao2NB_${b.guild.id}.reacoes`, `${getEmoji.id}`);

                        let canalReacao1 = await db.get(`canalautoReacao2NB_${b.guild.id}`);

                        if (!canalReacao1) {

                            canalReacao1 = `\`Não foi definido.\``

                        } else {

                            canalReacao1 = `<#${canalReacao1}>`
                        }

                        let autoReacoes = await db.get(`autoReacao2NBEmbed_${b.guild.id}.reacoes`);

                        if (!autoReacoes || !autoReacoes.length) {

                            autoReacoes = "ㅤ";

                        } else {

                            autoReacoes = `${(await db.get(`autoReacao2NBEmbed_${b.guild.id}`))?.reacoes.join(` `)}`;

                        }

                        let embedReacoes = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal 2`, value: `${canalReacao1}`, inline: false },
                                { name: `Reações`, value: `${autoReacoes}`, inline: false },

                            )

                       
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedReacoes] });

                    }
                }

                )

            }

            if (b.customId == 'removreacaoAuto2NB') {

                let react = new Discord.EmbedBuilder()
                    .setDescription(` Envie no chat o emoji desejado para remover da reação automática\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [react], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ID = message.content;

                    const getEmoji = Discord.parseEmoji(ID);

                    let fael = b.guild.emojis.cache.get(getEmoji.id)

                    if (ID == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let cancel = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [cancel], ephemeral: true });

                    }

                    if (!fael) {

                        let noEmoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji não encontrado no server.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [noEmoji], ephemeral: true });

                    } else {

                        let Emoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [Emoji], ephemeral: true });


                        await db.set(`autoReacao2NBEmbed_${b.guild.id}.reacoes`, (await db.get(`autoReacao2NBEmbed_${b.guild.id}.reacoes`))?.filter(e => e !== `${ID}`));
                        await db.set(`autoReacao2NB_${b.guild.id}.reacoes`, (await db.get(`autoReacao2NB_${b.guild.id}.reacoes`))?.filter(e => e !== `${getEmoji.id}`));

                        let canalReacao1 = await db.get(`canalautoReacao2NB_${b.guild.id}`);

                        if (!canalReacao1) {

                            canalReacao1 = `\`Não foi definido.\``

                        } else {

                            canalReacao1 = `<#${canalReacao1}>`
                        }

                        let autoReacoes = await db.get(`autoReacao2NBEmbed_${b.guild.id}.reacoes`);

                        if (!autoReacoes || !autoReacoes.length) {

                            autoReacoes = "ㅤ";

                        } else {

                            autoReacoes = `${(await db.get(`autoReacao2NBEmbed_${b.guild.id}`))?.reacoes.join(` `)}`;

                        }

                        let embedReacoes = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal 2`, value: `${canalReacao1}`, inline: false },
                                { name: `Reações`, value: `${autoReacoes}`, inline: false },

                            )

                       
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedReacoes] });

                    }
                }

                )

            }

            if (b.customId == 'reacaoAuto3NB') {

                b.deferUpdate();

                let canalReacao1 = await db.get(`canalautoReacao3NB_${b.guild.id}`);

                if (!canalReacao1) {

                    canalReacao1 = `\`Não foi definido.\``

                } else {

                    canalReacao1 = `<#${canalReacao1}>`
                }

                let autoReacoes = await db.get(`autoReacao3NBEmbed_${b.guild.id}.reacoes`);

                if (!autoReacoes || !autoReacoes.length) {

                    autoReacoes = "ㅤ";

                } else {

                    autoReacoes = `${(await db.get(`autoReacao3NBEmbed_${b.guild.id}`))?.reacoes.join(`\n`)}`;

                }

                let embedReacoes = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal 3`, value: `${canalReacao1}`, inline: false },
                        { name: `Reações`, value: `${autoReacoes}`, inline: false },

                    )

               
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowReacoes = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Definir canal das reações')
                            .setCustomId("canalreacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Adicionar Reação')
                            .setCustomId("addreacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Remover Reação')
                            .setCustomId("removreacaoAuto1NB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAuto = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarReacoesNB")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedReacoes], components: [rowReacoes, rowBackAuto] });

            }

            if (b.customId == 'canalreacaoAuto3NB') {

                let embedCanalReg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (#canal/id) do canal desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCanalReg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let canal = b.guild.channels.cache.get(ee.id);

                    if (!canal) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Canal adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`canalautoReacao3NB_${b.guild.id}`, canal.id);

                        let canalReacao3 = await db.get(`canalautoReacao3NB_${b.guild.id}`);

                        if (!canalReacao3) {

                            canalReacao3 = `\`Não foi definido.\``

                        } else {

                            canalReacao3 = `<#${canalReacao3}>`
                        }

                        let autoReacoes = await db.get(`autoReacao3NBEmbed_${b.guild.id}.reacoes`);

                        if (!autoReacoes || !autoReacoes.length) {

                            autoReacoes = "ㅤ";

                        } else {

                            autoReacoes = `${(await db.get(`autoReacao3NBEmbed_${b.guild.id}`))?.reacoes.join(`\n`)}`;

                        }

                        let embedReacoes = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal 1`, value: `${canalReacao3}`, inline: false },
                                { name: `Reações`, value: `${autoReacoes}`, inline: false },

                            )

                       
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)


                        MESSAGE.edit({ embeds: [embedReacoes] });
                    }
                })

            }

            if (b.customId == 'addreacaoAuto3NB') {

                let react = new Discord.EmbedBuilder()
                    .setDescription(` Envie no chat o emoji desejado para reagir automaticamente\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [react], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ID = message.content;

                    const getEmoji = Discord.parseEmoji(ID);

                    let fael = b.guild.emojis.cache.get(getEmoji.id)

                    if (ID == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let cancel = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [cancel], ephemeral: true });

                    }

                    if (!fael) {

                        let noEmoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji não encontrado no server.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [noEmoji], ephemeral: true });

                    } else {

                        let Emoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [Emoji], ephemeral: true });

                        await db.push(`autoReacao3NBEmbed_${b.guild.id}.reacoes`, `${ID}`);
                        await db.push(`autoReacao3NB_${b.guild.id}.reacoes`, `${getEmoji.id}`);

                        let canalReacao1 = await db.get(`canalautoReacao3NB_${b.guild.id}`);

                        if (!canalReacao1) {

                            canalReacao1 = `\`Não foi definido.\``

                        } else {

                            canalReacao1 = `<#${canalReacao1}>`
                        }

                        let autoReacoes = await db.get(`autoReacao3NBEmbed_${b.guild.id}.reacoes`);

                        if (!autoReacoes || !autoReacoes.length) {

                            autoReacoes = "ㅤ";

                        } else {

                            autoReacoes = `${(await db.get(`autoReacao3NBEmbed_${b.guild.id}`))?.reacoes.join(` `)}`;

                        }

                        let embedReacoes = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal 3`, value: `${canalReacao1}`, inline: false },
                                { name: `Reações`, value: `${autoReacoes}`, inline: false },

                            )

                       
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedReacoes] });

                    }
                }

                )

            }

            if (b.customId == 'removreacaoAuto3NB') {

                let react = new Discord.EmbedBuilder()
                    .setDescription(` Envie no chat o emoji desejado para remover da reação automática\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [react], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ID = message.content;

                    const getEmoji = Discord.parseEmoji(ID);

                    let fael = b.guild.emojis.cache.get(getEmoji.id)

                    if (ID == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let cancel = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [cancel], ephemeral: true });

                    }

                    if (!fael) {

                        let noEmoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji não encontrado no server.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [noEmoji], ephemeral: true });

                    } else {

                        let Emoji = new Discord.EmbedBuilder()
                            .setDescription(`Emoji removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [Emoji], ephemeral: true });


                        await db.set(`autoReacao3NBEmbed_${b.guild.id}.reacoes`, (await db.get(`autoReacao3NBEmbed_${b.guild.id}.reacoes`))?.filter(e => e !== `${ID}`));
                        await db.set(`autoReacao3NB_${b.guild.id}.reacoes`, (await db.get(`autoReacao3NB_${b.guild.id}.reacoes`))?.filter(e => e !== `${getEmoji.id}`));

                        let canalReacao1 = await db.get(`canalautoReacao3NB_${b.guild.id}`);

                        if (!canalReacao1) {

                            canalReacao1 = `\`Não foi definido.\``

                        } else {

                            canalReacao1 = `<#${canalReacao1}>`
                        }

                        let autoReacoes = await db.get(`autoReacao3NBEmbed_${b.guild.id}.reacoes`);

                        if (!autoReacoes || !autoReacoes.length) {

                            autoReacoes = "ㅤ";

                        } else {

                            autoReacoes = `${(await db.get(`autoReacao3NBEmbed_${b.guild.id}`))?.reacoes.join(` `)}`;

                        }

                        let embedReacoes = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Auto Reações`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal 3`, value: `${canalReacao1}`, inline: false },
                                { name: `Reações`, value: `${autoReacoes}`, inline: false },

                            )

                       
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedReacoes] });

                    }
                }

                )

            }

            if (b.customId == 'tempocallNB') { //beateamo

                b.deferUpdate();

                let cargosTempo = await db.get(`sistemaTempo_${b.guild.id}.cargos`);

                if (!cargosTempo || cargosTempo.length == 0) {

                    cargosTempo = `\`Nenhum\``;

                } else {

                    cargosTempo = cargosTempo.map(c => `<@&${c}>`).join('\n');

                }

                let categsTempo = await db.get(`sistemaTempo_${b.guild.id}.categs`);

                if (!categsTempo || categsTempo.length == 0) {

                    categsTempo = `\`Nenhum\``;

                } else {

                    categsTempo = categsTempo.map(c => `<#${c}>`).join('\n');

                }

                let ultimoReset = await db.get(`resettempoNB_${b.guild.id}`);

                if (ultimoReset) {

                    ultimoReset = `\`${moment(ultimoReset).fromNow()}\``

                } else {

                    ultimoReset = `\`Não foi resetado até o momento.\``
                }

                const embedTempo = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | TempoCall`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: "Cargos", value: `${cargosTempo}`, "inline": true },
                        { name: "Categorias", value: `${categsTempo}`, "inline": true },
                        { name: "Último Reset", value: `${ultimoReset}`, "inline": false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowTempo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Adicionar cargo')
                            .setCustomId("cargoaddtempo")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Remover cargo')
                            .setCustomId("cargoremovtempo")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Adicionar categoria')
                            .setCustomId("categtempoadd")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel('Remover categoria')
                            .setCustomId("categtemporemov")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Resetar o tempo geral")
                            .setEmoji('1067811994507427881')
                            .setCustomId("resetartempo")
                            .setStyle(Discord.ButtonStyle.Danger))

                const rowBackServidor = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedTempo], components: [rowTempo, rowBackServidor] });
            }

            if (b.customId == 'cargoaddtempo') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.push(`sistemaTempo_${b.guild.id}.cargos`, cargo.id);

                        cargo.members.forEach(async (member) => {

                            if (member.voice.channel) {

                                let entrada = new Date();

                                let hr = entrada.getHours();

                                if (hr < 10) {

                                    hr = '0' + hr;

                                } else {

                                    hr = hr + '';
                                }

                                let min = entrada.getMinutes()

                                if (min < 10) {

                                    min = '0' + min;

                                } else {

                                    min = min + '';
                                }

                                const inicio = hr + ":" + min;

                                await db.set(`call_${member.id}`, new Date().getTime());
                                await db.set(`inicio_${member.id}`, inicio);
                            }

                        });

                        let cargosTempo = await db.get(`sistemaTempo_${b.guild.id}.cargos`);

                        if (!cargosTempo || cargosTempo.length == 0) {

                            cargosTempo = `\`Nenhum\``;

                        } else {

                            cargosTempo = cargosTempo.map(c => `<@&${c}>`).join('\n');

                        }

                        let categsTempo = await db.get(`sistemaTempo_${b.guild.id}.categs`);

                        if (!categsTempo || categsTempo.length == 0) {

                            categsTempo = `\`Nenhum\``;

                        } else {

                            categsTempo = categsTempo.map(c => `<#${c}>`).join('\n');

                        }

                        let ultimoReset = await db.get(`resettempoNB_${b.guild.id}`);

                        if (ultimoReset) {

                            ultimoReset = `\`${moment(ultimoReset).fromNow()}\``

                        } else {

                            ultimoReset = `\`Não foi resetado até o momento.\``
                        }

                        const embedTempo = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | TempoCall`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: "Cargos", value: `${cargosTempo}`, "inline": true },
                                { name: "Categorias", value: `${categsTempo}`, "inline": true },
                                { name: "Último Reset", value: `${ultimoReset}`, "inline": false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedTempo] });

                    }
                })

            }

            if (b.customId == 'cargoremovtempo') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`sistemaTempo_${b.guild.id}.cargos`, (await db.get(`sistemaTempo_${b.guild.id}.cargos`))?.filter(e => e !== `${cargo.id}`));

                        let cargosTempo = await db.get(`sistemaTempo_${b.guild.id}.cargos`);

                        if (!cargosTempo || cargosTempo.length == 0) {

                            cargosTempo = `\`Nenhum\``;

                        } else {

                            cargosTempo = cargosTempo.map(c => `<@&${c}>`).join('\n');

                        }

                        let categsTempo = await db.get(`sistemaTempo_${b.guild.id}.categs`);

                        if (!categsTempo || categsTempo.length == 0) {

                            categsTempo = `\`Nenhum\``;

                        } else {

                            categsTempo = categsTempo.map(c => `<#${c}>`).join('\n');

                        }

                        let ultimoReset = await db.get(`resettempoNB_${b.guild.id}`);

                        if (ultimoReset) {

                            ultimoReset = `\`${moment(ultimoReset).fromNow()}\``

                        } else {

                            ultimoReset = `\`Não foi resetado até o momento.\``
                        }

                        const embedTempo = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | TempoCall`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: "Cargos", value: `${cargosTempo}`, "inline": true },
                                { name: "Categorias", value: `${categsTempo}`, "inline": true },
                                { name: "Último Reset", value: `${ultimoReset}`, "inline": false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedTempo] });

                    }
                })

            }

            if (b.customId == 'categtempoadd') {

                let embedCateg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a(#categoria/id) da categoria desejada\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCateg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let categoria = b.guild.channels.cache.get(ee.id);

                    if (!categoria) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    if (categoria.type !== 4) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor apenas categorias.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Categoria adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.push(`sistemaTempo_${b.guild.id}.categs`, categoria.id);

                        let cargosTempo = await db.get(`sistemaTempo_${b.guild.id}.cargos`);

                        if (!cargosTempo || cargosTempo.length == 0) {

                            cargosTempo = `\`Nenhum\``;

                        } else {

                            cargosTempo = cargosTempo.map(c => `<@&${c}>`).join('\n');

                        }

                        let categsTempo = await db.get(`sistemaTempo_${b.guild.id}.categs`);

                        if (!categsTempo || categsTempo.length == 0) {

                            categsTempo = `\`Nenhum\``;

                        } else {

                            categsTempo = categsTempo.map(c => `<#${c}>`).join('\n');

                        }

                        let ultimoReset = await db.get(`resettempoNB_${b.guild.id}`);

                        if (ultimoReset) {

                            ultimoReset = `\`${moment(ultimoReset).fromNow()}\``

                        } else {

                            ultimoReset = `\`Não foi resetado até o momento.\``
                        }

                        const embedTempo = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | TempoCall`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: "Cargos", value: `${cargosTempo}`, "inline": true },
                                { name: "Categorias", value: `${categsTempo}`, "inline": true },
                                { name: "Último Reset", value: `${ultimoReset}`, "inline": false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedTempo] });

                    }
                })

            }

            if (b.customId == 'categtemporemov') {

                let embedCateg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a(#categoria/id) da categoria desejada\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCateg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let categoria = b.guild.channels.cache.get(ee.id);

                    if (!categoria) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    if (categoria.type !== 4) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor apenas categorias.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Categoria adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`sistemaTempo_${b.guild.id}.categs`, (await db.get(`sistemaTempo_${b.guild.id}.categs`))?.filter(e => e !== `${categoria.id}`));

                        let cargosTempo = await db.get(`sistemaTempo_${b.guild.id}.cargos`);

                        if (!cargosTempo || cargosTempo.length == 0) {

                            cargosTempo = `\`Nenhum\``;

                        } else {

                            cargosTempo = cargosTempo.map(c => `<@&${c}>`).join('\n');

                        }

                        let categsTempo = await db.get(`sistemaTempo_${b.guild.id}.categs`);

                        if (!categsTempo || categsTempo.length == 0) {

                            categsTempo = `\`Nenhum\``;

                        } else {

                            categsTempo = categsTempo.map(c => `<#${c}>`).join('\n');

                        }

                        let ultimoReset = await db.get(`resettempoNB_${b.guild.id}`);

                        if (ultimoReset) {

                            ultimoReset = `\`${moment(ultimoReset).fromNow()}\``

                        } else {

                            ultimoReset = `\`Não foi resetado até o momento.\``
                        }

                        const embedTempo = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | TempoCall`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: "Cargos", value: `${cargosTempo}`, "inline": true },
                                { name: "Categorias", value: `${categsTempo}`, "inline": true },
                                { name: "Último Reset", value: `${ultimoReset}`, "inline": false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        await MESSAGE.edit({ embeds: [embedTempo] });

                    }
                })

            }

            if (b.customId == 'resetartempo') {

                let embedCateg = new Discord.EmbedBuilder()
                    .setDescription(`${b.member}, tempocall resetado com sucesso!`)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCateg], ephemeral: true });

                let entrada = new Date();

                let hr = entrada.getHours();

                if (hr < 10) {

                    hr = '0' + hr;

                } else {

                    hr = hr + '';
                }

                let min = entrada.getMinutes()

                if (min < 10) {

                    min = '0' + min;

                } else {

                    min = min + '';
                }

                const inicio = hr + ":" + min;

                (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`tempocall_`)).forEach(async (element) => {

                    await db.delete(element);
                });

                (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`call_`)).forEach(async (element) => {

                    await db.delete(element);
                });

                (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`inicio_`)).forEach(async (element) => {

                    await db.delete(element);
                });

                await message.guild.members.cache.filter(m => m.voice.channel).forEach(async (member) => {

                    await db.set(`call_${member.id}`, new Date().getTime())
                    await db.set(`inicio_${member.id}`, inicio);

                });

                await db.set(`resettempoNB_${b.guild.id}`, new Date().getTime());

                let cargosTempo = await db.get(`sistemaTempo_${b.guild.id}.cargos`);

                if (!cargosTempo || cargosTempo.length == 0) {

                    cargosTempo = `\`Nenhum\``;

                } else {

                    cargosTempo = cargosTempo.map(c => `<@&${c}>`).join('\n');

                }

                let categsTempo = await db.get(`sistemaTempo_${b.guild.id}.categs`);

                if (!categsTempo || categsTempo.length == 0) {

                    categsTempo = `\`Nenhum\``;

                } else {

                    categsTempo = categsTempo.map(c => `<#${c}>`).join('\n');

                }

                const embedTempo = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | TempoCall`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: "Cargos", value: `${cargosTempo}`, "inline": true },
                        { name: "Categorias", value: `${categsTempo}`, "inline": true },
                        { name: "Último Reset", value: `\`${moment(new Date().getTime()).fromNow()}\``, "inline": false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                await MESSAGE.edit({ embeds: [embedTempo] });
            }

            if (b.customId == 'callTempmenu') {

                b.deferUpdate();

                let statusautocallTemp = await db.get(`statusautocallTempNB_${b.guild.id}`);

                let emojistatusautocallTempNB;
                let emojistatusautocallTempNBEmbed;

                if (statusautocallTemp === true) {

                    emojistatusautocallTempNB = `1119444704178745464`;
                    emojistatusautocallTempNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojistatusautocallTempNB = `1119452618394177626`;
                    emojistatusautocallTempNBEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let canalTemp = await db.get(`canalTempNB_${b.guild.id}`);

                if (!canalTemp) {

                    canalTemp = `\`Não foi definido.\``

                } else {

                    canalTemp = `<#${canalTemp}>`
                }

                let embedCalltemp = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Call Temporaria`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal Temporário`, value: `${canalTemp}`, inline: false },
                        { name: `Status`, value: `${emojistatusautocallTempNBEmbed}`, inline: false }

                    )


                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowCall = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Definir canal temporário')
                            .setCustomId("callTempNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojistatusautocallTempNB}`)
                            .setCustomId("statusautocallTempNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackServidor = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedCalltemp], components: [rowCall, rowBackServidor] });
            }

            if (b.customId == 'callTempNB') {

                let embedCanalReg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (#canal/id) do canal desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCanalReg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let canal = b.guild.channels.cache.get(ee.id);

                    if (!canal) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Canal adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`canalTempNB_${b.guild.id}`, canal.id);

                        let statusautocallTemp = await db.get(`statusautocallTempNB_${b.guild.id}`);

                        let emojistatusautocallTempNBEmbed;

                        if (statusautocallTemp === true) {

                            emojistatusautocallTempNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                        } else {

                            emojistatusautocallTempNBEmbed = `> ${client.xx.desativado} Desativado`;

                        }

                        let canalTemp = await db.get(`canalTempNB_${b.guild.id}`);

                        if (!canalTemp) {

                            canalTemp = `\`Não foi definido.\``

                        } else {

                            canalTemp = `<#${canalTemp}>`
                        }

                        let embedCalltemp = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Call Temporaria`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal Temporário`, value: `${canalTemp}`, inline: false },
                                { name: `Status`, value: `${emojistatusautocallTempNBEmbed}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedCalltemp] });
                    }
                })

            }

            if (b.customId == 'statusautocallTempNB') {

                b.deferUpdate();

                let statusautocallTemp = await db.get(`statusautocallTempNB_${b.guild.id}`);

                let emojistatusautocallTempNB;
                let emojistatusautocallTempNBEmbed;

                if (statusautocallTemp === true) {

                    emojistatusautocallTempNB = `1119452618394177626`;
                    emojistatusautocallTempNBEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusautocallTempNB_${b.guild.id}`, false);

                } else {

                    emojistatusautocallTempNB = `1119444704178745464`;
                    emojistatusautocallTempNBEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusautocallTempNB_${b.guild.id}`, true);
                }

                let canalTemp = await db.get(`canalTempNB_${b.guild.id}`);

                if (!canalTemp) {

                    canalTemp = `\`Não foi definido.\``

                } else {

                    canalTemp = `<#${canalTemp}>`
                }

                let embedCalltemp = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Call Temporaria`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal Temporário`, value: `${canalTemp}`, inline: false },
                        { name: `Status`, value: `${emojistatusautocallTempNBEmbed}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowCall = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Definir canal temporário')
                            .setCustomId("callTempNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojistatusautocallTempNB}`)
                            .setCustomId("statusautocallTempNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackServidor = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarServidor")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedCalltemp], components: [rowCall, rowBackServidor] });
            }

            if (b.customId == 'registroNB') {

                b.deferUpdate()

                let canalReg = await db.get(`canalRegNB_${b.guild.id}`);

                if (!canalReg) {

                    canalReg = `\`Não foi definido.\``

                } else {

                    canalReg = `<#${canalReg}>`
                }

                let embedReg = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Registro`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal do registro`, value: `${canalReg}`, inline: true }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowReg = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal do registro")
                            .setCustomId("canalRegNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar registro")
                            .setCustomId("configRegNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do registro")
                            .setCustomId("embedRegNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackReg = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedReg], components: [rowReg, rowBackReg] })

            }

            if (b.customId == 'canalRegNB') {

                let embedCanalReg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (#canal/id) do canal desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCanalReg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let canal = b.guild.channels.cache.get(ee.id);

                    if (!canal) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Canal adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`canalRegNB_${b.guild.id}`, canal.id);

                        let embedReg = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Registro`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal do registro`, value: `${canal}`, inline: true }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedReg] });
                    }
                })

            }

            if (b.customId == 'configRegNB') {

                b.deferUpdate()

                var CargosAdicionados = [];
                var Pages = await db.get(`Registro_${message.guild.id}`);

                if (!Pages) {

                    Pages = {}
                    Pages[1] = []
                    Pages[2] = []
                    Pages[3] = []
                    Pages[4] = []
                    Pages[5] = []
                    Pages['Não Registrado'] = []
                    Pages['Registrado'] = []
                }

                let MainMessage = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Registro`, iconURL: client.user.displayAvatarURL() })
                    .setFields()
                    .setColor(`${colorNB}`)
                let Rows = []
                let butoes = []
                for (let index of Object.keys(Pages)) {
                    butoes.push(new Discord.ButtonBuilder()
                        .setCustomId(index)
                        .setLabel('Página ' + index)
                        .setStyle(Discord.ButtonStyle.Secondary))
                    let ValueField = ""
                    for (let i = 0; i < 4; i++) {
                        let CargoID = Pages[index][i]
                        CargoID !== undefined ? CargoID = '<@&' + CargoID + '>' : CargoID = '**`Nenhum`**'
                        ValueField = ValueField + CargoID + '\n'
                    }
                    MainMessage.addFields({ name: '📋 Página ' + index, value: ValueField, inline: true })
                }

                butoes.push(new Discord.ButtonBuilder()
                    .setLabel('Finalizar')
                    .setCustomId('finalizar')
                    .setStyle(Discord.ButtonStyle.Success))

                let rw = 0;
                let i = 0;

                for (let b of butoes) {
                    if (!Rows[rw]) Rows.push(new Discord.ActionRowBuilder())
                    Rows[rw].addComponents(b)
                    i += 1
                    if (i > 3) {
                        rw += 1
                        i = 0
                    }
                }

                await message.channel.send({ embeds: [MainMessage], components: Rows }).then(msg => {

                    let Filter = (Inter) => Inter.user.id == message.author.id;
                    let Coletor = msg.createMessageComponentCollector({ Filter })
                    Coletor.on('collect', async (Interaction) => {
                        if (Interaction.customId !== 'finalizar') {
                            let iPage = Interaction.customId
                            let Modal = new Discord.ModalBuilder()
                                .setTitle('Página ' + iPage)
                                .setCustomId('page:' + iPage)
                            for (let i = 0; i < 4; i++) {
                                Modal.addComponents(new Discord.ActionRowBuilder().setComponents(
                                    new Discord.TextInputBuilder()
                                        .setLabel('Cargo ' + Math.floor(Number(i) + 1))
                                        .setCustomId("page:" + iPage + ":id:" + i)
                                        .setPlaceholder('Id do cargo')
                                        .setRequired(false)
                                        .setStyle(Discord.TextInputStyle.Short)
                                ))
                            }

                            Interaction.showModal(Modal);
                            await Interaction.awaitModalSubmit({ filter: i => i.id && i.message.id == msg.id, time: 60000 }).then(resp => {
                                resp.deferUpdate().catch(err => { })
                                for (let field of Object.keys(resp.fields)) {
                                    resp.fields[field].map(c => {
                                        if (c.value) {
                                            let Cargo = c.value
                                            let page = c.customId.split(":")[1]
                                            let posi = c.customId.split(":")[3]
                                            CargosAdicionados.push(Cargo)
                                            Pages[page][posi] = Cargo
                                        }
                                    })
                                }
                                let Fields = []
                                for (let index of Object.keys(Pages)) {
                                    let ValueField = ""
                                    for (let i = 0; i < 4; i++) {
                                        let CargoID = Pages[index][i]
                                        CargoID !== undefined ? CargoID = '<@&' + CargoID + '>' : CargoID = '**`Nenhum`**'
                                        ValueField = ValueField + CargoID + '\n'
                                    }
                                    Fields.push({ name: 'Página ' + index, value: ValueField, inline: true })
                                }
                                MainMessage.setFields(Fields)
                                msg.edit({ embeds: [MainMessage] })

                            }).catch(err => { })

                        } else {

                            msg.delete();
                            db.set(`Registro_${message.guild.id}`, Pages)

                            let salvoReg = new Discord.EmbedBuilder()
                                .setDescription(`A configuração foi salva com sucesso.`)
                                .setColor(`${colorNB}`)

                            Interaction.reply({ embeds: [salvoReg], ephemeral: true }).catch(err => { })
                        }
                    })
                }
                )

            }

            if (b.customId == 'voltarReg') {

                b.deferUpdate();

                let canalReg = await db.get(`canalRegNB_${b.guild.id}`);

                if (!canalReg) {

                    canalReg = `\`Não foi definido.\``

                } else {

                    canalReg = `<#${canalReg}>`
                }

                let embedReg = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Registro`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal do registro`, value: `${canalReg}`, inline: true }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowReg = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal do registro")
                            .setCustomId("canalRegNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar registro")
                            .setCustomId("configRegNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do registro")
                            .setCustomId("embedRegNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackReg = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedReg], components: [rowReg, rowBackReg] });

            }

            if (b.customId == 'embedRegNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloReg_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descReg_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoReg_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageReg_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookWl = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedReg = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloReg')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descReg')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageReg')
                            .setStyle(Discord.ButtonStyle.Primary))

                let rowEmbedReg2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoReg')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarReg')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackReg = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarReg")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookWl], components: [rowEmbedReg, rowEmbedReg2, rowBackReg] })

            }

            if (b.customId == 'tituloReg') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let title = message.content;

                    if (title == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Título definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`tituloReg_${b.guild.id}`, title);

                        let titulo = await db.get(`tituloReg_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descReg_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoReg_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageReg_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] });

                    }
                })
            }

            if (b.customId == 'descReg') {

                let tit = await db.get(`tituloReg_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descReg_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloReg_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descReg_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoReg_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageReg_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimageReg") {

                let descri = await db.get(`descReg_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimageReg_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloReg_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descReg_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoReg_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageReg_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                })
            }

            if (b.customId == "imagemcantoReg") {

                let descri = await db.get(`descReg_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoReg_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloReg_${b.guild.id}`);
                            if (!titulo) titulo = 'Título';
                            let desc = await db.get(`descReg_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoReg_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageReg_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookReg = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookReg] });
                        }
                    })
                }
                )

            } // fim imagem de canto

            if (b.customId == 'enviarReg') {

                let descri = await db.get(`descReg_${b.guild.id}`);
                let canalReg = await db.get(`canalRegNB_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalReg);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal do Registro\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloReg_${b.guild.id}`);
                    let desc = await db.get(`descReg_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoReg_${b.guild.id}`);
                    let image = await db.get(`setimageReg_${b.guild.id}`);

                    const embedReg = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    let rowReg = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Iniciar")
                                
                                .setCustomId('registro')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    await canal.send({ embeds: [embedReg], components: [rowReg] }).catch(err => { })

                }
            }

            if (b.customId == 'sejamembroNB') {

                b.deferUpdate();

                let url = await db.get(`urlSejaMNB_`);

                if (url) {

                    url = `[${url}](https://discord.gg/${url})`;

                } else {

                    url = `\`Não foi definida.\``
                }

                let canalSejaM = await db.get(`canalSejaMNB_${b.guild.id}`);

                if (!canalSejaM) {

                    canalSejaM = `\`Não foi definido.\``

                } else {

                    canalSejaM = `<#${canalSejaM}>`
                }

                let canallogsSejaM = await db.get(`canallogsSejaMNB_${b.guild.id}`);

                if (!canallogsSejaM) {

                    canallogsSejaM = `\`Não foi definido.\``

                } else {

                    canallogsSejaM = `<#${canallogsSejaM}>`
                }

                let cargosSM = await db.get(`cargosSM_${b.guild.id}.cargosSM`);

                if (!cargosSM || cargosSM.length == 0) {

                    cargosSM = `\`Nenhum\``;

                } else {

                    cargosSM = cargosSM.map(c => `<@&${c}>`).join('\n');

                }

                let embedSejaM = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Seja Membro`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Url personalizada`, value: `${url}`, inline: true },
                        { name: `Canal do seja membro`, value: `${canalSejaM}`, inline: false },
                        { name: `Logs do seja membro`, value: `${canallogsSejaM}`, inline: false },
                        { name: `Cargos recebidos`, value: `${cargosSM}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                let rowSejaM = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Escolher url do servidor")
                            .setCustomId('urlSejaMNB')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais seja membro")
                            .setCustomId('canaisSejaMNB')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosSejaMembroNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosSejaMembroNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do seja membro")
                            .setCustomId("embedSejaMNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackSejaM = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedSejaM], components: [rowSejaM, rowBackSejaM] })

            }

            if (b.customId == 'urlSejaMNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o nome da url personalizada do servidor\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.content;

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    if (ee.includes('discord.gg/' || 'discordapp.com/invite/' || 'https://' || 'wwww')) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor apenas o nome da url (Ex:)`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Url personalizada setada com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`urlSejaMNB_`, ee);

                        let url = await db.get(`urlSejaMNB_`);

                        if (url) {

                            url = `[${url}](https://discord.gg/${url})`;

                        } else {

                            url = `\`Não foi definida.\``
                        }

                        let canalSejaM = await db.get(`canalSejaMNB_${b.guild.id}`);

                        if (!canalSejaM) {

                            canalSejaM = `\`Não foi definido.\``

                        } else {

                            canalSejaM = `<#${canalSejaM}>`
                        }

                        let canallogsSejaM = await db.get(`canallogsSejaMNB_${b.guild.id}`);

                        if (!canallogsSejaM) {

                            canallogsSejaM = `\`Não foi definido.\``

                        } else {

                            canallogsSejaM = `<#${canallogsSejaM}>`
                        }

                        let cargosSM = await db.get(`cargosSM_${b.guild.id}.cargosSM`);

                        if (!cargosSM || cargosSM.length == 0) {

                            cargosSM = `\`Nenhum\``;

                        } else {

                            cargosSM = cargosSM.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedSejaM = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Seja Membro`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Url personalizada`, value: `${url}`, inline: true },
                                { name: `Canal do seja membro`, value: `${canalSejaM}`, inline: false },
                                { name: `Logs do seja membro`, value: `${canallogsSejaM}`, inline: false },
                                { name: `Cargos recebidos`, value: `${cargosSM}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedSejaM] });
                    }
                })
            }

            if (b.customId == 'addcargosSejaMembroNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.push(`cargosSM_${b.guild.id}.cargosSM`, cargo.id);

                        let url = await db.get(`urlSejaMNB_`);

                        if (url) {

                            url = `[${url}](https://discord.gg/${url})`;

                        } else {

                            url = `\`Não foi definida.\``
                        }

                        let canalSejaM = await db.get(`canalSejaMNB_${b.guild.id}`);

                        if (!canalSejaM) {

                            canalSejaM = `\`Não foi definido.\``

                        } else {

                            canalSejaM = `<#${canalSejaM}>`
                        }

                        let canallogsSejaM = await db.get(`canallogsSejaMNB_${b.guild.id}`);

                        if (!canallogsSejaM) {

                            canallogsSejaM = `\`Não foi definido.\``

                        } else {

                            canallogsSejaM = `<#${canallogsSejaM}>`
                        }

                        let cargosSM = await db.get(`cargosSM_${b.guild.id}.cargosSM`);

                        if (!cargosSM || cargosSM.length == 0) {

                            cargosSM = `\`Nenhum\``;

                        } else {

                            cargosSM = cargosSM.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedSejaM = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Seja Membro`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Url personalizada`, value: `${url}`, inline: true },
                                { name: `Canal do seja membro`, value: `${canalSejaM}`, inline: false },
                                { name: `Logs do seja membro`, value: `${canallogsSejaM}`, inline: false },
                                { name: `Cargos recebidos`, value: `${cargosSM}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedSejaM] })

                    }

                })

            }

            if (b.customId == 'removcargosSejaMembroNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargosSM_${b.guild.id}.cargosSM`, (await db.get(`cargosSM_${b.guild.id}.cargosSM`))?.filter(e => e !== `${cargo.id}`));

                        let url = await db.get(`urlSejaMNB_`);

                        if (url) {

                            url = `[${url}](https://discord.gg/${url})`;

                        } else {

                            url = `\`Não foi definida.\``
                        }

                        let canalSejaM = await db.get(`canalSejaMNB_${b.guild.id}`);

                        if (!canalSejaM) {

                            canalSejaM = `\`Não foi definido.\``

                        } else {

                            canalSejaM = `<#${canalSejaM}>`
                        }

                        let canallogsSejaM = await db.get(`canallogsSejaMNB_${b.guild.id}`);

                        if (!canallogsSejaM) {

                            canallogsSejaM = `\`Não foi definido.\``

                        } else {

                            canallogsSejaM = `<#${canallogsSejaM}>`
                        }

                        let cargosSM = await db.get(`cargosSM_${b.guild.id}.cargosSM`);

                        if (!cargosSM || cargosSM.length == 0) {

                            cargosSM = `\`Nenhum\``;

                        } else {

                            cargosSM = cargosSM.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedSejaM = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Seja Membro`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Url personalizada`, value: `${url}`, inline: true },
                                { name: `Canal do seja membro`, value: `${canalSejaM}`, inline: false },
                                { name: `Logs do seja membro`, value: `${canallogsSejaM}`, inline: false },
                                { name: `Cargos recebidos`, value: `${cargosSM}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedSejaM] })

                    }

                })

            }

            if (b.customId == 'voltarSM') {

                b.deferUpdate();

                let url = await db.get(`urlSejaMNB_`);

                if (url) {

                    url = `[${url}](https://discord.gg/${url})`;

                } else {

                    url = `\`Não foi definida.\``
                }

                let canalSejaM = await db.get(`canalSejaMNB_${b.guild.id}`);

                if (!canalSejaM) {

                    canalSejaM = `\`Não foi definido.\``

                } else {

                    canalSejaM = `<#${canalSejaM}>`
                }

                let canallogsSejaM = await db.get(`canallogsSejaMNB_${b.guild.id}`);

                if (!canallogsSejaM) {

                    canallogsSejaM = `\`Não foi definido.\``

                } else {

                    canallogsSejaM = `<#${canallogsSejaM}>`
                }

                let cargosSM = await db.get(`cargosSM_${b.guild.id}.cargosSM`);

                if (!cargosSM || cargosSM.length == 0) {

                    cargosSM = `\`Nenhum\``;

                } else {

                    cargosSM = cargosSM.map(c => `<@&${c}>`).join('\n');

                }

                let embedSejaM = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Seja Membro`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Url personalizada`, value: `${url}`, inline: true },
                        { name: `Canal do seja membro`, value: `${canalSejaM}`, inline: false },
                        { name: `Logs do seja membro`, value: `${canallogsSejaM}`, inline: false },
                        { name: `Cargos recebidos`, value: `${cargosSM}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                let rowSejaM = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Escolher url do servidor")
                            .setCustomId('urlSejaMNB')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais seja membro")
                            .setCustomId('canaisSejaMNB')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosSejaMembroNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosSejaMembroNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do seja membro")
                            .setCustomId("embedSejaMNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackSejaM = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedSejaM], components: [rowSejaM, rowBackSejaM] })

            }

            if (b.customId == 'embedSejaMNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloSejaM_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descSejaM_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoSejaM_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageSejaM_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookWl = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloSM')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descSM')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageSM')
                            .setStyle(Discord.ButtonStyle.Primary))

                let rowEmbedWl2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoSM')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarSM')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarSM")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookWl], components: [rowEmbedWl, rowEmbedWl2, rowBackWl] }).then(async (msg) => {

                    const filter = (i) => i.user.id === message.author.id;
                    const collector = msg.createMessageComponentCollector({ filter });

                    collector.on('collect', async (b) => {

                        if (b.customId == 'tituloSM') {

                            let embedmsgs = new Discord.EmbedBuilder()
                                .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                                .setColor(`${colorNB}`)

                            b.reply({ embeds: [embedmsgs], ephemeral: true });

                            let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                            coletor.on("collect", async (message) => {

                                message.delete();

                                let title = message.content;

                                if (title == "cancelar") {

                                    coletor.stop('Collector stopped manually');

                                    let errado = new Discord.EmbedBuilder()
                                        .setDescription(`Operação cancelada com sucesso.`)
                                        .setColor(`${colorNB}`)

                                    return b.editReply({ embeds: [errado], ephemeral: true })

                                } else {

                                    let correto = new Discord.EmbedBuilder()
                                        .setDescription(`Título definido com sucesso.`)
                                        .setColor(`${colorNB}`)

                                    b.editReply({ embeds: [correto], ephemeral: true })

                                    await db.set(`tituloSejaM_${b.guild.id}`, title);

                                    let titulo = await db.get(`tituloSejaM_${b.guild.id}`);
                                    if (!titulo) titulo = 'Título'
                                    let desc = await db.get(`descSejaM_${b.guild.id}`);
                                    if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                                    let thumb = await db.get(`imagemdecantoSejaM_${b.guild.id}`);
                                    if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                                    let image = await db.get(`setimageSejaM_${b.guild.id}`);
                                    if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                                    const webhookWl = new Discord.EmbedBuilder()
                                        .setTitle(`${titulo}`)
                                        .setDescription(`${desc}`)
                                        .setThumbnail(`${thumb}`)
                                        .setColor(`${colorNB}`)
                                        .setImage(`${image}`)
                                        .setFooter({ text: `${b.guild.name} ©` })

                                    MESSAGE.edit({ embeds: [webhookWl] });

                                }

                            })
                        }

                    })

                })

            }

            if (b.customId == 'descSM') {

                let tit = await db.get(`tituloSejaM_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descSejaM_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloSejaM_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descSejaM_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoSejaM_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageSejaM_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimageSM") {

                let descri = await db.get(`descSejaM_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;

                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoTell_${b.guild.id}`, MENSAGEM.attachments.first().url);


                            await db.set(`setimageSejaM_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloSejaM_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descSejaM_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoSejaM_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageSejaM_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                }
                )

            } // fim setimagem

            if (b.customId == "imagemcantoSM") {

                let descri = await db.get(`descSejaM_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoSejaM_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloSejaM_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descSejaM_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoSejaM_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageSejaM_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });
                        }
                    })
                }
                )

            } // fim imagem de canto

            if (b.customId == 'enviarSM') {

                let descri = await db.get(`descSejaM_${b.guild.id}`);
                let canalReg = await db.get(`canalSejaMNB_${b.guild.id}`);
                let url = await db.get(`urlSejaMNB_`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalReg);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal do seja membro\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                if (!url) {

                    let semurl = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou a \`url personalizada\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semurl], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloSejaM_${b.guild.id}`);
                    let desc = await db.get(`descSejaM_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoSejaM_${b.guild.id}`);
                    let image = await db.get(`setimageSejaM_${b.guild.id}`);

                    const embedWl = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    let rowWl = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Verificar")
                                .setCustomId('sejamembro')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    await canal.send({ embeds: [embedWl], components: [rowWl] }).catch(err => { })

                }
            }

            if (b.customId == 'voltarMigra') {

                b.deferUpdate()

                let canalMigra = await db.get(`canalMigraNB_${b.guild.id}`);
                let canalfichasMigra = await db.get(`canalfichasMigraNB_${b.guild.id}`);
                let canallogsMigra = await db.get(`canallogsMigraNB_${b.guild.id}`);

                if (!canalMigra) {

                    canalMigra = `\`Não foi definido.\``

                } else {

                    canalMigra = `<#${canalMigra}>`
                }

                if (!canalfichasMigra) {

                    canalfichasMigra = `\`Não foi definido.\``

                } else {

                    canalfichasMigra = `<#${canalfichasMigra}>`
                }

                if (!canallogsMigra) {

                    canallogsMigra = `\`Não foi definido.\``

                } else {

                    canallogsMigra = `<#${canallogsMigra}>`
                }

                let cargosMigra = await db.get(`cargosMigra_${b.guild.id}.cargosMigra`);

                if (!cargosMigra || cargosMigra.length == 0) {

                    cargosMigra = `\`Nenhum\``;

                } else {

                    cargosMigra = cargosMigra.map(c => `<@&${c}>`).join('\n');

                }

                let embedMigra = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Migração`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal da migração`, value: `${canalMigra}`, inline: false },
                        { name: `Canal das fichas`, value: `${canalfichasMigra}`, inline: false },
                        { name: `Canal dos logs`, value: `${canallogsMigra}`, inline: false },
                        { name: `Cargos autorizados`, value: `${cargosMigra}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowMigra = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais da migração")
                            .setCustomId("canaisMigraNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosMigraNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosMigraNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed da migração")
                            .setCustomId("embedMigraNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackMigra = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedMigra], components: [rowMigra, rowBackMigra] });
            }

            if (b.customId == 'migracaoNB') {

                b.deferUpdate()

                let canalMigra = await db.get(`canalMigraNB_${b.guild.id}`);
                let canalfichasMigra = await db.get(`canalfichasMigraNB_${b.guild.id}`);
                let canallogsMigra = await db.get(`canallogsMigraNB_${b.guild.id}`);

                if (!canalMigra) {

                    canalMigra = `\`Não foi definido.\``

                } else {

                    canalMigra = `<#${canalMigra}>`
                }

                if (!canalfichasMigra) {

                    canalfichasMigra = `\`Não foi definido.\``

                } else {

                    canalfichasMigra = `<#${canalfichasMigra}>`
                }

                if (!canallogsMigra) {

                    canallogsMigra = `\`Não foi definido.\``

                } else {

                    canallogsMigra = `<#${canallogsMigra}>`
                }

                let cargosMigra = await db.get(`cargosMigra_${b.guild.id}.cargosMigra`);

                if (!cargosMigra || cargosMigra.length == 0) {

                    cargosMigra = `\`Nenhum\``;

                } else {

                    cargosMigra = cargosMigra.map(c => `<@&${c}>`).join('\n');

                }

                let embedMigra = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Migração`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal da migração`, value: `${canalMigra}`, inline: false },
                        { name: `Canal das fichas`, value: `${canalfichasMigra}`, inline: false },
                        { name: `Canal dos logs`, value: `${canallogsMigra}`, inline: false },
                        { name: `Cargos autorizados`, value: `${cargosMigra}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowMigra = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais da migração")
                            .setCustomId("canaisMigraNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosMigraNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosMigraNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed da migração")
                            .setCustomId("embedMigraNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackMigra = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedMigra], components: [rowMigra, rowBackMigra] });
            }

            if (b.customId == 'addcargosMigraNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.push(`cargosMigra_${b.guild.id}.cargosMigra`, cargo.id);

                        let canalMigra = await db.get(`canalMigraNB_${b.guild.id}`);
                        let canalfichasMigra = await db.get(`canalfichasMigraNB_${b.guild.id}`);
                        let canallogsMigra = await db.get(`canallogsMigraNB_${b.guild.id}`);

                        if (!canalMigra) {

                            canalMigra = `\`Não foi definido.\``

                        } else {

                            canalMigra = `<#${canalMigra}>`
                        }

                        if (!canalfichasMigra) {

                            canalfichasMigra = `\`Não foi definido.\``

                        } else {

                            canalfichasMigra = `<#${canalfichasMigra}>`
                        }

                        if (!canallogsMigra) {

                            canallogsMigra = `\`Não foi definido.\``

                        } else {

                            canallogsMigra = `<#${canallogsMigra}>`
                        }

                        let cargosMigra = await db.get(`cargosMigra_${b.guild.id}.cargosMigra`);

                        if (!cargosMigra || cargosMigra.length == 0) {

                            cargosMigra = `\`Nenhum\``;

                        } else {

                            cargosMigra = cargosMigra.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedMigra = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Migração`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal da migração`, value: `${canalMigra}`, inline: false },
                                { name: `Canal das fichas`, value: `${canalfichasMigra}`, inline: false },
                                { name: `Canal dos logs`, value: `${canallogsMigra}`, inline: false },
                                { name: `Cargos autorizados`, value: `${cargosMigra}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedMigra] })

                    }

                })

            }

            if (b.customId == 'removcargosMigraNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargosMigra_${b.guild.id}.cargosMigra`, (await db.get(`cargosMigra_${b.guild.id}.cargosMigra`))?.filter(e => e !== `${cargo.id}`));

                        let canalMigra = await db.get(`canalMigraNB_${b.guild.id}`);
                        let canalfichasMigra = await db.get(`canalfichasMigraNB_${b.guild.id}`);
                        let canallogsMigra = await db.get(`canallogsMigraNB_${b.guild.id}`);

                        if (!canalMigra) {

                            canalMigra = `\`Não foi definido.\``

                        } else {

                            canalMigra = `<#${canalMigra}>`
                        }

                        if (!canalfichasMigra) {

                            canalfichasMigra = `\`Não foi definido.\``

                        } else {

                            canalfichasMigra = `<#${canalfichasMigra}>`
                        }

                        if (!canallogsMigra) {

                            canallogsMigra = `\`Não foi definido.\``

                        } else {

                            canallogsMigra = `<#${canallogsMigra}>`
                        }

                        let cargosMigra = await db.get(`cargosMigra_${b.guild.id}.cargosMigra`);

                        if (!cargosMigra || cargosMigra.length == 0) {

                            cargosMigra = `\`Nenhum\``;

                        } else {

                            cargosMigra = cargosMigra.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedMigra = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Migração`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal da migração`, value: `${canalMigra}`, inline: false },
                                { name: `Canal das fichas`, value: `${canalfichasMigra}`, inline: false },
                                { name: `Canal dos logs`, value: `${canallogsMigra}`, inline: false },
                                { name: `Cargos autorizados`, value: `${cargosMigra}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedMigra] })

                    }

                })

            } //aq

            if (b.customId == 'embedMigraNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloMigra_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descMigra_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoMigra_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageMigra_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookWl = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloMigra')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descMigra')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageMigra')
                            .setStyle(Discord.ButtonStyle.Secondary))

                let rowEmbedWl2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoMigra')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarMigra')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMigra")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookWl], components: [rowEmbedWl, rowEmbedWl2, rowBackWl] }).then(async (msg) => {

                    const filter = (i) => i.user.id === message.author.id;
                    const collector = msg.createMessageComponentCollector({ filter });

                    collector.on('collect', async (b) => {

                        if (b.customId == 'tituloMigra') {

                            let embedmsgs = new Discord.EmbedBuilder()
                                .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                                .setColor(`${colorNB}`)

                            b.reply({ embeds: [embedmsgs], ephemeral: true });

                            let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                            coletor.on("collect", async (message) => {

                                message.delete();

                                let title = message.content;

                                if (title == "cancelar") {

                                    coletor.stop('Collector stopped manually');

                                    let errado = new Discord.EmbedBuilder()
                                        .setDescription(`Operação cancelada com sucesso.`)
                                        .setColor(`${colorNB}`)

                                    return b.editReply({ embeds: [errado], ephemeral: true })

                                } else {

                                    let correto = new Discord.EmbedBuilder()
                                        .setDescription(`Título definido com sucesso.`)
                                        .setColor(`${colorNB}`)

                                    b.editReply({ embeds: [correto], ephemeral: true })

                                    await db.set(`tituloMigra_${b.guild.id}`, title);

                                    let titulo = await db.get(`tituloMigra_${b.guild.id}`);
                                    if (!titulo) titulo = 'Título'
                                    let desc = await db.get(`descMigra_${b.guild.id}`);
                                    if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                                    let thumb = await db.get(`imagemdecantoMigra_${b.guild.id}`);
                                    if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                                    let image = await db.get(`setimageMigra_${b.guild.id}`);
                                    if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                                    const webhookWl = new Discord.EmbedBuilder()
                                        .setTitle(`${titulo}`)
                                        .setDescription(`${desc}`)
                                        .setThumbnail(`${thumb}`)
                                        .setColor(`${colorNB}`)
                                        .setImage(`${image}`)
                                        .setFooter({ text: `${b.guild.name} ©` })

                                    MESSAGE.edit({ embeds: [webhookWl] });

                                }

                            })
                        }

                    })

                })

            }

            if (b.customId == 'descMigra') {

                let tit = await db.get(`tituloMigra_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descMigra_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloMigra_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descMigra_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoMigra_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageMigra_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimageMigra") {

                let descri = await db.get(`descMigra_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimageMigra_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloMigra_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descMigra_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoMigra_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageMigra_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                }
                )

            } // fim setimagem

            if (b.customId == "imagemcantoMigra") {

                let descri = await db.get(`descMigra_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoMigra_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloMigra_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descMigra_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoMigra_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageMigra_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });
                        }
                    })
                }
                )

            } // fim imagem de canto

            if (b.customId == 'enviarMigra') {

                let descri = await db.get(`descMigra_${b.guild.id}`);
                let canalMigra = await db.get(`canalMigraNB_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalMigra);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal da migração\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloMigra_${b.guild.id}`);
                    let desc = await db.get(`descMigra_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoMigra_${b.guild.id}`);
                    let image = await db.get(`setimageMigra_${b.guild.id}`);

                    const embedMigra = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    const rowMigra = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.StringSelectMenuBuilder()
                                .setCustomId('sistemamigracao')
                                .setPlaceholder('Nada selecionado.')
                                .addOptions([
                                    {
                                        label: 'Migração',
                                        description: 'Abrir um ticket de migração.',
                                        emoji: '1068017621968113684',
                                        value: 'migracao',

                                    },

                                    {
                                        label: 'Recrutamento',
                                        description: 'Abrir um ticket de recrutamento.',
                                        emoji: '1072654941346340865',
                                        value: 'recruta',
                                    },

                                ])
                        )

                    await canal.send({ embeds: [embedMigra], components: [rowMigra] }).catch(err => { })

                }
            }
            if (b.customId == 'voltarVerific') {

                b.deferUpdate()

                let canalVerific = await db.get(`canalVerificNB_${b.guild.id}`);
                let cargoVerific = await db.get(`cargoVerificNB_${b.guild.id}`);
                let canallogsVerific = await db.get(`canallogsVerificNB_${b.guild.id}`);

                if (!canalVerific) {

                    canalVerific = `\`Não foi definido.\``

                } else {

                    canalVerific = `<#${canalVerific}>`
                }

                if (!cargoVerific) {

                    cargoVerific = `\`Não foi definido.\``

                } else {

                    cargoVerific = `<@&${cargoVerific}>`
                }

                if (!canallogsVerific) {

                    canallogsVerific = `\`Não foi definido.\``

                } else {

                    canallogsVerific = `<#${canallogsVerific}>`
                }

                let cargosVerific = await db.get(`cargosVerific_${b.guild.id}.cargosVerific`);

                if (!cargosVerific || cargosVerific.length == 0) {

                    cargosVerific = `\`Nenhum\``;

                } else {

                    cargosVerific = cargosVerific.map(c => `<@&${c}>`).join('\n');

                }

                let embedVerific = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Verificação`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal da verificação`, value: `${canalVerific}`, inline: true },
                        { name: `Cargo de verificado`, value: `${cargoVerific}`, inline: true },
                        { name: `Logs da verificação`, value: `${canallogsVerific}`, inline: false },
                        { name: `Cargos autorizados`, value: `${cargosVerific}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowVerific = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais da verificação")
                            .setCustomId("canaisVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir cargo de verificado")
                            .setCustomId("cargoVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed da verificação")
                            .setCustomId("embedVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackVerific = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedVerific], components: [rowVerific, rowBackVerific] })

            }

            if (b.customId == 'verificarNB') {

                b.deferUpdate()

                let canalVerific = await db.get(`canalVerificNB_${b.guild.id}`);
                let cargoVerific = await db.get(`cargoVerificNB_${b.guild.id}`);
                let canallogsVerific = await db.get(`canallogsVerificNB_${b.guild.id}`);

                if (!canalVerific) {

                    canalVerific = `\`Não foi definido.\``

                } else {

                    canalVerific = `<#${canalVerific}>`
                }

                if (!cargoVerific) {

                    cargoVerific = `\`Não foi definido.\``

                } else {

                    cargoVerific = `<@&${cargoVerific}>`
                }

                if (!canallogsVerific) {

                    canallogsVerific = `\`Não foi definido.\``

                } else {

                    canallogsVerific = `<#${canallogsVerific}>`
                }

                let cargosVerific = await db.get(`cargosVerific_${b.guild.id}.cargosVerific`);

                if (!cargosVerific || cargosVerific.length == 0) {

                    cargosVerific = `\`Nenhum\``;

                } else {

                    cargosVerific = cargosVerific.map(c => `<@&${c}>`).join('\n');

                }

                let embedVerific = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Verificação`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal da verificação`, value: `${canalVerific}`, inline: true },
                        { name: `Cargo de verificado`, value: `${cargoVerific}`, inline: true },
                        { name: `Logs da verificação`, value: `${canallogsVerific}`, inline: false },
                        { name: `Cargos autorizados`, value: `${cargosVerific}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowVerific = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais da verificação")
                            .setCustomId("canaisVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir cargo de verificado")
                            .setCustomId("cargoVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed da verificação")
                            .setCustomId("embedVerificNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackVerific = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedVerific], components: [rowVerific, rowBackVerific] })

            }

            if (b.customId == 'cargoVerificNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargoVerificNB_${b.guild.id}`, cargo.id);

                        let canalVerific = await db.get(`canalVerificNB_${b.guild.id}`);
                        let cargoVerific = await db.get(`cargoVerificNB_${b.guild.id}`);
                        let canallogsVerific = await db.get(`canallogsVerificNB_${b.guild.id}`);

                        if (!canalVerific) {

                            canalVerific = `\`Não foi definido.\``

                        } else {

                            canalVerific = `<#${canalVerific}>`
                        }

                        if (!cargoVerific) {

                            cargoVerific = `\`Não foi definido.\``

                        } else {

                            cargoVerific = `<@&${cargoVerific}>`
                        }

                        if (!canallogsVerific) {

                            canallogsVerific = `\`Não foi definido.\``

                        } else {

                            canallogsVerific = `<#${canallogsVerific}>`
                        }

                        let cargosVerific = await db.get(`cargosVerific_${b.guild.id}.cargosVerific`);

                        if (!cargosVerific || cargosVerific.length == 0) {

                            cargosVerific = `\`Nenhum\``;

                        } else {

                            cargosVerific = cargosVerific.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedVerific = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Verificação`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal da verificação`, value: `${canalVerific}`, inline: true },
                                { name: `Cargo de verificado`, value: `${cargoVerific}`, inline: true },
                                { name: `Logs da verificação`, value: `${canallogsVerific}`, inline: false },
                                { name: `Cargos autorizados`, value: `${cargosVerific}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedVerific] });

                    }

                })

            }

            if (b.customId == 'addcargosVerificNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.push(`cargosVerific_${b.guild.id}.cargosVerific`, cargo.id);

                        let canalVerific = await db.get(`canalVerificNB_${b.guild.id}`);
                        let cargoVerific = await db.get(`cargoVerificNB_${b.guild.id}`);
                        let canallogsVerific = await db.get(`canallogsVerificNB_${b.guild.id}`);

                        if (!canalVerific) {

                            canalVerific = `\`Não foi definido.\``

                        } else {

                            canalVerific = `<#${canalVerific}>`
                        }

                        if (!cargoVerific) {

                            cargoVerific = `\`Não foi definido.\``

                        } else {

                            cargoVerific = `<@&${cargoVerific}>`
                        }

                        if (!canallogsVerific) {

                            canallogsVerific = `\`Não foi definido.\``

                        } else {

                            canallogsVerific = `<#${canallogsVerific}>`
                        }

                        let cargosVerific = await db.get(`cargosVerific_${b.guild.id}.cargosVerific`);

                        if (!cargosVerific || cargosVerific.length == 0) {

                            cargosVerific = `\`Nenhum\``;

                        } else {

                            cargosVerific = cargosVerific.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedVerific = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Verificação`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal da verificação`, value: `${canalVerific}`, inline: true },
                                { name: `Cargo de verificado`, value: `${cargoVerific}`, inline: true },
                                { name: `Logs da verificação`, value: `${canallogsVerific}`, inline: false },
                                { name: `Cargos autorizados`, value: `${cargosVerific}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedVerific] });

                    }

                })

            }

            if (b.customId == 'removcargosVerificNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargosVerific_${b.guild.id}.cargosVerific`, (await db.get(`cargosVerific_${b.guild.id}.cargosVerific`))?.filter(e => e !== `${cargo.id}`));

                        let canalVerific = await db.get(`canalVerificNB_${b.guild.id}`);
                        let cargoVerific = await db.get(`cargoVerificNB_${b.guild.id}`);
                        let canallogsVerific = await db.get(`canallogsVerificNB_${b.guild.id}`);

                        if (!canalVerific) {

                            canalVerific = `\`Não foi definido.\``

                        } else {

                            canalVerific = `<#${canalVerific}>`
                        }

                        if (!cargoVerific) {

                            cargoVerific = `\`Não foi definido.\``

                        } else {

                            cargoVerific = `<@&${cargoVerific}>`
                        }

                        if (!canallogsVerific) {

                            canallogsVerific = `\`Não foi definido.\``

                        } else {

                            canallogsVerific = `<#${canallogsVerific}>`
                        }

                        let cargosVerific = await db.get(`cargosVerific_${b.guild.id}.cargosVerific`);

                        if (!cargosVerific || cargosVerific.length == 0) {

                            cargosVerific = `\`Nenhum\``;

                        } else {

                            cargosVerific = cargosVerific.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedVerific = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Verificação`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal da verificação`, value: `${canalVerific}`, inline: true },
                                { name: `Cargo de verificado`, value: `${cargoVerific}`, inline: true },
                                { name: `Logs da verificação`, value: `${canallogsVerific}`, inline: false },
                                { name: `Cargos autorizados`, value: `${cargosVerific}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedVerific] });
                    }

                })
            } // fim cargos

            if (b.customId == 'embedVerificNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloVerific_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descVerific_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoVerific_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageVerific_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookWl = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloVerific')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descVerific')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageVerific')
                            .setStyle(Discord.ButtonStyle.Secondary))

                let rowEmbedWl2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoVerific')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarVerific')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarVerific")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookWl], components: [rowEmbedWl, rowEmbedWl2, rowBackWl] })

            }

            if (b.customId == 'tituloVerific') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let title = message.content;

                    if (title == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Título definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`tituloVerific_${b.guild.id}`, title);

                        let titulo = await db.get(`tituloVerific_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descVerific_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoVerific_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageVerific_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] });

                    }
                })
            }

            if (b.customId == 'descVerific') {

                let tit = await db.get(`tituloVerific_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descVerific_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloVerific_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descVerific_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoVerific_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageVerific_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimageVerific") {

                let descri = await db.get(`descVerific_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimageVerific_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloVerific_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descVerific_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoVerific_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageVerific_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                })
            }

            if (b.customId == "imagemcantoVerific") {

                let descri = await db.get(`descVerific_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoVerific_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloVerific_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descVerific_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoVerific_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageVerific_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });
                        }
                    })
                }
                )
            }

            if (b.customId == 'enviarVerific') {

                let descri = await db.get(`descVerific_${b.guild.id}`);
                let canalVerific = await db.get(`canalVerificNB_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalVerific);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal da verificação\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloVerific_${b.guild.id}`);
                    let desc = await db.get(`descVerific_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoVerific_${b.guild.id}`);
                    let image = await db.get(`setimageVerific_${b.guild.id}`);

                    const embedVerific = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    const rowVerific = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Iniciar Verificação")
                                
                                .setCustomId('verificar')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    await canal.send({ embeds: [embedVerific], components: [rowVerific] }).catch(err => { })

                }
            }

            if (b.customId == 'voltarSuporte') {

                b.deferUpdate()

                let canalSup = await db.get(`canalSuporteNB_${b.guild.id}`);

                if (!canalSup) {

                    canalSup = `\`Não foi definido.\``

                } else {

                    canalSup = `<#${canalSup}>`
                }

                let cargosSup = await db.get(`cargosSup_${b.guild.id}.cargosSup`);

                if (!cargosSup || cargosSup.length == 0) {

                    cargosSup = `\`Nenhum\``;

                } else {

                    cargosSup = cargosSup.map(c => `<@&${c}>`).join('\n');

                }

                let embedSuporte = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Suporte`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal do suporte`, value: `${canalSup}`, inline: true },
                        { name: `Cargos autorizados`, value: `${cargosSup}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowSuporte = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal do suporte")
                            .setCustomId("canalSuporteNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosSuporteNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosSuporteNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do suporte")
                            .setCustomId("embedSuporteNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackSuporte = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedSuporte], components: [rowSuporte, rowBackSuporte] })

            }

            if (b.customId == 'suporteNB') {

                b.deferUpdate()

                let canalSup = await db.get(`canalSuporteNB_${b.guild.id}`);

                if (!canalSup) {

                    canalSup = `\`Não foi definido.\``

                } else {

                    canalSup = `<#${canalSup}>`
                }

                let cargosSup = await db.get(`cargosSup_${b.guild.id}.cargosSup`);

                if (!cargosSup || cargosSup.length == 0) {

                    cargosSup = `\`Nenhum\``;

                } else {

                    cargosSup = cargosSup.map(c => `<@&${c}>`).join('\n');

                }

                let embedSuporte = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Suporte`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal do suporte`, value: `${canalSup}`, inline: true },
                        { name: `Cargos autorizados`, value: `${cargosSup}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowSuporte = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal do suporte")
                            .setCustomId("canalSuporteNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosSuporteNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosSuporteNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do suporte")
                            .setCustomId("embedSuporteNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackSuporte = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedSuporte], components: [rowSuporte, rowBackSuporte] })

            }

            if (b.customId == 'canalSuporteNB') {

                let embedCanalSup = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (#canal/id) do canal desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCanalSup], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let canal = b.guild.channels.cache.get(ee.id);

                    if (!canal) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`canalSuporteNB_${b.guild.id}`, canal.id);

                        let canalSup = await db.get(`canalSuporteNB_${b.guild.id}`);

                        if (!canalSup) {

                            canalSup = `\`Não foi definido.\``

                        } else {

                            canalSup = `<#${canalSup}>`
                        }

                        let cargosSup = await db.get(`cargosSup_${b.guild.id}.cargosSup`);

                        if (!cargosSup || cargosSup.length == 0) {

                            cargosSup = `\`Nenhum\``;

                        } else {

                            cargosSup = cargosSup.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedSuporte = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Suporte`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal do suporte`, value: `${canalSup}`, inline: true },
                                { name: `Cargos autorizados`, value: `${cargosSup}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedSuporte] });

                    }

                })

            }

            if (b.customId == 'addcargosSuporteNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.push(`cargosSup_${b.guild.id}.cargosSup`, cargo.id);

                        let canalSup = await db.get(`canalSuporteNB_${b.guild.id}`);

                        if (!canalSup) {

                            canalSup = `\`Não foi definido.\``

                        } else {

                            canalSup = `<#${canalSup}>`
                        }

                        let cargosSup = await db.get(`cargosSup_${b.guild.id}.cargosSup`);

                        if (!cargosSup || cargosSup.length == 0) {

                            cargosSup = `\`Nenhum\``;

                        } else {

                            cargosSup = cargosSup.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedSuporte = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Suporte`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal do suporte`, value: `${canalSup}`, inline: true },
                                { name: `Cargos autorizados`, value: `${cargosSup}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedSuporte] });

                    }

                })

            }

            if (b.customId == 'removcargosSuporteNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargosSup_${b.guild.id}.cargosSup`, (await db.get(`cargosSup_${b.guild.id}.cargosSup`))?.filter(e => e !== `${cargo.id}`));

                        let canalSup = await db.get(`canalSuporteNB_${b.guild.id}`);

                        if (!canalSup) {

                            canalSup = `\`Não foi definido.\``

                        } else {

                            canalSup = `<#${canalSup}>`
                        }

                        let cargosSup = await db.get(`cargosSup_${b.guild.id}.cargosSup`);

                        if (!cargosSup || cargosSup.length == 0) {

                            cargosSup = `\`Nenhum\``;

                        } else {

                            cargosSup = cargosSup.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedSuporte = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Suporte`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal do suporte`, value: `${canalSup}`, inline: true },
                                { name: `Cargos autorizados`, value: `${cargosSup}`, inline: false }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedSuporte] });
                    }
                })
            }

            if (b.customId == 'embedSuporteNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloSuporte_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descSuporte_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoSuporte_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageSuporte_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookWl = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloSuporte')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descSuporte')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageSuporte')
                            .setStyle(Discord.ButtonStyle.Primary))

                let rowEmbedWl2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoSuporte')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarSuporte')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarSuporte")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookWl], components: [rowEmbedWl, rowEmbedWl2, rowBackWl] }).then(async (msg) => {

                    const filter = (i) => i.user.id === message.author.id;
                    const collector = msg.createMessageComponentCollector({ filter });

                    collector.on('collect', async (b) => {

                        if (b.customId == 'tituloSuporte') {

                            let embedmsgs = new Discord.EmbedBuilder()
                                .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                                .setColor(`${colorNB}`)

                            b.reply({ embeds: [embedmsgs], ephemeral: true });

                            let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                            coletor.on("collect", async (message) => {

                                message.delete();

                                let title = message.content;

                                if (title == "cancelar") {

                                    coletor.stop('Collector stopped manually');

                                    let errado = new Discord.EmbedBuilder()
                                        .setDescription(`Operação cancelada com sucesso.`)
                                        .setColor(`${colorNB}`)

                                    return b.editReply({ embeds: [errado], ephemeral: true })

                                } else {

                                    let correto = new Discord.EmbedBuilder()
                                        .setDescription(`Título definido com sucesso.`)
                                        .setColor(`${colorNB}`)

                                    b.editReply({ embeds: [correto], ephemeral: true })

                                    await db.set(`tituloSuporte_${b.guild.id}`, title);

                                    let titulo = await db.get(`tituloSuporte_${b.guild.id}`);
                                    if (!titulo) titulo = 'Título'
                                    let desc = await db.get(`descSuporte_${b.guild.id}`);
                                    if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                                    let thumb = await db.get(`imagemdecantoSuporte_${b.guild.id}`);
                                    if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                                    let image = await db.get(`setimageSuporte_${b.guild.id}`);
                                    if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                                    const webhookWl = new Discord.EmbedBuilder()
                                        .setTitle(`${titulo}`)
                                        .setDescription(`${desc}`)
                                        .setThumbnail(`${thumb}`)
                                        .setColor(`${colorNB}`)
                                        .setImage(`${image}`)
                                        .setFooter({ text: `${b.guild.name} ©` })

                                    MESSAGE.edit({ embeds: [webhookWl] });

                                }

                            })
                        }

                    })

                })

            }

            if (b.customId == 'descSuporte') {

                let tit = await db.get(`tituloSuporte_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descSuporte_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloSuporte_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descSuporte_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoSuporte_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageSuporte_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimageSuporte") {

                let descri = await db.get(`descSuporte_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimageSuporte_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloSuporte_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descSuporte_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoSuporte_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageSuporte_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                }
                )

            } // fim setimagem

            if (b.customId == "imagemcantoSuporte") {

                let descri = await db.get(`descSuporte_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoSuporte_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloSuporte_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descSuporte_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoSuporte_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageSuporte_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });
                        }
                    })
                }
                )

            } // fim imagem de canto

            if (b.customId == 'enviarSuporte') {

                let descri = await db.get(`descSuporte_${b.guild.id}`);
                let canalSuporte = await db.get(`canalSuporteNB_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalSuporte);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal do suporte\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloSuporte_${b.guild.id}`);
                    let desc = await db.get(`descSuporte_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoSuporte_${b.guild.id}`);
                    let image = await db.get(`setimageSuporte_${b.guild.id}`);

                    const embedSuporte = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    const rowSuporte = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.StringSelectMenuBuilder()
                                .setCustomId('ticket')
                                .setPlaceholder('Nada selecionado.')
                                .addOptions([
                                    {
                                        label: 'Ticket Suporte',
                                        description: 'Selecione esta opção para obter suporte.',
                                        value: 'suporte',

                                    },

                                    {
                                        label: 'Ticket Compras',
                                        description: 'Selecione esta opção para compras de vips etc.',
                                        value: 'denuncia',
                                    },

                                ])
                        )

                    await canal.send({ embeds: [embedSuporte], components: [rowSuporte] }).catch(err => { })

                }

            }

            if (b.customId == 'voltarInsta') {

                b.deferUpdate();

                let canalInsta = await db.get(`canaldoinsta_`);
                let canalDestaque = await db.get(`canaldodestaque_`);
                let cargoDestaque = await db.get(`tagdestaque_`);
                let diaReset = await db.get(`diadoresetinsta_`);

                if (!canalInsta) {

                    canalInsta = `\`Não foi definido.\``

                } else {

                    canalInsta = `<#${canalInsta}>`
                }

                if (!canalDestaque) {

                    canalDestaque = `\`Não foi definido.\``

                } else {

                    canalDestaque = `<#${canalDestaque}>`
                }

                if (!cargoDestaque) {

                    cargoDestaque = `\`Não foi definido.\``

                } else {

                    cargoDestaque = `<@&${cargoDestaque}>`
                }

                if (!diaReset) {

                    diaReset = `\`Não foi definido.\``

                } else {

                    let timeDb = diaReset || 0;
                    let timeCount = parseInt(timeDb - Date.now());

                    diaReset = `${ms(timeCount)}`;

                }

                const embedInsta = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Instagram`, iconURL: client.user.displayAvatarURL() })
                    .addFields(
                        { name: "Canal do Instagram", value: `${canalInsta}`, "inline": true },
                        { name: "Canal de Destaque", value: `${canalDestaque}`, "inline": true },
                        { name: "Tag de Destaque", value: `${cargoDestaque}`, "inline": true }
                    )
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowInsta = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar Instagram")
                            .setCustomId("configinstaNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Resetar sistema de destaque")
                            .setEmoji('1067811994507427881')
                            .setCustomId("resetinstaNB")
                            .setStyle(Discord.ButtonStyle.Danger))

                const rowBackInsta = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [embedInsta], components: [rowInsta, rowBackInsta], fetchReply: true })

            }

            if (b.customId == 'instaNB') {

                b.deferUpdate();

                let canalInsta = await db.get(`canaldoinsta_`);
                let canalDestaque = await db.get(`canaldodestaque_`);
                let cargoDestaque = await db.get(`tagdestaque_`);
                let diaReset = await db.get(`diadoresetinsta_`);

                if (!canalInsta) {

                    canalInsta = `\`Não foi definido.\``

                } else {

                    canalInsta = `<#${canalInsta}>`
                }

                if (!canalDestaque) {

                    canalDestaque = `\`Não foi definido.\``

                } else {

                    canalDestaque = `<#${canalDestaque}>`
                }

                if (!cargoDestaque) {

                    cargoDestaque = `\`Não foi definido.\``

                } else {

                    cargoDestaque = `<@&${cargoDestaque}>`
                }

                if (!diaReset) {

                    diaReset = `\`Não foi definido.\``

                } else {

                    let timeDb = diaReset || 0;
                    let timeCount = parseInt(timeDb - Date.now());

                    diaReset = `${ms(timeCount)}`;

                }

                const embedInsta = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Instagram`, iconURL: client.user.displayAvatarURL() })
                    .addFields(
                        { name: "Canal do Instagram", value: `${canalInsta}`, "inline": true },
                        { name: "Canal de Destaque", value: `${canalDestaque}`, "inline": true },
                        { name: "Tag de Destaque", value: `${cargoDestaque}`, "inline": true }

                    )
                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowInsta = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar Instagram")
                            .setCustomId("configinstaNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Resetar sistema de destaque")
                            .setEmoji('1067811994507427881')
                            .setCustomId("resetinstaNB")
                            .setStyle(Discord.ButtonStyle.Danger))

                const rowBackInsta = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [embedInsta], components: [rowInsta, rowBackInsta], fetchReply: true })

            }

            if (b.customId == 'resetinstaNB') {

                let embedReset = new Discord.EmbedBuilder()
                    .setDescription(`${b.member}, sistema de \`Destaque\` resetado com sucesso!`)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedReset], ephemeral: true });

                (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`likes_`)).forEach(async (element) => {

                    await db.delete(element);
                });

                (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`comentarios_`)).forEach(async (element) => {

                    await db.delete(element);
                });

                await db.delete(`msgInfluencer_${b.guild.id}`);
                await db.delete(`likesAtual_${b.guild.id}`);
            }

            if (b.customId == 'voltarTwitter') {

                b.deferUpdate();

                let canalTwitter = await db.get(`canaltwitter_`);

                if (!canalTwitter) {

                    canalTwitter = `\`Não foi definido.\``

                } else {

                    canalTwitter = `<#${canalTwitter}>`
                }


                const embedTwitter = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Twitter`, iconURL: client.user.displayAvatarURL() })
                    .addFields(
                        { name: "Canal do Twitter", value: `${canalTwitter}`, "inline": true },
                    )
                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowTwitter = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal do twitter")
                            .setCustomId("canaltwitter_")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackTwitter = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [embedTwitter], components: [rowTwitter, rowBackTwitter], fetchReply: true })
            }

            if (b.customId == 'ttNB') {

                b.deferUpdate();

                let canalTwitter = await db.get(`canaltwitter_`);

                if (!canalTwitter) {

                    canalTwitter = `\`Não foi definido.\``

                } else {

                    canalTwitter = `<#${canalTwitter}>`
                }


                const embedTwitter = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Twitter`, iconURL: client.user.displayAvatarURL() })
                    .addFields(
                        { name: "Canal do Twitter", value: `${canalTwitter}`, "inline": true },
                    )
                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowTwitter = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal do twitter")
                            .setCustomId("canaltwitterNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackTwitter = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarTwitter")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [embedTwitter], components: [rowTwitter, rowBackTwitter], fetchReply: true })
            }

            if (b.customId == 'canaltwitterNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (#canal/id) do canal desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let canal = b.guild.channels.cache.get(ee.id);

                    if (!canal) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Canal adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`canaltwitter_`, canal.id);

                        let hook = await canal.fetchWebhooks();

                        let webhook = hook.first();

                        if (!webhook) {

                            canal.createWebhook({
                                name: 'Twitter',
                                avatar: 'https://media.discordapp.net/attachments/1024812700351606906/1036007127153655911/twitter-logo-5476203-4602454.png',
                            })
                        }

                        let canalTwitter = await db.get(`canaltwitter_`);

                        if (!canalTwitter) {

                            canalTwitter = `\`Não foi definido.\``

                        } else {

                            canalTwitter = `<#${canalTwitter}>`
                        }


                        const embedTwitter = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Twitter`, iconURL: client.user.displayAvatarURL() })
                            .addFields(
                                { name: "Canal do Twitter", value: `${canalTwitter}`, "inline": true },
                            )
                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedTwitter] });
                    }
                })
            }

            if (b.customId == 'voltarTell') {

                b.deferUpdate()

                let canalcriarTell = await db.get(`canalcriarTellNB_${b.guild.id}`);
                let canalTell = await db.get(`canalTellNB_${b.guild.id}`);
                let canalfiltroTell = await db.get(`canalfiltroTellNB_${b.guild.id}`);

                if (!canalcriarTell) {

                    canalcriarTell = `\`Não foi definido.\``

                } else {

                    canalcriarTell = `<#${canalcriarTell}>`
                }

                if (!canalTell) {

                    canalTell = `\`Não foi definido.\``

                } else {

                    canalTell = `<#${canalTell}>`
                }

                if (!canalfiltroTell) {

                    canalfiltroTell = `\`Não foi definido.\``

                } else {

                    canalfiltroTell = `<#${canalfiltroTell}>`
                }

                let cargosTell = await db.get(`cargosTell_${b.guild.id}.cargosTell`);

                if (!cargosTell || cargosTell.length == 0) {

                    cargosTell = `\`Nenhum\``;

                } else {

                    cargosTell = cargosTell.map(c => `<@&${c}>`).join('\n');

                }

                let embedTell = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Tellonym`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal de criação de tellonym`, value: `${canalcriarTell}`, inline: true },
                        { name: `Canal do tellonym`, value: `${canalTell}`, inline: true },
                        { name: `Filtro do tellonym`, value: `${canalfiltroTell}`, inline: true },
                        { name: `Cargos autorizados`, value: `${cargosTell}`, inline: true }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowTell = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais do tellonym")
                            .setCustomId("canaisTellNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosTellNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosTellNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do tellonym")
                            .setCustomId("embedTellNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackTell = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedTell], components: [rowTell, rowBackTell] })

            }

            if (b.customId == 'tellNB') {

                b.deferUpdate()

                let canalcriarTell = await db.get(`canalcriarTellNB_${b.guild.id}`);
                let canalTell = await db.get(`canalTellNB_${b.guild.id}`);
                let canalfiltroTell = await db.get(`canalfiltroTellNB_${b.guild.id}`);

                if (!canalcriarTell) {

                    canalcriarTell = `\`Não foi definido.\``

                } else {

                    canalcriarTell = `<#${canalcriarTell}>`
                }

                if (!canalTell) {

                    canalTell = `\`Não foi definido.\``

                } else {

                    canalTell = `<#${canalTell}>`
                }

                if (!canalfiltroTell) {

                    canalfiltroTell = `\`Não foi definido.\``

                } else {

                    canalfiltroTell = `<#${canalfiltroTell}>`
                }

                let cargosTell = await db.get(`cargosTell_${b.guild.id}.cargosTell`);

                if (!cargosTell || cargosTell.length == 0) {

                    cargosTell = `\`Nenhum\``;

                } else {

                    cargosTell = cargosTell.map(c => `<@&${c}>`).join('\n');

                }

                let embedTell = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Tellonym`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal de criação de tellonym`, value: `${canalcriarTell}`, inline: true },
                        { name: `Canal do tellonym`, value: `${canalTell}`, inline: true },
                        { name: `Filtro do tellonym`, value: `${canalfiltroTell}`, inline: true },
                        { name: `Cargos autorizados`, value: `${cargosTell}`, inline: true }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowTell = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais do tellonym")
                            .setCustomId("canaisTellNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo")
                            .setCustomId("addcargosTellNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover cargo")
                            .setCustomId("removcargosTellNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do tellonym")
                            .setCustomId("embedTellNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackTell = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedTell], components: [rowTell, rowBackTell] })

            }

            if (b.customId == 'addcargosTellNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.push(`cargosTell_${b.guild.id}.cargosTell`, cargo.id);

                        let canalcriarTell = await db.get(`canalcriarTellNB_${b.guild.id}`);
                        let canalTell = await db.get(`canalTellNB_${b.guild.id}`);
                        let canalfiltroTell = await db.get(`canalfiltroTellNB_${b.guild.id}`);

                        if (!canalcriarTell) {

                            canalcriarTell = `\`Não foi definido.\``

                        } else {

                            canalcriarTell = `<#${canalcriarTell}>`
                        }

                        if (!canalTell) {

                            canalTell = `\`Não foi definido.\``

                        } else {

                            canalTell = `<#${canalTell}>`
                        }

                        if (!canalfiltroTell) {

                            canalfiltroTell = `\`Não foi definido.\``

                        } else {

                            canalfiltroTell = `<#${canalfiltroTell}>`
                        }

                        let cargosTell = await db.get(`cargosTell_${b.guild.id}.cargosTell`);

                        if (!cargosTell || cargosTell.length == 0) {

                            cargosTell = `\`Nenhum\``;

                        } else {

                            cargosTell = cargosTell.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedTell = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Tellonym`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal de criação de tellonym`, value: `${canalcriarTell}`, inline: true },
                                { name: `Canal do tellonym`, value: `${canalTell}`, inline: true },
                                { name: `Filtro do tellonym`, value: `${canalfiltroTell}`, inline: true },
                                { name: `Cargos autorizados`, value: `${cargosTell}`, inline: true }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedTell] })

                    }

                })

            }

            if (b.customId == 'removcargosTellNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargosTell_${b.guild.id}.cargosTell`, (await db.get(`cargosTell_${b.guild.id}.cargosTell`))?.filter(e => e !== `${cargo.id}`));

                        let canalcriarTell = await db.get(`canalcriarTellNB_${b.guild.id}`);
                        let canalTell = await db.get(`canalTellNB_${b.guild.id}`);
                        let canalfiltroTell = await db.get(`canalfiltroTellNB_${b.guild.id}`);

                        if (!canalcriarTell) {

                            canalcriarTell = `\`Não foi definido.\``

                        } else {

                            canalcriarTell = `<#${canalcriarTell}>`
                        }

                        if (!canalTell) {

                            canalTell = `\`Não foi definido.\``

                        } else {

                            canalTell = `<#${canalTell}>`
                        }

                        if (!canalfiltroTell) {

                            canalfiltroTell = `\`Não foi definido.\``

                        } else {

                            canalfiltroTell = `<#${canalfiltroTell}>`
                        }

                        let cargosTell = await db.get(`cargosTell_${b.guild.id}.cargosTell`);

                        if (!cargosTell || cargosTell.length == 0) {

                            cargosTell = `\`Nenhum\``;

                        } else {

                            cargosTell = cargosTell.map(c => `<@&${c}>`).join('\n');

                        }

                        let embedTell = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Tellonym`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Canal de criação de tellonym`, value: `${canalcriarTell}`, inline: true },
                                { name: `Canal do tellonym`, value: `${canalTell}`, inline: true },
                                { name: `Filtro do tellonym`, value: `${canalfiltroTell}`, inline: true },
                                { name: `Cargos autorizados`, value: `${cargosTell}`, inline: true }

                            )

                            
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embedTell] })

                    }

                })

            }

            if (b.customId == 'embedTellNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloTell_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descTell_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoTell_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageTell_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookTell = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedTell = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloTell')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descTell')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageTell')
                            .setStyle(Discord.ButtonStyle.Secondary))

                let rowEmbedTell2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoTell')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarTell')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackTell = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarTell")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookTell], components: [rowEmbedTell, rowEmbedTell2, rowBackTell] })

            }

            if (b.customId == 'tituloTell') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let title = message.content;

                    if (title == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Título definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`tituloTell_${b.guild.id}`, title);

                        let titulo = await db.get(`tituloTell_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descTell_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoTell_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageTell_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] });

                    }
                })
            }

            if (b.customId == 'descTell') {

                let tit = await db.get(`tituloTell_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descTell_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloTell_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descTell_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoTell_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageTell_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimageTell") {

                let descri = await db.get(`descTell_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimageTell_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloTell_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descTell_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoTell_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageTell_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                })
            }

            if (b.customId == "imagemcantoTell") {

                let descri = await db.get(`descTell_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoTell_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloTell_${b.guild.id}`);
                            if (!titulo) titulo = 'Título';
                            let desc = await db.get(`descTell_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoTell_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageTell_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookReg = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookReg] });
                        }
                    })
                }
                )

            } // fim imagem de canto

            if (b.customId == 'enviarTell') {

                let descri = await db.get(`descTell_${b.guild.id}`);
                let canalTell = await db.get(`canalcriarTellNB_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalTell);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal do Tellonym\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloTell_${b.guild.id}`);
                    let desc = await db.get(`descTell_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoTell_${b.guild.id}`);
                    let image = await db.get(`setimageTell_${b.guild.id}`);

                    const embedTell = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    let rowTell = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Enviar")
                                .setCustomId('tellonym')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    await canal.send({ embeds: [embedTell], components: [rowTell] }).catch(err => { })

                }
            } // fim enviar reg

            if (b.customId == 'voltarOrfa') {

                b.deferUpdate()

                let canalcriarOrfa = await db.get(`canalcriarOrfaNB_${b.guild.id}`);
                let canalOrfa = await db.get(`canalOrfaNB_${b.guild.id}`);

                if (!canalcriarOrfa) {

                    canalcriarOrfa = `\`Não foi definido.\``

                } else {

                    canalcriarOrfa = `<#${canalcriarOrfa}>`
                }

                if (!canalOrfa) {

                    canalOrfa = `\`Não foi definido.\``

                } else {

                    canalOrfa = `<#${canalOrfa}>`
                }

                let embedOrfa = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Orfanato`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal de criação de orfanato`, value: `${canalcriarOrfa}`, inline: true },
                        { name: `Canal do orfanato`, value: `${canalOrfa}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowOrfa = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais do orfanato")
                            .setCustomId("canaisOrfaNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do orfanato")
                            .setCustomId("embedOrfaNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackOrfa = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedOrfa], components: [rowOrfa, rowBackOrfa] })

            }

            if (b.customId == 'orfaNB') {

                b.deferUpdate()

                let canalcriarOrfa = await db.get(`canalcriarOrfaNB_${b.guild.id}`);
                let canalOrfa = await db.get(`canalOrfaNB_${b.guild.id}`);

                if (!canalcriarOrfa) {

                    canalcriarOrfa = `\`Não foi definido.\``

                } else {

                    canalcriarOrfa = `<#${canalcriarOrfa}>`
                }

                if (!canalOrfa) {

                    canalOrfa = `\`Não foi definido.\``

                } else {

                    canalOrfa = `<#${canalOrfa}>`
                }

                let embedOrfa = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Orfanato`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal de criação de orfanato`, value: `${canalcriarOrfa}`, inline: true },
                        { name: `Canal do orfanato`, value: `${canalOrfa}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowOrfa = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais do orfanato")
                            .setCustomId("canaisOrfaNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do orfanato")
                            .setCustomId("embedOrfaNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackOrfa = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedOrfa], components: [rowOrfa, rowBackOrfa] })

            }

            if (b.customId == 'embedOrfaNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloOrfa_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descOrfa_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoOrfa_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageOrfa_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookTell = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedTell = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloOrfa')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descOrfa')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageOrfa')
                            .setStyle(Discord.ButtonStyle.Primary))

                let rowEmbedTell2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoOrfa')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarOrfa')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackTell = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarOrfa")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookTell], components: [rowEmbedTell, rowEmbedTell2, rowBackTell] })

            }

            if (b.customId == 'tituloOrfa') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let title = message.content;

                    if (title == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Título definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`tituloOrfa_${b.guild.id}`, title);

                        let titulo = await db.get(`tituloOrfa_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descOrfa_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoOrfa_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageOrfa_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] });

                    }
                })
            }

            if (b.customId == 'descOrfa') {

                let tit = await db.get(`tituloOrfa_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descOrfa_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloOrfa_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descOrfa_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoOrfa_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageOrfa_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimageOrfa") {

                let descri = await db.get(`descOrfa_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimageOrfa_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloOrfa_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descOrfa_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoOrfa_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageOrfa_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                })
            }

            if (b.customId == "imagemcantoOrfa") {

                let descri = await db.get(`descOrfa_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoOrfa_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloOrfa_${b.guild.id}`);
                            if (!titulo) titulo = 'Título';
                            let desc = await db.get(`descOrfa_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoOrfa_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageOrfa_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookReg = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookReg] });
                        }
                    })
                }
                )

            } // fim imagem de canto

            if (b.customId == 'enviarOrfa') {

                let descri = await db.get(`descOrfa_${b.guild.id}`);
                let canalTell = await db.get(`canalcriarOrfaNB_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalTell);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal do Orfanato\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloOrfa_${b.guild.id}`);
                    let desc = await db.get(`descOrfa_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoOrfa_${b.guild.id}`);
                    let image = await db.get(`setimageOrfa_${b.guild.id}`);

                    const embedTell = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    let rowTell = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Criar")
                                .setCustomId('orfanato')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    await canal.send({ embeds: [embedTell], components: [rowTell] }).catch(err => { })

                }
            } // fim enviar orfa

            if (b.customId == 'voltarMatch') {

                b.deferUpdate()

                let canalcriarMatch = await db.get(`canalcriarMatchNB_${b.guild.id}`);
                let canalMatch = await db.get(`canalMatchNB_${b.guild.id}`);

                if (!canalcriarMatch) {

                    canalcriarMatch = `\`Não foi definido.\``

                } else {

                    canalcriarMatch = `<#${canalcriarMatch}>`
                }

                if (!canalMatch) {

                    canalMatch = `\`Não foi definido.\``

                } else {

                    canalMatch = `<#${canalMatch}>`
                }

                let embedMatch = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Match`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal de criação de match`, value: `${canalcriarMatch}`, inline: true },
                        { name: `Canal do match`, value: `${canalMatch}`, inline: false }

                    )


                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowMatch = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais do match")
                            .setCustomId("canaisMatchNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do match")
                            .setCustomId("embedMatchNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackMatch = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedMatch], components: [rowMatch, rowBackMatch] })

            }

            if (b.customId == 'matchNB') {

                b.deferUpdate()

                let canalcriarMatch = await db.get(`canalcriarMatchNB_${b.guild.id}`);
                let canalMatch = await db.get(`canalMatchNB_${b.guild.id}`);

                if (!canalcriarMatch) {

                    canalcriarMatch = `\`Não foi definido.\``

                } else {

                    canalcriarMatch = `<#${canalcriarMatch}>`
                }

                if (!canalMatch) {

                    canalMatch = `\`Não foi definido.\``

                } else {

                    canalMatch = `<#${canalMatch}>`
                }

                let embedMatch = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Match`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal de criação de match`, value: `${canalcriarMatch}`, inline: true },
                        { name: `Canal do match`, value: `${canalMatch}`, inline: false }

                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowMatch = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais do match")
                            .setCustomId("canaisMatchNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do match")
                            .setCustomId("embedMatchNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackMatch = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedMatch], components: [rowMatch, rowBackMatch] })

            }

            if (b.customId == 'embedMatchNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloMatch_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descMatch_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoMatch_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageMatch_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookTell = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedMatch = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloMatch')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descMatch')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageMatch')
                            .setStyle(Discord.ButtonStyle.Secondary))

                let rowEmbedMatch2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoMatch')
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarMatch')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackMatch = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMatch")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookTell], components: [rowEmbedMatch, rowEmbedMatch2, rowBackMatch] })

            }

            if (b.customId == 'tituloMatch') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let title = message.content;

                    if (title == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Título definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`tituloMatch_${b.guild.id}`, title);

                        let titulo = await db.get(`tituloMatch_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descMatch_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoMatch_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageMatch_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] });

                    }
                })
            }

            if (b.customId == 'descMatch') {

                let tit = await db.get(`tituloMatch_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descMatch_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloMatch_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descMatch_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoMatch_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageMatch_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimageMatch") {

                let descri = await db.get(`descMatch_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimageMatch_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloMatch_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descMatch_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoMatch_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageMatch_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                })
            }

            if (b.customId == "imagemcantoMatch") {

                let descri = await db.get(`descMatch_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoMatch_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloMatch_${b.guild.id}`);
                            if (!titulo) titulo = 'Título';
                            let desc = await db.get(`descMatch_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoMatch_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageMatch_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookReg = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookReg] });
                        }
                    })
                }
                )

            } // fim imagem de canto

            if (b.customId == 'enviarMatch') {

                let descri = await db.get(`descMatch_${b.guild.id}`);
                let canalTell = await db.get(`canalcriarMatchNB_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalTell);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal do Match\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloMatch_${b.guild.id}`);
                    let desc = await db.get(`descMatch_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoMatch_${b.guild.id}`);
                    let image = await db.get(`setimageMatch_${b.guild.id}`);

                    const embedTell = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    let rowTell = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setEmoji('1071641531838120016')
                                .setCustomId('match')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    await canal.send({ embeds: [embedTell], components: [rowTell] }).catch(err => { })

                }
            } // fim enviar reg

            if (b.customId == 'voltarOnly') {

                b.deferUpdate()

                let canalcriarOnly = await db.get(`canalcriarOnlyNB_${b.guild.id}`);
                let canalOnly = await db.get(`canalOnlyNB_${b.guild.id}`);

                if (!canalcriarOnly) {

                    canalcriarOnly = `\`Não foi definido.\``

                } else {

                    canalcriarOnly = `<#${canalcriarOnly}>`
                }

                if (!canalOnly) {

                    canalOnly = `\`Não foi definido.\``

                } else {

                    canalOnly = `<#${canalOnly}>`
                }

                let embedOnly = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Only`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal de criação de only`, value: `${canalcriarOnly}`, inline: true },
                        { name: `Canal do only`, value: `${canalOnly}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowOnly = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais do Only")
                            .setCustomId("canaisOnlyNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do Only")
                            .setCustomId("embedOnlyNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackOnly = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedOnly], components: [rowOnly, rowBackOnly] })

            }

            if (b.customId == 'onlyNB') {

                b.deferUpdate()

                let canalcriarOnly = await db.get(`canalcriarOnlyNB_${b.guild.id}`);
                let canalOnly = await db.get(`canalOnlyNB_${b.guild.id}`);

                if (!canalcriarOnly) {

                    canalcriarOnly = `\`Não foi definido.\``

                } else {

                    canalcriarOnly = `<#${canalcriarOnly}>`
                }

                if (!canalOnly) {

                    canalOnly = `\`Não foi definido.\``

                } else {

                    canalOnly = `<#${canalOnly}>`
                }

                let embedOnly = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Only`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Canal de criação de only`, value: `${canalcriarOnly}`, inline: true },
                        { name: `Canal do only`, value: `${canalOnly}`, inline: false }

                    )

                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowOnly = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canais do Only")
                            .setCustomId("canaisOnlyNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Configurar embed do Only")
                            .setCustomId("embedOnlyNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackOnly = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedOnly], components: [rowOnly, rowBackOnly] })

            }

            if (b.customId == 'embedOnlyNB') {

                b.deferUpdate()

                let titulo = await db.get(`tituloOnly_${b.guild.id}`);
                if (!titulo) titulo = 'Título';
                let desc = await db.get(`descOnly_${b.guild.id}`);
                if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                let thumb = await db.get(`imagemdecantoOnly_${b.guild.id}`);
                if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                let image = await db.get(`setimageOnly_${b.guild.id}`);
                if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                const webhookTell = new Discord.EmbedBuilder()
                    .setTitle(`${titulo}`)
                    .setDescription(`${desc}`)
                    .setThumbnail(`${thumb}`)
                    .setColor(`${colorNB}`)
                    .setImage(`${image}`)
                    .setFooter({ text: `${message.guild.name} ©` })

                let rowEmbedOnly = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Título")
                            .setCustomId('tituloOnly')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Descrição")
                            .setCustomId('descOnly')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem")
                            .setCustomId('setimageOnly')
                            .setStyle(Discord.ButtonStyle.Primary))

                let rowEmbedOnly2 = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Definir Imagem de Canto")
                            .setCustomId('imagemcantoOnly')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setLabel("Enviar")
                            .setCustomId('enviarOnly')
                            .setStyle(Discord.ButtonStyle.Success))

                const rowBackOnly = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarOnly")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [webhookTell], components: [rowEmbedOnly, rowEmbedOnly2, rowBackOnly] })

            }

            if (b.customId == 'tituloOnly') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o título desejado para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let title = message.content;

                    if (title == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Título definido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`tituloOnly_${b.guild.id}`, title);

                        let titulo = await db.get(`tituloOnly_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descOnly_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoOnly_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageOnly_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] });

                    }
                })
            }

            if (b.customId == 'descOnly') {

                let tit = await db.get(`tituloOnly_${b.guild.id}`)

                if (!tit) {

                    let semtitulo = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu o \`Título\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semtitulo], ephemeral: true });

                }

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a descrição desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let descr = message.content;

                    if (descr == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let correto = new Discord.EmbedBuilder()
                            .setDescription(`Descrição definida com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [correto], ephemeral: true })

                        await db.set(`descOnly_${b.guild.id}`, descr);

                        let titulo = await db.get(`tituloOnly_${b.guild.id}`);
                        if (!titulo) titulo = 'Título'
                        let desc = await db.get(`descOnly_${b.guild.id}`);
                        if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                        let thumb = await db.get(`imagemdecantoOnly_${b.guild.id}`);
                        if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                        let image = await db.get(`setimageOnly_${b.guild.id}`);
                        if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                        const webhookWl = new Discord.EmbedBuilder()
                            .setTitle(`${titulo}`)
                            .setDescription(`${desc}`)
                            .setThumbnail(`${thumb}`)
                            .setColor(`${colorNB}`)
                            .setImage(`${image}`)
                            .setFooter({ text: `${b.guild.name} ©` })

                        MESSAGE.edit({ embeds: [webhookWl] })
                    }

                })
            } // fim desc

            if (b.customId == "setimageOnly") {

                let descri = await db.get(`descOnly_${b.guild.id}`)

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true });

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`setimageOnly_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloOnly_${b.guild.id}`);
                            if (!titulo) titulo = 'Título'
                            let desc = await db.get(`descOnly_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoOnly_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageOnly_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookWl = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookWl] });

                        }
                    })
                })
            }

            if (b.customId == "imagemcantoOnly") {

                let descri = await db.get(`descOnly_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não definiu a \`Descrição\` do Webhook.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let embedcargo = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat a imagem anexada desejada para o Webhook\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedcargo], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let url_imagem;

                    message.attachments.forEach(async function (Attachment) {

                        url_imagem = Attachment.url

                        if (message.content == "cancelar") {

                            coletor.stop('Collector stopped manually');

                            let errado = new Discord.EmbedBuilder()
                                .setDescription(`Operação cancelada com sucesso.`)
                                .setColor(`${colorNB}`)

                            return b.editReply({ embeds: [errado], ephemeral: true })

                        } else {

                            let correto = new Discord.EmbedBuilder()
                                .setDescription(`Imagem definida com sucesso.`)
                                .setColor(`${colorNB}`)

                            b.editReply({ embeds: [correto], ephemeral: true })

                            const membro = message.member;


                            let imagem = new Discord.AttachmentBuilder(`${url_imagem}`)

                            let MENSAGEM = await membro.send({ files: [imagem.attachment] });

                            await db.set(`imagemdecantoOnly_${b.guild.id}`, MENSAGEM.attachments.first().url);

                            let titulo = await db.get(`tituloOnly_${b.guild.id}`);
                            if (!titulo) titulo = 'Título';
                            let desc = await db.get(`descOnly_${b.guild.id}`);
                            if (!desc) desc = `> Todos os campos os quais estiverem vazios não irão aparecer ao enviar a mensagem.`
                            let thumb = await db.get(`imagemdecantoOnly_${b.guild.id}`);
                            if (!thumb) thumb = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"
                            let image = await db.get(`setimageOnly_${b.guild.id}`);
                            if (!image) image = "https://media.discordapp.net/attachments/1137450798020833470/1137498051972452463/image.png"

                            const webhookReg = new Discord.EmbedBuilder()
                                .setTitle(`${titulo}`)
                                .setDescription(`${desc}`)
                                .setThumbnail(`${thumb}`)
                                .setColor(`${colorNB}`)
                                .setImage(`${image}`)
                                .setFooter({ text: `${b.guild.name} ©` })

                            MESSAGE.edit({ embeds: [webhookReg] });
                        }
                    })
                }
                )

            } // fim imagem de canto

            if (b.customId == 'enviarOnly') {

                let descri = await db.get(`descOnly_${b.guild.id}`);
                let canalTell = await db.get(`canalcriarOnlyNB_${b.guild.id}`);

                if (!descri) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`Webhook\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                }

                let canal = b.guild.channels.cache.get(canalTell);

                if (!canal) {

                    let semdesc = new Discord.EmbedBuilder()
                        .setDescription(`Você ainda não configurou o \`canal do Onlyfans\`.`)
                        .setColor(`${colorNB}`)

                    return b.reply({ embeds: [semdesc], ephemeral: true });

                } else {

                    let enviado = new Discord.EmbedBuilder()
                        .setDescription(`Webhook enviado com sucesso.`)
                        .setColor(`${colorNB}`)

                    let enviadoCanal = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Conferir no canal")
                                .setURL(`https://discord.com/channels/${b.guild.id}/${canal.id}`)
                                .setStyle(Discord.ButtonStyle.Link))

                    b.reply({ embeds: [enviado], components: [enviadoCanal], ephemeral: true });

                    let titulo = await db.get(`tituloOnly_${b.guild.id}`);
                    let desc = await db.get(`descOnly_${b.guild.id}`);
                    let thumb = await db.get(`imagemdecantoOnly_${b.guild.id}`);
                    let image = await db.get(`setimageOnly_${b.guild.id}`);

                    const embedTell = new Discord.EmbedBuilder()
                        .setTitle(titulo)
                        .setDescription(desc)
                        .setThumbnail(thumb)
                        .setColor(`${colorNB}`)
                        .setImage(image)
                        .setFooter({ text: `${message.guild.name} ©` })

                    let rowTell = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel("Enviar")
                                .setCustomId('Only')
                                .setStyle(Discord.ButtonStyle.Secondary))

                    await canal.send({ embeds: [embedTell], components: [rowTell] }).catch(err => { })

                }
            } // fim enviar only

            if (b.customId == 'blacklistNB') {

                b.deferUpdate()

                let statusEmbed = await db.get(`statusBlacklist_${b.guild.id}`);

                let emojiStatusBlacklist;
                let emojiStatusBlacklistEmbed;

                if (statusEmbed === true) {

                    emojiStatusBlacklist = `1119444704178745464`;
                    emojiStatusBlacklistEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojiStatusBlacklist = `1119452618394177626`;
                    emojiStatusBlacklistEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let embed = new Discord.EmbedBuilder()
                .setAuthor({  name: `${client.user.username} | BlackList`, iconURL: client.user.displayAvatarURL() })
                    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                var vls = await db.get(`blacklist_${b.guild.id}.bl`);

                if (vls) {

                    for (let pd of vls) {

                        embed.addFields({
                            name: `${client.xx.membro} Membro:`,
                            value: `\`${pd.membroID}\`\n${client.xx.moderador}  **Moderador**:\n${pd.mod}\n${client.xx.motivo} **Motivo**:\n\`${pd.motivo}\``,
                            inline: true
                        })

                    }

                }

                embed.addFields(

                    { name: `Status`, value: `${emojiStatusBlacklistEmbed}`, inline: false }

                )

                const rowBlacklist = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar membro")
                            .setCustomId("blacklistAddNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover membro")
                            .setCustomId("blacklistRemovNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusBlacklist}`)
                            .setCustomId("statusBlacklistNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackBl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowBlacklist, rowBackBl] })

            }

            if (b.customId == 'anticargoNB') {

                b.deferUpdate()

                let statusAntiCargo = await db.get(`statusAnticargoNB_${b.guild.id}`);

                let emojiStatusAnticargo;
                let emojiStatusAnticargoEmbed;

                if (statusAntiCargo === true) {

                    emojiStatusAnticargo = `1119444704178745464`;
                    emojiStatusAnticargoEmbed = `> <:stats:1265363896038850621> Ativado`;

                } else {

                    emojiStatusAnticargo = `1119452618394177626`;
                    emojiStatusAnticargoEmbed = `> ${client.xx.desativado} Desativado`;

                }

                let cargosProtegidos = await db.get(`cargosProtegidos_${b.guild.id}.antiCargos`);

                if (!cargosProtegidos || cargosProtegidos.length == 0) {

                    cargosProtegidos = `\`Nenhum\``;

                } else {

                    cargosProtegidos = cargosProtegidos.map(c => `<@&${c}>`).join('\n');

                }

                let embed = new Discord.EmbedBuilder()
                .setAuthor({  name: `${client.user.username} | Anti Cargos`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Cargos protegidos`, value: `${cargosProtegidos}`, inline: true },
                        { name: `Status`, value: `${emojiStatusAnticargoEmbed}`, inline: false }

                    )

                   
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAnticargo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar Cargo")
                            .setCustomId("AnticargoAddNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover Cargo")
                            .setCustomId("AnticargoRemovNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusAnticargo}`)
                            .setCustomId("statusAnticargoNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAnticargo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowAnticargo, rowBackAnticargo] })

            }

            if (b.customId == 'AnticargoAddNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.push(`cargosProtegidos_${b.guild.id}.antiCargos`, cargo.id);

                        let statusEmbed = await db.get(`statusAnticargoNB_${b.guild.id}`);

                        let emojiStatusAnticargoEmbed;

                        if (statusEmbed === true) {

                            emojiStatusAnticargo = `1119444704178745464`;
                            emojiStatusAnticargoEmbed = `> <:stats:1265363896038850621> Ativado`;

                        } else {

                            emojiStatusAnticargoEmbed = `> ${client.xx.desativado} Desativado`;

                        }

                        let cargosProtegidos = await db.get(`cargosProtegidos_${b.guild.id}.antiCargos`);

                        if (!cargosProtegidos || cargosProtegidos.length == 0) {

                            cargosProtegidos = `\`Nenhum\``;

                        } else {

                            cargosProtegidos = cargosProtegidos.map(c => `<@&${c}>`).join('\n');

                        }

                        let embed = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Anti Cargos`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Cargos protegidos`, value: `${cargosProtegidos}`, inline: true },
                                { name: `Status`, value: `${emojiStatusAnticargoEmbed}`, inline: false }

                            )

                           
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embed] });

                    }
                })
            }

            if (b.customId == 'AnticargoRemovNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargosProtegidos_${b.guild.id}.antiCargos`, (await db.get(`cargosProtegidos_${b.guild.id}.antiCargos`))?.filter(e => e !== `${cargo.id}`));

                        let statusEmbed = await db.get(`statusAnticargoNB_${b.guild.id}`);

                        let emojiStatusAnticargoEmbed;

                        if (statusEmbed === true) {

                            emojiStatusAnticargo = `1119444704178745464`;
                            emojiStatusAnticargoEmbed = `> <:stats:1265363896038850621> Ativado`;

                        } else {

                            emojiStatusAnticargoEmbed = `> ${client.xx.desativado} Desativado`;

                        }

                        let cargosProtegidos = await db.get(`cargosProtegidos_${b.guild.id}.antiCargos`);

                        if (!cargosProtegidos || cargosProtegidos.length == 0) {

                            cargosProtegidos = `\`Nenhum\``;

                        } else {

                            cargosProtegidos = cargosProtegidos.map(c => `<@&${c}>`).join('\n');

                        }

                        let embed = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Anti Cargos`, iconURL: client.user.displayAvatarURL() })
                            .addFields(

                                { name: `Cargos protegidos`, value: `${cargosProtegidos}`, inline: true },
                                { name: `Status`, value: `${emojiStatusAnticargoEmbed}`, inline: false }

                            )

                           
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        MESSAGE.edit({ embeds: [embed] });

                    }

                })

            }

            if (b.customId == 'statusAnticargoNB') {

                b.deferUpdate();

                let status = await db.get(`statusAnticargoNB_${b.guild.id}`);

                let emojiStatusAnticargo;
                let emojiStatusAnticargoEmbed;

                if (status === true) {

                    emojiStatusAnticargo = `1119452618394177626`;
                    emojiStatusAnticargoEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusAnticargoNB_${b.guild.id}`, false);

                } else {

                    emojiStatusAnticargo = `1119444704178745464`;
                    emojiStatusAnticargoEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusAnticargoNB_${b.guild.id}`, true);
                }

                let cargosProtegidos = await db.get(`cargosProtegidos_${b.guild.id}.antiCargos`);

                if (!cargosProtegidos || cargosProtegidos.length == 0) {

                    cargosProtegidos = `\`Nenhum\``;

                } else {

                    cargosProtegidos = cargosProtegidos.map(c => `<@&${c}>`).join('\n');

                }

                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Anti Cargos`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `Cargos protegidos`, value: `${cargosProtegidos}`, inline: true },
                        { name: `Status`, value: `${emojiStatusAnticargoEmbed}`, inline: false }

                    )

                   
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowAnticargo = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar Cargo")
                            .setCustomId("AnticargoAddNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover Cargo")
                            .setCustomId("AnticargoRemovNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusAnticargo}`)
                            .setCustomId("statusAnticargoNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackAnti = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1058988724383387658')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [embed], components: [rowAnticargo, rowBackAnti] });

            }


            if (b.customId == 'blacklistRemovNB') {

                let embedBlack = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@usuario/id) do membro desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedBlack], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    const listado = await db.get(`blacklist_${b.guild.id}.info`);

                    if (!listado.includes(message.content)) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Membro removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`blacklist_${b.guild.id}.bl`, (await db.get(`blacklist_${b.guild.id}.bl`))?.filter(element => element.membroID !== message.content));
                        await db.set(`blacklist_${b.guild.id}.info`, (await db.get(`blacklist_${b.guild.id}.info`))?.filter(e => e !== message.content));

                        await b.guild.members.unban(message.content).catch(err => { });

                        let embed = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Blacklist`, iconURL: client.user.displayAvatarURL() })
                    
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        let statusEmbed = await db.get(`statusBlacklist_${b.guild.id}`);

                        let emojiStatusBlacklistEmbed;

                        if (statusEmbed === true) {

                            emojiStatusBlacklistEmbed = `> <:stats:1265363896038850621> Ativado`;

                        } else {

                            emojiStatusBlacklistEmbed = `> ${client.xx.desativado} Desativado`;

                        }

                        var vls = await db.get(`blacklist_${b.guild.id}.bl`);

                        if (vls) {

                            for (let pd of vls) {

                                embed.addFields({
                                    name: `${client.xx.membro} Membro:`,
                                    value: `\`${pd.membroID}\`\n${client.xx.moderador}  **Moderador**:\n${pd.mod}\n${client.xx.motivo} **Motivo**:\n\`${pd.motivo}\``,
                                    inline: true
                                })

                            }

                        }

                        embed.addFields(

                            { name: `Status`, value: `${emojiStatusBlacklistEmbed}`, inline: false }

                        )

                        await MESSAGE.edit({ embeds: [embed] })

                    }
                })
            }

            if (b.customId == 'statusBlacklistNB') {

                b.deferUpdate()

                let statusEmbed = await db.get(`statusBlacklist_${b.guild.id}`);

                let emojiStatusBlacklist;
                let emojiStatusBlacklistEmbed;

                if (statusEmbed === true) {

                    emojiStatusBlacklist = `1119452618394177626`;
                    emojiStatusBlacklistEmbed = `> ${client.xx.desativado} Desativado`;

                    await db.set(`statusBlacklist_${b.guild.id}`, false);

                } else {

                    emojiStatusBlacklist = `1119444704178745464`;
                    emojiStatusBlacklistEmbed = `> <:stats:1265363896038850621> Ativado`;

                    await db.set(`statusBlacklist_${b.guild.id}`, true);

                }


                let embed = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Blacklist`, iconURL: client.user.displayAvatarURL() })
  
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                var vls = await db.get(`blacklist_${b.guild.id}.bl`)

                if (vls) {

                    for (let pd of vls) {

                        embed.addFields({
                            name: `${client.xx.membro} Membro:`,
                            value: `\`${pd.membroID}\`\n${client.xx.moderador}  **Moderador**:\n${pd.mod}\n${client.xx.motivo} **Motivo**:\n\`${pd.motivo}\``,
                            inline: true
                        })

                    }

                }

                embed.addFields(

                    { name: `Status`, value: `${emojiStatusBlacklistEmbed}`, inline: false }

                )

                const rowBlacklist = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar membro")
                            .setCustomId("blacklistAddNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover membro")
                            .setCustomId("blacklistRemovNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setEmoji(`${emojiStatusBlacklist}`)
                            .setCustomId("statusBlacklistNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackBl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embed], components: [rowBlacklist, rowBackBl] });

            }

            if (b.customId == 'vipNB') {

                b.deferUpdate();

                let logs = await db.get(`logsvipNB_`);

                if (!logs) {

                    logs = `\`Não foi definido.\``

                } else {

                    logs = `<#${logs}>`
                }

                let embedVip = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | VIP`, iconURL: client.user.displayAvatarURL() })
    
                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                var vls = await db.get(`vips_${b.guild.id}.vip`);

                if (vls) {

                    for (let pd of vls) {

                        embedVip.addFields({
                            name: `${client.xx.vips} ` + pd.vipnome,
                            value: `${client.xx.duracao} Duração: ` + `\`${pd.diasvip} Dias.\``
                        })

                    }

                }

                embedVip.addFields(

                    { name: `Logs Vip`, value: `${logs}`, inline: false }

                )

                const rowVip = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar vip")
                            .setCustomId("vipAddNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover vip")
                            .setCustomId("vipRemovNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Gerenciar vip do membro")
                            .setCustomId("gerenciarVip")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Definir canal de logs")
                            .setCustomId("logsVipNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackVip = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarVips")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedVip], components: [rowVip, rowBackVip] });

            }

            if (b.customId == 'voltarVips') {

                b.deferUpdate();

                let embedVip = new Discord.EmbedBuilder()
                   .setAuthor({  name: `${client.user.username} | Vips`, iconURL: client.user.displayAvatarURL() })
                    .addFields(

                        { name: `<:menu:1327398586333266144> Configurações`, value: `> Vip\n> Primeira dama`, inline: true }

                    )

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                const rowVips = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Vip")
                            .setCustomId("vipNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Primeira dama")
                            .setCustomId("pdNB")
                            .setStyle(Discord.ButtonStyle.Secondary))

                const rowBackVips = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                MESSAGE.edit({ embeds: [embedVip], components: [rowVips, rowBackVips] });

            }

            if (b.customId == 'vipRemovNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`${b.member}, VIP removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`vips_${b.guild.id}.vip`, (await db.get(`vips_${b.guild.id}.vip`))?.filter(element => element.vipID !== cargo.id));

                        let logs = await db.get(`logsvipNB_`);

                        if (!logs) {

                            logs = `\`Não foi definido.\``

                        } else {

                            logs = `<#${logs}>`
                        }

                        let embedVip = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | VIP`, iconURL: client.user.displayAvatarURL() })
                           
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        var vls = await db.get(`vips_${b.guild.id}.vip`);

                        if (vls) {

                            for (let pd of vls) {

                                embedVip.addFields({
                                    name: `${client.xx.vips} ` + pd.vipnome,
                                    value: `${client.xx.duracao} Duração: ` + `\`${pd.diasvip} Dias.\``
                                })

                            }

                        }

                        embedVip.addFields(

                            { name: `Logs Vip`, value: `${logs}`, inline: false }

                        )
                        await MESSAGE.edit({ embeds: [embedVip] });
                    }

                })

            }

            if (b.customId == 'gerenciarVip') {

                let embedmsgs = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@usuario/id) do membro VIP para gerenciar\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedmsgs], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })
                    }

                    let ee = message.mentions.members.first() || message.guild.members.cache.get(message.content);

                    let encerraovip = await db.get(`encerravip_${ee.id}`);

                    if (!encerraovip) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`${b.member}, o membro mencionado não possui VIP.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`VIP encontrado, operação de gerenciamento iniciada.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        let acabaovip = await db.get(`acabaovip_${message.guild.id}_${ee.id}`);
                        let cargoVipDb = await db.get(`Rcar_${message.guild.id}_${ee.id}`);
                        let callVipDb = await db.get(`cal_${message.guild.id}_${ee.id}`);

                        let cargoVip = message.guild.roles.cache.get(cargoVipDb);
                        let callVip = message.guild.channels.cache.get(callVipDb);

                        let rcar;
                        let cal;

                        if (!cargoVip) {

                            rcar = `Nenhum`

                        } else {

                            rcar = `${cargoVip.name}`
                        }

                        if (!callVip) {

                            cal = `Nenhum`

                        } else {

                            cal = `${callVip.name}`
                        }

                        let v = await db.get(`encerravip_${ee.id}`);
                        let encerra = v.map(encerra => encerra.encerra);

                        let timeDb = encerra || 0;
                        let timeCount = parseInt(timeDb - Date.now());
                        let Restam = `${ms(timeCount)}`;

                        const conv = Restam.replace(/(?<![A-Z])d(?![A-Z])/gi, ' dias');

                        let vipEmbed = new Discord.EmbedBuilder()
                            .setTitle(`Vip ${ee.user.username}\nVip se encerra ${acabaovip}\n(${conv} restantes)`)
                            .setDescription(`**Cargo**: ${rcar}\n**Canal**: ${cal}`)
                            .setThumbnail(ee.user.avatarURL({ dynamic: true }))
                            .setColor(`${colorNB}`)
                            .setTimestamp()

                        const rowGerenciar = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setLabel("Adicionar dias")
                                        .setCustomId("diasAddNB")
                                    .setStyle(Discord.ButtonStyle.Secondary),
                                new Discord.ButtonBuilder()
                                    .setLabel("Remover dias")
                                        .setCustomId("diasRemovNB")
                                    .setStyle(Discord.ButtonStyle.Secondary),
                                new Discord.ButtonBuilder()
                                    .setLabel("Remover vip")
                                        .setCustomId("vipRemovM")
                                    .setStyle(Discord.ButtonStyle.Secondary))

                        const rowVoltar = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setEmoji('1120039338923794432')
                                    .setCustomId("voltarVips")
                                    .setStyle(Discord.ButtonStyle.Danger))

                        await MESSAGE.edit({ embeds: [vipEmbed], components: [rowGerenciar, rowVoltar] }).then(async (MENSAGEM) => {

                            const filter = (i) => i.user.id === message.author.id;
                            const collectorr = MENSAGEM.createMessageComponentCollector({ filter });

                            collectorr.on('collect', async (b) => {

                                parse["e"] = 0;
                                parse["dia"] = parse["day"];
                                parse["dias"] = parse["days"];
                                parse["d"] = parse["day"];

                                let v = await db.get(`encerravip_${ee.id}`);

                                let encerra;
                                let vip;

                                if (v) {

                                    encerra = await v.map(x => x.encerra);
                                    vip = await v.map(x => x.cargoVip);

                                }

                                if (b.customId == 'diasAddNB') {

                                    let embedDias = new Discord.EmbedBuilder()
                                        .setDescription(`Envie no chat os dias que deseja adicionar ao VIP\nPara cancelar a operação digite: \`cancelar\``)
                                        .setColor(`${colorNB}`)

                                    b.reply({ embeds: [embedDias], ephemeral: true });

                                    let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                                    coletor.on("collect", async (message) => {

                                        message.delete();

                                        let dias = message.content;

                                        if (isNaN(dias)) {

                                            coletor.stop('Collector stopped manually');

                                            let errado = new Discord.EmbedBuilder()
                                                .setDescription(`Por favor envie apenas números`)
                                                .setColor(`${colorNB}`)

                                            return b.editReply({ embeds: [errado], ephemeral: true })
                                        }

                                        if (ee == "cancelar") {

                                            coletor.stop('Collector stopped manually');

                                            let errado = new Discord.EmbedBuilder()
                                                .setDescription(`Operação cancelada com sucesso.`)
                                                .setColor(`${colorNB}`)

                                            return b.editReply({ embeds: [errado], ephemeral: true })

                                        } else {

                                            let tempoAdd = parse(encerra) + parse(`${dias} dias`)

                                            const object2 = `{
                            
                                            "encerra": "${tempoAdd}",
                                            "usuarioID": "${ee.id}",
                                            "cargoVip": "${vip}"
                                        }`

                                            await db.delete(`encerravip_${ee.id}`);
                                            await db.push(`encerravip_${ee.id}`, JSON.parse(object2));
                                            await db.set(`acabaovip_${b.guild.id}_${ee.id}`, `${moment(tempoAdd).format("LLL")}`);
                                            await db.delete(`avisado_${ee.id}`);

                                            let adicionado = new Discord.EmbedBuilder()
                                                .setDescription(`${dias} dias de VIP adicionados com sucesso.`)
                                                .setColor(`${colorNB}`)

                                            b.editReply({ embeds: [adicionado], ephemeral: true })

                                            let timeDb = tempoAdd || 0;
                                            let timeCount = parseInt(timeDb - Date.now());
                                            let Restam = `${ms(timeCount)}`;

                                            const conv = Restam.replace(/(?<![A-Z])d(?![A-Z])/gi, ' dias');

                                            let vipEmbed = new Discord.EmbedBuilder()
                                                .setTitle(`Vip ${ee.user.username}\nVip se encerra ${moment(tempoAdd).format("LLL")}\n(${conv} restantes)`)
                                                .setDescription(`**Cargo**: ${rcar}\n**Canal**: ${cal}`)
                                                .setThumbnail(ee.user.avatarURL({ dynamic: true }))
                                                .setColor(`${colorNB}`)
                                                .setTimestamp()

                                            MENSAGEM.edit({ embeds: [vipEmbed] });

                                        }
                                    }

                                    )

                                }

                                if (b.customId == 'vipRemovM') {

                                    let embedFim = new Discord.EmbedBuilder()
                                        .setDescription(`Vip removido com sucesso!`)
                                        .setColor(`${colorNB}`)

                                    b.reply({ embeds: [embedFim], ephemeral: true });

                                    let vipEmbed = new Discord.EmbedBuilder()
                                        .setTitle(`Vip ${ee.user.username}\n(Vip excluido com sucesso)`)
                                        .setDescription(`**Cargo**: Nenhum\n**Canal**: Nenhum`)
                                        .setThumbnail(ee.user.avatarURL({ dynamic: true }))
                                        .setColor(`${colorNB}`)
                                        .setTimestamp()

                                    MENSAGEM.edit({ embeds: [vipEmbed] });

                                    await db.set(`databasevip`, (await db.get(`databasevip`))?.filter(e => e.usuarioID !== `${ee.id}`));
                                    await db.delete(`encerravip_${ee.id}`);
                                    await db.delete(`acabaovip_${b.guild.id}_${ee.id}`);
                                    await db.delete(`limitevip_${b.guild.id}_${ee.id}`);
                                    await db.delete(`avisado_${ee.id}`);

                                    let t = await db.get(`Rcar_${b.guild.id}_${ee.id}`);
                                    let c = await db.get(`cal_${b.guild.id}_${ee.id}`);

                                    let tag = await b.guild.roles.cache.get(t);
                                    let chx = await b.guild.channels.cache.get(c);

                                    let cargoVip = await db.get(`vipdomembro_${ee.id}`);

                                    if (cargoVip) {

                                        await ee.roles.remove(cargoVip).catch(err => { });
                                    }
                                    if (tag) {

                                        await tag.delete().catch(err => { });

                                        await db.delete(`Rcar_${b.guild.id}_${ee.id}`);
                                    }

                                    if (chx) {

                                        await chx.delete().catch(err => { });
                                        await db.delete(`cal_${b.guild.id}_${ee.id}`);
                                    }

                                }

                                if (b.customId == 'diasRemovNB') {

                                    let embedDias = new Discord.EmbedBuilder()
                                        .setDescription(`Envie no chat os dias que deseja remover do VIP\nPara cancelar a operação digite: \`cancelar\``)
                                        .setColor(`${colorNB}`)

                                    b.reply({ embeds: [embedDias], ephemeral: true });

                                    let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                                    coletor.on("collect", async (message) => {

                                        message.delete();

                                        let dias = message.content;

                                        if (isNaN(dias)) {

                                            coletor.stop('Collector stopped manually');

                                            let errado = new Discord.EmbedBuilder()
                                                .setDescription(`Por favor envie apenas números`)
                                                .setColor(`${colorNB}`)

                                            return b.editReply({ embeds: [errado], ephemeral: true })
                                        }

                                        if (ee == "cancelar") {

                                            coletor.stop('Collector stopped manually');

                                            let errado = new Discord.EmbedBuilder()
                                                .setDescription(`Operação cancelada com sucesso.`)
                                                .setColor(`${colorNB}`)

                                            return b.editReply({ embeds: [errado], ephemeral: true })

                                        } else {

                                            let tempoRemov = parse(encerra) - parse(`${dias} dias`)

                                            const object2 = `{
                            
                                            "encerra": "${tempoRemov}",
                                            "usuarioID": "${ee.id}",
                                            "cargoVip": "${vip}"
                                        }`

                                            await db.delete(`encerravip_${ee.id}`);
                                            await db.push(`encerravip_${ee.id}`, JSON.parse(object2));
                                            await db.set(`acabaovip_${b.guild.id}_${ee.id}`, `${moment(tempoRemov).format("LLL")}`);

                                            let adicionado = new Discord.EmbedBuilder()
                                                .setDescription(`${dias} dias de VIP removidos com sucesso.`)
                                                .setColor(`${colorNB}`)

                                            b.editReply({ embeds: [adicionado], ephemeral: true })

                                            let timeDb = tempoRemov || 0;
                                            let timeCount = parseInt(timeDb - Date.now());
                                            let Restam = `${ms(timeCount)}`;

                                            const conv = Restam.replace(/(?<![A-Z])d(?![A-Z])/gi, ' dias');

                                            let vipEmbed = new Discord.EmbedBuilder()
                                                .setTitle(`Vip ${ee.user.username}\nVip se encerra ${moment(tempoRemov).format("LLL")}\n(${conv} restantes)`)
                                                .setDescription(`**Cargo**: ${rcar}\n**Canal**: ${cal}`)
                                                .setThumbnail(ee.user.avatarURL({ dynamic: true }))
                                                .setColor(`${colorNB}`)
                                                .setTimestamp()

                                            MENSAGEM.edit({ embeds: [vipEmbed] });

                                        }
                                    }

                                    )

                                }

                                if (b.customId == 'voltarVip') {

                                    b.deferUpdate();

                                    let logs = await db.get(`logsvipNB_`);

                                    if (!logs) {

                                        logs = `\`Não foi definido.\``

                                    } else {

                                        logs = `<#${logs}>`
                                    }

                                    let embedVip = new Discord.EmbedBuilder()
                                        .setAuthor({  name: `${client.user.username} | VIP`, iconURL: client.user.displayAvatarURL() })
                
                                        .setThumbnail(client.user.avatarURL({ size: 4096 }))
                                        .setColor(`${colorNB}`)

                                    var vls = await db.get(`vips_${b.guild.id}.vip`)

                                    if (vls) {

                                        for (let pd of vls) {

                                            embedVip.addFields({
                                                name: `${client.xx.vips} ` + pd.vipnome,
                                                value: `${client.xx.duracao} Duração: ` + `\`${pd.diasvip} Dias.\``
                                            })

                                        }

                                    }

                                    embedVip.addFields(

                                        { name: `Logs Vip`, value: `${logs}`, inline: false }

                                    )

                                    const rowVip = new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setLabel("Adicionar Vip")
                                                                .setCustomId("vipAddNB")
                                                .setStyle(Discord.ButtonStyle.Secondary),
                                            new Discord.ButtonBuilder()
                                                .setLabel("Remover Vip")
                                                                .setCustomId("vipRemovNB")
                                                .setStyle(Discord.ButtonStyle.Secondary),
                                            new Discord.ButtonBuilder()
                                                .setLabel("Gerenciar Vip")
                                                .setCustomId("gerenciarVip")
                                                .setStyle(Discord.ButtonStyle.Secondary),
                                            new Discord.ButtonBuilder()
                                                .setLabel("Definir canal de logs")
                                                .setCustomId("logsVipNB")
                                                .setStyle(Discord.ButtonStyle.Secondary))

                                    const rowBackVips = new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setEmoji('1120039338923794432')
                                                .setCustomId("voltarVip")
                                                .setStyle(Discord.ButtonStyle.Danger))

                                    await MENSAGEM.edit({ embeds: [embedVip], components: [rowVip, rowBackVips] });

                                }

                            })
                        })
                    }
                }
                )

            }

            if (b.customId == 'logsVipNB') {

                let embedCanalReg = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (#canal/id) do canal desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCanalReg], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let canal = b.guild.channels.cache.get(ee.id);

                    if (!canal) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Canal adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`logsvipNB_`, canal.id);

                        let embedVip = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | VIP`, iconURL: client.user.displayAvatarURL() })

                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        var vls = await db.get(`vips_${b.guild.id}.vip`);

                        if (vls) {

                            for (let pd of vls) {

                                embedVip.addFields({
                                    name: `${client.xx.vips} ` + pd.vipnome,
                                    value: `${client.xx.duracao} Duração: ` + `\`${pd.diasvip} Dias.\``
                                })

                            }

                        }

                        embedVip.addFields(

                            { name: `Logs Vip`, value: `${canal}`, inline: false }

                        )

                        await MESSAGE.edit({ embeds: [embedVip] });
                    }
                })
            }

            if (b.customId == 'pdNB') {

                b.deferUpdate();

                let cargoPd = await db.get(`cargopdNB_${b.guild.id}`);

                if (!cargoPd) {

                    cargoPd = `\`Não foi definido.\``

                } else {
                    cargoPd = `<@&${cargoPd}>`
                }

                let ultimoReset = await db.get(`resetpdNB_${b.guild.id}`);

                if (ultimoReset) {

                    ultimoReset = `\`${moment(ultimoReset).fromNow()}\``

                } else {

                    ultimoReset = `\`Não foi resetado até o momento.\``
                }

                let embedPds = new Discord.EmbedBuilder()
                    .setAuthor({  name: `${client.user.username} | Primeira Dama`, iconURL: client.user.displayAvatarURL() })

                    .setThumbnail(client.user.avatarURL({ size: 4096 }))
                    .setColor(`${colorNB}`)

                var vls = await db.get(`sistemaPD_${b.guild.id}.pd`);

                if (vls) {

                    for (let pd of vls) {

                        embedPds.addFields({
                            name: `${client.xx.anel} ${pd.cargoNome}`,
                            value: `Limite: \`${pd.cargoLimite}\``
                        })

                    }

                }

                embedPds.addFields(

                    { name: `Cargo de primeira dama`, value: `${cargoPd}`, inline: false },
                    { name: `${client.xx.reset} Último Reset`, value: `${ultimoReset}`, inline: false },

                )

                const rowPds = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar permissão de uso de algum cargo")
                            .setCustomId("pdAddNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Adicionar cargo para a primeira dama")
                            .setCustomId("pdCargoNB")
                            .setStyle(Discord.ButtonStyle.Secondary),
                        new Discord.ButtonBuilder()
                            .setLabel("Remover permissão de uso de algum cargo")
                            .setCustomId("pdRemovNB")
                            .setStyle(Discord.ButtonStyle.Danger),
                        new Discord.ButtonBuilder()
                            .setLabel("Resetar")
                            .setEmoji('1067811994507427881')
                            .setCustomId("pdResetNB")
                            .setStyle(Discord.ButtonStyle.Danger))

                const rowBackPds = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setEmoji('1120039338923794432')
                            .setCustomId("voltarMenu")
                            .setStyle(Discord.ButtonStyle.Danger))

                await MESSAGE.edit({ embeds: [embedPds], components: [rowPds, rowBackPds] });
            }

            if (b.customId == 'pdRemovNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content);

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
                            .setDescription(`Cargo removido com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`sistemaPD_${b.guild.id}.pd`, (await db.get(`sistemaPD_${b.guild.id}.pd`))?.filter(element => element.cargoId !== cargo.id));

                        let pd = await db.get(`cargopdNB_${b.guild.id}`);

                        cargo.members.forEach(async (member) => {

                            let Ids = (await db.get(`pd_${member.id}.pds`));

                            if (Ids) {

                                let damas = Ids.map(c => c);

                                let gangroles = await b.guild.members.cache.filter((membro) =>
                                    damas.includes(membro.id)
                                );

                                gangroles.each(async (r) => {
                                    await r.roles.remove(pd).catch(err => { });
                                });

                                await db.delete(`pd_${member.id}`);
                                await db.delete(`limitepdNB_${member.id}`);
                                await db.delete(`contadorpd_${member.id}`);
                            }

                        });

                        let cargoPd = await db.get(`cargopdNB_${b.guild.id}`);

                        if (!cargoPd) {

                            cargoPd = `\`Não foi definido.\``

                        } else {
                            cargoPd = `<@&${cargoPd}>`
                        }

                        let ultimoReset = await db.get(`resetpdNB_${b.guild.id}`);

                        if (ultimoReset) {

                            ultimoReset = `\`${moment(ultimoReset).fromNow()}\``

                        } else {

                            ultimoReset = `\`Não foi resetado até o momento.\``
                        }

                        let embedPds = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Primeira Dama`, iconURL: client.user.displayAvatarURL() })
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        var vls = await db.get(`sistemaPD_${b.guild.id}.pd`);

                        if (vls) {

                            for (let pd of vls) {

                                embedPds.addFields({
                                    name: `${client.xx.anel} ${pd.cargoNome}`,
                                    value: `Limite: \`${pd.cargoLimite}\``
                                })

                            }

                        }

                        embedPds.addFields(

                            { name: `Cargo de primeira dama`, value: `${cargoPd}`, inline: false },
                            { name: `${client.xx.reset} Último Reset`, value: `${ultimoReset}`, inline: false },

                        )


                        await MESSAGE.edit({ embeds: [embedPds] });
                    }

                })

            }

            if (b.customId == 'pdCargoNB') {

                let embedCargoWl = new Discord.EmbedBuilder()
                    .setDescription(`Envie no chat o (@cargo/id) do cargo desejado\nPara cancelar a operação digite: \`cancelar\``)
                    .setColor(`${colorNB}`)

                b.reply({ embeds: [embedCargoWl], ephemeral: true });

                let coletor = b.channel.createMessageCollector({ filter: mm => mm.author.id == b.user.id, max: 1 })

                coletor.on("collect", async (message) => {

                    message.delete();

                    let ee = message.mentions.roles.first() || message.guild.roles.cache.get(message.content) ;

                    if (message.content == "cancelar") {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Operação cancelada com sucesso.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    }

                    let cargo = b.guild.roles.cache.get(ee?.id)

                    if (!cargo) {

                        coletor.stop('Collector stopped manually');

                        let errado = new Discord.EmbedBuilder()
                            .setDescription(`Por favor mencione um ID válido.`)
                            .setColor(`${colorNB}`)

                        return b.editReply({ embeds: [errado], ephemeral: true })

                    } else {

                        let embedG = new Discord.EmbedBuilder()
                            .setDescription(`Cargo de dama adicionado com sucesso.`)
                            .setColor(`${colorNB}`)

                        b.editReply({ embeds: [embedG], ephemeral: true });

                        await db.set(`cargopdNB_${b.guild.id}`, cargo.id);

                        cargo.members.forEach(async (member) => {

                            await member.roles.remove(cargo.id).catch(err => { });

                            await db.delete(`dama_${member.id}`);

                        });

                        let ultimoReset = await db.get(`resetpdNB_${b.guild.id}`);

                        if (ultimoReset) {

                            ultimoReset = `\`${moment(ultimoReset).fromNow()}\``

                        } else {

                            ultimoReset = `\`Não foi resetado até o momento.\``
                        }

                        let embedPds = new Discord.EmbedBuilder()
                            .setAuthor({  name: `${client.user.username} | Primeira Dama`, iconURL: client.user.displayAvatarURL() })
                            .setThumbnail(client.user.avatarURL({ size: 4096 }))
                            .setColor(`${colorNB}`)

                        var vls = await db.get(`sistemaPD_${b.guild.id}.pd`);

                        if (vls) {

                            for (let pd of vls) {

                                embedPds.addFields({
                                    name: `${client.xx.anel} ${pd.cargoNome}`,
                                    value: `Limite: \`${pd.cargoLimite}\``
                                })

                            }

                        }

                        embedPds.addFields(

                            { name: `Cargo de primeira dama`, value: `${cargo}`, inline: false },
                            { name: `${client.xx.reset} Último Reset`, value: `${ultimoReset}`, inline: false },

                        )

                        await MESSAGE.edit({ embeds: [embedPds] });
                    }

                })

            }

            if (b.customId == 'pdResetNB') {

                const embedReset = new Discord.EmbedBuilder()
                    .setDescription(`${b.member}, escolha uma das opções abaixo:`)
                    .setColor(`${colorNB}`)

                let rowWl = new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel("Resetar lista de damas")
                            .setEmoji('1067811994507427881')
                            .setCustomId('resetarLista')
                            .setStyle(Discord.ButtonStyle.Danger),
                        new Discord.ButtonBuilder()
                            .setLabel("Resetar todas as configurações")
                            .setEmoji('1067811994507427881')
                            .setCustomId('resetarTudo')
                            .setStyle(Discord.ButtonStyle.Danger))

                b.reply({ embeds: [embedReset], components: [rowWl], ephemeral: true, fetchReply: true }).then(msg => {
                    const filter = (i) => i.user.id === message.author.id;
                    let coletor = msg.createMessageComponentCollector({ filter });

                    coletor.on('collect', async (b) => {

                        coletor.stop();
                        b.deferUpdate();

                        if (b.customId == 'resetarLista') {

                            (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`pd_`)).forEach(async (element) => {

                                await db.delete(element);
                            });

                            (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`dama_`)).forEach(async (element) => {

                                await db.delete(element);
                            });

                            (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`contadorpd_`)).forEach(async (element) => {

                                await db.delete(element);
                            });

                            let cargopdDb = await db.get(`cargopdNB_${b.guild.id}`);
                            const cargopd = b.guild.roles.cache.get(cargopdDb);

                            if (cargopd) {

                                cargopd.members.forEach(async (member) => {

                                    await member.roles.remove(cargopdDb).catch(err => { });

                                });
                            }

                            await db.set(`resetpdNB_${b.guild.id}`, new Date().getTime());

                            let embedPds = new Discord.EmbedBuilder()
                                .setAuthor({  name: `${client.user.username} | Primeira Dama`, iconURL: client.user.displayAvatarURL() })
                                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                                .setColor(`${colorNB}`)

                            let cargoPd = await db.get(`cargopdNB_${b.guild.id}`);

                            if (!cargoPd) {

                                cargoPd = `\`Não foi definido.\``

                            } else {
                                cargoPd = `<@&${cargoPd}>`
                            }

                            var vls = await db.get(`sistemaPD_${b.guild.id}.pd`);

                            if (vls) {

                                for (let pd of vls) {

                                    embedPds.addFields({
                                        name: `${client.xx.anel} ${pd.cargoNome}`,
                                        value: `Limite: \`${pd.cargoLimite}\``
                                    })

                                }

                            }

                            embedPds.addFields(

                                { name: `Cargo de primeira dama`, value: `${cargoPd}`, inline: false },
                                { name: `${client.xx.reset} Último Reset`, value: `\`${moment(new Date().getTime()).fromNow()}\``, inline: false },

                            )

                            await MESSAGE.edit({ embeds: [embedPds] });
                        }

                        if (b.customId == 'resetarTudo') {

                            await db.delete(`sistemaPD_${b.guild.id}`);
                            await db.delete(`cargopdNB_${b.guild.id}`);

                            (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`pd_`)).forEach(async (element) => {

                                await db.delete(element);
                            });

                            (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`limitepdNB_`)).forEach(async (element) => {

                                await db.delete(element);
                            });

                            (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`dama_`)).forEach(async (element) => {

                                await db.delete(element);
                            });

                            (await db.all()).map(entry => entry.id)?.filter(id => id.startsWith(`contadorpd_`)).forEach(async (element) => {

                                await db.delete(element);
                            });

                            let cargopdDb = await db.get(`cargopdNB_${b.guild.id}`);
                            const cargopd = b.guild.roles.cache.get(cargopdDb);

                            if (cargopd) {

                                cargoPd.members.forEach(async (member) => {

                                    await member.roles.remove(cargopdDb).catch(err => { });

                                });
                            }

                            await db.set(`resetpdNB_${b.guild.id}`, new Date().getTime());

                            let embedPds = new Discord.EmbedBuilder()
                                .setAuthor({  name: `${client.user.username} | Primeira Dama`, iconURL: client.user.displayAvatarURL() })
                                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                                .setColor(`${colorNB}`)

                            let cargoPd = await db.get(`cargopdNB_${b.guild.id}`);

                            if (!cargoPd) {

                                cargoPd = `\`Não foi definido.\``

                            } else {
                                cargoPd = `<@&${cargoPd}>`
                            }

                            var vls = await db.get(`sistemaPD_${b.guild.id}.pd`);

                            if (vls) {

                                for (let pd of vls) {

                                    embedPds.addFields({
                                        name: `${client.xx.anel} ${pd.cargoNome}`,
                                        value: `Limite: \`${pd.cargoLimite}\``
                                    })

                                }

                            }

                            embedPds.addFields(

                                { name: `Cargo de primeira dama`, value: `${cargoPd}`, inline: false },
                                { name: `${client.xx.reset} Último Reset`, value: `\`${moment(new Date().getTime()).fromNow()}\``, inline: false },

                            )

                            await MESSAGE.edit({ embeds: [embedPds] });
                        }
                    }
                    )
                })

            }

        })
    }
}