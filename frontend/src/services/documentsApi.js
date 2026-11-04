// Cliente de API para documentos: toda comunicação com o backend via fetch,
// usando o prefixo /api (proxy configurado no Vite).

const API_BASE = '/api';

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data?.error?.message || data?.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function userHeaders(userId) {
  return { 'X-User-Id': userId };
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);
  if (owner) {
    formData.append('owner', owner);
  }

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: userHeaders(userId),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Falha ao enviar o documento.'));
  }

  return response.json();
}

export async function listDocuments(userId) {
  const response = await fetch(`${API_BASE}/documents`, {
    headers: userHeaders(userId),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Falha ao listar os documentos.'));
  }

  const data = await response.json();
  return data.documents;
}

export async function downloadDocument(id, fileName, userId) {
  const response = await fetch(`${API_BASE}/documents/${id}/download`, {
    headers: userHeaders(userId),
  });

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
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
