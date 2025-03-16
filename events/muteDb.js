const client = require('..');
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const ms = require('ms');

client.on("ready", async () => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const data = await db.get(
        `databasemute`)

    data?.forEach(async function (ob) {

        const servidorID = await db.get(`servidorMute`);
        if (!servidorID) return;

        let servidor = client.guilds.cache.get(servidorID);
        if (!servidor) return;

        servidor.members.fetch(ob.usuarioID).then(async member => {
            let mute = await db.get(
                `mutedatabase_${member.id}`
            )

            if (mute) {

                let colorNB = await db.get(`colorNB`);
                if (!colorNB) colorNB = '#2f3136'

                let tempo = Math.ceil(ms(mute.tempo) / 1000),

                    dataMute = mute.data,

                    dataAtivo = new Date().getTime(),

                    diff = Math.abs(dataMute - dataAtivo),

                    filtro = Math.ceil(diff / 1000),

                    timeout = Math.abs(tempo - filtro);

                setTimeout(async () => {

                    servidor.roles.fetch(mute.cargoID)?.then(role => {
                        member.roles.remove(role.id)
                    })


                    client.channels.fetch(mute.chatID)?.then(channel => {

                        const acabou = new Discord.EmbedBuilder()
                            .setDescription(`${member} seu mute acabou.`)
                            .setColor(`${colorNB}`)

                        channel?.send({ embeds: [acabou] }).then((msg) => {

                            setTimeout(() => msg.delete(), 7000);
                        });

                    })

                    await db.delete(
                        `mutedatabase_${member.id}`
                    )

                    await db.set('databasemute', (await db.get('databasemute'))?.filter(e => e !== e.usuarioID !== member.id));

                }, timeout * 1000);
            }
        })
    })
});