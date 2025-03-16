const client = require('..');
const Discord = require("discord.js");
const { QuickDB } = require('quick.db')
const db = new QuickDB();

client.on('messageCreate', async message => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }
    
    if (!message.guild) return;

    let statusAutoReacoes = await db.get(`statusautoReacoesNB_${message.guild.id}`);
    if (statusAutoReacoes === true) {

        let canalReacao1 = await db.get(`canalautoReacao1NB_${message.guild.id}`);
        let canalReacao2 = await db.get(`canalautoReacao2NB_${message.guild.id}`);
        let canalReacao3 = await db.get(`canalautoReacao3NB_${message.guild.id}`);

        if (message.channel.id === `${canalReacao1}`) {

            let reacoesDb = await db.get(`autoReacao1NB_${message.guild.id}.reacoes`);

            let i = 0;
            setInterval(async function () {
                message.react(reacoesDb[i]).catch(err => { });
                i++;
                if (i == reacoesDb.length) {
                    clearInterval(this);
                }
            }, 1000);
        }

        if (message.channel.id === `${canalReacao2}`) {

            let reacoesDb = await db.get(`autoReacao2NB_${message.guild.id}.reacoes`);

            let i = 0;
            setInterval(async function () {
                message.react(reacoesDb[i]).catch(err => { });
                i++;
                if (i == reacoesDb.length) {
                    clearInterval(this);
                }
            }, 1000);

        }

        if (message.channel.id === `${canalReacao3}`) {

            let reacoesDb = await db.get(`autoReacao3NB_${message.guild.id}.reacoes`);

            let i = 0;
            setInterval(async function () {
                message.react(reacoesDb[i]).catch(err => { });
                i++;
                if (i == reacoesDb.length) {
                    clearInterval(this);
                }
            }, 1000);
        }

    }
});
