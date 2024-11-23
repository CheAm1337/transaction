const axios = require('axios');
const Redis = require('ioredis');

const redis = new Redis ({
  host: 'redis',
  port: 6379
})


const url_EUR_USD = 'https://cash.rbc.ru/cash/json/converter_currency_rate/?currency_from=USD&currency_to=EUR&source=cash&sum=1&date=';
const url_RUB_USD = 'https://cash.rbc.ru/cash/json/converter_currency_rate/?currency_from=RUR&currency_to=USD&source=cash&sum=1&date=';
const url_EUR_RUB = 'https://cash.rbc.ru/cash/json/converter_currency_rate/?currency_from=EUR&currency_to=RUR&source=cash&sum=1&date=';
const fetchCurrencyRate = async () => {
    let USD_EUR, EUR_USD, RUB_USD, USD_RUB, EUR_RUB, RUB_EUR;

  try {
    const response = await axios.get(url_EUR_USD);
    USD_EUR = response.data.data.rate1
    EUR_USD = response.data.data.rate2

  } catch (error) {
    console.error('Error fetching data:', error);
  }

  try {
    const response = await axios.get(url_RUB_USD);
    RUB_USD = response.data.data.rate1
    USD_RUB = response.data.data.rate2

  } catch (error) {
    console.error('Error fetching data:', error);
  }

  try {
    const response = await axios.get(url_EUR_RUB);
    EUR_RUB = response.data.data.rate1
    RUB_EUR = response.data.data.rate2

  } catch (error) {
    console.error('Error fetching data:', error);
  }

  await redis.set('USD_EUR', USD_EUR);
  await redis.set('EUR_USD', EUR_USD);
  await redis.set('RUB_USD', RUB_USD);
  await redis.set('USD_RUB', USD_RUB);
  await redis.set('EUR_RUB', EUR_RUB);
  await redis.set('RUB_EUR', RUB_EUR);
  console.log('USD->EUR:', USD_EUR);
  console.log('EUR->USD:', EUR_USD);
  console.log('RUB->USD:', RUB_USD);
  console.log('USD->RUB:', USD_RUB);
  console.log('EUR->RUB:', EUR_RUB);
  console.log('RUB->EUR:', RUB_EUR);
  console.log('-----------------');
  
};

setInterval(fetchCurrencyRate, 5000);
