const express = require('express');
const path = require('path');
const app = express();

// Раздача собранных файлов Vue из папки `/app/dist` внутри контейнера
app.use(express.static(path.join(__dirname, 'dist')));

// Для работы с Vue Router (если используется history mode)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
