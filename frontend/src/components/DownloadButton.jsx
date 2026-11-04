import { useState } from 'react';
import { downloadDocument } from '../services/documentsApi';

// Botão que baixa um documento pelo id, usando o nome original do arquivo.
export default function DownloadButton({ documentId, fileName, userId }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadDocument(documentId, fileName, userId);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button type="button" onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
