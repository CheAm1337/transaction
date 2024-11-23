# Этап 1: Используем базовый образ для Node.js
FROM node:20 AS production-stage

# Рабочая директория для сервера
WORKDIR /app

# Копируем скомпилированную папку dist из локальной директории front в контейнер
COPY front/dist /app/dist

# Копируем server.js для Express
COPY server.js /app/server.js

# Копируем package.json для установки зависимостей Express
COPY front/package*.json ./
RUN npm install --production

# Открываем порт для работы
EXPOSE 8080

# Запускаем сервер
CMD ["node", "server.js"]
