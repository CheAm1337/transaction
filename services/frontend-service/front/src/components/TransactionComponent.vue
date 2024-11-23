<template>
  <div class="transaction-container">
    <h1>Транзакция</h1>
    <form @submit.prevent="handleTransfer" class="form">
      <input
        type="text"
        v-model="transferForm.sender_account"
        placeholder="Ваш аккаунт"
        required
        class="input-field"
      />
      <input
        type="text"
        v-model="transferForm.recipient_account"
        placeholder="Аккаунт получателя"
        required
        class="input-field"
      />
      <input
        type="number"
        v-model="transferForm.amount"
        placeholder="Сумма"
        required
        class="input-field"
        min="1"
      />
      <button type="submit" class="submit-button">Отправить</button>
    </form>
    <div id="message-transfer" class="message-transfer">
      <transition name="fade">
        <p v-if="transferMessage">{{ transferMessage }}</p>
      </transition>
    </div>

    <h2>Курсы валют</h2>
    <div class="currency-rates">
      <p>USD → EUR: <span>{{ currencyRates.USD_EUR }}</span></p>
      <p>EUR → USD: <span>{{ currencyRates.EUR_USD }}</span></p>
      <p>RUB → USD: <span>{{ currencyRates.RUB_USD }}</span></p>
      <p>USD → RUB: <span>{{ currencyRates.USD_RUB }}</span></p>
      <p>EUR → RUB: <span>{{ currencyRates.EUR_RUB }}</span></p>
      <p>RUB → EUR: <span>{{ currencyRates.RUB_EUR }}</span></p>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from "vue";

export default {
  setup() {
    const transferForm = reactive({
      sender_account: "",
      recipient_account: "",
      amount: 0,
    });

    const transferMessage = ref("");

    const currencyRates = reactive({
      USD_EUR: null,
      EUR_USD: null,
      RUB_USD: null,
      USD_RUB: null,
      EUR_RUB: null,
      RUB_EUR: null,
    });

    const fetchCurrencyRates = async () => {
      try {
        const response = await fetch("http://localhost:8003/api/currency-rates");
        if (response.ok) {
          Object.assign(currencyRates, await response.json());
        } else {
          console.error("Не удалось загрузить курсы валют");
        }
      } catch (error) {
        console.error("Ошибка при загрузке курсов валют:", error);
      }
    };

    const handleTransfer = async () => {
      try {
        const response = await fetch("http://localhost:8003/api/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transferForm),
        });
        if (response.ok) {
          const data = await response.json();
          transferMessage.value = data.message || "Перевод выполнен успешно";
        } else {
          transferMessage.value = "Ошибка перевода";
        }
      } catch (error) {
        console.error("Произошла ошибка:", error);
        transferMessage.value = "Произошла ошибка";
      }
    };

    onMounted(() => {
      if (!localStorage.getItem("isLoggedIn")) {
        window.location.href = "/login";
      }
      fetchCurrencyRates();
      setInterval(fetchCurrencyRates, 5000);
    });

    return {
      transferForm,
      transferMessage,
      currencyRates,
      handleTransfer,
    };
  },
};
</script>

<style scoped>
.transaction-container {
  font-family: 'Arial', sans-serif;
  padding: 20px;
  background-color: #ffffff;
  max-width: 600px;
  margin: 20px auto;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 1.8rem;
  color: #333333;
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-field {
  padding: 10px 15px;
  border: 1px solid #cccccc;
  border-radius: 5px;
  font-size: 1rem;
}

.input-field:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

.submit-button {
  background-color: #007bff;
  color: #ffffff;
  padding: 10px 15px;
  font-size: 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: #0056b3;
}

.message-transfer {
  margin-top: 15px;
  font-size: 1.1rem;
  text-align: center;
}

.message-transfer p {
  color: #007bff;
}

.currency-rates {
  margin-top: 30px;
}

.currency-rates p {
  font-size: 1rem;
  margin: 5px 0;
}

.currency-rates span {
  font-weight: bold;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
