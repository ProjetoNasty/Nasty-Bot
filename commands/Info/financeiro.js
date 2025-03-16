const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const config = require('../../config.json'); // Usando config.json para configurações
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    name: 'financeiro',
    description: "Displays the financial information and renewal options",
    run: async (client, message, args) => {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        const botE = await db.get(`botex_${client.user.id}`); // Data de expiração armazenada no banco
        const encerrar = new Date(botE);
        const hoje = new Date();
        const diferencaMs = encerrar - hoje;
        const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
        const status = diferencaDias <= 0 ? "Expirado" : "Ativo";

        const adminUser = message.mentions.users.first() || message.author;
        const adminID = adminUser.id;
        const monthlyPrice = "R$ 15,00";
        const supportServerLink = "https://discord.gg/sync";
        const serverIconUrl = message.guild.iconURL({ dynamic: true, format: "png", size: 1024 });

        const embed = new EmbedBuilder()
            .setColor("#F2F2F2")
            .setTitle(`Financeiro - ${client.user.username}`)
            .setThumbnail(serverIconUrl)
            .addFields(
                { name: "<:sejamembro:1327398609007939664> Administrador(a):", value: `${adminUser} \`${adminID}\``, inline: true },
                { name: "<:compressor:1327398596580081744> Status:", value: `\`${status}\``, inline: true },
                { name: "<:time:1327398608122675353> Tempo Restante:", value: diferencaDias > 0 ? `\`${diferencaDias} dias\`` : "`Expirado`", inline: false },
                { name: "<:moderao:1327398604272566322> Informações:", value: `Este sistema de renovação está em **BETA**, caso encontre erros ou a renovação não seja corretamente feita entre em contato no [Servidor de Suporte](${supportServerLink}).`, inline: false },
                { name: "Valor Mensal:", value: monthlyPrice, inline: false }
            )
            .setFooter({ text: "» Todos os direitos reservados para Sync Development." });

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('go_back').setLabel('Voltar').setStyle('Danger'),
                new ButtonBuilder().setCustomId('renew_pix').setLabel('Renovar (PIX)').setStyle('Secondary')
            );

        const sentMessage = await message.channel.send({
            embeds: [embed],
            components: [buttonRow]
        });

        const filter = (interaction) => interaction.customId === 'renew_pix' && interaction.user.id === message.author.id;
        const collector = sentMessage.createMessageComponentCollector({ filter, time: 300000 });

        collector.on('collect', async (interaction) => {
            await interaction.deferUpdate();

            if (status === "Expirado") {
                await interaction.followUp({
                    content: "Seu tempo de premium expirou. Vamos gerar um QR code para renovação.",
                    ephemeral: true
                });

                const transactionId = uuidv4();
                const paymentData = {
                    transaction_amount: 15.00,
                    description: "Renovação de serviço - Sync Development",
                    payment_method_id: "pix",
                    payer: {
                        email: `${interaction.user.username}@example.com` // Placeholder
                    }
                };

                try {
                    const response = await axios.post('https://api.mercadopago.com/v1/payments', paymentData, {
                        headers: {
                            Authorization: `Bearer ${config.mpAccessToken}`
                        }
                    });

                    const qrCodeUrl = response.data.point_of_interaction.transaction_data.qr_code_base64;

                    const qrEmbed = new EmbedBuilder()
                        .setColor("#F2F2F2")
                        .setTitle("Pagamento PIX")
                        .setDescription("Escaneie o QR code abaixo com seu aplicativo bancário para realizar o pagamento.")
                        .setImage(`data:image/png;base64,${qrCodeUrl}`)
                        .setFooter({ text: "Após o pagamento, o sistema confirmará automaticamente." });

                    await interaction.followUp({ embeds: [qrEmbed], ephemeral: true });

                    const interval = setInterval(async () => {
                        const paymentStatus = await axios.get(`https://api.mercadopago.com/v1/payments/${response.data.id}`, {
                            headers: {
                                Authorization: `Bearer ${config.mpAccessToken}`
                            }
                        });

                        if (paymentStatus.data.status === 'approved') {
                            clearInterval(interval);

                            const successEmbed = new EmbedBuilder()
                                .setColor("#00FF00")
                                .setTitle("Pagamento Confirmado")
                                .setDescription("Seu pagamento foi confirmado com sucesso! O sistema foi renovado por mais 30 dias.")
                                .setFooter({ text: "Obrigado por utilizar nossos serviços!" });

                            await db.set(`botex_${client.user.id}`, new Date(hoje.setDate(hoje.getDate() + 30)));
                            await interaction.followUp({ embeds: [successEmbed], ephemeral: true });
                        }
                    }, 5000);
                } catch (error) {
                    console.error(error);
                    await interaction.followUp({ content: "Erro ao gerar o QR code PIX. Tente novamente mais tarde.", ephemeral: true });
                }
            } else {
                await interaction.followUp({
                    content: "Seu tempo premium ainda está ativo.",
                    ephemeral: true
                });
            }
        });
    }
};
