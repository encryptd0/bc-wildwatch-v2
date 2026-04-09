require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

const { sessionLocals } = require('./middleware/auth');
const { connectDB } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
    },
  },
}));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Attach session user to all views
app.use(sessionLocals);

// MongoDB connection (lazy, awaited per-request in controllers)
connectDB().catch(err => console.error('Initial DB connect error:', err));

// Home redirect
app.get('/', (req, res) => {
  res.redirect('/home');
});

// Routes
app.use('/login', require('./routes/auth'));
app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/incidents'));
app.use('/admin', require('./routes/admin'));
app.use('/chatbot', require('./routes/chatbot'));
app.use('/feed',    require('./routes/feed'));
app.use('/qr', require('./routes/qr'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found' });
});

// 500 handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: '500 - Server Error', error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 BC WildWatch running on http://localhost:${PORT}`);
  });
}

module.exports = app;
