import { callHaService, sendSafeReply } from '../connect.js';
import { bathroomKeyboard } from '../keyboards.js';

export async function handleBathroomCommand(command, ctx) {
  if (command === 'bathroom_fan') {
    const success = await callHaService('fan', 'toggle', 'fan.bathroom_fan');
    await sendSafeReply(ctx, success ? ' Вытяжка переключена!' : '❌ Ошибка управления вытяжкой.', bathroomKeyboard);
  }
  else {
    await sendSafeReply(ctx, ' Неизвестная команда для ванной.', bathroomKeyboard);
  }
}
