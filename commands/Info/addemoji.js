const Discord = require('discord.js')
const { parse } = require("twemoji-parser");
const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "addemoji",
  category: "ixi",
  description: "",
  run: async (client, message, args) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageEmojis)) {
      return message.channel.send(`sem perm`)
    }
    const emojis = args.join(" ").match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/gi)
    if (!emojis) return message.channel.send(`ixi`);
    emojis.forEach(async emote => { // mas qualquer coisa nos deixa o comando
      let emoji = parseEmoji(emote); 
      if (emoji.id) {
        const Link = `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}`
        await message.guild.emojis.create({ name: emoji.name, attachment: Link }).then(em => message.channel.send({ content: `${em.toString()} adicionado` })).catch(error => {
          message.channel.send("erro")
          console.log(error)
        })

      }
    })
  }
}
function parseEmoji(text) {
  if (text.includes('%')) text = decodeURIComponent(text);
  if (!text.includes(':')) return { animated: false, name: text, id: undefined };
  const match = text.match(/<?(?:(a):)?(\w{1,32}):(\d{17,19})?>?/);
  return match && { animated: Boolean(match[1]), name: match[2], id: match[3] };
}