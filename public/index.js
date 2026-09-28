const express = require('express');
const path = require('path');

const app = express();

// Serve static assets from the current directory (public)
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: Date.now(),
    deployment: 'Vercel Serverless (Public Directory)',
    mode: 'Hybrid (WebSockets + In-Browser Engine)'
  });
});

// Single Page Application catch-all route (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = app;
