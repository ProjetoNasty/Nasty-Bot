const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const config = require('./../../config.json');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const crypto = require('crypto');
const { prefix } = require("../..");

module.exports = {
    name: 'codigo',
    description: "Gerenciar códigos de verificação",

    run: async (client, message, args) => {

        let prefixoNB = await db.get(`prefixoNB`);
        if (!prefixoNB) prefixoNB = prefix;
        
        if (args.length === 0) {
            const userCodes = await db.all();

            const userCodeEntries = userCodes.filter(entry => 
                entry.id && 
                entry.value && 
                entry.id.startsWith(`codigo_`) && 
                entry.value.donoId === message.author.id
            );
            
            const codesList = userCodeEntries.length === 0
                ? 'Você ainda não tem códigos gerados.'
                : userCodeEntries.map(entry => entry.value.codigo).join('\n');
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`Como usar o comando ${prefixoNB}codigo`)
                .setDescription(
                    `**Uso do comando:**\n` +
                    `\`${prefixoNB}codigo\` - Mostra esta mensagem de ajuda e os códigos existentes para você.\n` +
                    `\`${prefixoNB}codigo gerar\` - Gera um novo código de verificação.\n` +
                    `\n**Seus Códigos de Verificação:**\n` +
                    `${codesList}`
                );
            
            return message.channel.send({ embeds: [embed] });
            
        }

        if (args[0] === 'gerar') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

            const existingCode = await db.get(`codigo_${message.author.id}`);

            if (existingCode) {
      
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Código de Verificação')
                    .setDescription(`Você já tem um código de verificação: \`\`\`\n${existingCode.codigo}\`\`\``);
                
                return message.channel.send({ embeds: [embed] });
            }

            let codigo;
            let isUnique = false;

            while (!isUnique) {
                codigo = crypto.randomBytes(4).toString('hex').toUpperCase();
                const existing = await db.get(`codigo_${codigo}`);
                if (!existing) isUnique = true;
            }

            await db.set(`codigo_${codigo}`, {
                donoId: message.author.id,
                codigo: codigo,
                criadoEm: new Date().toISOString()
            });

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Código de Verificação')
                .setDescription(`Seu novo código de verificação é: \`\`\`\n${codigo}\`\`\``);
            
            message.channel.send({ embeds: [embed] });
        } else {
    
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Erro')
                .setDescription('Uso inválido. Use `!codigo` para ver a lista de comandos e seus códigos ou `!codigo gerar` para gerar um novo código.');

            return message.channel.send({ embeds: [embed] });
        }
    }
};
