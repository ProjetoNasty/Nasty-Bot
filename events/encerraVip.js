
const client = require('..');
const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const ms = require('ms');

client.on("ready", () => {

    setInterval(async () => {

        const botE = await db.get(`botex_${client.user.id}`);
        const encerrar = new Date(botE);
        const hoje = new Date();
        const diferencaMs = encerrar - hoje;
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    
        if (diferencaDias <= 0) {
            return;
        }

        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136'

        let membros = await db.get(`databasevip`);
        if (!membros) return;

        await membros.forEach(async (x) => {

            let vip = await db.get(`encerravip_${x.usuarioID}`);

            if (vip) {

                await vip.forEach(async (ob) => {

                    let timeDb = ob.encerra || 0;
                    let timeCount = parseInt(timeDb - Date.now());
                    let tempoAcabando = `${ms(timeCount)}`;

                    const conv = tempoAcabando.replace(/(?<![A-Z])d(?![A-Z])/gi, ' dias');

                    let l = await db.get(`logsvipNB_`);
                    let logVip = client.channels.cache.get(l);

                    if (tempoAcabando === '2d') {

                        let avisado = await db.get(`avisado_${x.usuarioID}`);

                        let acabando = new Discord.EmbedBuilder()
                            .setAuthor({ name: 'Vip acabando', iconURL: 'https://cdn.discordapp.com/emojis/1058984666633338904.png' })
                            .setDescription(`${client.xx.membro} **Membro**: <@${x.usuarioID}>\n${client.xx.clock} **Tempo restante**: \`${conv}\``)
                            .setColor('#ff0000')
                            .setTimestamp()

                        if (!avisado) {

                            if (logVip) await logVip.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                            if (logVip) await logVip.send({ embeds: [acabando] }).catch(err => { });

                            await db.set(`avisado_${x.usuarioID}`, true);

                        }
                    }

                    if (ob.encerra <= Date.now()) {

                        let acabou = new Discord.EmbedBuilder()
                            .setAuthor({ name: 'Vip encerrou', iconURL: 'https://cdn.discordapp.com/emojis/1058984666633338904.png' })
                            .setDescription(`${client.xx.membro} **Membro**: <@${x.usuarioID}>`)
                            .setColor('#ff0000')
                            .setTimestamp()

                        if (logVip) await logVip.send({ content: `@everyone` }).then((msg) => { msg.delete() });
                        if (logVip) await logVip.send({ embeds: [acabou] }).catch(err => { });

                        await db.set(`databasevip`, (await db.get(`databasevip`))?.filter(e => e.usuarioID !== `${ob.usuarioID}`));
                        await db.delete(`avisado_${x.usuarioID}`);

                    } else {

                        return;
                    }

                    return;
                }

                )

            }
        });

    }, 50000);
});