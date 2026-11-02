import { setMaxListeners } from 'events';
import { bot, sendSafeReply, lastChatId, HA_URL, HA_TOKEN, getHaState } from './connect.js';
import { 
  mainKeyboard, 
  bathroomKeyboard, 
  corridorKeyboard, 
  kitchenKeyboard, 
  bedroomKeyboard 
} from './keyboards.js';
import { handleBathroomCommand } from './rooms/bathroom.js';

setMaxListeners(0);
const userStates = new Map();

export async function processCommand(text, ctx) {
  const chatId = ctx.message?.recipient?.chat_id || ctx.message?.chat?.id;
  const currentRoom = userStates.get(chatId) || 'main';
  
  console.log(`[Команда] ${text} (комната: ${currentRoom})`);
  
  if (text === '/start' || text === 'помощь' || text === 'cmd_help' || text === 'back_to_main') {
    userStates.set(chatId, 'main');
    await sendSafeReply(ctx, '️ *Эгида* на связи!\n\nВыберите комнату:', mainKeyboard);
  }
  else if (text === 'room_corridor') {
    userStates.set(chatId, 'corridor');
    await sendSafeReply(ctx, ' *Коридор*\n\nУправление освещением:', corridorKeyboard);
  }
  else if (text === 'room_bathroom') {
    userStates.set(chatId, 'bathroom');
    await sendSafeReply(ctx, ' *Ванная комната*\n\nУправление вентиляцией:', bathroomKeyboard);
  }
  else if (text === 'room_kitchen') {
    userStates.set(chatId, 'kitchen');
    await sendSafeReply(ctx, ' *Кухня*\n\nУправление освещением:', kitchenKeyboard);
  }
  else if (text === 'room_bedroom') {
    userStates.set(chatId, 'bedroom');
    await sendSafeReply(ctx, '️ *Спальня*\n\nУправление освещением:', bedroomKeyboard);
  }
  else if (currentRoom === 'bathroom') {
    await handleBathroomCommand(text, ctx);
  }
  else if (text === 'статус' || text === 'cmd_status') {
    const pveStatus = await getHaState('sensor.pve_status');
    const xpeStatus = await getHaState('sensor.xpe_status');
    const haStatus = await getHaState('sensor.haos_18_2_status');
    await sendSafeReply(ctx, ` *Статус систем*\n Proxmox: ${pveStatus}\n Xpenology: ${xpeStatus}\n Home Assistant: ${haStatus}`, mainKeyboard);
  }
  else if (text === 'погода' || text === 'cmd_weather') {
    try {
      const weatherData = await fetch(HA_URL + '/api/states/weather.forecast_home_assistant', {
        headers: { 'Authorization': 'Bearer ' + HA_TOKEN }
      }).then(r => r.json());
      const temp = weatherData.attributes.temperature || 'недоступно';
      const weatherTranslations = { 'clear-night': 'ясно ', 'cloudy': 'облачно ☁️', 'partlycloudy': 'переменная облачность ⛅', 'sunny': 'солнечно ☀️', 'rainy': 'дождь ️', 'snowy': 'снег ❄️' };
      const weatherText = weatherTranslations[weatherData.state] || weatherData.state;
      await sendSafeReply(ctx, `️ *Текущая погода*\n\nТемпература: *${temp}°C*\nСостояние: ${weatherText}`, mainKeyboard);
    } catch (e) {
      await sendSafeReply(ctx, '❌ Ошибка получения погоды', mainKeyboard);
    }
  }
  else if (text === 'morning_weather') {
    try {
      const weatherData = await fetch(HA_URL + '/api/states/weather.forecast_home_assistant', {
        headers: { 'Authorization': 'Bearer ' + HA_TOKEN }
      }).then(r => r.json());
      const temp = weatherData.attributes.temperature || 'недоступно';
      const humidity = weatherData.attributes.humidity || 'недоступно';
      const weatherTranslations = { 'clear-night': 'ясно ', 'cloudy': 'облачно ☁️', 'partlycloudy': 'переменная облачность ⛅', 'sunny': 'солнечно ☀️', 'rainy': 'дождь ️', 'snowy': 'снег ❄️' };
      const weatherText = weatherTranslations[weatherData.state] || weatherData.state;
      const message = `☀️ *Доброе утро!* ️\n\nПогода сейчас: *${temp}°C*, ${weatherText}\nВлажность: ${humidity}%\n\nХорошего дня! Все системы под контролем.`;
      await sendSafeReply(ctx, message, mainKeyboard);
    } catch (e) {
      await sendSafeReply(ctx, '❌ Ошибка получения погоды', mainKeyboard);
    }
  }
  else if (text === 'серверы' || text === 'cmd_servers') {
    const pveStatus = await getHaState('sensor.pve_status');
    const xpeStatus = await getHaState('sensor.xpe_status');
    const haStatus = await getHaState('sensor.haos_18_2_status');
    const q4osStatus = await getHaState('sensor.q4os_status');
    const statusIcon = (s) => (s && ['running', 'online', 'on', 'active'].includes(s.toLowerCase())) ? '' : '';
    await sendSafeReply(ctx, `️ *Инфраструктура:*\n\n${statusIcon(pveStatus)} Proxmox VE\n${statusIcon(xpeStatus)} Xpenology (DSM)\n${statusIcon(haStatus)} Home Assistant\n${statusIcon(q4osStatus)} Q4OS\n\n_Все узлы работают стабильно._`, mainKeyboard);
  }
  else if (text === 'тест утра' || text === 'cmd_test_morning') {
    await processCommand('morning_weather', ctx);
  }
  else if (text === 'door_opened') {
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU');
    await sendSafeReply(ctx, ` *Открытие двери!*\n\nВремя: ${time}\n\nВходная дверь открыта. Проверьте, всё ли в порядке.`, mainKeyboard);
  }
  else {
    await sendSafeReply(ctx, ' Не понимаю команду. Используйте главное меню:', mainKeyboard);
  }
}

bot.on('message_created', async (ctx) => {
  try {
    const text = ctx.message?.body?.text?.toLowerCase().trim();
    if (!text) return;
    console.log('[Текст] Пользователь:', text);
    await processCommand(text, ctx);
  } catch (error) {
    console.error('❌ Ошибка в message_created:', error);
  }
});

bot.on('message_callback', async (ctx) => {
  try {
    const payload = ctx.update?.callback?.payload;
    console.log('[Кнопка] Payload:', payload);

    if (ctx.update?.callback?.callback_id && ctx.api?.answerOnCallback) {
      try { await ctx.api.answerOnCallback({ callback_id: ctx.update.callback.callback_id }); } 
      catch (e) { console.log('⚠️ answerOnCallback пропущен'); }
    }

    if (payload) {
      await processCommand(payload, ctx);
    }
  } catch (error) {
    console.error('❌ Ошибка в message_callback:', error);
  }
});

console.log('============================================');
console.log('️ ЭГИДА — Официальный MAX Bot API + MQTT');
console.log(' Home Assistant:', HA_URL);
console.log(' MQTT:', process.env.MQTT_URL);
console.log(' Запуск...');
console.log('============================================');

bot.start();