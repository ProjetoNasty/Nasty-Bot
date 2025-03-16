const Discord = require("discord.js");
const config = require('../../config.json');
const serverId = config.serverId;
const logChannelId = '1319066342153781338'; // Substitua pelo ID do canal de logs
const verificationChannelId = '1319067996655845419'; // Substitua pelo ID do canal de verificação
const { MessageEmbed } = require('discord.js');

const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    name: 'verificar',
    description: "verifica ai caralho",
    run: async (client, message, args) => {
        // Verifica se o comando foi executado no servidor correto
        
        let colorNB = await db.get(`colorNB`);
        if (!colorNB) colorNB = '#2f3136';

        // Verifica se o autor do comando é um administrador
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            const noPerm = new Discord.EmbedBuilder()
                .setDescription(`${message.author}, você não tem a permissão necessária!`)
                

            return message.channel.send({ embeds: [noPerm] }).then((msg) => {
                setTimeout(() => msg.delete(), 8000);
            });
        }

        const userId = args[0]?.replace(/<@!?(\d+)>/, '$1');

        if (!userId) {
            const reply = new Discord.EmbedBuilder()
                .setDescription('Por favor, mencione um usuário ou forneça o ID do usuário.')
                

            return message.channel.send({ embeds: [reply] }).then((msg) => {
                setTimeout(() => msg.delete(), 5000);
            });
        }

        const guild = message.guild;
        const role = guild.roles.cache.get('1306449335738699858'); // Substitua pelo ID do cargo que deseja atribuir

        if (!role) {
            const reply = new Discord.EmbedBuilder()
                .setDescription('O cargo especificado não foi encontrado.')
                

            return message.channel.send({ embeds: [reply] }).then((msg) => {
                setTimeout(() => msg.delete(), 5000);
            });
        }

        const member = guild.members.cache.get(userId);

        if (!member) {
            const reply = new Discord.EmbedBuilder()
                .setDescription('O usuário mencionado não foi encontrado no servidor.')
                

            return message.channel.send({ embeds: [reply] }).then((msg) => {
                setTimeout(() => msg.delete(), 5000);
            });
        }

        try {
            await member.roles.add(role);

            const logChannel = guild.channels.cache.get(logChannelId);
            const verificationChannel = guild.channels.cache.get(verificationChannelId);

            if (logChannel) {
                const adminTag = `<@${message.author.id}> (ID: ${message.author.id})`;
                const verifiedTag = `<@${member.user.id}> (ID: ${member.user.id})`;
              
                const embed = new Discord.EmbedBuilder()
                .setTitle('VERIFICAÇÃO')
                .setDescription(`Moderador(a): ${adminTag}\nMembro(a): ${verifiedTag}`)
                  .setThumbnail(member.user.displayAvatarURL({ dynamic: true })) 
                    .setColor('#008000')
                    .setTimestamp()
                    logChannel.send({ embeds: [embed] }).catch(console.error);
              }
              

            if (verificationChannel) {
                setTimeout(async () => {
                    try {
                        const messages = await verificationChannel.messages.fetch({ limit: 100 });
                        const userMessages = messages.filter(msg => msg.author.id === member.user.id);
            
                        userMessages.forEach(async (msg) => {
                            try {
                                await msg.delete();
                            } catch (error) {
                                console.error('Erro ao excluir a mensagem:', error.message);
                            }
                        });
                    } catch (error) {
                        console.error('Erro ao buscar as mensagens:', error.message);
                    }
                }, 1000); // Adicionando um atraso de 1 segundo (1000 milissegundos) antes de excluir as mensagens
            }
            
        } catch (error) {
            console.error(error);

            const reply = new Discord.EmbedBuilder()
                .setDescription('Ocorreu um erro ao realizar a verificação.')
              

            return message.channel.send({ embeds: [reply] }).then((msg) => {
                setTimeout(() => msg.delete(), 5000);
            });
        }

        // Apaga a mensagem de comando
        message.delete().catch(console.error);
    },
};
