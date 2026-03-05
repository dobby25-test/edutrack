const { app, ensureDatabaseReady } = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await ensureDatabaseReady();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
