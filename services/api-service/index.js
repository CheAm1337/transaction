const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');

const app = express();
const PORT = 8003;

const redis = new Redis({
  host: 'redis',
  port: 6379,
});

app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

const kafka = new Kafka({
  clientId: 'api-service',
  brokers: ['kafka:9093'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'api-group' });

const runKafkaConsumer = async () => {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'auth-responses' });
  await consumer.subscribe({ topic: 'validation-responses' });
  await consumer.subscribe({ topic: 'transfer-responses' });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const response = JSON.parse(message.value.toString());
      const { payment_id } = response;
      if (payment_id) {
        await redis.set(payment_id, JSON.stringify(response), 'EX', 30);
      }
    }
  });
};

runKafkaConsumer().catch(console.error);

const waitForResponse = async (payment_id, timeout = 10000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const response = await redis.get(payment_id);
    if (response) {
      await redis.del(payment_id);
      return JSON.parse(response);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Тайм-аут ответа');
};

app.post('/api/auth', async (req, res) => {
  const { username, password } = req.body;
  const payment_id = `${Date.now()}-${Math.random()}`;
  try {
    await producer.send({
      topic: 'auth-requests',
      messages: [{ value: JSON.stringify({ payment_id, username, password }) }],
    });
    const authResponse = await waitForResponse(payment_id);
    if (authResponse.status === 'success') {
      res.status(200).json({ message: authResponse.message });
    } else {
      res.status(401).json({ message: authResponse.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Тайм-аут авторизации' });
  }
});

app.post('/api/transfer', async (req, res) => {
  const { sender_account, recipient_account, amount } = req.body;
  const payment_id = `${Date.now()}-${Math.random()}`;
  try {
    await producer.send({
      topic: 'validation-requests',
      messages: [{ value: JSON.stringify({ payment_id, sender_account, recipient_account, amount }) }],
    });
    const validationResult = await waitForResponse(payment_id);
    if (validationResult.valid) {
      await producer.send({
        topic: 'transfer-requests',
        messages: [{ value: JSON.stringify({ payment_id, sender_account, recipient_account, amount }) }],
      });
      const transferResult = await waitForResponse(payment_id);
      if (transferResult.status === 'success') {
        res.status(200).json({ message: transferResult.message });
      } else {
        res.status(400).json({ message: transferResult.message });
      }
    } else {
      res.status(400).json({ message: 'Ошибка валидации' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

app.get('/api/currency-rates', async (req, res) => {
  try {
    const rates = await Promise.all([
      redis.get('USD_EUR'),
      redis.get('EUR_USD'),
      redis.get('RUB_USD'),
      redis.get('USD_RUB'),
      redis.get('EUR_RUB'),
      redis.get('RUB_EUR'),
    ]);
    res.status(200).json({
      USD_EUR: rates[0],
      EUR_USD: rates[1],
      RUB_USD: rates[2],
      USD_RUB: rates[3],
      EUR_RUB: rates[4],
      RUB_EUR: rates[5],
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении курсов валют' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервис API запущен на http://localhost:${PORT}`);
});
