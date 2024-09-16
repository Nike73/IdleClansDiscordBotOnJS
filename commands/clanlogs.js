const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Получает логи клана и отправляет их как embet-сообщения')
        .addStringOption(option =>
            option.setName('clanname')
                .setDescription('Название клана')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Максимальное количество сообщений для отправки')
                .setRequired(false)),
    async execute(interaction) {
        const clanname = interaction.options.getString('clanname');
        const limit = interaction.options.getInteger('limit') || 10; // По умолчанию лимит 10
        const url = `https://query.idleclans.com/api/Clan/logs/clan/${clanname}`;

        try {
            const response = await axios.get(url);
            let logs = response.data;
            if (!Array.isArray(logs)) {
                await interaction.reply('Не удалось получить логи.');
                return;
            }

            logs = logs.reverse();

            const limitedLogs = logs.slice(0, limit);

            await interaction.reply('Обрабатываю логи...');

            for (const log of limitedLogs) {
                const { clanName, memberUsername, message, timestamp } = log;

                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle(`Действие о ${memberUsername}`)
                    .addFields(
                        { name: 'Клан', value: clanName || 'Не указан', inline: true },
                        { name: 'Сообщение', value: message || 'Не указано', inline: false },
                        { name: 'Время', value: new Date(timestamp).toLocaleString() || 'Не указано', inline: true }
                    )

                await interaction.followUp({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Ошибка при получении данных из API:', error);
            await interaction.followUp('Не удалось получить логи клана.');
        }
    },
};
