const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_BYTES = '32';

const app = require('../src/app');
const documentsService = require('../src/services/documents.service');

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

function createUploadForm(contents = 'document content', fieldName = 'file') {
  const form = new FormData();
  form.append(fieldName, new Blob([contents]), 'document.txt');
  return form;
}

test('exige X-User-Id nas operações de documentos', async () => {
  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 400);
  assert.deepEqual(await listResponse.json(), {
    error: { code: 'USER_ID_REQUIRED', message: 'O cabeçalho X-User-Id é obrigatório.' },
  });

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm(),
  });
  assert.equal(uploadResponse.status, 400);
  assert.equal((await uploadResponse.json()).error.code, 'USER_ID_REQUIRED');
});

test('restringe listagem e download ao dono informado', async () => {
  const form = createUploadForm('alice document');
  form.append('owner', 'bob');
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: form,
  });
  assert.equal(response.status, 201);

  const createdDocument = await response.json();
  assert.equal(createdDocument.owner, 'alice');
  assert.equal('path' in createdDocument, false);
  assert.equal('storedName' in createdDocument, false);

  const aliceList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.deepEqual((await aliceList.json()).documents.map((document) => document.id), [createdDocument.id]);

  const bobList = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'bob' },
  });
  assert.deepEqual((await bobList.json()).documents, []);

  const deniedDownload = await fetch(`${baseUrl}/documents/${createdDocument.id}/download`, {
    headers: { 'X-User-Id': 'bob' },
  });
  assert.equal(deniedDownload.status, 404);
  assert.equal((await deniedDownload.json()).error.code, 'DOCUMENT_NOT_FOUND');

  const allowedDownload = await fetch(`${baseUrl}/documents/${createdDocument.id}/download`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.equal(allowedDownload.status, 200);
  assert.match(allowedDownload.headers.get('content-disposition'), /attachment/);
  assert.equal(await allowedDownload.text(), 'alice document');
});

test('rejeita arquivo ausente, campo inesperado e arquivo acima do limite', async () => {
  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: new FormData(),
  });
  assert.equal(missingFile.status, 400);
  assert.equal((await missingFile.json()).error.code, 'FILE_REQUIRED');

  const unexpectedField = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: createUploadForm('content', 'unexpected'),
  });
  assert.equal(unexpectedField.status, 400);
  assert.equal((await unexpectedField.json()).error.code, 'UNEXPECTED_FILE_FIELD');

  const oversizedFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: createUploadForm('x'.repeat(33)),
  });
  assert.equal(oversizedFile.status, 413);
  assert.equal((await oversizedFile.json()).error.code, 'FILE_TOO_LARGE');
});

test('responde 404 quando o arquivo físico não está disponível', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: createUploadForm('to be removed'),
  });
  const createdDocument = await response.json();
  const storedDocument = documentsService.getDocumentById(createdDocument.id, 'alice');
  await fs.promises.unlink(storedDocument.path);

  const download = await fetch(`${baseUrl}/documents/${createdDocument.id}/download`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.equal(download.status, 404);
  assert.equal((await download.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
