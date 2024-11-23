const { Pool } = require('pg');
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');

const pool = new Pool({ 
  user: 'admin',
  host: 'postgres_db',
  database: 'main_db',
  password: 'admin',
  port: 5432,
});

const kafka = new Kafka({
  clientId: 'transaction-service',
  brokers: ['kafka:9093'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'transfer-group' });

const redis = new Redis({
  host: 'redis',
  port: 6379
});

const getCurrencyRate = async (fromCurrency, toCurrency) => {
  const rateKey = `${fromCurrency}_${toCurrency}`;
  const rate = await redis.get(rateKey);
  if (!rate) {
    throw new Error(`Курс валют ${fromCurrency} -> ${toCurrency} не найден`);
  }
  return parseFloat(rate);
};

const getCurrencyNameById = async (currencyId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT currency_name FROM currencies WHERE currency_id = $1',
      [currencyId]
    );
    if (result.rowCount === 0) {
      throw new Error('Валюта не найдена');
    }
    return result.rows[0].currency_name;
  } finally {
    client.release();
  }
};

const run = async () => {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'transfer-requests' });

  await consumer.run({
    eachMessage: async ({ message }) => {
      let client;
      const { payment_id, sender_account, recipient_account, amount } = JSON.parse(message.value.toString());

      try {
        client = await pool.connect();

        const senderCheck = await client.query(
          'SELECT balance, currency_id FROM accounts WHERE account_number = $1',
          [sender_account]
        );
        const recipientCheck = await client.query(
          'SELECT currency_id FROM accounts WHERE account_number = $1',
          [recipient_account]
        );

        if (!senderCheck.rowCount) throw new Error('Счёт отправителя не существует');
        if (!recipientCheck.rowCount) throw new Error('Счёт получателя не существует');
        if (senderCheck.rows[0].balance < amount) throw new Error('Недостаточно средств');

        const senderCurrency = senderCheck.rows[0].currency_id;
        const recipientCurrency = recipientCheck.rows[0].currency_id;

        let finalAmount = amount;

        if (senderCurrency !== recipientCurrency) {
          const fromCurrency = await getCurrencyNameById(senderCurrency);
          const toCurrency = await getCurrencyNameById(recipientCurrency);

          const rate = await getCurrencyRate(fromCurrency, toCurrency);
          finalAmount = amount * rate;
        }

        await client.query('BEGIN');
        await client.query('UPDATE accounts SET balance = balance - $1 WHERE account_number = $2', [amount, sender_account]);
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE account_number = $2', [finalAmount, recipient_account]);
        await client.query('COMMIT');

        await producer.send({
          topic: 'transfer-responses',
          messages: [
            { value: JSON.stringify({ payment_id, status: 'success', message: 'Перевод успешен' }) },
          ],
        });
      } catch (error) {
        if (client) await client.query('ROLLBACK');
        await producer.send({
          topic: 'transfer-responses',
          messages: [
            { value: JSON.stringify({ payment_id, status: 'error', message: error.message }) },
          ],
        });
      } finally {
        if (client) client.release();
      }
    },
  });
};

run().catch(console.error);
