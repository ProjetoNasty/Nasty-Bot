const { EmbedBuilder, Collection } = require('discord.js');
const ms = require('ms');
const client = require('..');
const config = require('../config.json');
const cooldown = new Collection();
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const axios = require('axios');

async function getUserIdFromToken(token) {
  const url = 'https://discord.com/api/v10/users/@me';
  const headers = {
    'Authorization': `${token}`
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data.id;
  } catch (error) {
    console.error('Erro ao obter o ID do usuário:', error.response ? error.response.data : error.message);
    return null;
  }
}

client.on('guildUpdate', async (oldGuild, newGuild) => {

  const botE = await db.get(`botex_${client.user.id}`);
  const encerrar = new Date(botE);
  const hoje = new Date();
  const diferencaMs = encerrar - hoje;
  const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

  if (diferencaDias <= 0) {
      return;
  }
  
  if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
    let stat = await db.get(`protecaourl_${newGuild.id}.estado`);
    let logChannelId = await db.get(`protecaourl_${newGuild.id}.logs`);
    let account = await db.get(`protecaourl_${newGuild.id}.account`);
    let oldVanityUrlCode = oldGuild.vanityURLCode;

    if (stat && logChannelId && account) {
      const auditLogs = await newGuild.fetchAuditLogs({ type: 'GUILD_UPDATE', limit: 1 });
      const logEntry = auditLogs.entries.first();
      if (logEntry) {
        const user = logEntry.executor;

        const userIdFromToken = await getUserIdFromToken(account);
        if (userIdFromToken && user.id === userIdFromToken) {
          console.log(`A URL foi alterada pela conta configurada (${user.tag}).`);
          return;
        }
      }

      const url = `https://discord.com/api/v10/guilds/${newGuild.id}/vanity-url`;
      const config = {
        headers: {
          'Authorization': account,
          'Content-Type': 'application/json'
        }
      };
      const payload = {
        code: oldVanityUrlCode
      };

      try {
        await axios.patch(url, payload, config);
        console.log('Vanity URL revertida com sucesso!');
      } catch (error) {
        console.error('Erro ao reverter a vanity URL:', error.response ? error.response.data : error.message);
      }

      const logChannel = client.channels.cache.get(logChannelId);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000') 
		  .setAuthor(
		 	{ name: client.user.username + ' | Proteção de URL', iconURL: client.user.displayAvatarURL() }
		  )
          .addFields(
            { name: 'Servidor', value: newGuild.name, inline: true },
            { name: 'URL Antiga', value: oldVanityUrlCode, inline: true },
            { name: 'URL Atual', value: newGuild.vanityURLCode || 'Não definida', inline: true }
          )
          .setDescription('A Vanity URL foi alterada e revertida.')
          .setTimestamp()
          .setFooter({ text: 'Sistema de Proteção de Vanity URL' });

        logChannel.send({ embeds: [embed] });
      }

      if (logEntry) {
        const user = logEntry.executor;
        const member = await newGuild.members.fetch(user.id);
        if (member) {
          member.ban({ reason: 'Alteração não autorizada da URL.' })
            .then(() => console.log(`Todos os cargos removidos do usuário ${user.tag}.`))
            .catch(console.error);
        }
      }
    }
  }
});
