# TASK-008 — Implementar a gestão de turmas

**Prioridade:** obrigatória

**Dependências:** TASK-002, TASK-003 e TASK-004

**Resultado:** cadastro, listagem, edição e exclusão de turmas integrados à API

## História de usuário

Como pessoa responsável pela gestão acadêmica, quero manter turmas com situação
de abertura e limite de vagas para controlar onde novas matrículas podem ocorrer.

## Contrato aplicável

- `GET /api/academic-classes/v1`: retorna array completo.
- `POST /api/academic-classes/v1`: cria turma e retorna `201`.
- `PUT /api/academic-classes/v1/{id}`: substitui `openingStatus` e `seatLimit`.
- `DELETE /api/academic-classes/v1/{id}`: exclui e retorna `204`.
- `openingStatus`: `OPEN` ou `CLOSED`.
- `seatLimit`: inteiro obrigatório com mínimo 1 e sem máximo documentado.
- Reduzir o limite abaixo do total confirmado gera `409`.
- Excluir turma com matrículas gera `409`.

Turma não possui nome, código, curso, disciplina, período, professor ou horário.
O UUID completo é a identidade disponível e não pode ser substituído por texto
fictício.

## Requisitos funcionais

- Criar tela “Turmas” com título, contagem e ação “Cadastrar turma”.
- Listar Identificador, Situação, Limite de vagas e Ações em tabela semântica.
- Manter o UUID completo disponível, com quebra segura ou região horizontal em
  telas estreitas.
- Traduzir `OPEN` para “Aberta” e `CLOSED` para “Fechada”, sempre com texto além
  da cor.
- Aplicar ordenação local determinística por situação e UUID, documentando o
  critério na interface quando necessário.
- Criar e editar por formulário reativo tipado com situação e limite de vagas.
- Usar select nativo ou radios acessíveis para situação e entrada numérica que
  permita digitação e colagem para o limite.
- No `PUT`, enviar os dois campos obrigatórios mesmo se apenas um mudar.
- Exigir confirmação de exclusão, identificar a turma pelo UUID e informar que a
  ação é permanente.
- Atualizar a coleção somente após sucesso confirmado.

## Validação, conflitos e estados

- Aceitar apenas os enums documentados e limite inteiro maior ou igual a 1.
- Não inventar limite máximo; entradas impraticáveis devem depender da validação
  de fronteira e da resposta da API, sem coerção silenciosa.
- Mapear violações reconhecidas de `openingStatus` e `seatLimit`; demais
  violações ficam no resumo.
- Em conflito ao reduzir vagas, manter o formulário aberto, preservar ambos os
  valores e explicar que o limite está abaixo das matrículas confirmadas.
- Em conflito de exclusão, manter o diálogo aberto e informar que existem
  matrículas vinculadas.
- Em `404`, informar possível remoção concorrente e recarregar a coleção.
- Oferecer retry somente para leituras e nunca reenviar mutações automaticamente.
- Representar loading, vazio, erro, atualização e sucesso.

## Requisitos técnicos e não funcionais

- Não calcular ou exibir vagas disponíveis como informação autoritativa: a API
  não fornece ocupação e pode haver concorrência.
- Não usar a quantidade de matrículas carregada em outro fluxo para liberar uma
  alteração sem tratar o `409` do backend.
- Usar UUID como identidade estável da linha.
- Bloquear submissão duplicada e preservar dados válidos durante atualização.
- Aplicar os padrões acessíveis de tabela, badge, formulário e diálogo.
- O fluxo deve funcionar por teclado, em zoom elevado e desde `320px`.

## Critérios de aceitação

- Uma coleção vazia apresenta “Nenhuma turma cadastrada”.
- Cadastro e edição enviam exatamente `openingStatus` e `seatLimit`.
- Um limite decimal, vazio, zero ou negativo não é enviado como válido.
- `OPEN` e `CLOSED` nunca aparecem sem as traduções “Aberta” e “Fechada” na UI.
- Um `409` de redução preserva o formulário e não altera a linha da tabela.
- Um `409` de exclusão preserva a turma e apresenta a restrição no diálogo.
- Após `204`, a linha é removida e o foco é restaurado de maneira previsível.
- A interface não sugere nome, curso, disciplina, ocupação ou disponibilidade de
  vagas inexistentes no contrato.

## Testes e verificações

- Testar lista vazia, ordenação, UUID completo, erro e retry.
- Testar os dois status e limites vazio, decimal, 0, 1 e inteiro maior.
- Testar payload completo de cadastro e `PUT`.
- Testar violações, `404`, conflito de redução, conflito de exclusão e `204`.
- Testar diálogo, duplo envio, teclado, zoom e viewport de `320px`.
- Executar testes, lint e build disponíveis.

## Fora de escopo

- Relações com curso, disciplina, professor, horário ou período.
- Tela de detalhe ou GET por ID.
- Ocupação, vagas disponíveis, lista de espera ou reserva de vaga.
- Paginação, busca ou filtros no servidor.
