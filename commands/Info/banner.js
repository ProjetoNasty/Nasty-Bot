const Discord = require("discord.js");
const axios = require('axios');
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: "banner",
    category: "Veja o banner de algum membro.",
    description: "",
    run: async (client, message, args) => {
        

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        let u = message.mentions.users.first() ||
            client.users.cache.get(args[0]) ||
            message.author;

        axios.get(`https://discord.com/api/users/${u.id}`, {
            headers: {
                Authorization: `Bot ${client.token}`,
            },
        })
            .then((res) => {

                const { banner } = res.data;

                if (banner) {
                    
                    const extension = banner.startsWith("a_") ? '.gif?size=4096' : '.png?size=4096';
                    const url = `https://cdn.discordapp.com/banners/${u.id}/${banner}${extension}`;

                    let embed = new Discord.EmbedBuilder()
                        .setTitle(`Banner ${u.username}`)
                        .setImage(`${url}`)
                        .setColor(`${colorNB}`)
                        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
                        .setTimestamp()

                    message.channel.send({ embeds: [embed] });

                } else {

                    return;
                }
            })
    }
}
