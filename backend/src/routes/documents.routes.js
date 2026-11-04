// Rotas de documentos: definem os endpoints e delegam aos controllers.

const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const STORAGE_DIR = path.join(__dirname, '..', '..', 'storage');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (req, file, cb) => {
    // Nome único no disco para evitar colisões; o nome original fica nos metadados.
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

const router = express.Router();

router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', documentsController.downloadDocument);

module.exports = router;
