const app = require('./app');

const PORT = Number(process.env.PORT) || 4000;

const server = app.listen(PORT, () => {
  console.log(`[solanium] backend listening on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[solanium] SIGTERM — closing');
  server.close(() => process.exit(0));
});
