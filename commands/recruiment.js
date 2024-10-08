const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const xpTable = require('../data/xptable.js');
const { categoryMap, houseMap, rankEmojis, languageMap, skillEmojis } = require('../data/maps.js');
const { upgradeMap } = require('../data/upgradeMap.js')

// Подбор уровня из xp
function getLevelFromXP(xp) {
    for (let i = xpTable.length - 1; i >= 0; i--) {
        if (xp >= xpTable[i].xp) {
            return xpTable[i].level;
        }
    }
    return 1;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recruitment')
        .setDescription('Get clan info')
        .addStringOption(option =>
            option.setName('clanname')
                .setDescription('Clan name')
                .setRequired(true)),

    async execute(interaction) {
        const clanname = interaction.options.get('clanname').value;

            // Логирование информации о пользователе, использующем команду
    console.log(`${interaction.user.tag} использовал команду /recruitment с параметром name: ${clanname}`);

        try {
            // Загружаем данные о клане из API
            const url = `https://query.idleclans.com/api/Clan/recruitment/${clanname}`;
            const response = await axios.get(url);
            const data = response.data;

            // Проверка что 'memberlist' существует
            const members = data.memberlist || [];

            // Парсим строку serializedSkills
            const skills = JSON.parse(data.serializedSkills || '{}'); // Если пусто, используем пустой объект

            // Собираем строку с навыками и их уровнями
            let skillsString = '';
            for (const [skill, value] of Object.entries(skills)) {
                const level = getLevelFromXP(value); // Расчёт уровня
                const skillName = skillEmojis[skill.toLocaleLowerCase()] || skill;
                skillsString += `- ${skillName} ${skill.charAt(0).toUpperCase() + skill.slice(1)}: Level ${level}\n`; // Формируем строку с уровнями
                //skillsString += `- ${skill}: Level ${level} (XP: ${value.toFixed(2)})\n`;
            }

            // Формируем список участников с эмодзи
            let memberNames = members.map(member => {
                const rankEmoji = rankEmojis[member.rank] || ''; // Добавляем эмодзи в зависимости от ранга
                return `${rankEmoji} ${member.memberName}`;
            }).join('\n');

            if (memberNames.length === 0) {
                memberNames = 'No members';
            }

            const house = houseMap[data.houseId] || 'Without house';
            const category = categoryMap[data.category] || 'No category data';
            const recruitmentMessage = data.recruitmentMessage || 'No message data';
            const language = languageMap[data.language] || 'No language';

             // Парсим serializedUpgrades и заменяем id на название из карты
            let upgradesString = '';
            const upgrades = JSON.parse(data.serializedUpgrades || '[]'); // Преобразуем строку в массив

            // Обрабатываем каждый элемент апгрейдов
            upgrades.forEach((upgradeId, index) => {
                // Получаем название апгрейда из карты, если оно есть
                const upgradeName = upgradeMap[upgradeId] || `Unknown upgrade (${upgradeId})`;
                upgradesString += `- ${upgradeName}\n`;
            });

            const embed = new EmbedBuilder()
                .setColor(0x5DA91E)
                .setTitle(`Clan info ${clanname}`)
                .addFields(
                    { name: 'Clan name:', value: data.clanName.toString(), inline: false },
                    { name: 'Activity:', value:  `[${data.activityScore.toString()}/100]`, inline: true },
                    { name: 'Min total level:', value: `[${data.minimumTotalLevelRequired.toString()}/2280]`, inline: true },
                    { name: 'Member Count:', value: `[${members.length.toString()}/20]`, inline: true },
                    { name: 'Recruiting:', value: data.isRecruiting ? ':white_check_mark:' : ':negative_squared_cross_mark:', inline: true },
                    { name: 'Clan language:', value: language, inline: true },
                    { name: 'Category:', value: category, inline: true },
                    { name: 'House:', value: house, inline: true},
                    { name: 'Members:', value: memberNames, inline: false},
                    { name: 'Skills:', value: skillsString, inline: false },
                    { name: 'Upgrades:', value: upgradesString, inline: false },
                    { name: 'Recruitment message:', value: recruitmentMessage, inline: false },
                )

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Ошибка при получении данных из API:', error);
            await interaction.reply('Cannot grab clan information.');
        }
    },
};
