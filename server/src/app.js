const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const entriesRoutes = require('./routes/entries.routes');
const remindersRoutes = require('./routes/reminders.routes');
const notesRoutes = require('./routes/notes.routes');
const analyzeRoutes = require('./routes/analyze.routes');
const weatherRoutes = require('./routes/weather.routes');
const calendarRoutes = require('./routes/calendar.routes');
const newsRoutes = require('./routes/news.routes');
const quotesRoutes = require('./routes/quotes.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/entries', entriesRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/quotes', quotesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;