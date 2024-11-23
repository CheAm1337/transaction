const { Kafka } = require('kafkajs');
const fs = require('fs');
const path = require('path');

const kafka = new Kafka({
  clientId: 'log-service',
  brokers: ['kafka:9093'],
});

const consumer = kafka.consumer({ groupId: 'log-group' });

const logFilePath = path.join(__dirname, 'logs', 'kafka_messages.log');

if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

const logMessage = (topic, message) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    topic,
    message,
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  fs.appendFile(logFilePath, logLine, (err) => {
    if (err) {
      console.error('Ошибка записи в лог файл', err);
    } else {
      console.log(`Сообщение от ${topic}`);
    }
  });
};

const runKafkaConsumer = async () => {
  try {
    await consumer.connect();

    await consumer.subscribe({ topic: 'auth-responses' });
    await consumer.subscribe({ topic: 'auth-requests' });
    await consumer.subscribe({ topic: 'transfer-responses' });
    await consumer.subscribe({ topic: 'transfer-requests' });
    await consumer.subscribe({ topic: 'validation-responses' });
    await consumer.subscribe({ topic: 'validation-requests' });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const response = JSON.parse(message.value.toString());

          logMessage(topic, response);

          console.log(`Сообщение от ${topic}:`, response);
        } catch (err) {
          console.error('Ошибка при обработке сообщения:', err);
        }
      }
    });

  } catch (err) {
    console.error('Ошибка при запуске Kafka consumer:', err);
  }
};

runKafkaConsumer().catch(console.error);
