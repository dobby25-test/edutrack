module.exports = async (req, res) => {
  const isHealthCheck = req.url === '/api/health' || req.url?.startsWith('/api/health?');

  if (isHealthCheck) {
    return res.status(200).json({
      success: true,
      message: 'EduTrack API is running',
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'unknown'
    });
  }

  try {
    const { app, ensureDatabaseReady } = require('../app');
    await ensureDatabaseReady();
    return app(req, res);
  } catch (error) {
    console.error('Serverless startup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Backend failed to initialize',
      error: error.message
    });
  }
};
