const { EmbedBuilder, Collection, PermissionsBitField, ChannelType } = require('discord.js')
const ms = require('ms');
const client = require('..');
const config = require('../config.json');
const cooldown = new Collection();
const { QuickDB } = require('quick.db')
const db = new QuickDB();

async function handleImageDeletion(message) {
    if (message.channel.type !== ChannelType.DM) return;
	const botE = await db.get(`botex_${message?.guild.id}`)
    const encerrar = new Date(botE);
    const hoje = new Date();
        
    const diferencaMs = encerrar - hoje; 
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24)); 
        
    if (diferencaDias <= 0) { 
		return;
	};

    if (message.attachments.size > 0) {
        let stat = await db.get(`autolimpezaimagens_${message.guild.id}.estado`);
        if (stat) {
            let channels = await db.get(`autolimpezaimagens_${message.guild.id}.canais`) || [];
            if (channels.includes(message.channel.id)) {
                let logChannelId = await db.get(`autolimpezaimagens_${message.guild.id}.logs`);
                let logChannel = logChannelId ? message.guild.channels.cache.get(logChannelId) : null;

                if (logChannel) {
					const logEmbed = new EmbedBuilder()
                        .setTitle('Imagem Detectada')
						.setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
						.addFields(
							{ name: 'Usuário', value: `${message.author.globalName ? message.author.globalName : message.author.username}`, inline: true },
							{ name: 'Canal', value: `<#${message.channel.id}>`, inline: true },
							{ name: 'Link', value: message.attachments.first().url, inline: true}
						)
                        .setColor('#ff0000')
						.setThumbnail(client.user.avatarURL({ size: 4096 }))
						.setFooter({ text: `ID: ${message.author.id}`})
                        .setTimestamp();
                 
                    await logChannel.send({ embeds: [logEmbed] })
                }

                setTimeout(async () => {
                    try {
                      
                        let messageToDelete = await message.channel.messages.fetch(message.id);
                        if (messageToDelete) {
                            await messageToDelete.delete();
                            if (logChannel) {
                        
                                await logChannel.send(`Imagem em ${message.channel} foi deletada.`);
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao deletar a mensagem:', error);
                    }
                }, 10 * 60 * 1000); 
            }
        }
    }
}

client.on('messageCreate', async message => {
    await handleImageDeletion(message);

    let prefixoNB = await db.get('prefixCurrent');
  
    if (!prefixoNB) prefixoNB = config.prefix;

    if (message.author.bot) return;
    if (message.channel.type !== 0) return;
    if (!message.content.startsWith(prefixoNB)) return;

    const args = message.content.slice(prefixoNB.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if (cmd.length == 0) return;
    let command = client.commands.get(cmd);
    if (!command) command = client.commands.get(client.aliases.get(cmd));

    const botE = await db.get(`botex_${client.user.id}`);
    const encerrar = new Date(botE);
    const hoje = new Date();
    const diferencaMs = encerrar - hoje;
    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    if (diferencaDias <= 0 && cmd !== 'menu') {
        return;
    }

    if (command) {
        if (command.cooldown) {
            if (cooldown.has(`${command.name}${message.author.id}`)) {
                return message.channel.send({
                    content: config.messages["COOLDOWN_MESSAGE"].replace(
                        '<duration>',
                        ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), { long: true })
                    )
                });
            }
            if (command.userPerms || command.botPerms) {
                if (!message.member.permissions.has(PermissionsBitField.resolve(command.userPerms || []))) {
                    const userPerms = new EmbedBuilder()
                        .setDescription(`🚫 ${message.author}, You don't have \`${command.userPerms}\` permissions to use this command!`)
                        .setColor('Red');
                    return message.reply({ embeds: [userPerms] });
                }
                if (!message.guild.members.cache.get(client.user.id).permissions.has(PermissionsBitField.resolve(command.botPerms || []))) {
                    const botPerms = new EmbedBuilder()
                        .setDescription(`🚫 ${message.author}, I don't have \`${command.botPerms}\` permissions to use this command!`)
                        .setColor('Red');
                    return message.reply({ embeds: [botPerms] });
                }
            }

            command.run(client, message, args);
            cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown);
            setTimeout(() => {
                cooldown.delete(`${command.name}${message.author.id}`);
            }, command.cooldown);
        } else {
            if (command.userPerms || command.botPerms) {
                if (!message.member.permissions.has(PermissionsBitField.resolve(command.userPerms || []))) {
                    const userPerms = new EmbedBuilder()
                        .setDescription(`🚫 ${message.author}, You don't have \`${command.userPerms}\` permissions to use this command!`)
                        .setColor('Red');
                    return message.reply({ embeds: [userPerms] });
                }

                if (!message.guild.members.cache.get(client.user.id).permissions.has(PermissionsBitField.resolve(command.botPerms || []))) {
                    const botPerms = new EmbedBuilder()
                        .setDescription(`🚫 ${message.author}, I don't have \`${command.botPerms}\` permissions to use this command!`)
                        .setColor('Red');
                    return message.reply({ embeds: [botPerms] });
                }
            }
            command.run(client, message, args);
            await message.delete().catch(err => {
            });
        }
    }
});
