import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentsApi';

// Formulário de upload de documentos. Notifica o componente pai após o envio
// para que a listagem seja atualizada.
export default function UploadComponent({ userId, onUploadSuccess }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadDocument(file, userId);
      fileInputRef.current.value = '';
      await onUploadSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section>
      <h2>Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.5rem' }}>
          <input ref={fileInputRef} type="file" aria-label="Arquivo" />
        </div>
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </section>
  );
}
