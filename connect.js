import { Bot } from '@maxhub/max-bot-api';
import mqtt from 'mqtt';

let rawToken = process.env.BOT_TOKEN || '';
if (rawToken.includes('=')) {
  rawToken = rawToken.split('=').pop();
}
export const BOT_TOKEN = rawToken.replace(/^["'\s]+|["'\s]+$/g, '').trim();

export const HA_URL = process.env.HA_URL || 'http://ВАШ_АДРЕС_HA:8123';
export const HA_TOKEN = process.env.HA_TOKEN;
export const MQTT_URL = process.env.MQTT_URL || 'mqtt://ВАШ_АДРЕС_MQTT:1883';
export const MQTT_USER = process.env.MQTT_USER;
export const MQTT_PASS = process.env.MQTT_PASS;

export const bot = new Bot(BOT_TOKEN);

export async function getHaState(entityId) {
  try {
    const response = await fetch(HA_URL + '/api/states/' + entityId, {
      headers: { 'Authorization': 'Bearer ' + HA_TOKEN, 'Content-Type': 'application/json' }
    });
    if (!response.ok) return 'недоступно';
    const data = await response.json();
    return data.state;
  } catch (error) {
    return 'ошибка сети';
  }
}

export async function callHaService(domain, service, entityId) {
  try {
    const response = await fetch(HA_URL + '/api/services/' + domain + '/' + service, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + HA_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: entityId })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export let lastChatId = null;
export let lastUserId = null;

export async function sendSafeReply(ctx, text, keyboard = null) {
  const recipient = ctx.message?.recipient || ctx.message?.chat || {};
  const chatId = recipient.chat_id;
  const userId = recipient.user_id;
  
  const targetId = Number(chatId || userId);
  if (!targetId) {
    console.error('⚠️ Не удалось определить ID получателя');
    return;
  }
  
  lastChatId = targetId;
  lastUserId = userId || targetId;

  const safeText = String(text || '');
  console.log(`[DEBUG] Отправка в URL: /messages?chat_id=${targetId}`);

  const bodyPayload = {
    chat_id: targetId,
    text: safeText,
    format: 'markdown'
  };

  if (keyboard) {
    bodyPayload.attachments = [keyboard];
  }

  try {
    const response = await fetch(`https://platform-api2.max.ru/messages?chat_id=${targetId}`, {
      method: 'POST',
      headers: {
        'Authorization': BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }
    console.log('✅ Сообщение успешно отправлено');
  } catch (error) {
    console.error('❌ Ошибка отправки:', error.message);
  }
}

const mqttOptions = {};
if (MQTT_USER) mqttOptions.username = MQTT_USER;
if (MQTT_PASS) mqttOptions.password = MQTT_PASS;

export const mqttClient = mqtt.connect(MQTT_URL, mqttOptions);

mqttClient.on('connect', () => {
  console.log('✅ MQTT подключен к HA:', MQTT_URL);
  mqttClient.subscribe('aegis/command');
  mqttClient.subscribe('aegis/response');
  
  const deviceInfo = {
    "name": "Эгида Бот",
    "unique_id": "aegis_bot_status_001",
    "device_class": "connectivity",
    "state_topic": "aegis/status",
    "payload_on": "online",
    "payload_off": "offline",
    "device": {
      "identifiers": ["aegis_bot_001"],
      "manufacturer": "Aegis",
      "model": "Smart Home Bot v1.0",
      "name": "Эгида"
    }
  };
  
  mqttClient.publish('homeassistant/binary_sensor/aegis/config', JSON.stringify(deviceInfo), { qos: 1, retain: true });
  mqttClient.publish('aegis/status', 'online', { qos: 1, retain: true });
  console.log('🏠 Бот зарегистрирован в Home Assistant');
});

mqttClient.on('message', async (topic, message) => {
  if (topic === 'aegis/command') {
    const command = message.toString().trim();
    console.log('[MQTT] Получена команда:', command);
    
    if (!lastChatId) return;

    const fakeCtx = {
      message: { recipient: { chat_id: lastChatId, user_id: lastUserId }, body: { text: command } }
    };
    
    const { processCommand } = await import('./index.js');
    await processCommand(command, fakeCtx);
  }
  else if (topic === 'aegis/response') {
    const responseText = message.toString();
    try {
      await fetch(`https://platform-api2.max.ru/messages?chat_id=${lastChatId}`, {
        method: 'POST',
        headers: { 'Authorization': BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: lastChatId, text: String(responseText), format: 'markdown' })
      });
    } catch (error) {
      console.error('❌ Ошибка отправки Node-RED:', error.message);
    }
  }
});

setInterval(() => {
  if (mqttClient.connected) mqttClient.publish('aegis/status', 'online', { qos: 1, retain: true });
}, 60000);
