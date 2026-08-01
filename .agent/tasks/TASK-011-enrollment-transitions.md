# TASK-011 — Implementar confirmação e cancelamento de matrícula

**Prioridade:** obrigatória

**Dependências:** TASK-010

**Resultado:** transições de matrícula integradas e coerentes com o estado atual

## História de usuário

Como pessoa responsável pela gestão acadêmica, quero confirmar matrículas
pendentes e cancelar matrículas confirmadas para manter o processo e a capacidade
das turmas consistentes.

## Contrato e regras aplicáveis

- `POST /api/enrollments/v1/{id}/confirmation` confirma somente matrícula
  `PENDING` e retorna estado `CONFIRMED`.
- Confirmação pode retornar `409` se a turma estiver lotada ou a matrícula não
  estiver mais pendente.
- `POST /api/enrollments/v1/{id}/cancellation` cancela somente matrícula
  `CONFIRMED` e retorna estado `CANCELED`.
- Cancelamento pode retornar `409` se a matrícula não estiver confirmada.
- Ambas podem retornar `400` para UUID inválido, `404` e `500`.
- A confirmação consome capacidade e o cancelamento a libera, mas somente o
  backend possui informação autoritativa e transacional.

Não existe reativação, exclusão nem transição genérica de matrícula.

## Requisitos funcionais

- Nas duas consultas da TASK-010, mostrar “Confirmar matrícula” somente para
  registros `PENDING`.
- Mostrar “Cancelar matrícula” somente para registros `CONFIRMED`.
- Não mostrar ação de transição para `CANCELED`.
- Executar confirmação diretamente pelo botão claramente nomeado; não adicionar
  um segundo diálogo de confirmação sem evidência de necessidade.
- Exigir diálogo antes do cancelamento, informando que não há reativação no
  contrato e identificando matrícula, aluno e turma com dados reais disponíveis.
- Durante uma transição, bloquear apenas a ação afetada e apresentar progresso.
- Após sucesso, atualizar a linha com a resposta oficial e manter coerência com a
  consulta ativa; uma nova consulta pode ser usada se a arquitetura exigir.
- Anunciar “Matrícula confirmada” ou “Matrícula cancelada” sem mover o foco para
  toast.

## Conflitos, concorrência e recuperação

- Sempre aceitar o backend como autoridade, mesmo que a tela ainda mostre uma
  ação aparentemente válida.
- Em `409` de confirmação por lotação, manter a matrícula pendente na tela e
  explicar que não há vaga disponível naquele momento.
- Em `409` por transição obsoleta, atualizar a consulta ativa para refletir o
  estado atual e preservar o contexto selecionado.
- Em `404`, informar que a matrícula pode não existir mais e atualizar a consulta.
- Em falha de rede ou `500`, não presumir que a mutação falhou de forma segura;
  orientar atualização da consulta antes de tentar novamente.
- Não repetir automaticamente confirmação ou cancelamento.
- Impedir cliques concorrentes sobre a mesma matrícula.

## Requisitos técnicos e não funcionais

- Não usar cálculo local de vagas para autorizar confirmação.
- Não atualizar estado de forma otimista sem rollback definido.
- Renderizar detalhes de erro como texto, nunca HTML.
- Preservar seleção, posição e contexto da consulta após sucesso ou falha.
- O diálogo de cancelamento deve conter foco, preferir foco inicial na ação
  segura, fechar com `Escape` quando o envio não estiver ativo e restaurar foco.
- Após mudança de estado, mover o foco para a ação restante lógica ou para a
  identificação da linha, sem perda de contexto.
- Todos os controles devem ter nomes explícitos; não depender de ícones ou hover.

## Critérios de aceitação

- Matrícula pendente oferece apenas confirmação entre as transições possíveis.
- Matrícula confirmada oferece apenas cancelamento entre as transições possíveis.
- Matrícula cancelada não oferece ação de reativar, confirmar, cancelar ou
  excluir.
- Confirmação bem-sucedida troca o texto para “Confirmada” usando a resposta da
  API.
- Cancelamento só é enviado após decisão explícita no diálogo e resulta em
  “Cancelada”.
- Um conflito de lotação não altera o estado local para confirmado.
- Uma resposta atrasada de transição não contamina outra consulta selecionada
  posteriormente.
- Nenhuma mensagem promete capacidade sem confirmação do backend.

## Testes e verificações

- Testar matriz de ações disponíveis para os três estados.
- Testar URL e ausência de body nos dois POSTs de transição.
- Testar sucesso de confirmação e cancelamento com atualização da linha.
- Testar confirmação lotada, transição inválida, `404`, `500` e erro de rede.
- Testar prevenção de duplo clique e resposta após troca de consulta.
- Testar diálogo de cancelamento, `Escape`, contenção e restauração de foco.
- Executar testes, lint e build disponíveis.

## Fora de escopo

- Reativação, exclusão ou alteração genérica de matrícula.
- Reserva, fila de espera ou apresentação autoritativa de vagas.
- Implementação frontend das garantias transacionais do backend.
