import DownloadButton from './DownloadButton';

// Formata o tamanho do arquivo em unidades legíveis.
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString('pt-BR');
}

// Lista os documentos recebidos via props, com botão de download por item.
export default function DocumentList({ documents, isLoading, error }) {
  if (isLoading) {
    return <p>Carregando documentos...</p>;
  }

  if (error) {
    return <p style={{ color: 'crimson' }}>{error}</p>;
  }

  if (documents.length === 0) {
    return <p>Nenhum documento enviado ainda.</p>;
  }

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Nome</th>
          <th style={{ textAlign: 'left' }}>Tamanho</th>
          <th style={{ textAlign: 'left' }}>Dono</th>
          <th style={{ textAlign: 'left' }}>Enviado em</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id}>
            <td>{doc.originalName}</td>
            <td>{formatSize(doc.size)}</td>
            <td>{doc.owner}</td>
            <td>{formatDate(doc.uploadedAt)}</td>
            <td>
              <DownloadButton documentId={doc.id} fileName={doc.originalName} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
