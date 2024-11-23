const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'validation-service',
  brokers: ['kafka:9093'],
});

const consumer = kafka.consumer({ groupId: 'validation-group' });
const producer = kafka.producer();

const run = async () => {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({ topic: 'validation-requests', fromBeginning: false });

  console.log('Validation service is running...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payment = JSON.parse(message.value.toString());
        const { payment_id, sender_account, recipient_account } = payment;

        const amount = Number(payment.amount);

        const errors = [];
        if (!sender_account || typeof sender_account !== 'string') errors.push('Неверный счёт отправителя');
        if (!recipient_account || typeof recipient_account !== 'string') errors.push('Неверный счёт получателя');
        if (isNaN(amount) || amount <= 0) errors.push('Сумма должна быть положительным числом');

        const response = {
          payment_id,
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : null,
        };

        await producer.send({
          topic: 'validation-responses',
          messages: [{ value: JSON.stringify(response) }],
        });

        console.log(`Результат проверки для платежа ${payment_id}:`, response);
      } catch (error) {
        console.error('Ошибка при обработке сообщения проверки:', error);
      }
    },
  });
};

run().catch((error) => console.error('Ошибка при запуске службы проверки:', error));
