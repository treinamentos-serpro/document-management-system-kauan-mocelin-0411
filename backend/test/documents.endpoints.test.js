// Testes dos fluxos principais dos endpoints de upload, listagem e download.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-endpoints-test-'));
process.env.STORAGE_DIR = storageDirectory;

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await fs.promises.rm(storageDirectory, { recursive: true, force: true });
});

function createUploadForm(contents, fileName) {
  const form = new FormData();
  form.append('file', new Blob([contents]), fileName);
  return form;
}

async function uploadDocument(contents, fileName, userId) {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: createUploadForm(contents, fileName),
  });
  return response;
}

test('POST /upload grava o arquivo e retorna os metadados públicos', async () => {
  const contents = 'conteúdo do relatório';
  const response = await uploadDocument(contents, 'relatorio.txt', 'alice');

  assert.equal(response.status, 201);
  const document = await response.json();

  assert.ok(document.id);
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.size, Buffer.byteLength(contents));
  assert.equal(document.owner, 'alice');
  assert.ok(!Number.isNaN(Date.parse(document.uploadedAt)));

  // Não expõe detalhes internos de armazenamento.
  assert.equal('path' in document, false);
  assert.equal('storedName' in document, false);

  // O arquivo foi gravado no diretório de armazenamento local.
  const storedFiles = await fs.promises.readdir(storageDirectory);
  assert.equal(storedFiles.length >= 1, true);
});

test('GET /documents lista somente os documentos do usuário com campos públicos', async () => {
  const first = await (await uploadDocument('primeiro', 'primeiro.txt', 'carol')).json();
  const second = await (await uploadDocument('segundo', 'segundo.txt', 'carol')).json();

  const response = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'carol' },
  });

  assert.equal(response.status, 200);
  const { documents } = await response.json();

  const ids = documents.map((document) => document.id);
  assert.ok(ids.includes(first.id));
  assert.ok(ids.includes(second.id));

  for (const document of documents) {
    assert.ok(document.id);
    assert.ok(document.originalName);
    assert.equal(typeof document.size, 'number');
    assert.equal(document.owner, 'carol');
    assert.ok(document.uploadedAt);
    assert.equal('path' in document, false);
    assert.equal('storedName' in document, false);
  }
});

test('GET /documents/:id/download devolve o conteúdo original do arquivo', async () => {
  const contents = 'conteúdo para download';
  const created = await (await uploadDocument(contents, 'baixar.txt', 'dave')).json();

  const response = await fetch(`${baseUrl}/documents/${created.id}/download`, {
    headers: { 'X-User-Id': 'dave' },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /attachment/);
  assert.match(response.headers.get('content-disposition'), /baixar\.txt/);
  assert.equal(await response.text(), contents);
});

test('GET /documents/:id/download responde 404 para documento inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`, {
    headers: { 'X-User-Id': 'dave' },
  });

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
