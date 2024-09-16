const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { url } = require('../config.json');

// Путь к файлу состояния мониторинга
const stateFilePath = path.join(__dirname, '../monitoringState.json');

// Функция для загрузки состояния
function loadState() {
  if (fs.existsSync(stateFilePath)) {
    const stateData = fs.readFileSync(stateFilePath);
    return JSON.parse(stateData);
  } else {
    return {
      monitoring: false,
      channelId: null,
      lastLogTimestamp: null,
    };
  }
}

// Функция для сохранения состояния
function saveState(state) {
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
}

// Загрузка состояния при старте
let { monitoring, channelId, lastLogTimestamp } = loadState();

const sentMessages = new Set();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('togglemonitor')
    .setDescription('Включает или выключает мониторинг логов клана'),

  async execute(interaction) {
    // Переключаем состояние мониторинга
    monitoring = !monitoring;

    if (monitoring) {
      // Сохраняем ID канала, куда будут отправляться сообщения
      channelId = interaction.channel.id;
      interaction.reply(`Мониторинг включен. Сообщения будут отправляться в канал ${interaction.channel.name}.`);
      
      // Сохраняем состояние
      saveState({ monitoring, channelId, lastLogTimestamp });

      // Запускаем мониторинг
      startMonitoring(interaction.client);
    } else {
      interaction.reply('Мониторинг выключен.');
      saveState({ monitoring, channelId, lastLogTimestamp });
    }
  },
};

// Функция для запуска мониторинга
async function startMonitoring(client) {

  const interval = setInterval(async () => {
    // Если мониторинг выключен, прекращаем интервал
    if (!monitoring) {
      clearInterval(interval);
      return;
    }

    try {
      const response = await axios.get(url);
      let logs = response.data;

      if (logs.length === 0) {
        return;
      }

      logs = logs.reverse();

      for (const log of logs) {
        const { clanName, memberUsername, message, timestamp } = log;

        if (!lastLogTimestamp || new Date(timestamp) > new Date(lastLogTimestamp)) {
            // Обрезаем сообщение до 200 символов, чтобы все embed выглядели одинаково
            const truncatedMessage = message.length > 200 ? message.slice(0, 200) + '...' : message;
            
            // Создаем embed-сообщение
            const embed = new EmbedBuilder()
              .setTitle('Новый лог клана')
              .addFields(
                { name: 'Клан', value: clanName, inline: true },
                { name: 'Участник', value: memberUsername, inline: true },
                { name: 'Лог', value: truncatedMessage },
                { name: 'Время', value: new Date(timestamp).toLocaleString(), inline: true }
              )
              .setColor('#00AAFF')
              .setTimestamp();
  
            // Проверяем, было ли сообщение уже отправлено
            const logMessage = `${clanName}${memberUsername}${message}${timestamp}`;
            if (!sentMessages.has(logMessage)) {
              sentMessages.add(logMessage);
  
              const channel = client.channels.cache.get(channelId);
              if (channel) {
                await channel.send({ embeds: [embed] });
              }
  
              // Обновляем время последнего лога
              lastLogTimestamp = timestamp;
              saveState({ monitoring, channelId, lastLogTimestamp });
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке логов:', error);
      }
    }, 30000);
  }

// Автоматическое восстановление мониторинга при перезапуске бота
if (monitoring && channelId) {
  // Передаем клиента в функцию старта
  module.exports.startMonitoring = startMonitoring;
}
