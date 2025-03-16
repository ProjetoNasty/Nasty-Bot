const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;

module.exports = {
    name: "addpd",
    category: "Adicionar primeira dama",
    description: "",
    run: async (client, message, args) => {
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        const dama = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        let cargosPd = await db.get(`sistemaPD_${message.guild.id}.cargospd`);
        if (!cargosPd || cargosPd.length == 0) return;

        let cargosAutorizados = await cargosPd.map(x => x.cargoId);

        if (!message.member.roles.cache.some(r => cargosAutorizados.includes(r.id))) {

            const semperm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem permissão para adicionar dama!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [semperm] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })
        }

        if (!dama) {

            const nomembro = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, mencione alguém para ser sua dama.`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [nomembro] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })
        }

        if (message.author.id == dama.id) {

            const carente = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não pode se setar pd.`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [carente] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })

        }

        if (dama.id == client.user.id) {

            const bot = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, ta carente parsa?`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [bot] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })
        }

        let limite = await db.get(`limitepdNB_${message.author.id}`);
        let contador = await db.get(`contadorpd_${message.author.id}`);
        if (!contador) contador = 0;

        if (!limite) {

            const limite = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, seu limite não foi definido corretamente, entre em contato com um responsável!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [limite] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })

        }

        if (contador >= limite) {

            const limite = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você atingiu o seu limite de damas, gado(a)!`)
                .setColor(`${colorNB}`)

            return message.channel.send({ embeds: [limite] }).then((msg) => {

                setTimeout(() => msg.delete(), 5000);
            })

        }

        let cargoPd = await db.get(`cargopdNB_${message.guild.id}`);
        let dama_existe = await db.get(`dama_${dama.id}`)
        let dono_pd = await client.users.fetch(dama_existe).catch(err => false)
        
        if(dama_existe) return message.channel.send({content: `${dama_existe == message.author ? `${dama} já é seu pd` : `${dama} já é pd de **${dono_pd.username}**`}`})
        await dama.roles.add(cargoPd).catch(err => { console.log(err) });

        const object = `{
            
            "dama": "${dama.id}",
            "damatag": "${dama.user.username}"
        }`

        await db.push(`pd_${message.author.id}.pd`, JSON.parse(object));
        await db.push(`pd_${message.author.id}.listapds`, `${dama.user.username}`);
        await db.push(`pd_${message.author.id}.pds`, dama.id);
        await db.set(`dama_${dama.id}`, message.author.id);
        await db.add(`contadorpd_${message.author.id}`, 1);

        let damaEmbed = new Discord.EmbedBuilder()
            .setAuthor({ name: `Primeira Dama Adicionada!`, iconURL: message.author.avatarURL({ dynamic: true }) })
            .setDescription(`${client.xx.anel} **Dama**: ${dama}\n${client.xx.id} **ID**: ${dama.id}\n\n${client.xx.anel} **Adicionada por**: ${message.author}\n${client.xx.id} **ID**: ${message.author.id}`)
            .setColor(`${colorNB}`)

        message.channel.send({ embeds: [damaEmbed] }).then((msg) => {

            setTimeout(() => msg.delete(), 7000);
        })

    }
}