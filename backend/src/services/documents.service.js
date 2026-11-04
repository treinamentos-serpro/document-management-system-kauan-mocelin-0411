// Regras de negócio relacionadas a documentos.

const crypto = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');

function createDocument({ originalName, storedName, size, path, owner }) {
  const document = {
    id: crypto.randomUUID(),
    originalName,
    storedName,
    size,
    path,
    owner: owner || 'anonymous',
    uploadedAt: new Date().toISOString(),
  };

  return documentsRepository.save(document);
}

function listDocuments() {
  // Não expõe o caminho físico do arquivo na listagem.
  return documentsRepository.findAll().map(({ path, storedName, ...publicData }) => publicData);
}

function getDocumentById(id) {
  return documentsRepository.findById(id);
}

module.exports = { createDocument, listDocuments, getDocumentById };
