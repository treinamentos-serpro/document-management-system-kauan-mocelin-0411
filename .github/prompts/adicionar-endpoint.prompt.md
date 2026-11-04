---
description: Adiciona um endpoint ao backend seguindo a arquitetura do projeto e cobre o comportamento com testes.
name: adicionar-endpoint
argument-hint: descreva o endpoint e seu comportamento esperado
agent: agent
---

# Adicionar endpoint ao backend

Implemente o endpoint `${input:funcionalidade:descreva o endpoint e seu comportamento esperado}` no backend do Document Management System.

Antes de alterar o código, examine as rotas, controllers, services, repositories e testes existentes. Reutilize os padrões do projeto e evite duplicar lógica.

Requisitos:

- Mantenha o fluxo `routes -> controllers -> services -> repositories`.
- Deixe validação de entrada e resposta HTTP no controller; regras de negócio no service; persistência no repository.
- Preserve o armazenamento local de arquivos em `backend/storage` e os metadados em memória, quando aplicável.
- Trate erros nos limites do sistema e retorne status HTTP e mensagens adequados.
- Adicione testes em `backend/test` usando `node:test` e `node:assert`, cobrindo sucesso e falhas relevantes.
- Não adicione dependências nem altere funcionalidades não relacionadas.
- Execute `npm test` em `backend` e informe o resultado.