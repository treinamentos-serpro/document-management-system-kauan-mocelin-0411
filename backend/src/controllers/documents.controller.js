// Controller de documentos: trata entrada/saída HTTP e validação básica.

const documentsService = require('../services/documents.service');

function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado. Use o campo "file".' });
  }

  const document = documentsService.createDocument({
    originalName: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    path: req.file.path,
    owner: req.body?.owner,
  });

  const { path, storedName, ...publicData } = document;
  return res.status(201).json(publicData);
}

function listDocuments(req, res) {
  return res.json(documentsService.listDocuments());
}

function downloadDocument(req, res) {
  const document = documentsService.getDocumentById(req.params.id);

  if (!document) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  return res.download(document.path, document.originalName, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Falha ao baixar o arquivo.' });
    }
  });
}

module.exports = { uploadDocument, listDocuments, downloadDocument };
