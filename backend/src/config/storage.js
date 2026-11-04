const fs = require('node:fs');
const path = require('node:path');

const STORAGE_DIR = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '..', '..', 'storage'),
);
const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_BYTES || 10485760);

if (!Number.isSafeInteger(MAX_FILE_SIZE_BYTES) || MAX_FILE_SIZE_BYTES <= 0) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

fs.mkdirSync(STORAGE_DIR, { recursive: true });

module.exports = { STORAGE_DIR, MAX_FILE_SIZE_BYTES };