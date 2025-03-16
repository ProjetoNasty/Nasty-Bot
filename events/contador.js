const client = require('..');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('ready', () => {

    setInterval(async () => {

        const botE = await db.get(`botex_${client.user.id}`);
        const encerrar = new Date(botE);
        const hoje = new Date();
        const diferencaMs = encerrar - hoje;
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    
        if (diferencaDias <= 0) {
            return;
        }
      
        let guildId = await db.get(`ServidorContador_`);
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        let canalContador = await db.get(`canalContadorMembrosCallNB_${guild.id}`);
        let nomeCanal = await db.get(`nomecanalContadorMembrosCallNB_${guild.id}`);

        const contador = guild.channels.cache.get(canalContador);
        if (!contador) return;

        let membros = guild.members.cache.filter(m => m.voice.channel).size;
        console.log(membros)
        if (contador.name !== `${nomeCanal} ${membros}`) {

        contador.setName(`${nomeCanal} ${membros}`);

        }

    }, 360000);

});
