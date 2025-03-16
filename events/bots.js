const client = require('..');
const Discord = require("discord.js");
const moment = require("moment");
moment.locale('pt-br');
require("moment-duration-format");
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on("voiceStateUpdate", async (oldMember, newMember) => {
    const usuario = newMember.guild.members.cache.get(newMember.id);
    const bot = usuario.user.bot;

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }
  
    let oldVoice = oldMember.channel;
    let newVoice = newMember.channel;
  
    let channel = await db.get(`msgbotscanal_${newMember.guild.id}`);
    let message = await db.get(`msgbots_${newMember.guild.id}`);
  
    if (!channel || !message) {
      console.log('Channel or message not found. Aborting voiceStateUpdate event.');
      return;
    }
  
    let colorNB = await db.get(`colorNB`);
    if (!colorNB) colorNB = '#2f3136';
  
    let bots = await db.get(`cargobotNB_${newMember.guild.id}`);
    let cargosBot = [`${bots}`];
  
    let d = newMember.guild.members.cache
      .filter(
        (member) =>
          member.roles.cache.some((r) => cargosBot.includes(r.id)) &&
          !member.voice.channel
      )
      .map((u) => `<@${u.user.id}>`)
      .join('\n');
  
    if (!d) d = `ㅤ`;
  
    let i = newMember.guild.members.cache
      .filter(
        (member) =>
          member.roles.cache.some((r) => cargosBot.includes(r.id)) &&
          member.voice.channel
      )
      .map((u) => `<@${u.user.id}>`)
      .join('\n');
  
    if (!i) i = `ㅤ`;
  
    if (bot === true) {
      if (!oldVoice && newVoice) {
        // entrou - indisponível
        const embed = new Discord.EmbedBuilder()
          .setAuthor({name: 
            `${newMember.guild.name || 'GG'} - Bots`,
           iconURL: newMember.guild.iconURL({ dynamic: true })
      })
          .setDescription(
            '\`・\` Para uma melhor experiência em nosso servidor aproveite os bots de música disponíveis. Saiba como usar e quais comandos necessários:'
          )
          .setColor(colorNB)
          .addFields(
            { name: 'Bots disponíveis:', value: `${d}`, inline: true },
            { name: 'Bots indisponíveis:', value: `${i}`, inline: true }
          )
          .setThumbnail(newMember.guild.iconURL({ dynamic: true }))
          .setFooter({text: `› Atualizado em ${moment(Date.now()).format('LLL')}`});
  
        const channelObj = newMember.guild.channels.cache.get(channel);
        if (!channelObj) {
          console.log(`Channel ${channel} not found in guild. Aborting voiceStateUpdate event.`);
          return;
        }
  
        channelObj.messages
          .fetch(message)
          .then((msg) => {
            msg.edit({ embeds: [embed] }).catch((err) => {});
          })
          .catch((err) => {
            console.log(`Error fetching message ${message}. Aborting voiceStateUpdate event.`);
          });
      }
  
      if (!newVoice) {
        const embed = new Discord.EmbedBuilder()
          .setAuthor({name: 
            `${newMember.guild.name} - Bots`,
           iconURL: newMember.guild.iconURL({ dynamic: true })
      })
          .setDescription(
            '\`・\` Para uma melhor experiência em nosso servidor aproveite os bots de música disponíveis. Saiba como usar e quais comandos necessários:'
          )
          .setColor(colorNB)
          .addFields(
            { name: 'Bots disponíveis:', value: `${d}`, inline: true },
            { name: 'Bots indisponíveis:', value: `${i}`, inline: true }
          )
          .setThumbnail(newMember.guild.iconURL({ dynamic: true }))
          .setFooter({text: `› Atualizado em ${moment(Date.now()).format('LLL')}`});
  
        const channelObj = newMember.guild.channels.cache.get(channel);
        if (!channelObj) {
          console.log(`Channel ${channel} not found in guild. Aborting voiceStateUpdate event.`);
          return;
        }
  
        channelObj.messages
          .fetch(message)
          .then((msg) => {
            msg.edit({ embeds: [embed] }).catch((err) => {});
          })
          .catch((err) => {
            console.log(`Error fetching message ${message}. Aborting voiceStateUpdate event.`);
          });
      }
    }
  });
  