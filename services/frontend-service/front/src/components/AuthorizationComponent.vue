<template>
  <div class="login-container">
    <h1>Вход в систему</h1>
    <form @submit.prevent="handleLogin">
      <input
        type="text"
        v-model="loginForm.username"
        placeholder="Имя пользователя"
        required
      />
      <input
        type="password"
        v-model="loginForm.password"
        placeholder="Пароль"
        required
      />
      <button type="submit">Войти</button>
    </form>
    <div id="message-login">{{ loginMessage }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loginForm: {
        username: "",
        password: "",
      },
      loginMessage: "",
    };
  },
  methods: {
    async handleLogin() {
      try {
        const response = await fetch("http://localhost:8003/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.loginForm),
        });

        if (response.ok) {
          const data = await response.json();
          this.loginMessage = data.message || "Вход выполнен успешно";
          localStorage.setItem("isLoggedIn", true);
          this.$router.push({ name: "Transaction" });
        } else {
          const data = await response.json();
          this.loginMessage = "Ошибка авторизации: " + data.message;
        }
      } catch (error) {
        console.error("Ошибка:", error);
        this.loginMessage = "Ошибка при подключении";
      }
    },
  },
};
</script>

<style scoped>
body {
  font-family: "Arial", sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background-color: #eef2f3;
}

.login-container {
  background: #ffffff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 300px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
}

form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

input {
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

button {
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: #4caf50;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}

button:hover {
  background: #43a047;
}

#message-login {
  margin-top: 15px;
  font-size: 14px;
  color: red;
}
</style>
