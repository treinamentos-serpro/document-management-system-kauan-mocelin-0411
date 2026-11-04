// Rotas de documentos: definem os endpoints e delegam aos controllers.

const express = require('express');
const documentsController = require('../controllers/documents.controller');
const requireUserId = require('../middleware/requireUserId');
const upload = require('../middleware/documentUpload');

const router = express.Router();

router.post('/upload', requireUserId, upload.single('file'), documentsController.uploadDocument);
router.get('/documents', requireUserId, documentsController.listDocuments);
router.get('/documents/:id/download', requireUserId, documentsController.downloadDocument);

module.exports = router;
