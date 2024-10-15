const express = require('express');
const RateLimit = require('express-rate-limit');
const db = require('./database'); // Подключение к базе данных
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http); // Подключаем socket.io
const RateLimit = require('express-rate-limit');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));

// Set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
});

// Apply rate limiter to all requests
app.use(limiter);

app.use(express.static(path.join(__dirname, 'public')));

// Set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
});

// Основной маршрут для отображения главной страницы dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});


// Маршрут для отображения логов
app.get('/logs', limiter, (req, res) => {
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
