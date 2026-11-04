// Regras de negócio relacionadas a documentos.

const crypto = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');
const fileStorageRepository = require('../repositories/fileStorage.repository');

async function createDocument({ originalName, storedName, size, path, owner }) {
  const document = {
    id: crypto.randomUUID(),
    originalName,
    storedName,
    size,
    path,
    owner,
    uploadedAt: new Date().toISOString(),
  };

  try {
    return documentsRepository.save(document);
  } catch (error) {
    await fileStorageRepository.remove(path);
    throw error;
  }
}

function listDocuments(owner) {
  // Não expõe o caminho físico do arquivo na listagem.
  return documentsRepository.findAllByOwner(owner)
    .map(({ path, storedName, ...publicData }) => publicData);
}

function getDocumentById(id, owner) {
  return documentsRepository.findByIdAndOwner(id, owner);
}

module.exports = { createDocument, listDocuments, getDocumentById };
