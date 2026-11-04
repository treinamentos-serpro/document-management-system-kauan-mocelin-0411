// Repositório de documentos: metadados mantidos em memória nesta fase.

const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findAllByOwner(owner) {
  return Array.from(documents.values()).filter((document) => document.owner === owner);
}

function findByIdAndOwner(id, owner) {
  const document = documents.get(id);
  return document?.owner === owner ? document : null;
}

module.exports = { save, findAllByOwner, findByIdAndOwner };
