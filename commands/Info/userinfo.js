const { EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("./../../config.json");
const axios = require("axios");

module.exports = {
    name: "userinfo",
    description: "Exibe informações do usuário",
    run: async (client, message, args) => {
        const userId = args[0];
        const mentionedUser = message.mentions.users.first();
        const user = mentionedUser || (userId ? await client.users.fetch(userId).catch(() => null) : message.author);

        if (!user) {
            return message.reply("Usuário não encontrado. Certifique-se de mencionar ou fornecer um ID válido.");
        }

        const account = await db.get(`protecaourl_${message.guild.id}.account`);

        try {
            const response = await axios.get(`https://api.victims.lol/api/profile/${user.id}`, {
                headers: { authorization: "9BwHvZj595HN" },
            });

            const userProfile = response.data;
            const boost = userProfile?.boost || {};
            const createdAtTimestamp = Math.floor(user.createdAt.getTime() / 1000);

            const boosterMap = {
                BoostLevel1: "<:lvl1:1266413105785733171>",
                BoostLevel2: "<:lvl2:1266413104204480595>",
                BoostLevel3: "<:lvl3:1266413113792790752>",
                BoostLevel4: "<:lvl4:1266413112429641900>",
                BoostLevel5: "<:lvl5:1266413108533133456>",
                BoostLevel6: "<:lvl6:1266413110714175549>",
                BoostLevel7: "<:lvl7:1266413115030110218>",
                BoostLevel8: "<:lvl8:1266413107144818750>",
                BoostLevel9: "<:lvl9:1266413109464273071>",
            };

            const embed = new EmbedBuilder()
                .setColor("#ff0000")
                .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "Usuário:", value: `@${user.username} (\`${user.id}\`)`, inline: false },
                    { name: "Entrada no Discord:", value: `<t:${createdAtTimestamp}:F>`, inline: false }
                );

            if (userProfile?.user_profile?.about_me) {
                embed.addFields({ name: "📝 Biografia", value: `\`\`\`\n${userProfile.user_profile.about_me}\`\`\``, inline: false });
            }

            if (boost.current_level_date) {
                const boostTimestamp = Math.floor(new Date(boost.current_level_date).getTime() / 1000);
                embed.addFields({
                    name: "Impulso Atual",
                    value: `${boosterMap[boost.current_level]} <t:${boostTimestamp}:R>`,
                    inline: true,
                });
            }

            if (boost.next_level_date) {
                const nextBoostTimestamp = Math.floor(new Date(boost.next_level_date).getTime() / 1000);
                embed.addFields({
                    name: "Próximo Impulso",
                    value: `${boosterMap[boost.next_level]} <t:${nextBoostTimestamp}:R>`,
                    inline: true,
                });
            }

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Erro ao buscar informações do usuário:", error);
            message.reply("Ocorreu um erro ao buscar as informações do usuário. Tente novamente mais tarde.");
        }
    },
};
