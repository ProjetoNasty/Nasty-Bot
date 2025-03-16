const fs = require('fs');
const { PermissionsBitField } = require('discord.js');
const AsciiTable = require('ascii-table');

// Cria uma tabela para exibir o status dos comandos
const table = new AsciiTable()
    .setHeading('Slash Commands', 'Stats')
    .setBorder('|', '=', "0", "0");

module.exports = (client) => {
    // Inicializa client.slashCommands como uma Collection
    if (!client.slashCommands) client.slashCommands = new Map();

    const slashCommands = [];

    // Lê os diretórios de comandos
    fs.readdirSync('./slashCommands/').forEach(async (dir) => {
        const files = fs.readdirSync(`./slashCommands/${dir}/`).filter(file => file.endsWith('.js'));

        // Processa cada arquivo de comando
        for (const file of files) {
            try {
                const slashCommand = require(`../slashCommands/${dir}/${file}`);
                console.log(slashCommand);

                // Adiciona o comando à lista de comandos slash
                slashCommands.push({
                    name: slashCommand.name,
                    description: slashCommand.description,
                    type: slashCommand.type,
                    options: slashCommand.options || null,
                    default_permission: slashCommand.default_permission || null,
                    default_member_permissions: slashCommand.default_member_permissions
                        ? PermissionsBitField.resolve(slashCommand.default_member_permissions).toString()
                        : null,
                });

                // Adiciona o comando ao Map de comandos do cliente
                if (slashCommand.name) {
                    client.slashCommands.set(slashCommand.name, slashCommand);
                    table.addRow(file.split('.js')[0], '✅');
                } else {
                    table.addRow(file.split('.js')[0], '⛔');
                }
            } catch (error) {
                console.error(`Erro ao carregar o comando ${file}:`, error);
                table.addRow(file.split('.js')[0], '❌');
            }
        }
    });

    // Registra os comandos slash quando o bot estiver pronto
    client.once('ready', async () => {
        try {
            await client.application.commands.set(slashCommands);
            console.log('Comandos slash registrados com sucesso!');
            console.log(table.toString());
        } catch (error) {
            console.error('Erro ao registrar comandos slash:', error);
        }
    });
};