const { app, ensureDatabaseReady } = require('../app');

module.exports = async (req, res) => {
  try {
    await ensureDatabaseReady();
    return app(req, res);
  } catch (error) {
    console.error('Serverless startup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Backend failed to initialize'
    });
  }
};
