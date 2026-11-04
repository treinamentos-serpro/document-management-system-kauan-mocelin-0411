// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const documentsRoutes = require('./routes/documents.routes');
const sendApiError = require('./utils/apiError');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de verificação de saúde.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rotas de documentos: /upload, /documents e /documents/:id/download.
app.use(documentsRoutes);

// Tratamento de erros no limite do sistema (uploads e falhas inesperadas).
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendApiError(res, 413, 'FILE_TOO_LARGE', 'O arquivo excede o limite permitido.');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendApiError(res, 400, 'UNEXPECTED_FILE_FIELD', 'Use somente um arquivo no campo "file".');
    }
    return sendApiError(res, 400, 'UPLOAD_FAILED', 'Falha ao processar o upload.');
  }
  console.error(err);
  if (req.path === '/upload') {
    return sendApiError(res, 500, 'UPLOAD_FAILED', 'Falha ao gravar o arquivo.');
  }
  return sendApiError(res, 500, 'INTERNAL_ERROR', 'Erro interno do servidor.');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
