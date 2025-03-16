
const client = require('..');
const { QuickDB } = require('quick.db');
const { AuditLogEvent } = require('discord.js');
const db = new QuickDB();

client.on("voiceStateUpdate", async (oldState, newState) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    let cargos = await db.get(`sistemaTempo_${newState.guild.id}.cargos`);
    if (!cargos) cargos = [""];

    let fael = await db.get(`sistemaTempo_${newState.guild.id}.categs`);
    if (!fael) fael = [""];

    let usuario = newState.guild.members.cache.get(newState.id);

    let entrada = new Date();

    let hr = entrada.getHours();

    if (hr < 10) {

        hr = '0' + hr;

    } else {

        hr = hr + '';
    }

    let min = entrada.getMinutes()

    if (min < 10) {

        min = '0' + min;

    } else {

        min = min + '';
    }

    const inicio = hr + ":" + min;

    if (!usuario.roles.cache.some(r => cargos.includes(r.id))) return;

    if (!oldState.channel && newState.channel) { // quando ele entrar em um canal de voz

        if (fael.includes(newState.channel?.parentId)) { // Entrada - COMEÇA A CONTAR

            await db.set(`call_${usuario.id}`, new Date().getTime());
            await db.set(`inicio_${usuario.id}`, inicio);

            if (newState.selfMute === false) {

                await db.set(`contando_${usuario.id}`, true);

            }

        } else {

            return;
        }

    } else {

        if (!newState.channel) {

            if (fael.includes(oldState.channel?.parentId)) {

                const tempo = await db.get(`call_${usuario.id}`);

                const start = new Date().getTime();

                const diff = Math.abs(tempo - start);

                const tempo2 = Math.ceil(diff / 1000)

                if (await db.get(`contando_${usuario.id}`) === true) {

                    await db.add(`tempocall_${usuario.id}`, tempo2);
                    await db.set(`contando_${usuario.id}`, false);
                    await db.delete(`call_${usuario.id}`);
                    await db.delete(`inicio_${usuario.id}`);

                }

            } else {

                return;
            }
        }

        else {

            if (oldState.channel && newState.channel && oldState.channel !== newState.channel) {

                 if (fael.includes(newState.channel?.parentId)) { // Entrada - COMEÇA A CONTAR

                    if (await db.get(`contando_${usuario.id}`) == true) {

                        await db.set(`call_${usuario.id}`, new Date().getTime());
                        await db.set(`contando_${usuario.id}`, true);
                        await db.set(`inicio_${usuario.id}`, inicio);

                    }

                } else {

                    const tempo = await db.get(`call_${usuario.id}`)

                    const start = new Date().getTime();

                    const diff = Math.abs(tempo - start);

                    const tempo2 = Math.ceil(diff / 1000)

                    if (await db.get(`contando_${usuario.id}`) === true) {

                        await db.add(`tempocall_${usuario.id}`, tempo2)
                        await db.set(`contando_${usuario.id}`, false)
                        await db.delete(`call_${usuario.id}`)
                        await db.delete(`inicio_${usuario.id}`)

                    }
                }

                return;
            }
        }

        if (newState.selfMute === true) { // Se o usuário estiver mutado (true) e contando o tmepo, ele vai parar de contar o tempo.

            if (usuario.voice.channel) { // checando se ele está em call, para evitar erros..

                if (await db.get(`contando_${newState.id}`) === true) {

                     if (fael.includes(newState.channel?.parentId)) { // Entrada - COMEÇA A CONTAR  // Saída - Adiciona as horas

                        const tempo = await db.get(`call_${usuario.id}`)

                        const start = new Date().getTime();

                        const diff = Math.abs(tempo - start);

                        const tempo2 = Math.ceil(diff / 1000)

                        if (await db.get(`contando_${usuario.id}`) == true) {

                            await db.add(`tempocall_${usuario.id}`, tempo2);
                            await db.set(`contando_${usuario.id}`, false);
                            await db.delete(`call_${usuario.id}`);
                            await db.delete(`inicio_${usuario.id}`);

                        }
                    }
                }
            }

        } else { // Se ele se desmutar estando em CALL, o seu tempo voltará a ser contado.

            if (usuario.voice.channel) { // checando se ele está em call, para evitar erros..	

                 if (fael.includes(newState.channel?.parentId)) { // Entrada - COMEÇA A CONTAR  // Entrada - COMEÇA A CONTAR

                    await db.set(`call_${usuario.id}`, new Date().getTime());
                    await db.set(`contando_${usuario.id}`, true);
                    await db.set(`inicio_${usuario.id}`, inicio);
                }

            }

            return;
        }
    }
});

client.on('guildMemberUpdate', async (oM, nM) => {

    let cargosTempo = await db.get(`sistemaTempo_${oM.guild.id}.cargos`);
    if (!cargosTempo || cargosTempo.length == 0) return;

    const fetchedLogs = await oM.guild?.fetchAuditLogs({
        limite: 1,
        type: AuditLogEvent.MemberRoleUpdate

    }).catch(err => { });

    const roleAddLog = fetchedLogs.entries.first();

    const { executor, target } = roleAddLog;
    if (!executor) return;

    if (roleAddLog.changes[0].key === '$add') {

        let entrada = new Date();

        let hr = entrada.getHours();

        if (hr < 10) {

            hr = '0' + hr;

        } else {

            hr = hr + '';
        }

        let min = entrada.getMinutes()

        if (min < 10) {

            min = '0' + min;

        } else {

            min = min + '';
        }

        const inicio = hr + ":" + min;

        let oldRoles = oM.roles.cache.map(c => c);
        let newRoles = nM.roles.cache.map(c => c);

        if (oldRoles !== newRoles) {
            oldRoles.forEach((r, s) => {
                if (newRoles.find(c => c == r)) {
                    newRoles.splice(newRoles.indexOf(newRoles.find(c => c == r)), 1)
                }
            })

            if (newRoles.length > 0) {

                for (let cargo of newRoles) {

                    if (cargosTempo.includes(cargo.id)) {

                        await db.set(`call_${target.id}`, new Date().getTime());
                        await db.set(`inicio_${target.id}`, inicio);

                    }

                }
            }
        }
    }

});