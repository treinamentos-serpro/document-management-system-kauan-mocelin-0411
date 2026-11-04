# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para que usuários enviem, consultem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário informado na requisição.
- Download de um documento pelo identificador, limitado ao usuário associado.
- Interface React para upload, listagem e download.
- Identificação simples do usuário por contexto enviado na requisição, sem autenticação nesta fase.
- Armazenamento de arquivos em disco local por meio de `multer` com `diskStorage`.
- Armazenamento temporário dos metadados em memória.

### Fora do escopo

- Autenticação, cadastro ou administração de usuários.
- Armazenamento em nuvem, banco de dados ou provedores externos.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Pesquisa avançada, pastas e permissões configuráveis.
- Garantia de persistência dos metadados após reiniciar o processo.
- Varredura antivírus ou validação profunda do conteúdo dos arquivos.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | A aplicação deve receber um identificador de usuário nas operações de documentos. | As rotas de upload, listagem e download exigem `X-User-Id` não vazio. A identidade é tratada como contexto informado pelo cliente, não como prova de autenticação. |
| RF-02 | O usuário pode enviar um documento. | `POST /upload` recebe um único arquivo no campo `file`, grava-o no armazenamento local e retorna seus metadados com identificador único. |
| RF-03 | O sistema deve registrar os metadados do documento. | O registro inclui identificador, nome original, tamanho em bytes, data/hora de upload e dono. |
| RF-04 | O usuário pode listar seus documentos. | `GET /documents` retorna apenas documentos cujo dono corresponde ao `X-User-Id`; sem documentos, retorna uma lista vazia. |
| RF-05 | O usuário pode baixar um documento pelo identificador. | `GET /documents/:id/download` transmite o arquivo como anexo somente quando o documento pertence ao usuário informado. |
| RF-06 | O sistema deve rejeitar requisições inválidas de upload. | Campo de arquivo ausente, campo inesperado ou limite de tamanho excedido resulta em erro HTTP documentado, sem registrar metadados incompletos. |
| RF-07 | A interface deve permitir o envio de um documento e apresentar o resultado. | A interface envia o arquivo selecionado, informa sucesso ou erro e atualiza a listagem após um envio bem-sucedido. |
| RF-08 | A interface deve apresentar os documentos do usuário e permitir baixá-los. | A lista exibe nome, tamanho e data de envio; cada item oferece uma ação de download. Estados vazios e erros de comunicação são apresentados. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados no filesystem local com `multer` configurado com `diskStorage`; não usar armazenamento externo. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. Uma reinicialização pode tornar os metadados indisponíveis mesmo que os arquivos continuem no disco. |
| RNF-03 | O diretório de armazenamento e o limite de tamanho devem ser configuráveis por variáveis de ambiente. |
| RNF-04 | O diretório padrão de armazenamento é `backend/storage`; o limite padrão é 10 MiB (`10485760` bytes), configurável por `MAX_FILE_SIZE_BYTES`. |
| RNF-05 | O nome físico do arquivo deve ser gerado pelo servidor a partir do identificador, sem usar o nome enviado pelo usuário como caminho. O nome original serve apenas para exibição e download. |
| RNF-06 | Datas devem ser armazenadas e serializadas em UTC no formato ISO 8601. |
| RNF-07 | Erros devem ser tratados nos limites HTTP e de filesystem, sem expor caminhos locais ou detalhes internos na resposta. |
| RNF-08 | A identificação via `X-User-Id` é somente uma conveniência de isolamento funcional do MVP. Como o cliente pode escolher esse valor, ela não fornece controle de acesso seguro e não deve ser apresentada como autenticação. |
| RNF-09 | O frontend deve chamar a API pelo prefixo `/api`. No desenvolvimento, o proxy do Vite encaminha `/api/*` ao backend removendo o prefixo; as rotas do backend não incluem `/api`. |
| RNF-10 | O backend deve manter dependências direcionadas conforme `routes -> controllers -> services -> repositories`; camadas internas não devem depender de Express ou de componentes de interface. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string (UUID) | Sim | Identificador único do documento, gerado pelo servidor. |
| `originalName` | string | Sim | Nome original fornecido pelo cliente, usado para apresentação e nome do download. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string (ISO 8601 UTC) | Sim | Instante em que o upload foi concluído com sucesso. |
| `owner` | string | Sim | Valor do cabeçalho `X-User-Id` associado ao documento. |
| `storageName` | string | Sim, interno | Nome gerado pelo servidor para o arquivo físico; não deve ser exposto na API. Pode corresponder ao UUID `id`. |

Os registros ficam em uma estrutura em memória indexada por `id`. O arquivo físico fica no diretório local configurado. O caminho absoluto não faz parte da resposta pública. O nome original não deve ser concatenado a um caminho de filesystem.

## 6. Contratos de API

### Convenções comuns

- Rotas do backend: sem prefixo `/api`.
- Chamadas do frontend: prefixo `/api`, removido pelo proxy de desenvolvimento do Vite. Por exemplo, `/api/documents` é encaminhado para `/documents`.
- Operações sobre documentos exigem `X-User-Id` com valor não vazio.
- Respostas de erro usam o formato `{ "error": { "code": "...", "message": "..." } }`.
- O nome do campo multipart de upload é `file`.

### `POST /upload`

Recebe `multipart/form-data` com exatamente um arquivo no campo `file`.

Cabeçalho obrigatório:

```http
X-User-Id: identificador-do-usuario
```

Resposta de sucesso: `201 Created`.

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-11-04T12:00:00.000Z",
  "owner": "identificador-do-usuario"
}
```

Erros esperados:

| Status | Código | Situação |
| --- | --- | --- |
| 400 | `USER_ID_REQUIRED` | Cabeçalho `X-User-Id` ausente ou vazio. |
| 400 | `FILE_REQUIRED` | Nenhum arquivo foi enviado no campo `file`. |
| 400 | `UNEXPECTED_FILE_FIELD` | Campo de arquivo diferente de `file` ou mais de um arquivo. |
| 413 | `FILE_TOO_LARGE` | Arquivo acima de `MAX_FILE_SIZE_BYTES`. |
| 500 | `UPLOAD_FAILED` | Falha ao gravar o arquivo ou concluir o registro. |

Se a gravação falhar, nenhum metadado deve ser registrado. Se ocorrer falha após a gravação física e antes de registrar os metadados, o arquivo parcial ou órfão deve ser removido sempre que possível.

### `GET /documents`

Lista os documentos do usuário indicado em `X-User-Id`. Não recebe corpo.

Resposta de sucesso: `200 OK`.

```json
{
  "documents": [
    {
      "id": "uuid",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-11-04T12:00:00.000Z",
      "owner": "identificador-do-usuario"
    }
  ]
}
```

A propriedade `documents` deve ser `[]` quando não houver resultados. A resposta não inclui `storageName` nem caminho físico.

Erro esperado: `400 USER_ID_REQUIRED` quando o cabeçalho obrigatório estiver ausente ou vazio.

### `GET /documents/:id/download`

Baixa como anexo o documento identificado por `id`, desde que pertença ao valor de `X-User-Id`.

Resposta de sucesso: `200 OK`, conteúdo binário, `Content-Disposition: attachment` e nome de download correspondente a `originalName`.

Erros esperados:

| Status | Código | Situação |
| --- | --- | --- |
| 400 | `USER_ID_REQUIRED` | Cabeçalho `X-User-Id` ausente ou vazio. |
| 404 | `DOCUMENT_NOT_FOUND` | Documento inexistente, de outro usuário ou arquivo físico indisponível. A mesma resposta evita revelar a existência de documentos de terceiros. |
| 500 | `DOWNLOAD_FAILED` | Outra falha ao transmitir o arquivo. |

## 7. Decisões arquiteturais

- Backend em Node.js, Express e CommonJS, organizado em quatro camadas simples:
  - `routes`: associação de método/caminho a middleware e controller.
  - `controllers`: leitura da requisição, validação básica e construção da resposta HTTP.
  - `services`: regras de negócio, como associar o dono, criar metadados e aplicar o escopo por usuário.
  - `repositories`: gravação/leitura dos arquivos locais e armazenamento/leitura dos metadados em memória.
- O upload usa `multer` com `diskStorage` e destino no filesystem local. O identificador/nome físico é gerado pelo servidor.
- O frontend usa React com componentes e hooks, organizado em componentes, páginas e serviços; chamadas HTTP usam `fetch` pelo prefixo `/api`.
- O repositório de metadados em memória e o armazenamento em disco têm ciclos de vida diferentes. Não se deve presumir que arquivos existentes após reinicialização possam ser listados ou baixados sem seus metadados.
- A associação por `X-User-Id` é provisória e não substitui autenticação. Uma evolução com autenticação deve obter o dono de uma identidade validada no servidor, sem confiar em um valor arbitrário do cliente.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro. Esta especificação não executa nem altera arquivos de implementação do backend ou do frontend.

1. Revisar e aprovar os requisitos, os contratos de API e as premissas explícitas, especialmente identificação do usuário, limite de upload e perda de metadados após reinicialização.
2. Definir os critérios de teste para validação de entrada, isolamento por usuário, erros de filesystem e respostas HTTP; preparar armazenamento temporário para testes.
3. Implementar o fluxo de upload no backend, incluindo configuração, gravação local com `multer`/`diskStorage`, geração de identificador e registro em memória.
4. Implementar no backend a listagem filtrada por dono e o download com validação de propriedade, tratamento de arquivo indisponível e respostas de erro consistentes.
5. Implementar a interface React para upload, estados de carregamento/erro/sucesso, listagem e download por meio do proxy `/api`.
6. Integrar frontend e backend e validar o fluxo completo, incluindo usuário sem documentos, arquivo acima do limite, documento de outro usuário e indisponibilidade do arquivo.
7. Executar a suíte de testes e as verificações de build aplicáveis, corrigir divergências em relação aos critérios de aceite e registrar as limitações conhecidas do MVP.
