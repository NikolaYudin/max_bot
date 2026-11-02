// === ГЛАВНОЕ МЕНЮ (4 комнаты) ===
export const mainKeyboard = {
  type: 'inline_keyboard',
  payload: {
    buttons: [
      [
        { type: 'callback', text: '🚪', payload: 'room_corridor' },
        { type: 'callback', text: '🛁', payload: 'room_bathroom' },
        { type: 'callback', text: '🍳', payload: 'room_kitchen' },
        { type: 'callback', text: '🛏️', payload: 'room_bedroom' }
      ]
    ]
  }
};

// === ВАННАЯ КОМНАТА ===
export const bathroomKeyboard = {
  type: 'inline_keyboard',
  payload: {
    buttons: [
      [
        { type: 'callback', text: '⬅️ Назад', payload: 'back_to_main' },
        { type: 'callback', text: '💨 Вытяжка', payload: 'bathroom_fan' }
      ]
    ]
  }
};

// === КОРИДОР ===
export const corridorKeyboard = {
  type: 'inline_keyboard',
  payload: {
    buttons: [
      [
        { type: 'callback', text: '⬅️ Назад', payload: 'back_to_main' },
        { type: 'callback', text: '💡 Свет', payload: 'corridor_light' }
      ]
    ]
  }
};

// === КУХНЯ ===
export const kitchenKeyboard = {
  type: 'inline_keyboard',
  payload: {
    buttons: [
      [
        { type: 'callback', text: '⬅️ Назад', payload: 'back_to_main' },
        { type: 'callback', text: '💡 Свет', payload: 'kitchen_light' }
      ]
    ]
  }
};

// === СПАЛЬНЯ ===
export const bedroomKeyboard = {
  type: 'inline_keyboard',
  payload: {
    buttons: [
      [
        { type: 'callback', text: '⬅️ Назад', payload: 'back_to_main' },
        { type: 'callback', text: '💡 Свет', payload: 'bedroom_light' }
      ]
    ]
  }
};