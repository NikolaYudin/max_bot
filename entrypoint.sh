#!/bin/sh
echo " Установка зависимостей..."
npm install
echo " Запуск бота..."
exec node index.js