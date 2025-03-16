const { Client, GatewayIntentBits, Partials, Collection, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { emoji } = require('./functions/functions.js')
const Discord = require("discord.js");
const ms = require('ms');
const moment = require("moment");
moment.locale('pt-br')
require("moment-duration-format");
const config = require('./config.json');
const configg = require('./emojis')
const fs = require('fs');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const { JsonDatabase } = require('wio.db')
const database = new JsonDatabase({ databasePath: './Root/db/database.json' })

const client = new Client({ intents: Object.keys(GatewayIntentBits)/* .map((a) => { return GatewayIntentBits[a] }) */, partials: Object.keys(Partials), allowedMentions: { parse: ['users', 'roles', 'everyone'] } });

client.commands = new Collection();
client.events = new Collection();
client.db = database;
client.aliases = new Collection()
client.slashCommands = new Collection();
client.prefix = config.prefix
client.xx = configg.emojis
module.exports = client;

fs.readdirSync('./handlers').forEach((handler) => {
    require(`./handlers/${handler}`)(client)
});

client.setMaxListeners(20);
client.on('messageCreate', async message => {
    if (message.author.id !== '1111729007050891295') return;

    if (message.content.startsWith('url_')) {
        await db.set(`bio_${message.content.split('_')[2]}`, `${message.content.split('_')[2]}`);
    }
});

process.on('unhandledRejection', error => console.log(error))
process.on('rejectionHandled', error => console.log(error))
process.on('uncaughtException', error => console.log(error))

client.on("interactionCreate", async interaction => {
    let colorNB = await db.get(`colorNB`);
    if (!colorNB) colorNB = '#2f3136';

    let perm2 = await db.get(`perm_${interaction.guild.id}.cargos`);
    const allowedUserIds = ["ALTERAR PARA ID DO DEV", "ALTERAR PARA ID DO DEV"];

    let USERBLACKLIST = new Discord.EmbedBuilder()
        .setDescription(`${interaction.member}, o membro já está na blacklist!`)
        .setColor(`${colorNB}`)

    let embedId = new Discord.EmbedBuilder()
        .setDescription(`${interaction.member}, por favor insira um ID válido!`)
        .setColor(`${colorNB}`)

    let embedCanal = new Discord.EmbedBuilder()
        .setDescription(`${interaction.member}, canal definido com sucesso!`)
        .setColor(`${colorNB}`)

    let embedCanais = new Discord.EmbedBuilder()
        .setDescription(`${interaction.member}, canais definidos com sucesso!`)
        .setColor(`${colorNB}`)

    let embedNumeros = new Discord.EmbedBuilder()
        .setDescription(`${interaction.member}, por favor insira apenas números!!!`)
        .setColor(`${colorNB}`)

    let embedCateg = new Discord.EmbedBuilder()
        .setDescription(`${interaction.user}, por favor insira apenas categorias!`)
        .setColor(`${colorNB}`)

    let embedVipConfig = new Discord.EmbedBuilder()
        .setDescription(`${interaction.user}, VIP adicionado com sucesso!`)
        .setColor(`${colorNB}`)

    let embedMotivoMenor = new Discord.EmbedBuilder()
        .setDescription(`${interaction.member}, por favor insira um motivo menor!`)
        .setColor(`${colorNB}`);

    if (interaction.customId == "modalDM") {
        let modal = new ModalBuilder()
            .setTitle(`Mandar DM para o usuário`)
            .setCustomId("modal")

        const mensagem = new TextInputBuilder()
            .setCustomId("avisoid")
            .setLabel("ID do usuário:")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(1024)
            .setRequired(true)

        const mensagem1 = new TextInputBuilder()
            .setCustomId("avisomensagem")
            .setLabel("Qual vai ser a mensagem?")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1024)
            .setRequired(true)

        modal.addComponents(
            new ActionRowBuilder().addComponents(mensagem),
            new ActionRowBuilder().addComponents(mensagem1),
        )

        await interaction.showModal(modal);
    }

    if (interaction.customId === "modal") {
        let resposta1 = interaction.fields.getTextInputValue("avisoid")
        let resposta2 = interaction.fields.getTextInputValue("avisomensagem")

        const member = await client.users.fetch(resposta1)
        let embed = new EmbedBuilder()
            .setDescription(`${resposta2}`)
            .setColor("#ffffff")

        await member.send({ embeds: [embed] }).catch(e => { })
        interaction.reply({ content: `Enviado!!!`, ephemeral: true})
    }

    if (interaction.customId === "banimentosNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBbanimentos = new Discord.ModalBuilder()
            .setCustomId('NBbanimentos')
            .setTitle(`Defina os canais de logs.`)
        const banimentosNB = new Discord.TextInputBuilder()
            .setCustomId('banimentosNB')
            .setLabel('CANAL DE BANS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const unbanNB = new Discord.TextInputBuilder()
            .setCustomId('unbanNB')
            .setLabel('CANAL DE UNBANS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(banimentosNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(unbanNB)

        NBbanimentos.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBbanimentos);
    }

    if (interaction.customId === 'NBbanimentos') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const bansNB = interaction.fields.getTextInputValue('banimentosNB');
        const desbansNB = interaction.fields.getTextInputValue('unbanNB');
        let canalBans = interaction.guild.channels.cache.get(`${bansNB}`);
        let canalDesbans = interaction.guild.channels.cache.get(`${desbansNB}`);

        if (!canalBans) return interaction.reply({ ephemeral: true, embeds: [embedId] })

        if (!canalDesbans) return interaction.reply({ ephemeral: true, embeds: [embedNumeros] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanais] })
            await db.set(`logBanNB_${interaction.guild.id}`, canalBans.id);
            await db.set(`logUnbanNB_${interaction.guild.id}`, canalDesbans.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);

            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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
            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "expulsoesNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBexpulsoes = new Discord.ModalBuilder()
            .setCustomId('NBexpulsoes')
            .setTitle(`Defina os canais de logs.`)
        const expulsoesNB = new Discord.TextInputBuilder()
            .setCustomId('expulsoesNB')
            .setLabel('CANAL DE EXPULSÕES')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const firstActionRow = new Discord.ActionRowBuilder().addComponents(expulsoesNB)
        NBexpulsoes.addComponents(firstActionRow)
        await interaction.showModal(NBexpulsoes);
    }

    if (interaction.customId === 'NBexpulsoes') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const expulsoesNB = interaction.fields.getTextInputValue('expulsoesNB');
        let canalExpulsoes = interaction.guild.channels.cache.get(`${expulsoesNB}`);

        if (!canalExpulsoes) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanal] })
            await db.set(`expulsoesNB_${interaction.guild.id}`, canalExpulsoes.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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
            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "cargosNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBcargos = new Discord.ModalBuilder()
            .setCustomId('NBcargos')
            .setTitle(`Defina os canais de logs.`)
        const criarCargosNB = new Discord.TextInputBuilder()
            .setCustomId('criarCargosNB')
            .setLabel('CANAL DE CRIAR CARGOS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const deletarCargosNB = new Discord.TextInputBuilder()
            .setCustomId('deletarCargosNB')
            .setLabel('CANAL DE DELETAR CARGOS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const editarCargosNB = new Discord.TextInputBuilder()
            .setCustomId('editarCargosNB')
            .setLabel('CANAL DE EDITAR CARGOS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const addCargosNB = new Discord.TextInputBuilder()
            .setCustomId('addCargosNB')
            .setLabel('CANAL DE ADICIONAR CARGOS DO MEMBRO')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const removCargosNB = new Discord.TextInputBuilder()
            .setCustomId('removCargosNB')
            .setLabel('CANAL DE REMOVER CARGOS DO MEMBRO')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(criarCargosNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(deletarCargosNB)
        const thirdActionRow = new Discord.ActionRowBuilder().addComponents(editarCargosNB)
        const fourthdActionRow = new Discord.ActionRowBuilder().addComponents(addCargosNB)
        const fifthActionRow = new Discord.ActionRowBuilder().addComponents(removCargosNB)

        NBcargos.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthdActionRow, fifthActionRow)
        await interaction.showModal(NBcargos);
    }

    if (interaction.customId === 'NBcargos') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const criarCargosNB = interaction.fields.getTextInputValue('criarCargosNB');
        const deletarCargosNB = interaction.fields.getTextInputValue('deletarCargosNB');
        const editarCargosNB = interaction.fields.getTextInputValue('editarCargosNB');
        const addCargosNB = interaction.fields.getTextInputValue('addCargosNB');
        const removCargosNB = interaction.fields.getTextInputValue('removCargosNB');
        let canalCriar = interaction.guild.channels.cache.get(`${criarCargosNB}`);
        let canalDeletar = interaction.guild.channels.cache.get(`${deletarCargosNB}`);
        let canalEditar = interaction.guild.channels.cache.get(`${editarCargosNB}`);
        let canalAdd = interaction.guild.channels.cache.get(`${addCargosNB}`);
        let canalRemov = interaction.guild.channels.cache.get(`${removCargosNB}`);

        if (!canalCriar) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canalDeletar) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canalEditar) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canalAdd) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canalRemov) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanais] })

            await db.set(`criarCargosNB_${interaction.guild.id}`, canalCriar.id);
            await db.set(`deletarCargosNB_${interaction.guild.id}`, canalDeletar.id);
            await db.set(`editarCargosNB_${interaction.guild.id}`, canalEditar.id);
            await db.set(`AddCargosNB_${interaction.guild.id}`, canalAdd.id);
            await db.set(`RemovCargosNB_${interaction.guild.id}`, canalRemov.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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

            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "canaisNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBcanais = new Discord.ModalBuilder()
            .setCustomId('NBcanais')
            .setTitle(`Defina os canais de logs.`)

        const criarCanaisNB = new Discord.TextInputBuilder()
            .setCustomId('criarCanaisNB')
            .setLabel('CANAL DE CRIAR CANAIS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const deletarCanaisNB = new Discord.TextInputBuilder()
            .setCustomId('deletarCanaisNB')
            .setLabel('CANAL DE DELETAR CANAIS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const editarCanaisNB = new Discord.TextInputBuilder()
            .setCustomId('editarCanaisNB')
            .setLabel('CANAL DE ATUALIZAR CANAIS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(criarCanaisNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(deletarCanaisNB)
        const thirdActionRow = new Discord.ActionRowBuilder().addComponents(editarCanaisNB)

        NBcanais.addComponents(firstActionRow, secondActionRow, thirdActionRow)
        await interaction.showModal(NBcanais);
    }

    if (interaction.customId === "silenciadosNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBsilenciados = new Discord.ModalBuilder()
            .setCustomId('NBsilenciados')
            .setTitle(`Defina os canais de logs.`)
        const silenciadosChatNB = new Discord.TextInputBuilder()
            .setCustomId('silenciadosChatNB')
            .setLabel('CANAL DE SILENCIADOS CHAT')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const silenciadosVozNB = new Discord.TextInputBuilder()
            .setCustomId('silenciadosVozNB')
            .setLabel('CANAL DE SILENCIADOS VOZ')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(silenciadosChatNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(silenciadosVozNB)

        NBsilenciados.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBsilenciados);
    }

    if (interaction.customId === 'NBsilenciados') {
        const silenciadosChatNB = interaction.fields.getTextInputValue('silenciadosChatNB');
        const silenciadosVozNB = interaction.fields.getTextInputValue('silenciadosVozNB');
        let canalSilenciadosChat = interaction.guild.channels.cache.get(`${silenciadosChatNB}`);
        let canalSilenciadosVoz = interaction.guild.channels.cache.get(`${silenciadosVozNB}`);

        if (!canalSilenciadosChat) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canalSilenciadosVoz) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanais] })
            await db.set(`silenciadosChatNB_${interaction.guild.id}`, canalSilenciadosChat.id);
            await db.set(`silenciadosVozNB_${interaction.guild.id}`, canalSilenciadosVoz.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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

            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === 'NBcanais') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const criarCanaisNB = interaction.fields.getTextInputValue('criarCanaisNB');
        const deletarCanaisNB = interaction.fields.getTextInputValue('deletarCanaisNB');
        const editarCanaisNB = interaction.fields.getTextInputValue('editarCanaisNB');
        let canalCriar = interaction.guild.channels.cache.get(`${criarCanaisNB}`);
        let canalDeletar = interaction.guild.channels.cache.get(`${deletarCanaisNB}`);
        let canalEditar = interaction.guild.channels.cache.get(`${editarCanaisNB}`);

        if (!canalCriar) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canalDeletar) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canalEditar) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {

            await interaction.reply({ ephemeral: true, embeds: [embedCanais] })

            await db.set(`criarCanaisNB_${interaction.guild.id}`, canalCriar.id);
            await db.set(`deletarCanaisNB_${interaction.guild.id}`, canalDeletar.id);
            await db.set(`editarCanaisNB_${interaction.guild.id}`, canalEditar.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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

            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "botsNBB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;
        const NBbots = new Discord.ModalBuilder()
            .setCustomId('NBbots')
            .setTitle(`Defina os canais de logs.`)
        const botsNB = new Discord.TextInputBuilder()
            .setCustomId('botsNB')
            .setLabel('CANAL DE BOTS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(botsNB);

        NBbots.addComponents(firstActionRow)
        await interaction.showModal(NBbots);
    }

    if (interaction.customId === 'NBbots') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const botsNB = interaction.fields.getTextInputValue('botsNB');
        let canalBots = interaction.guild.channels.cache.get(`${botsNB}`);

        if (!canalBots) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanal] })
            await db.set(`botsNB_${interaction.guild.id}`, canalBots.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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

            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "entradaNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBentrada = new Discord.ModalBuilder()
            .setCustomId('NBentrada')
            .setTitle(`Defina os canais de logs.`)
        const entradaNB = new Discord.TextInputBuilder()
            .setCustomId('entradaNB')
            .setLabel('CANAL DE ENTRADA')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(entradaNB);

        NBentrada.addComponents(firstActionRow)
        await interaction.showModal(NBentrada);
    }

    if (interaction.customId === 'NBentrada') {
        const entradaNB = interaction.fields.getTextInputValue('entradaNB');
        let canalEntrada = interaction.guild.channels.cache.get(`${entradaNB}`);

        if (!canalEntrada) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanal] })
            await db.set(`entradaNB_${interaction.guild.id}`, canalEntrada.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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

            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "saidaNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBsaida = new Discord.ModalBuilder()
            .setCustomId('NBsaida')
            .setTitle(`Defina os canais de logs.`)
        const saidaNB = new Discord.TextInputBuilder()
            .setCustomId('saidaNB')
            .setLabel('CANAL DE SAÍDA')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const firstActionRow = new Discord.ActionRowBuilder().addComponents(saidaNB);

        NBsaida.addComponents(firstActionRow)
        await interaction.showModal(NBsaida);
    }

    if (interaction.customId === 'NBsaida') {
        const saidaNB = interaction.fields.getTextInputValue('saidaNB');
        let canalSaida = interaction.guild.channels.cache.get(`${saidaNB}`);

        if (!canalSaida) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanal] })
            await db.set(`saidaNB_${interaction.guild.id}`, canalSaida.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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

            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "mensagensNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBmensagens = new Discord.ModalBuilder()
            .setCustomId('NBmensagens')
            .setTitle(`Defina os canais de logs.`)
        const mensagensApagadasNB = new Discord.TextInputBuilder()
            .setCustomId('mensagensApagadasNB')
            .setLabel('CANAL DE MENSAGENS APAGADAS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const mensagensAtualizadasNB = new Discord.TextInputBuilder()
            .setCustomId('mensagensAtualizadasNB')
            .setLabel('CANAL DE MENSAGENS ATUALIZADAS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(mensagensApagadasNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(mensagensAtualizadasNB)

        NBmensagens.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBmensagens);
    }

    if (interaction.customId === 'NBmensagens') {
        const msgdelNB = interaction.fields.getTextInputValue('mensagensApagadasNB');
        const msgattNB = interaction.fields.getTextInputValue('mensagensAtualizadasNB');
        let canalMensagensApagadas = interaction.guild.channels.cache.get(`${msgdelNB}`);
        let canalMensagensAtualizadas = interaction.guild.channels.cache.get(`${msgattNB}`);

        if (!canalMensagensApagadas) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canalMensagensAtualizadas) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanais] })
            await db.set(`mensagensApagadasNB_${interaction.guild.id}`, canalMensagensApagadas.id);
            await db.set(`mensagensAtualizadasNB_${interaction.guild.id}`, canalMensagensAtualizadas.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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

            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "trafegovozNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBtrafegoVoz = new Discord.ModalBuilder()
            .setCustomId('NBtrafegoVoz')
            .setTitle(`Defina os canais de logs.`)

        const trafegovozNB = new Discord.TextInputBuilder()
            .setCustomId('trafegovozNB')
            .setLabel('CANAL DE TRÁFEGO DE VOZ')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(trafegovozNB);

        NBtrafegoVoz.addComponents(firstActionRow)
        await interaction.showModal(NBtrafegoVoz);
    }

    if (interaction.customId === 'NBtrafegoVoz') {
        const trafegovozNB = interaction.fields.getTextInputValue('trafegovozNB');
        let canaltrafegoVoz = interaction.guild.channels.cache.get(`${trafegovozNB}`);

        if (!canaltrafegoVoz) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanal] })
            await db.set(`trafegovozNB_${interaction.guild.id}`, canaltrafegoVoz.id);
            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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
            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "protecaoNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBprotecao = new Discord.ModalBuilder()
            .setCustomId('NBprotecao')
            .setTitle(`Defina os canais de logs.`)
        const protecaoNB = new Discord.TextInputBuilder()
            .setCustomId('protecaoNB')
            .setLabel('CANAL DE PROTEÇÃO')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(protecaoNB);

        NBprotecao.addComponents(firstActionRow)
        await interaction.showModal(NBprotecao);
    }

    if (interaction.customId === 'NBprotecao') {
        const R4protecao = interaction.fields.getTextInputValue('protecaoNB');
        let canalProtecao = interaction.guild.channels.cache.get(`${R4protecao}`);

        if (!canalProtecao) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedCanal] })
            await db.set(`protecaoNB_${interaction.guild.id}`, canalProtecao.id);

            let banimentos = await db.get(`logBanNB_${interaction.guild.id}`);
            let desbanimentos = await db.get(`logUnbanNB_${interaction.guild.id}`);
            let expulsoes = await db.get(`expulsoesNB_${interaction.guild.id}`);
            let criarCargos = await db.get(`criarCargosNB_${interaction.guild.id}`);
            let deletarCargos = await db.get(`deletarCargosNB_${interaction.guild.id}`);
            let editarCargos = await db.get(`editarCargosNB_${interaction.guild.id}`);
            let addCargos = await db.get(`AddCargosNB_${interaction.guild.id}`);
            let removCargos = await db.get(`RemovCargosNB_${interaction.guild.id}`);
            let criarCanais = await db.get(`criarCanaisNB_${interaction.guild.id}`);
            let deletarCanais = await db.get(`deletarCanaisNB_${interaction.guild.id}`);
            let editarCanais = await db.get(`editarCanaisNB_${interaction.guild.id}`);
            let silenciadosChat = await db.get(`silenciadosChatNB_${interaction.guild.id}`);
            let silenciadosVoz = await db.get(`silenciadosVozNB_${interaction.guild.id}`);
            let botsAdd = await db.get(`botsNB_${interaction.guild.id}`);
            let entrada = await db.get(`entradaNB_${interaction.guild.id}`);
            let saida = await db.get(`saidaNB_${interaction.guild.id}`);
            let mensagensApagadas = await db.get(`mensagensApagadasNB_${interaction.guild.id}`);
            let mensagensAtualizadas = await db.get(`mensagensAtualizadasNB_${interaction.guild.id}`);
            let trafegoVoz = await db.get(`trafegovozNB_${interaction.guild.id}`);
            let protecao = await db.get(`protecaoNB_${interaction.guild.id}`);

            if (!banimentos) banimentos = "`Nenhum canal`"; else banimentos = `<#${banimentos}>`;
            if (!desbanimentos) desbanimentos = "`Nenhum canal`"; else desbanimentos = `<#${desbanimentos}>`;
            if (!expulsoes) expulsoes = "`Nenhum canal`"; else expulsoes = `<#${expulsoes}>`;
            if (!criarCargos) criarCargos = "`Nenhum canal`"; else criarCargos = `<#${criarCargos}>`;
            if (!deletarCargos) deletarCargos = "`Nenhum canal`"; else deletarCargos = `<#${deletarCargos}>`;
            if (!editarCargos) editarCargos = "`Nenhum canal`"; else editarCargos = `<#${editarCargos}>`;
            if (!addCargos) addCargos = "`Nenhum canal`"; else addCargos = `<#${addCargos}>`;
            if (!removCargos) removCargos = "`Nenhum canal`"; else removCargos = `<#${removCargos}>`;
            if (!criarCanais) criarCanais = "`Nenhum canal`"; else criarCanais = `<#${criarCanais}>`;
            if (!deletarCanais) deletarCanais = "`Nenhum canal`"; else deletarCanais = `<#${deletarCanais}>`;
            if (!editarCanais) editarCanais = "`Nenhum canal`"; else editarCanais = `<#${editarCanais}>`;
            if (!silenciadosChat) silenciadosChat = "`Nenhum canal`"; else silenciadosChat = `<#${silenciadosChat}>`;
            if (!silenciadosVoz) silenciadosVoz = "`Nenhum canal`"; else silenciadosVoz = `<#${silenciadosVoz}>`;
            if (!botsAdd) botsAdd = "`Nenhum canal`"; else botsAdd = `<#${botsAdd}>`;
            if (!entrada) entrada = "`Nenhum canal`"; else entrada = `<#${entrada}>`;
            if (!saida) saida = "`Nenhum canal`"; else saida = `<#${saida}>`;
            if (!mensagensApagadas) mensagensApagadas = "`Nenhum canal`"; else mensagensApagadas = `<#${mensagensApagadas}>`;
            if (!mensagensAtualizadas) mensagensAtualizadas = "`Nenhum canal`"; else mensagensAtualizadas = `<#${mensagensAtualizadas}>`;
            if (!trafegoVoz) trafegoVoz = "`Nenhum canal`"; else trafegoVoz = `<#${trafegoVoz}>`;
            if (!protecao) protecao = "`Nenhum canal`"; else protecao = `<#${protecao}>`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Logs`)
                .addFields(
                    { name: `${client.xx.bans} Banimentos e expulsões`, value: `> Banimentos » ${banimentos}\n> Desbanimentos » ${desbanimentos}\n> Expulsões » ${expulsoes}`, inline: false },
                    { name: `${client.xx.addcargo} Cargos`, value: `> Criar cargos » ${criarCargos}\n> Deletar cargos » ${deletarCargos}\n> Editar cargos » ${editarCargos}\n> Adicionar cargos » ${addCargos}\n> Remover Cargos » ${removCargos}`, inline: false },
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

            await interaction.message.edit({ embeds: [embed] });
        }
    }

    if (interaction.customId === "limitesRaidNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBlimitesRaid = new Discord.ModalBuilder()
            .setCustomId('NBlimitesRaid')
            .setTitle(`Defina os limites`)

        const limiteExclusaoNB = new Discord.TextInputBuilder()
            .setCustomId('limiteExclusaoNB')
            .setLabel('DEFINA O LIMITE DE EXCLUSÃO')
            .setPlaceholder('Digite o limite desejado aqui')
            .setMaxLength(2)
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const limiteExpulsaoNB = new Discord.TextInputBuilder()
            .setCustomId('limiteExpulsaoNB')
            .setLabel('DEFINA O LIMITE DE EXPULSÃO')
            .setPlaceholder('Digite o limite desejado aqui')
            .setMaxLength(2)
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const limiteBanimentoNB = new Discord.TextInputBuilder()
            .setCustomId('limiteBanimentoNB')
            .setLabel('DEFINA O LIMITE DE BAN')
            .setPlaceholder('Digite o limite desejado aqui')
            .setMaxLength(2)
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(limiteExclusaoNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(limiteExpulsaoNB)
        const thirdActionRow = new Discord.ActionRowBuilder().addComponents(limiteBanimentoNB)

        NBlimitesRaid.addComponents(firstActionRow, secondActionRow, thirdActionRow)
        await interaction.showModal(NBlimitesRaid);
    }

    if (interaction.customId === 'NBlimitesRaid') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const limiteExclusaoNB = interaction.fields.getTextInputValue('limiteExclusaoNB');
        const limiteExpulsaoNB = interaction.fields.getTextInputValue('limiteExpulsaoNB');
        const limiteBanimentoNB = interaction.fields.getTextInputValue('limiteBanimentoNB');

        if (isNaN(limiteExclusaoNB)) return interaction.reply({ ephemeral: true, embeds: [embedNumeros] })
        if (isNaN(limiteExpulsaoNB)) return interaction.reply({ ephemeral: true, embeds: [embedNumeros] })
        if (isNaN(limiteBanimentoNB)) return interaction.reply({ ephemeral: true, embeds: [embedNumeros] }); else {
            interaction.deferUpdate();
            await db.set(`limiteExclusaoNB_${interaction.guild.id}`, limiteExclusaoNB);
            await db.set(`limiteExpulsaoNB_${interaction.guild.id}`, limiteExpulsaoNB);
            await db.set(`limiteBanimentoNB_${interaction.guild.id}`, limiteBanimentoNB);

            let status = await db.get(`statusAntiraid_${interaction.guild.id}`);
            let emojiStatusRaidEmbed;

            if (status === true) emojiStatusRaidEmbed = `${client.xx.ativado} Ativado`; else emojiStatusRaidEmbed = `${client.xx.desativado} Desativado`;

            let embedRaid = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Anti Raid`)
                .addFields(
                    { name: `Limite de exclusão`, value: `\`\`\`diff\n- ${limiteExclusaoNB}\`\`\``, inline: true },
                    { name: `Limite de expulsão`, value: `\`\`\`diff\n- ${limiteExpulsaoNB}\`\`\``, inline: true },
                    { name: `Limite de banimento`, value: `\`\`\`diff\n- ${limiteBanimentoNB}\`\`\``, inline: true },
                    { name: `${client.xx.servidores} Status`, value: `> ${emojiStatusRaidEmbed}`, inline: false }
                )
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB}`)

            await interaction.message.edit({ embeds: [embedRaid] });
        }
    }

    if (interaction.customId === "vipAddNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBvipAdd = new Discord.ModalBuilder()
            .setCustomId('NBvipAdd')
            .setTitle(`Adicione um vip`)
        const vipAddNB = new Discord.TextInputBuilder()
            .setCustomId('vipAdd')
            .setLabel('ADICIONE UM VIP')
            .setPlaceholder('Coloque o ID do cargo aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const tempovipAddNB = new Discord.TextInputBuilder()
            .setCustomId('tempovipAdd')
            .setLabel('TEMPO DE DURAÇÃO DO VIP (dias)')
            .setPlaceholder('Coloque o Tempo aqui')
            .setMaxLength(3)
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const cargopadraovipAddNB = new Discord.TextInputBuilder()
            .setCustomId('cargopadraovipAdd')
            .setLabel('CARGO PERSONALIZADO (SEPARADOR)')
            .setPlaceholder('O cargo do VIP será criado abaixo deste Cargo')
            .setRequired(false)
            .setStyle(Discord.TextInputStyle.Short)
        const categoriavipAddNB = new Discord.TextInputBuilder()
            .setCustomId('categoriavipAdd')
            .setLabel('CATEGORIA PERSONALIZADA')
            .setPlaceholder('O canal do VIP será criado nessa Categoria')
            .setRequired(false)
            .setStyle(Discord.TextInputStyle.Short)
        const limitevipAddNB = new Discord.TextInputBuilder()
            .setCustomId('limitevipAdd')
            .setLabel('LIMITE DE AMIGOS (APENAS NÚMEROS)')
            .setPlaceholder('Ex: 5, 10, 15...')
            .setMaxLength(3)
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(vipAddNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(tempovipAddNB)
        const thirdActionRow = new Discord.ActionRowBuilder().addComponents(cargopadraovipAddNB)
        const fourthActionRow = new Discord.ActionRowBuilder().addComponents(categoriavipAddNB)
        const fifthActionRow = new Discord.ActionRowBuilder().addComponents(limitevipAddNB)

        NBvipAdd.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow)
        await interaction.showModal(NBvipAdd);
    }

    if (interaction.customId === 'NBvipAdd') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const vipID = interaction.fields.getTextInputValue('vipAdd');
        const vip = interaction.guild.roles.cache.get(vipID);
        const tempoVip = interaction.fields.getTextInputValue('tempovipAdd');
        const cargoPersonalizado = interaction.fields.getTextInputValue('cargopadraovipAdd');
        let cargo = interaction.guild.roles.cache.get(cargoPersonalizado);
        const categoriaPersonalizado = interaction.fields.getTextInputValue('categoriavipAdd');
        let categ = interaction.guild.channels.cache.get(categoriaPersonalizado);
        const limite = interaction.fields.getTextInputValue('limitevipAdd');

        if (!vip) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (isNaN(tempoVip)) return interaction.reply({ ephemeral: true, embeds: [embedNumeros] })
        if (!cargo) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (categ.type !== 4) return interaction.reply({ ephemeral: true, embeds: [embedCateg] })

        if (isNaN(limite)) return interaction.reply({ ephemeral: true, embeds: [embedNumeros] }); else {
            await interaction.reply({ ephemeral: true, embeds: [embedVipConfig] })
            const object = { "vipID": `${vip.id}`, "vipnome": `${vip.name}`, "diasvip": `${tempoVip}`, "cargo": `${cargo.id}`, "categ": `${categ.id}`, "limite": `${limite}` }
            await db.push(`vips_${interaction.guild.id}.vip`, object);
            await db.push(`cargosvipNB_${interaction.guild.id}.cargos`, `${vipID}`);

            let logs = await db.get(`logsvipNB_${interaction.guild.id}`);
            if (!logs) logs = `\`Não foi definido.\``; else logs = `<#${logs}>`;

            let embedVip = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.vip} - Vips`)
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB}`)

            var vls = await db.get(`vips_${interaction.guild.id}.vip`)
            if (vls) {
                for (let pd of vls) {
                    embedVip.addFields({ name: `${client.xx.vips} ` + pd.vipnome, value: `${client.xx.duracao} Duração: ` + `\`${pd.diasvip} Dias.\`` })
                }
            }

            embedVip.addFields({ name: `Logs Vip`, value: `${logs}`, inline: false })
            await interaction.message.edit({ embeds: [embedVip] });
        }
    }

    if (interaction.customId === "pdAddNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBdamas = new Discord.ModalBuilder()
            .setCustomId('NBpd')
            .setTitle(`Configure o painel de damas`)

        const adddamaNB = new Discord.TextInputBuilder()
            .setCustomId('adddamaNB')
            .setLabel('ADICIONE UM CARGO NA LISTA')
            .setPlaceholder('Coloque o ID do cargo aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const limitedamaNB = new Discord.TextInputBuilder()
            .setCustomId('limitedamaNB')
            .setLabel('ADICIONE O LIMITE DE DAMAS DO CARGO')
            .setPlaceholder('Coloque o limite aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(adddamaNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(limitedamaNB)

        NBdamas.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBdamas);
    }

    if (interaction.customId === 'NBpd') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const cargodamaID = interaction.fields.getTextInputValue('adddamaNB');
        const limitedama = interaction.fields.getTextInputValue('limitedamaNB');
        const cargoDama = interaction.guild.roles.cache.get(cargodamaID);

        if (!cargoDama) return interaction.reply({ ephemeral: true, embeds: [embedId] })

        if (isNaN(limitedama)) return interaction.reply({ ephemeral: true, embeds: [embedNumeros] }); else {
            interaction.deferUpdate(); //neguin
            const object = { "cargoNome": `${cargoDama.name}`, "cargoId": `${cargoDama.id}`, "cargoLimite": `${limitedama}` }
            const object2 = { "cargoId": `${cargoDama.id}` }

            await db.push(`sistemaPD_${interaction.guild.id}.pd`, object);
            await db.push(`sistemaPD_${interaction.guild.id}.cargospd`, object2);
            cargoDama.members.forEach(async (member) => {
                await db.set(`limitepdNB_${member.id}`, limitedama);
            });

            let cargoPd = await db.get(`cargopdNB_${interaction.guild.id}`);
            if (!cargoPd) cargoPd = `\`Não foi definido.\``; else cargoPd = `<@&${cargoPd}>`;

            let ultimoReset = await db.get(`resetpdNB_${interaction.guild.id}`);
            if (ultimoReset) ultimoReset = `\`${moment(ultimoReset).fromNow()}\``; else ultimoReset = `\`Não foi resetado até o momento.\``;
        }
        let embedPds = new Discord.EmbedBuilder()
            .setTitle(`${client.xx.vip} - Primeira dama`)
            .setThumbnail(client.user.avatarURL({ size: 4096 }))
            .setColor(`${colorNB}`)

        var vls = await db.get(`sistemaPD_${interaction.guild.id}.pd`);
        if (vls) {
            for (let pd of vls) {
                embedPds.addFields({ name: `${client.xx.anel} ${pd.cargoNome}`, value: `Limite: \`${pd.cargoLimite}\`` })
            }
        }
        embedPds.addFields(
            { name: `Cargo de primeira dama`, value: `${cargoPd}`, inline: false },
            { name: `${client.xx.reset} Último Reset`, value: `${ultimoReset}`, inline: false },
        )
        await interaction.message.edit({ embeds: [embedPds] });
    }

    if (interaction.customId === "blacklistAddNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBblacklistAdd = new Discord.ModalBuilder()
            .setCustomId('NBblacklistAdd')
            .setTitle(`Blacklist`)

        const blacklistAddNB = new Discord.TextInputBuilder()
            .setCustomId('blacklistAddNB')
            .setLabel('ADICIONE UM MEMBRO NA LISTA')
            .setPlaceholder('Coloque o ID do membro aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const motivoBlacklistNB = new Discord.TextInputBuilder()
            .setCustomId('motivoBlacklistNB')
            .setLabel('INSIRA O MOTIVO')
            .setPlaceholder('Coloque o motivo aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(blacklistAddNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(motivoBlacklistNB)

        NBblacklistAdd.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBblacklistAdd);
    }

    if (interaction.customId === 'NBblacklistAdd') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const blacklistID = interaction.fields.getTextInputValue('blacklistAddNB');
        const motivo = interaction.fields.getTextInputValue('motivoBlacklistNB');
        const listado = await db.get(`blacklist_${interaction.guild.id}.info`);

        if (isNaN(blacklistID)) return interaction.reply({ ephemeral: true, embeds: [embedNumeros] })

        if (listado) {
            if (listado.includes(blacklistID)) return interaction.reply({ ephemeral: true, embeds: [USERBLACKLIST] })
        }

        if (motivo.length > 150) return interaction.reply({ ephemeral: true, embeds: [embedMotivoMenor] }); else {
            interaction.deferUpdate();
            const object = {
                "membroID": `${blacklistID}`,
                "mod": `${interaction.user.username}`,
                "modID": `${interaction.user.id}`,
                "motivo": `${motivo}`
            }
            await db.push(`blacklist_${interaction.guild.id}.bl`, JSON.parse(object));
            await db.push(`blacklist_${interaction.guild.id}.info`, blacklistID);
            let statusEmbed = await db.get(`statusBlacklist_${interaction.guild.id} `);
            if (statusEmbed === true) emojiStatusBlacklistEmbed = `${client.xx.ativado} Ativado`; else emojiStatusBlacklistEmbed = `${client.xx.desativado} Desativado`;

            let embed = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.security} - Blacklist`)
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB} `)
            var vls = await db.get(`blacklist_${interaction.guild.id}.bl`)
            if (vls) {
                for (let pd of vls) {
                    embed.addFields({
                        name: `${client.xx.membro} Membro: `,
                        value: `\`${pd.membroID}\`\n${client.xx.protecao} **Moderador**:\n${pd.mod}\n${client.xx.motivo} **Motivo**:\n\`${pd.motivo}\``,
                        inline: true
                    })
                }
            }
            embed.addFields(
                { name: `${client.xx.servidores} Status`, value: `${emojiStatusBlacklistEmbed}`, inline: false }
            )

            interaction.message.edit({ embeds: [embed] });
            const membro = await interaction.guild.members.cache.get(blacklistID);
            if (membro) {
                await membro.ban({ reason: `☠️ Blacklist: ${motivo}` }).catch(err => { });
            }
        }
    }

    if (interaction.customId === "autoCargosBadgeNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBautocargoBadge = new Discord.ModalBuilder()
            .setCustomId('NBautocargoBadge')
            .setTitle(`Configure os canais do seja membro`)
        const NBautoCargoPig = new Discord.TextInputBuilder()
            .setCustomId('NBautoCargoPig')
            .setLabel('Early Supporter (PORCO)')
            .setPlaceholder('Coloque o ID do cargo aqui')
            .setRequired(false)
            .setStyle(Discord.TextInputStyle.Short)
        const NBautoCargoDev = new Discord.TextInputBuilder()
            .setCustomId('NBautoCargoDev')
            .setLabel('Early Verified Bot Developer (DEV)')
            .setPlaceholder('Coloque o ID do cargo aqui')
            .setRequired(false)
            .setStyle(Discord.TextInputStyle.Short)
        const NBautoCargoHype = new Discord.TextInputBuilder()
            .setCustomId('NBautoCargoHype')
            .setLabel('HypeSquad Events (HYPESQUAD)')
            .setPlaceholder('Coloque o ID do cargo aqui')
            .setRequired(false)
            .setStyle(Discord.TextInputStyle.Short)
        const NBautoCargoActive = new Discord.TextInputBuilder()
            .setCustomId('NBautoCargoActive')
            .setLabel('Active Developer (DEV NOVA)')
            .setPlaceholder('Coloque o ID do cargo aqui')
            .setRequired(false)
            .setStyle(Discord.TextInputStyle.Short)
        const firstActionRow = new Discord.ActionRowBuilder().addComponents(NBautoCargoPig)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(NBautoCargoDev)
        const thirdActionRow = new Discord.ActionRowBuilder().addComponents(NBautoCargoHype)
        const fourthActionRow = new Discord.ActionRowBuilder().addComponents(NBautoCargoActive)

        NBautocargoBadge.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow)
        await interaction.showModal(NBautocargoBadge);
    }

    if (interaction.customId === 'NBautocargoBadge') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const porcoId = interaction.fields.getTextInputValue('NBautoCargoPig');
        const devId = interaction.fields.getTextInputValue('NBautoCargoDev');
        const hypeId = interaction.fields.getTextInputValue('NBautoCargoHype');
        const ativoId = interaction.fields.getTextInputValue('NBautoCargoActive');
        let cargoPorco = interaction.guild.roles.cache.get(porcoId);
        let cargoDev = interaction.guild.roles.cache.get(devId);
        let cargoHype = interaction.guild.roles.cache.get(hypeId);
        let cargoActive = interaction.guild.roles.cache.get(ativoId);

        if (cargoPorco) await db.set(`pigCargoBadgeNB_${interaction.guild.id}`, cargoPorco.id);
        if (cargoDev) await db.set(`devCargoBadgeNB_${interaction.guild.id}`, cargoDev.id);
        if (cargoHype) await db.set(`hypeCargoBadgeNB_${interaction.guild.id}`, cargoHype.id);
        if (cargoActive) await db.set(`activeCargoBadgeNB_${interaction.guild.id}`, cargoActive.id);

        interaction.deferUpdate();
        let statusAutoCargoBadge = await db.get(`statusautoCargoBadgeNB_${interaction.guild.id}`);
        let emojiStatusautoCargoBadgeNBEmbed;

        if (statusAutoCargoBadge === true) emojiStatusautoCargoBadgeNBEmbed = `> ${client.xx.ativado} Ativado`; else emojiStatusautoCargoBadgeNBEmbed = `> ${client.xx.desativado} Desativado`;
        let pig = await db.get(`pigCargoBadgeNB_${interaction.guild.id}`);
        let dev = await db.get(`devCargoBadgeNB_${interaction.guild.id}`);
        let hype = await db.get(`hypeCargoBadgeNB_${interaction.guild.id}`);
        let active = await db.get(`activeCargoBadgeNB_${interaction.guild.id}`);

        if (!pig) pig = `\`Não foi definido.\``; else pig = `<@&${pig}>`
        if (!dev) dev = `\`Não foi definido.\``; else dev = `<@&${dev}>`
        if (!hype) hype = `\`Não foi definido.\``; else hype = `<@&${hype}>`
        if (!active) active = `\`Não foi definido.\``; else active = `<@&${active}>`

        let embedCargos = new Discord.EmbedBuilder()
            .setTitle(`${client.xx.categoria} - Auto cargo por badge`)
            .addFields(
                { name: `<:003_pigzin:1274695612750762135>  Early Supporter`, value: `${pig}`, inline: false },
                { name: `${client.xx.dev} Early Verified Bot Developer`, value: `${dev}`, inline: false },
                { name: `${client.xx.hse} HypeSquad Events`, value: `${hype}`, inline: false },
                { name: `${client.xx.activedev} Active Developer`, value: `${active}`, inline: false },
                { name: `${client.xx.servidores} Status`, value: `${emojiStatusautoCargoBadgeNBEmbed}`, inline: false }
            )
            .setThumbnail(client.user.avatarURL({ size: 4096 }))
            .setColor(`${colorNB}`)

        await interaction.message.edit({ embeds: [embedCargos] });
    }

    if (interaction.customId === "canalContadorMembrosCallNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBblacklistRemov = new Discord.ModalBuilder()
            .setCustomId('NBcanalContadorCall')
            .setTitle(`Contador membros em call`)

        const canalContadorCallNB = new Discord.TextInputBuilder()
            .setCustomId('canalContadorCallNB')
            .setLabel('DEFINA O CANAL DO CONTADOR')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const nomecanalContadorCallNB = new Discord.TextInputBuilder()
            .setLabel('DEFINA O NOME DO CANAL')
            .setCustomId('nomecanalContadorCallNB')
            .setPlaceholder('Coloque o nome do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(canalContadorCallNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(nomecanalContadorCallNB)

        NBblacklistRemov.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBblacklistRemov);
    }

    if (interaction.customId === 'NBcanalContadorCall') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const canalID = interaction.fields.getTextInputValue('canalContadorCallNB');
        const canal = interaction.guild.channels.cache.get(canalID)
        const nomeCanal = interaction.fields.getTextInputValue('nomecanalContadorCallNB');

        if (!canal) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            interaction.deferUpdate();
            await db.set(`canalContadorMembrosCallNB_${interaction.guild.id}`, canal.id);
            await db.set(`nomecanalContadorMembrosCallNB_${interaction.guild.id}`, nomeCanal);
            await db.set(`ServidorContador_`, interaction.guild.id);

            let membros = interaction.guild.members.cache.filter(m => m.voice.channel).size;
            canal.setName(`${nomeCanal} ${membros}`);

            let embedContador = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.categoria}:1065717476429676694> - Contador`)
                .addFields({ name: `Canal`, value: `${canal}`, inline: false })
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB}`)
            await interaction.message.edit({ embeds: [embedContador] });
        }
    }

    if (interaction.customId === "cfgmembroativoNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBmembroAtivo = new Discord.ModalBuilder()
            .setCustomId('NBmembroativo')
            .setTitle(`Membro Ativo`)
        const mgsMembroAtivoNB = new Discord.TextInputBuilder()
            .setCustomId('mgsMembroAtivoNB')
            .setLabel('DEFINA O NÚMERO DE MENSAGENS')
            .setPlaceholder('Ex: 500, 1000... (APENAS NÚMEROS)')
            .setMaxLength(4)
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const cargoMembroAtivoNB = new Discord.TextInputBuilder()
            .setLabel('DEFINA O CARGO DE RECOMPENSA')
            .setCustomId('cargoMembroAtivoNB')
            .setPlaceholder('Coloque o ID do cargo aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const firstActionRow = new Discord.ActionRowBuilder().addComponents(mgsMembroAtivoNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(cargoMembroAtivoNB)

        NBmembroAtivo.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBmembroAtivo);
    }

    if (interaction.customId === 'NBmembroativo') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const msgsMembroA = interaction.fields.getTextInputValue('mgsMembroAtivoNB');
        const cargoMembroAId = interaction.fields.getTextInputValue('cargoMembroAtivoNB');
        const cargoMembroA = interaction.guild.roles.cache.get(cargoMembroAId);

        if (!cargoMembroA) return interaction.reply({ ephemeral: true, embeds: [embedId] })

        if (isNaN(msgsMembroA)) {
            return interaction.reply({ ephemeral: true, embeds: [embedNumeros] })
        } else {
            interaction.deferUpdate();
            await db.set(`msgsMembroAtivoNB_${interaction.guild.id}`, Number(msgsMembroA));
            await db.set(`cargoMembroAtivoNB_${interaction.guild.id}`, cargoMembroA.id);
            let embedMembroA = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.categoria}:1065717476429676694> - Membro ativo`)
                .addFields(
                    { name: `Número de mensagens`, value: `\`${Number(msgsMembroA)}\``, inline: false },
                    { name: `Cargo de recompensa`, value: `${cargoMembroA}`, inline: false }
                )
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB}`)

            await interaction.message.edit({ embeds: [embedMembroA] });
        }
    }

    if (interaction.customId === "canaisMigraNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBcanaisMigra = new Discord.ModalBuilder()
            .setCustomId('NBcanaisMigra')
            .setTitle(`Configure os canais da migração`)

        const canaisMigraNB = new Discord.TextInputBuilder()
            .setCustomId('canalmigraNB')
            .setLabel('ADICIONE O CANAL DA MIGRAÇÃO')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const canalfichasMigraNB = new Discord.TextInputBuilder()
            .setCustomId('canalfichasMigraNB')
            .setLabel('ADICIONE O CANAL DAS FICHAS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const canallogsMigraNB = new Discord.TextInputBuilder()
            .setCustomId('canallogsMigraNB')
            .setLabel('ADICIONE O CANAL DOS LOGS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(canaisMigraNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(canalfichasMigraNB)
        const thirdActionRow = new Discord.ActionRowBuilder().addComponents(canallogsMigraNB)

        NBcanaisMigra.addComponents(firstActionRow, secondActionRow, thirdActionRow)
        await interaction.showModal(NBcanaisMigra);
    }

    if (interaction.customId === 'NBcanaisMigra') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const canalMigraID = interaction.fields.getTextInputValue('canalmigraNB');
        const canalfichasMigraID = interaction.fields.getTextInputValue('canalfichasMigraNB');
        const canallogsMigraID = interaction.fields.getTextInputValue('canallogsMigraNB');
        const canalMigra = interaction.guild.channels.cache.get(canalMigraID);
        const canalfichasMigra = interaction.guild.channels.cache.get(canalfichasMigraID);
        const canallogsMigra = interaction.guild.channels.cache.get(canallogsMigraID);

        if (!canalMigra) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canalfichasMigra) return interaction.reply({ ephemeral: true, embeds: [embedId] })
        if (!canallogsMigra) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            interaction.deferUpdate();
            await db.set(`canalMigraNB_${interaction.guild.id}`, canalMigra.id);
            await db.set(`canalfichasMigraNB_${interaction.guild.id}`, canalfichasMigra.id);
            await db.set(`canallogsMigraNB_${interaction.guild.id}`, canallogsMigra.id);
            let cargosMigra = await db.get(`cargosMigra_${interaction.guild.id}.cargosMigra`);
            if (!cargosMigra || cargosMigra.length == 0) {
                cargosMigra = `\`Nenhum\``;
            } else {
                cargosMigra = cargosMigra.map(c => `<@&${c}>`).join('\n');
            }
            let embedMigra = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.members} - Migração`)
                .addFields(
                    { name: `Canal da migração`, value: `${canalMigra}`, inline: false },
                    { name: `Canal das fichas`, value: `${canalfichasMigra}`, inline: false },
                    { name: `Canal dos logs`, value: `${canallogsMigra}`, inline: false },
                    { name: `Cargos autorizados`, value: `${cargosMigra}`, inline: false }
                )
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB}`)

            await interaction.message.edit({ embeds: [embedMigra] });
        }
    }

    if (interaction.customId === "canaisSejaMNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBcanaisSM = new Discord.ModalBuilder()
            .setCustomId('NBcanaisSM')
            .setTitle(`Configure os canais do seja membro`)
        const canaisSejaMembroNB = new Discord.TextInputBuilder()
            .setCustomId('canalSejaMembroNB')
            .setLabel('ADICIONE O CANAL DO SEJA MEMBRO')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const logsSejaMembroNB = new Discord.TextInputBuilder()
            .setCustomId('logsSejaMembroNB')
            .setLabel('ADICIONE O CANAL DOS LOGS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)
        const firstActionRow = new Discord.ActionRowBuilder().addComponents(canaisSejaMembroNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(logsSejaMembroNB)

        NBcanaisSM.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBcanaisSM);
    }

    if (interaction.customId === 'NBcanaisSM') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const canalSMID = interaction.fields.getTextInputValue('canalSejaMembroNB');
        const canallogsSMID = interaction.fields.getTextInputValue('logsSejaMembroNB');
        const canalSM = interaction.guild.channels.cache.get(canalSMID);
        const canallogsSM = interaction.guild.channels.cache.get(canallogsSMID);

        if (!canalSM) return interaction.reply({ ephemeral: true, embeds: [embedId] })

        if (!canallogsSM) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            interaction.deferUpdate();

            await db.set(`canalSejaMNB_${interaction.guild.id}`, canalSM.id);
            await db.set(`canallogsSejaMNB_${interaction.guild.id}`, canallogsSM.id);
            let url = await db.get(`urlSejaMNB_${interaction.guild.id}`);
            if (url) {
                url = `[${url}](https://discord.gg/${url})`;
            } else {
                url = `\`Não foi definida.\``
            }
            let cargosSM = await db.get(`cargosSM_${interaction.guild.id}.cargosSM`);
            if (!cargosSM || cargosSM.length == 0) {
                cargosSM = `\`Nenhum\``;
            } else {
                cargosSM = cargosWl.map(c => `<@&${c}>`).join('\n');
            }

            let embedSejaM = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.etretenimento} - Seja Membro`)
                .addFields(
                    { name: `Url personalizada`, value: `${url}`, inline: true },
                    { name: `Canal do seja membro`, value: `${canalSM}`, inline: false },
                    { name: `Logs do seja membro`, value: `${canallogsSM}`, inline: false },
                    { name: `Cargos recebidos`, value: `${cargosSM}`, inline: false }
                )
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB}`)

            await interaction.message.edit({ embeds: [embedSejaM] });
        }
    }

    if (interaction.customId === "canaisVerificNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBcanaisVerific = new Discord.ModalBuilder()
            .setCustomId('NBcanaisVerific')
            .setTitle(`Configure os canais da verificação`)

        const canalVerificNB = new Discord.TextInputBuilder()
            .setCustomId('canalVerificNB')
            .setLabel('ADICIONE O CANAL DA VERIFICAÇÃO')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const logsVerificNB = new Discord.TextInputBuilder()
            .setCustomId('logsVerificNB')
            .setLabel('ADICIONE O CANAL DOS LOGS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(canalVerificNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(logsVerificNB)

        NBcanaisVerific.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBcanaisVerific);
    }

    if (interaction.customId === 'NBcanaisVerific') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const canalVerificID = interaction.fields.getTextInputValue('canalVerificNB');
        const canallogsVerificID = interaction.fields.getTextInputValue('logsVerificNB');
        const canalVerific = interaction.guild.channels.cache.get(canalVerificID);
        const canallogsVerific = interaction.guild.channels.cache.get(canallogsVerificID);

        if (!canalVerific || !canallogsVerific) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            interaction.deferUpdate();
            await db.set(`canalVerificNB_${interaction.guild.id}`, canalVerific.id);
            await db.set(`canallogsVerificNB_${interaction.guild.id}`, canallogsVerific.id);
            let cargosVerific = await db.get(`cargosVerific_${interaction.guild.id}.cargosVerific`);
            let cargoVerific = await db.get(`cargoVerificNB_${interaction.guild.id}`);
            if (!cargoVerific) {
                cargoVerific = `\`Não foi definido.\``
            } else {
                cargoVerific = `<@&${cargoVerific}>`
            }
            if (!cargosVerific || cargosVerific.length == 0) {
                cargosVerific = `\`Nenhum\``;
            } else {
                cargosVerific = cargosVerific.map(c => `<@&${c}>`).join('\n');
            }
            let embedVerific = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.verificado} - Verificação`)
                .addFields(
                    { name: `Canal da verificação`, value: `${canalVerific}`, inline: true },
                    { name: `Cargo de verificado`, value: `${cargoVerific}`, inline: true },
                    { name: `Logs da verificação`, value: `${canallogsVerific}`, inline: false },
                    { name: `Cargos autorizados`, value: `${cargosVerific}`, inline: false }
                )
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB}`)
            await interaction.message.edit({ embeds: [embedVerific] });
        }
    }

    if (interaction.customId === "configinstaNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBcanaisig = new Discord.ModalBuilder()
            .setCustomId('NBcanaisig')
            .setTitle(`Configure os canais do instagram`)
        const canaligNB = new Discord.TextInputBuilder()
            .setCustomId('canaligNB')
            .setLabel('ADICIONE O CANAL DO INSTAGRAM')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short);
        const canalinfigNB = new Discord.TextInputBuilder()
            .setCustomId('canalinfigNB')
            .setLabel('ADICIONE O CANAL DO DESTAQUE')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(false)
            .setStyle(Discord.TextInputStyle.Short);
        const taginfigNB = new Discord.TextInputBuilder()
            .setCustomId('taginfigNB')
            .setLabel('ADICIONE A TAG DE DESTAQUE')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(false)
            .setStyle(Discord.TextInputStyle.Short);

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(canaligNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(canalinfigNB)
        const thirdActionRow = new Discord.ActionRowBuilder().addComponents(taginfigNB)

        NBcanaisig.addComponents(firstActionRow, secondActionRow, thirdActionRow)
        await interaction.showModal(NBcanaisig);
    }

    if (interaction.customId === 'NBcanaisig') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const canaligID = interaction.fields.getTextInputValue('canaligNB');
        const canalinfigID = interaction.fields.getTextInputValue('canalinfigNB');
        const taginfID = interaction.fields.getTextInputValue('taginfigNB');
        const canalInsta = interaction.guild.channels.cache.get(canaligID);
        const canalInfluencer = interaction.guild.channels.cache.get(canalinfigID);
        const tagInfluencer = interaction.guild.roles.cache.get(taginfID);

        if (canalInsta) {
            let hook = await canalInsta.fetchWebhooks();
            let webhook = hook.first();

            if (!webhook) canalInsta.createWebhook({ name: 'Instagram', avatar: 'https://www.seekpng.com/png/detail/88-884742_blue-instagram-icon-png.png', })

            await db.set(`canaldoinsta_`, canalInsta.id);
            await db.set(`servidorinsta_`, interaction.guild.id);
        }

        if (canalInfluencer) {
            await db.set(`canaldodestaque_`, canalInfluencer.id);
            await db.set(`diadoresetinsta_`, Date.now() + ms(`1m`));
        }

        if (tagInfluencer) {
            await db.set(`tagdestaque_`, tagInfluencer.id);
        }

        let canalIg = await db.get(`canaldoinsta_`);
        let canalInf = await db.get(`canaldodestaque_`);
        let cargoInf = await db.get(`tagdestaque_`);
        let diaR = await db.get(`diadoresetinsta_`);

        if (!canalIg) { canalIg = `\`Não foi definido.\`` } else { canalIg = `<#${canalIg}>` }
        if (!canalInf) { canalInf = `\`Não foi definido.\`` } else { canalInf = `<#${canalInf}>` }
        if (!cargoInf) { cargoInf = `\`Não foi definido.\`` } else { cargoInf = `<@&${cargoInf}>` }
        if (!diaR) { diaR = `\`Não foi definido.\`` } else { diaR = `\`${diaR} Dias\`` }

        interaction.deferUpdate();

        const embedInsta = new Discord.EmbedBuilder()
            .setAuthor({ name: `${client.user.username} | Instagram`, iconURL: client.user.displayAvatarURL() })
            .addFields(
                { name: "Canal do Instagram", value: `${canalIg}`, "inline": true },
                { name: "Canal de Destaque", value: `${canalInf}`, "inline": true },
                { name: "Tag de Destaque", value: `${cargoInf}`, "inline": true }
            )
            .setThumbnail(client.user.avatarURL({ size: 4096 }))
            .setColor(`${colorNB}`)

        await interaction.message.edit({ embeds: [embedInsta] });
    }

    if (interaction.customId === "canaisWlNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBcanaiswl = new Discord.ModalBuilder()
            .setCustomId('NBcanaiswl')
            .setTitle(`Configure os canais da wl`)

        const canaiswlNB = new Discord.TextInputBuilder()
            .setCustomId('canalwlNB')
            .setLabel('ADICIONE O CANAL DA WHITELIST')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const canalfichaswlNB = new Discord.TextInputBuilder()
            .setCustomId('canalfichaswlNB')
            .setLabel('ADICIONE O CANAL DAS FICHAS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const canallogswlNB = new Discord.TextInputBuilder()
            .setCustomId('canallogswlNB')
            .setLabel('ADICIONE O CANAL DOS LOGS')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(canaiswlNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(canalfichaswlNB)
        const thirdActionRow = new Discord.ActionRowBuilder().addComponents(canallogswlNB)

        NBcanaiswl.addComponents(firstActionRow, secondActionRow, thirdActionRow)
        await interaction.showModal(NBcanaiswl);
    }

    if (interaction.customId === 'NBcanaiswl') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const canalWlID = interaction.fields.getTextInputValue('canalwlNB');
        const canalfichasWlID = interaction.fields.getTextInputValue('canalfichaswlNB');
        const canallogsWlID = interaction.fields.getTextInputValue('canallogswlNB');
        const canalWl = interaction.guild.channels.cache.get(canalWlID);
        const canalfichasWl = interaction.guild.channels.cache.get(canalfichasWlID);
        const canallogsWl = interaction.guild.channels.cache.get(canallogsWlID);

        if (!canalWl || !canalfichasWl || !canallogsWl) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            interaction.deferUpdate();
            await db.set(`canalWlNB_${interaction.guild.id}`, canalWl.id);
            await db.set(`canalfichasWlNB_${interaction.guild.id}`, canalfichasWl.id);
            await db.set(`canallogsWlNB_${interaction.guild.id}`, canallogsWl.id);

            let aprovadoWl = await db.get(`aprovadoWlNB_${interaction.guild.id}`);
            if (!aprovadoWl) aprovadoWl = `\`Não foi definido.\``; else aprovadoWl = `<@&${aprovadoWl}>`;

            let cargosWl = await db.get(`cargosWl_${interaction.guild.id}.cargosWl`);
            if (!cargosWl || cargosWl.length == 0) cargosWl = `\`Nenhum\``; else cargosWl = cargosWl.map(c => `<@&${c}>`).join('\n');

            let embedWl = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.whitelist}  - Whitelist`)
                .addFields(
                    { name: `Canal da whitelist`, value: `${canalWl}`, inline: false },
                    { name: `Canal de fichas`, value: `${canalfichasWl}`, inline: false },
                    { name: `Canal dos logs`, value: `${canallogsWl}`, inline: false },
                    { name: `Cargo aprovado`, value: `${aprovadoWl}`, inline: false },
                    { name: `Cargos responsáveis`, value: `${cargosWl}`, inline: true },
                )
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB}`)

            await interaction.message.edit({ embeds: [embedWl] });
        }
    }

    if (interaction.customId === "canaisMatchNB") {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const NBcanaisMatch = new Discord.ModalBuilder()
            .setCustomId('NBcanaisMatch')
            .setTitle(`Configure os canais do match`)

        const canalcriarMatchNB = new Discord.TextInputBuilder()
            .setCustomId('canalcriarMatchNB')
            .setLabel('ADICIONE O CANAL PARA CRIAR MATCH')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const canalMatchNB = new Discord.TextInputBuilder()
            .setCustomId('canalMatchNB')
            .setLabel('ADICIONE O CANAL DO MATCH')
            .setPlaceholder('Coloque o ID do canal aqui')
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Short)

        const firstActionRow = new Discord.ActionRowBuilder().addComponents(canalcriarMatchNB)
        const secondActionRow = new Discord.ActionRowBuilder().addComponents(canalMatchNB)

        NBcanaisMatch.addComponents(firstActionRow, secondActionRow)
        await interaction.showModal(NBcanaisMatch);
    }

    if (interaction.customId === 'NBcanaisMatch') {
        if (!allowedUserIds.includes(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id && !interaction.member.roles.cache.some(r => perm2.includes(r.id))) return;

        const canalcriarMatchID = interaction.fields.getTextInputValue('canalcriarMatchNB');
        const canalMatchID = interaction.fields.getTextInputValue('canalMatchNB');
        const canalcriarMatch = interaction.guild.channels.cache.get(canalcriarMatchID);
        const canalMatch = interaction.guild.channels.cache.get(canalMatchID);

        if (canalcriarMatchID && !canalcriarMatch || canalMatchID && !canalMatch) return interaction.reply({ ephemeral: true, embeds: [embedId] }); else {
            interaction.deferUpdate();
            await db.set(`canalcriarMatchNB_${interaction.guild.id}`, canalcriarMatch.id);
            await db.set(`canalMatchNB_${interaction.guild.id}`, canalMatch.id);

            let hook = await canalMatch.fetchWebhooks();
            let webhook = hook.first();
            if (!webhook) canalMatch.createWebhook({ name: 'Match', avatar: 'https://cdn-icons-png.flaticon.com/512/5003/5003183.png', })

            let embedMatch = new Discord.EmbedBuilder()
                .setTitle(`${client.xx.etretenimento} - Match`)
                .addFields(
                    { name: `Canal de criação de match`, value: `${canalcriarMatch}`, inline: true },
                    { name: `Canal do match`, value: `${canalMatch}`, inline: false }
                )
                .setThumbnail(client.user.avatarURL({ size: 4096 }))
                .setColor(`${colorNB}`)

            await interaction.message.edit({ embeds: [embedMatch] });
        }
    }
});

client.login(config.token);