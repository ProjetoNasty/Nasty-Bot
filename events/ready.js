const ms = require("ms");
const { ActivityType } = require("discord.js");
const client = require('..');
const config = require('../config.json');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on("ready", async () => {

  console.log(`🔮 Logado em: ${client.user.username} [${client.users.cache.size}]`);

  const servidores = client.guilds.cache
    .map(guild => `${guild.name} | ${guild.id}`)
    .join("\n");

  console.log(`✅ Conectado em:\n${servidores}`);

  // client.user.setBanner("https://cdn.discordapp.com/attachments/1188222081826033755/1312156432476672090/ezgif.com-crop.gif?ex=674b7868&is=674a26e8&hm=e49646bed8eaa0b1c689742f9b8f5c533a5b8cfb8ac8c447a44f695dbff777fe&")
  setStatus(client)
  client.user.setStatus('dnd');
  setInterval(() => setStatus(client), ms('5m'));
  async function setStatus(client) {

    let prefixoNB = await db.get('prefixCurrent');
    if (!prefixoNB) prefixoNB = config.prefix[0];

    const games = [
      `Prefixo: {/} e ${prefixoNB}`
    ];

    const MD = games[Math.floor(Math.random() * games.length)];

    client.user.setActivity({
      type: ActivityType.Custom,
      // url: "",
      name: MD
    });

    client.user.setStatus('dnd');
  }
});
