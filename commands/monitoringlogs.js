const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { url } = require('../config.json');
const db = require('../database');

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

// Функция для обновления темы канала
async function updateChannelTopic(client, channelId) {
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    const newTopic = `Бот был перезапущен в ${new Date().toLocaleString()}`;
    await channel.setTopic(newTopic)
      .catch(console.error);
  }
}

// Функция для восстановления мониторинга
function restoreMonitoring(client) {
  if (monitoring && channelId) {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send('Мониторинг продолжается после перезапуска бота.');
    }
    updateChannelTopic(client, channelId);  // Обновление темы канала
    startMonitoring(client);  // Запуск мониторинга
  }
}

// Функция для запуска мониторинга
async function startMonitoring(client) {
  const interval = setInterval(async () => {
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

        // Проверка на уникальность записи перед вставкой в базу данных
        const logMessage = `${clanName}${memberUsername}${message}${timestamp}`;

        // Проверка на существование сообщения в базе данных
        db.get(`SELECT COUNT(*) AS count FROM logs WHERE clanName = ? AND memberUsername = ? AND message = ? AND timestamp = ?`, 
          [clanName, memberUsername, message, timestamp], (err, row) => {
            if (err) {
              console.error('Ошибка при проверке наличия лога в базе данных:', err.message);
              return;
            }

            // Если запись не найдена, добавляем её в базу данных
            if (row.count === 0) {
              const truncatedMessage = message.length > 200 ? message.slice(0, 200) + '...' : message;

              db.run(`INSERT INTO logs (clanName, memberUsername, message, timestamp) VALUES (?, ?, ?, ?)`, 
                [clanName, memberUsername, truncatedMessage, timestamp], (err) => {
                  if (err) {
                    console.error('Ошибка при сохранении лога в базу данных:', err.message);
                  }
                });

          const embed = new EmbedBuilder()
            .setTitle('New clan log')
            .addFields(
              { name: 'Clan', value: clanName, inline: true },
              { name: 'Member', value: memberUsername, inline: true },
              { name: 'Message', value: truncatedMessage },
              { name: 'Date & Time', value: `Local: ${new Date(timestamp).toLocaleString()} | Discord: <t:${Math.floor(new Date(timestamp).getTime() / 1000)}>`, inline: true }
            )
            .setColor('#00AAFF')

            sentMessages.add(logMessage);

              const channel = client.channels.cache.get(channelId);
              if (channel) {
                channel.send({ embeds: [embed] });
              }

              lastLogTimestamp = timestamp;
              saveState({ monitoring, channelId, lastLogTimestamp });
            }
          });
      }
    } catch (error) {
      console.error('Ошибка при проверке логов:', error);
    }
  }, 30000);
}

// Загрузка состояния при старте
let { monitoring, channelId, lastLogTimestamp } = loadState();

const sentMessages = new Set();

// Экспортируем все функции и команду в одном объекте
module.exports = {
  data: new SlashCommandBuilder()
    .setName('togglemonitor')
    .setDescription('Включает или выключает мониторинг логов клана'),
  
  async execute(interaction) {
    monitoring = !monitoring;

    if (monitoring) {
      channelId = interaction.channel.id;
      interaction.reply(`Мониторинг включен. Сообщения будут отправляться в канал ${interaction.channel.name}.`);
      saveState({ monitoring, channelId, lastLogTimestamp });
      updateChannelTopic(interaction.client, channelId);
      startMonitoring(interaction.client);
    } else {
      interaction.reply('Мониторинг выключен.');
      saveState({ monitoring, channelId, lastLogTimestamp });
    }
  },

  restoreMonitoring,
  startMonitoring,
};
