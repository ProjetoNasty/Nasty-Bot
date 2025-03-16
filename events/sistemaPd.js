const client = require('..');
const { AuditLogEvent } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.on('guildMemberUpdate', async (oM, nM) => {

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0) {
        return;
    }

    const fetchedLogs = await oM.guild?.fetchAuditLogs({
        limite: 1,
        type: AuditLogEvent.MemberRoleUpdate

    }).catch(err => { });

    const roleAddLog = fetchedLogs?.entries.first();

    const { executor, target } = roleAddLog;
    if (!executor) return;

    if (roleAddLog.changes[0].key === '$add') {

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

                    let pd = await db.get(`cargopdNB_${oM.guild.id}`);

                    let damaDb = await db.get(`sistemaPD_${oM.guild.id}.pd`);
                    if (!damaDb || damaDb.length == 0) return;

                    let cargoDamaDb = (await db.get(`sistemaPD_${oM.guild.id}.pd`))?.filter(element => element.cargoId == cargo.id);

                    if (cargo.id == pd) {

                        if (executor.id !== client.user.id) {

                            await oM.roles.remove(pd).catch(err => {

                            })
                        }
                    }

                    if (cargoDamaDb.length) {

                        await db.set(`limitepdNB_${target.id}`, cargoDamaDb[0].cargoLimite);
                    }

                }
            }
        }
    }

    if (roleAddLog.changes[0].key === '$remove') {

        let oldRoles = oM.roles.cache.map(c => c);
        let newRoles = nM.roles.cache.map(c => c);

        if (oldRoles !== newRoles) {

            newRoles.forEach((r, s) => {
                if (oldRoles.find(c => c !== r)) {
                    oldRoles.splice(oldRoles.indexOf(oldRoles.find(c => c == r)), 1)
                }
            })

            let roleIds = oldRoles.map(c => c.id);

            let possui = false;

            let pdDb = await db.get(`sistemaPD_${oM.guild.id}.cargospd`);
            if (!pdDb || pdDb.length == 0) return;

            let cargos = await pdDb.map(x => x.cargoId);

            cargos.forEach((c, s) => {
                if (roleIds.includes(c)) possui = true
            });

            if (possui) {

                let Ids = (await db.get(`pd_${target.id}.pds`));

                let pd = await db.get(`cargopdNB_${oM.guild.id}`);
                if (!pd) return;

                if (Ids) {

                    let damas = Ids.map(c => c);

                    let gangroles = await oM.guild.members.cache.filter((membro) =>
                        damas.includes(membro.id)
                    );

                    gangroles.each(async (r) => {
                        await r.roles.remove(pd).catch(err => {
                        })

                        await db.delete(`dama_${r.id}`);
                    })

                    await db.delete(`pd_${target.id}`);
                    await db.delete(`limitepdNB_${target.id}`);
                    await db.delete(`contadorpd_${target.id}`);
                }
            }
        }
    }
});

client.on('guildMemberRemove', async (member) => {

    const prince = await db.get(`dama_${member.id}`);

    let Ids = (await db.get(`pd_${member.id}.pds`));

    if (Ids) {

        let cargoPd = await db.get(`cargopdNB_${member.guild.id}`);

        let damas = Ids.map(c => c);

        let gangroles = await member.guild.members.cache.filter((membro) =>
            damas.includes(membro.id)
        );

        gangroles.each(async (r) => {
            await r.roles.remove(cargoPd).catch(err => {
            })
        })

        await db.delete(`pd_${member.id}`);
        await db.delete(`limitepdNB_${member.id}`);
    }

    if (prince) {

        const filterComment = (await db.get(`pd_${prince}.pd`))?.filter(element => element.dama !== member.id);
        await db.set(`pd_${prince}.pd`, filterComment);

        await db.set(`pd_${prince}.listapds`, (await db.get(`pd_${prince}.listapds`))?.filter(e => e !== `${member.user.username}`));
        await db.set(`pd_${prince}.pds`, (await db.get(`pd_${prince}.pds`))?.filter(e => e !== `${member.id}`));
        await db.delete(`dama_${member.id}`);
        await db.sub(`contadorpd_${prince}`, 1);

        let dataBase = await db.get(`pd_${prince}.pd`);

        if (!dataBase || dataBase.length == 0) {

            await db.delete(`pd_${prince}`);
        }

    }
});