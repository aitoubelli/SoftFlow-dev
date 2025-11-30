const express = require('express');
const router = express.Router();
const documentationController = require('../controllers/documentation.controller');
const { protect, adminOrOwnerOnly } = require('../middleware/auth.middleware'); // Corrected import path

router.post('/', protect, adminOrOwnerOnly, documentationController.createDocumentation);
router.get('/project/:projectId', protect, documentationController.getDocumentationByProject);
router.put('/:id', protect, adminOrOwnerOnly, documentationController.updateDocumentation);

module.exports = router;
