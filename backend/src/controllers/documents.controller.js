// Controller de documentos: trata entrada/saída HTTP e validação básica.

const documentsService = require('../services/documents.service');
const sendApiError = require('../utils/apiError');

async function uploadDocument(req, res, next) {
  if (!req.file) {
    return sendApiError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  try {
    const document = await documentsService.createDocument({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      path: req.file.path,
      owner: req.userId,
    });

    const { path, storedName, ...publicData } = document;
    return res.status(201).json(publicData);
  } catch (error) {
    return next(error);
  }
}

function listDocuments(req, res) {
  return res.json({ documents: documentsService.listDocuments(req.userId) });
}

function downloadDocument(req, res) {
  const document = documentsService.getDocumentById(req.params.id, req.userId);

  if (!document) {
    return sendApiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return res.download(document.path, document.originalName, (err) => {
    if (!err && !res.headersSent) {
      return;
    }
    if (res.headersSent) return;
    if (err.code === 'ENOENT') {
      return sendApiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }
    return sendApiError(res, 500, 'DOWNLOAD_FAILED', 'Falha ao baixar o arquivo.');
  });
}

module.exports = { uploadDocument, listDocuments, downloadDocument };
