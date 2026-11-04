// Cliente de API para documentos: toda comunicação com o backend via fetch,
// usando o prefixo /api (proxy configurado no Vite).

const API_BASE = '/api';

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data?.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);
  if (owner) {
    formData.append('owner', owner);
  }

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Falha ao enviar o documento.'));
  }

  return response.json();
}

export async function listDocuments() {
  const response = await fetch(`${API_BASE}/documents`);

  if (!response.ok) {
    throw new Error(await parseError(response, 'Falha ao listar os documentos.'));
  }

  return response.json();
}

export async function downloadDocument(id, fileName) {
  const response = await fetch(`${API_BASE}/documents/${id}/download`);

  if (!response.ok) {
    throw new Error(await parseError(response, 'Falha ao baixar o documento.'));
  }

  // Cria um link temporário para disparar o download no navegador.
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
