# TASK-010 — Implementar consultas de matrículas

**Prioridade:** obrigatória

**Dependências:** TASK-005, TASK-008 e TASK-009

**Resultado:** consultas acessíveis por aluno e por turma, nos dois eixos da API

## História de usuário

Como pessoa responsável pela gestão acadêmica, quero consultar matrículas por
aluno ou por turma para acompanhar seus estados e decidir as próximas ações.

## Contrato aplicável

- `GET /api/enrollments/v1/students/{studentId}` consulta por aluno.
- `GET /api/enrollments/v1/academic-classes/{academicClassId}` consulta por turma.
- Ambos retornam array completo com `id`, `studentId`, `academicClassId` e
  `status`.
- Os estados possíveis são `PENDING`, `CONFIRMED` e `CANCELED`.
- Uma resposta `[]` não comprova se a entidade consultada existe; não há `404`
  documentado nessas consultas.

Não existe GET global, por ID, paginação, busca, datas ou ordenação no contrato.

## Requisitos funcionais

- Iniciar a tela com escolha explícita entre “Consultar por aluno” e “Consultar
  por turma”.
- Após escolher o eixo, exigir um seletor alimentado pelas coleções reais de
  alunos ou turmas; digitação manual de UUID não deve ser o fluxo principal.
- Não disparar consulta enquanto o eixo e o registro não estiverem selecionados.
- Na consulta por aluno, identificar o aluno por nome e e-mail e exibir a turma
  pelo UUID completo.
- Na consulta por turma, identificar a turma por UUID, situação e limite; resolver
  nome e e-mail do aluno usando a coleção real de alunos quando disponível.
- Se um aluno relacionado não estiver na coleção carregada, exibir seu UUID e um
  texto neutro de indisponibilidade, sem inventar nome.
- Traduzir os estados para “Pendente”, “Confirmada” e “Cancelada”, sempre com
  texto visível.
- Exibir contagem de resultados e tabela semântica adequada ao eixo selecionado.
- Aplicar ordenação local determinística por estado e UUID, pois não há data no
  contrato.
- Manter o UUID integralmente acessível e permitir nova seleção sem recarregar a
  aplicação.

## Concorrência e estados assíncronos

- Modelar separadamente “nenhum filtro selecionado”, loading, resultado vazio,
  resultado preenchido e erro.
- Cancelar ou ignorar respostas anteriores quando eixo ou seleção mudarem, para
  que uma resposta lenta nunca sobrescreva a consulta mais recente.
- Durante atualização, preservar resultado válido somente se ficar claro que ele
  pertence à mesma consulta; caso contrário, não misturar contextos.
- Uma resposta vazia deve dizer “Nenhuma matrícula encontrada para este
  aluno” ou “para esta turma”, sem afirmar inexistência da entidade.
- Erros de leitura devem oferecer “Tentar novamente” para a mesma seleção.
- A troca de eixo deve limpar o resultado incompatível e manter foco previsível.

## Requisitos técnicos e não funcionais

- Usar RxJS com semântica de cancelamento adequada para mudanças rápidas de
  seleção; não criar subscriptions aninhadas.
- Não executar uma requisição por linha para resolver nomes de alunos.
- Manter dados externos tipados e estado de tela derivado, sem duplicar listas
  sincronizadas manualmente.
- Usar identidade por UUID na renderização.
- Colocar tabelas em regiões horizontais nomeadas e focáveis no mobile.
- Garantir operação por teclado, anúncio de loading/resultado e reflow desde
  `320px`.
- Não usar paginação fictícia, virtualização sem medição ou ordenação remota
  inexistente.

## Critérios de aceitação

- Antes da seleção, a tela orienta o próximo passo e não chama endpoints de
  matrícula.
- Selecionar um aluno chama somente o endpoint por aluno com seu UUID.
- Selecionar uma turma chama somente o endpoint por turma com seu UUID.
- Todos os três estados são exibidos em português e não dependem somente de cor.
- Resposta vazia é diferenciada de filtro ainda não selecionado e de erro.
- Se duas seleções forem feitas rapidamente, somente a resposta da última fica
  visível.
- Os mesmos registros recebidos em ordens diferentes produzem a mesma ordem
  visual.
- A interface não apresenta listagem global, datas, nomes de turma ou outras
  informações ausentes na API.

## Testes e verificações

- Testar estado inicial e ausência de requisição sem seleção.
- Testar URLs e resultados das consultas por aluno e por turma.
- Testar arrays vazios, os três estados, ordenação e UUIDs completos.
- Testar resolução de aluno por dados reais e fallback para UUID desconhecido.
- Testar erro com retry e disputa entre respostas fora de ordem.
- Testar troca de eixo, foco, teclado e região rolável em `320px`.
- Executar testes, lint e build disponíveis.

## Fora de escopo

- Listagem global, consulta por matrícula, paginação ou busca remota.
- Datas de matrícula ou ordenação cronológica.
- Nome humano para turma ou relações com curso e disciplina.
- Alteração, exclusão ou reativação de matrícula.
