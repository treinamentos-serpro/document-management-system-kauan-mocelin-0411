import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentsApi';

// Componente raiz: monta a interface de upload, listagem e download.
export default function App() {
  const [documents, setDocuments] = useState([]);
  const [userId, setUserId] = useState('anonymous');
  const [userIdInput, setUserIdInput] = useState('anonymous');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDocuments(await listDocuments(userId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  function handleUserSubmit(event) {
    event.preventDefault();
    const nextUserId = userIdInput.trim();
    if (nextUserId) {
      setUserId(nextUserId);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>
      <form onSubmit={handleUserSubmit}>
        <label htmlFor="user-id">Identificador do usuário</label>
        <input
          id="user-id"
          type="text"
          required
          value={userIdInput}
          onChange={(event) => setUserIdInput(event.target.value)}
        />
        <button type="submit">Selecionar usuário</button>
      </form>
      <UploadComponent userId={userId} onUploadSuccess={loadDocuments} />
      <section style={{ marginTop: '2rem' }}>
        <h2>Documentos</h2>
        <DocumentList documents={documents} isLoading={isLoading} error={error} userId={userId} />
      </section>
    </main>
  );
}
