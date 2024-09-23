const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const levels = require('../data/xptable.js');
const { skillEmojis } = require('../data/maps.js');
const itemMap = require('../data/itemMap.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Получает логи клана и отправляет их как embet-сообщения')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Имя игрока')
                .setRequired(true)),
    async execute(interaction) {
        const name = interaction.options.getString('name');

        try {
            const url = `https://query.idleclans.com/api/Player/profile/${name}`;
            const response = await axios.get(url);
            const data = response.data;

                // Функция для нахождения уровня по общему опыту
                function getLevelFromXP(xp) {
                    let currentLevel = levels[0].level;

                   for (let i = 0; i < levels.length; i++) {
                        if (xp >= levels[i].xp) {
                            currentLevel = levels[i].level;
                        } else {
                            break;
                        }
                    }
                        return currentLevel;
                      }

                    // Рассчитываем уровни для всех навыков
                    const skillLevels = {};
                    for (const [skill, xp] of Object.entries(data.skillExperiences)) {
                        skillLevels[skill] = getLevelFromXP(xp);
                    }

                    const mainEmbed = new EmbedBuilder()
                    .setTitle(`Статистика игрока: `)
                    .addFields(
                      { name: 'Имя', value: data.username, inline: false },
                      { name: 'Режим игры', value: data.gameMode, inline: false },
                      { name: 'Клан', value: data.guildName || 'N/A', inline: false }
                    )
                    .setColor('#00AAFF')
                    
                    const skillEmbed = new EmbedBuilder()
                    .setTitle('Нывыки:')
                    .setColor('#00AAFF')
                    .setTimestamp();
                  // Добавляем уровни навыков в embed
                  for (const [skill, level] of Object.entries(skillLevels)) {
                    const emoji = skillEmojis[skill] || '';  // Добавляем эмодзи, если есть, иначе пусто
                    skillEmbed.addFields({ name: `${emoji} ${skill.charAt(0).toUpperCase() + skill.slice(1)}`, value: `Уровень: ${level}`, inline: true });
                  }

                  // Создаем embed для оборудования (equipment)
                  const equipmentEmbed = new EmbedBuilder()
                    .setTitle(`Экипировка игрока:`)
                    .setColor('#FFD700')
                    .setTimestamp();
                    if (data.equipment) {
                      for (const [itemId, value] of Object.entries(data.equipment)) {
                          // Заменяем значение, если оно есть в карте
                          const itemValue = itemMap[value] || value;
                          equipmentEmbed.addFields({ name: itemId.charAt(0).toUpperCase() + itemId.slice(1), value: `${itemValue}`, inline: true });
                      }
                  } else {
                      equipmentEmbed.addFields({ name: 'Экипировка', value: 'Нет данных', inline: true });
                  }

//                const Bossembet = new EmbedBuilder()
//                .setTitle('Боссы и данжи:')
//                .setColor('#555555')
//                .addFields(
//                    { name: 'Griffin Kills', value: data.griffinKills.toString(), inline: true },
//                   { name: 'Devil Kills', value: data.devilKills.toString(), inline: true },
//                    { name: 'Hades Kills', value: data.hadesKills.toString(), inline: true },
//                    { name: 'Zeus Kills', value: data.zeusKills.toString(), inline: true },
//                    { name: 'Medusa Kills', value: data.medusaKills.toString(), inline: true },
//                    { name: 'Chimera Kills', value: data.chimeraKills.toString(), inline: true },
//                    { name: 'Kronos Kills', value: data.kronosKills.toString(), inline: true },
//                    { name: 'RotG Completions', value: data.reckoningOfTheGodsCompletions.toString(), inline: true },
//                    { name: 'GotC Completions', value: data.guardiansOfTheCitadelCompletions.toString(), inline: true }
//                )

                await interaction.reply({ embeds:
                     [
                        mainEmbed,
                        skillEmbed,
                        equipmentEmbed,
                        //Bossembet
                    ] });
                
        } catch (error) {
            console.error(error);
            await interaction.reply('Не удалось получить данные о игроке. Либо с базы данных не грузит данные о игроке то попозже повторите команду, либо опечатка проверьте правильно ли написан ник игрока');
        }
    },
};
