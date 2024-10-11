const express = require('express');
const db = require('./database'); // Подключение к базе данных
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http); // Подключаем socket.io

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));


app.use(express.static(path.join(__dirname, 'public')));

// Основной маршрут для отображения главной страницы dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});


// Маршрут для отображения логов
app.get('/logs', (req, res) => {
    db.all('SELECT * FROM logs ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) {
            res.status(500).send('Ошибка при получении данных из базы');
            return;
        }
        
        const logs = rows.map(log => {
            const logDate = new Date(log.timestamp);
            const formattedDate = logDate.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            return {
                ...log,
                formattedDate,
            };
        });

        res.render('logs', { logs });
    });
});

db.on('log_added', (newLog) => {
    io.emit('log_update', newLog);
});

module.exports = app;
