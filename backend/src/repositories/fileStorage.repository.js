const fs = require('node:fs');
const path = require('node:path');
const { STORAGE_DIR } = require('../config/storage');

async function remove(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(`${STORAGE_DIR}${path.sep}`)) {
    throw new Error('O arquivo está fora do diretório de armazenamento.');
  }
  await fs.promises.unlink(resolvedPath);
}

module.exports = { remove };