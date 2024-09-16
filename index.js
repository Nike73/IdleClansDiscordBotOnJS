const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

// Создаем клиент
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Загружаем команды из папки commands
const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }

// Регистрируем команды (для одного сервера)
const rest = new REST({ version: '10' }).setToken(token);


(async () => {
    try {
      console.log('Начинаю регистрацию slash-команд.');
 
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
  
      console.log('Slash-команды успешно зарегистрированы.');
     } catch (error) {
        console.error(error);
    }
})();

// Обработка событий
client.once('ready', () => {
    console.log(`Бот успешно запущен как ${client.user.tag}`);
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
  
    const command = client.commands.get(interaction.commandName);
  
    if (!command) return;
  
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Произошла ошибка при выполнении команды!', ephemeral: true });
    }
});


client.login(token);