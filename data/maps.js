const categoryMap = {
    '1': '🎮 Казуал',
    '2': '🏆 Соревнующийся',
    '3': '🔥 Хардкорный',
};


const houseMap = {
    '0': '<:Guild_house_1:1285272003573715065> Палатка (+5% Xp',
    '1': '<:Guild_house_2:1285272421334777931> Конюшня (+10% Xp)',
    '2': '<:Guild_house_3:1285272437222674464> Мельница (+15% Xp)',
    '3': '<:Guild_house_4:1285272453928456283> Дом (+20% Xp)',
    '4': '<:Guild_house_5:1285272467551686737> Коттедж (+25% Xp)',
    '5': '<:Guild_house_6:1285272481149485107> Замок   (+30% Xp)',
};

// Маппинг рангов и кастомных эмодзи (замените на ваши эмодзи ID)
const rankEmojis = {
    1: '<:star:1285266701692309504>',  // Кастомное эмодзи для ранга 1 (ID эмодзи 123456789012345678)
    2: '<:crown:1285266446884012103>',  // Кастомное эмодзи для ранга 2 (ID эмодзи 987654321098765432)
};

const skillEmojis = {
    attack: '⚔️',
    strength: '💪',
    defence: '🛡️',
    archery: '🏹',
    magic: '🪄',
    health: '❤️',
    crafting: '🔨',
    woodcutting: '🌲',
    carpentry: '🪓',
    fishing: '🎣',
    cooking: '🍳',
    mining: '⛏️',
    smithing: '⚒️',
    foraging: '🍂',
    farming: '🌾',
    agility: '🏃',
    plundering: '🏴‍☠️',
    enchanting: '✨',
    brewing: '🍺',
  };

module.exports = { categoryMap, houseMap, rankEmojis, skillEmojis };
