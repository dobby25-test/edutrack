const express = require('express');
const router = express.Router();

const { bulkImportUsers, downloadTemplate } = require('../controllers/bulkImportBackend');
const { authenticateToken, checkRole } = require('../middleware/auth');

router.post('/import-users', authenticateToken, checkRole('director'), bulkImportUsers);
router.get('/template', authenticateToken, checkRole('director'), downloadTemplate);

module.exports = router;
