const express = require('express');
const path = require('path');

const app = express();

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: Date.now(),
    deployment: 'Vercel Serverless (Root Directory)',
    mode: 'Hybrid (WebSockets + In-Browser Engine)'
  });
});

// Single Page Application catch-all route (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
