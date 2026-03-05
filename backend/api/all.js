module.exports = async (req, res) => {
  try {
    const { app, ensureDatabaseReady } = require('../app');
    const isHealthCheck = req.url === '/api/health' || req.url?.startsWith('/api/health?');

    if (!isHealthCheck) {
      await ensureDatabaseReady();
    }

    return app(req, res);
  } catch (error) {
    console.error('Serverless startup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Backend failed to initialize',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};
