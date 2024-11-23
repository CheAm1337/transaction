const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { Kafka } = require('kafkajs');

const app = express();
const pool = new Pool({
  user: 'admin',
  host: 'postgres_db',
  database: 'main_db',
  password: 'admin',
  port: 5432,
});

const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: ['kafka:9093']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'auth-group' });

const run = async () => {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'auth-requests' });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { payment_id, username, password } = JSON.parse(message.value.toString());
      try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        let responseMessage;
        if (result.rows.length > 0) {
          const isMatch = await bcrypt.compare(password, result.rows[0].password);
          responseMessage = JSON.stringify({
            payment_id,
            status: isMatch ? 'success' : 'failure',
            message: isMatch ? 'Вход выполнен успешно' : 'Неверный пароль',
          });
        } else {
          responseMessage = JSON.stringify({
            payment_id,
            status: 'failure',
            message: 'Пользователь не найден',
          });
        }
        await producer.send({
          topic: 'auth-responses',
          messages: [{ value: responseMessage }],
        });
      } catch {
        await producer.send({
          topic: 'auth-responses',
          messages: [{ value: JSON.stringify({ payment_id, status: 'failure', message: 'Ошибка' }) }],
        });
      }
    }
  });
};

run().catch(console.error);

app.get('/status', (req, res) => {
  res.status(200).send({ status: 'Сервис авторизации запущен' });
});

app.listen(8001, () => {
  console.log('Сервис авторизации запущен на порту 8001');
});
