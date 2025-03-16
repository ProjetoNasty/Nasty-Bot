const Discord = require("discord.js");
const { PermissionsBitField } = require("discord.js")
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


module.exports = {
    name: "eval",
    category: "",
    description: "",
    run: async (client, message, args) => {
        
     
        let code = eval(args.join(" "))
        if (typeof code !== 'string') code = require('util').inspect(code, { depth: 0 })
        code.length >= 1010 ? code = code.slice(0, 1010) + '...' : code
        let msgEmbed = new Discord.EmbedBuilder()
            .setTitle("Terminal - " + process.version.split(":")[0])
            .setColor(Discord.Colors.DarkGrey)
            .addFields([
                { name: 'Input', value: '```js\n' + args.join(" ") + '```' },
                { name: 'Output', value: '```js\n' + code + '```' }
            ])
            .setFooter({ text: 'JavaScript - Terminal' })
            message.channel.send({ embeds: [msgEmbed]})
    }
}