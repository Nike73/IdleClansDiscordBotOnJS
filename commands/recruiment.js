const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const xpTable = require('../data/xptable.js');
const { categoryMap, houseMap, rankEmojis } = require('../data/maps.js');
const { upgradeMap } = require('../data/upgradeMap.js')

function getLevelFromXP(xp) {
    // Находим уровень на основе XP
    for (let i = xpTable.length - 1; i >= 0; i--) {
        if (xp >= xpTable[i].xp) {
            return xpTable[i].level;
        }
    }
    return 1; // Минимальный уровень, если XP меньше минимального значения
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recruitment')
        .setDescription('Получить данные о клане')
        .addStringOption(option =>
            option.setName('clanname')
                .setDescription('Название клана')
                .setRequired(true)),

    async execute(interaction) {
        const clanname = interaction.options.get('clanname').value;

        try {
            // Загружаем данные о клане из API
            const url = `https://query.idleclans.com/api/Clan/recruitment/${clanname}`;
            const response = await axios.get(url);
            const data = response.data;

            // Убедитесь, что 'memberlist' существует
            const members = data.memberlist || [];

            // Парсим строку serializedSkills
            const skills = JSON.parse(data.serializedSkills || '{}'); // Если пусто, используем пустой объект

            // Собираем строку с навыками и их уровнями
            let skillsString = '';
            for (const [skill, value] of Object.entries(skills)) {
                const level = getLevelFromXP(value); // Расчёт уровня
                skillsString += `- ${skill}: Level ${level} (XP: ${value.toFixed(2)})\n`; // Формируем строку с уровнями
            }

            // Формируем список участников с эмодзи
            let memberNames = members.map(member => {
                const rankEmoji = rankEmojis[member.rank] || ''; // Добавляем эмодзи в зависимости от ранга
                return `${rankEmoji} ${member.memberName}`;
            }).join('\n');

            if (memberNames.length === 0) {
                memberNames = 'Нету участников';
            }

            const house = houseMap[data.houseId] || 'Без здания';
            const category = categoryMap[data.category] || 'Неизвестная категория';
            const recruitmentMessage = data.recruitmentMessage || 'Нету сообщения о найме';
            const language = data.language || 'Не указан язык';

             // Парсим serializedUpgrades и заменяем id на название из карты
            let upgradesString = '';
            const upgrades = JSON.parse(data.serializedUpgrades || '[]'); // Преобразуем строку в массив

            // Обрабатываем каждый элемент апгрейдов
            upgrades.forEach((upgradeId, index) => {
                // Получаем название апгрейда из карты, если оно есть
                const upgradeName = upgradeMap[upgradeId] || `Неизвестный апгрейд (${upgradeId})`;
                upgradesString += `${upgradeName}\n`;
            });

            // Формируем Embed сообщение
            const embed = new EmbedBuilder()
                .setColor(0x5DA91E)
                .setTitle(`Информация о клане ${clanname}`)
                .addFields(
                    { name: 'Название клана', value: data.clanName.toString(), inline: false },
                    { name: 'Активность', value: data.activityScore.toString(), inline: true },
                    { name: 'Мин Общ ур', value: data.minimumTotalLevelRequired.toString(), inline: true },
                    { name: 'Кол-во участ', value: members.length.toString(), inline: true },
                    { name: 'Нанимают', value: data.isRecruiting ? ':white_check_mark:' : ':negative_squared_cross_mark:', inline: true },
                    { name: 'Язык клана', value: language, inline: true },
                    { name: 'Категория', value: category, inline: true },
                    { name: 'Здание', value: house, inline: true},
                    { name: 'Участники', value: memberNames, inline: false},
                    { name: 'Навыки', value: skillsString, inline: false },
                    { name: 'Апгрейды', value: upgradesString, inline: false },
                    { name: 'Сообщения о найме', value: recruitmentMessage, inline: false },
                )

            // Отправляем сообщение в канал
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Ошибка при получении данных из API:', error);
            await interaction.reply('Не удалось получить данные о клане.');
        }
    },
};
