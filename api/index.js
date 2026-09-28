const express = require('express');
const path = require('path');

const app = express();

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: Date.now(),
    name: 'UNO With Friends & Bots (Vercel Serverless)'
  });
});

// Catch-all SPA route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
