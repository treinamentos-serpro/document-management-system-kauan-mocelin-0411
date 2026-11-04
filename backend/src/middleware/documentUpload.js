const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { STORAGE_DIR, MAX_FILE_SIZE_BYTES } = require('../config/storage');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, STORAGE_DIR);
  },
  filename: (req, file, callback) => {
    const storedName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    callback(null, storedName);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});