# TASK-007 — Implementar a gestão de disciplinas

**Prioridade:** obrigatória

**Dependências:** TASK-002, TASK-003 e TASK-004

**Resultado:** cadastro, listagem, edição e exclusão de disciplinas integrados à API

## História de usuário

Como pessoa responsável pela gestão acadêmica, quero manter o cadastro de
disciplinas para organizar esse catálogo de maneira simples e confiável.

## Contrato aplicável

- `GET /api/disciplines/v1`: retorna array completo, sem ordenação garantida.
- `POST /api/disciplines/v1`: cria disciplina com `name` e retorna `201`.
- `PUT /api/disciplines/v1/{id}`: substitui o nome.
- `DELETE /api/disciplines/v1/{id}`: exclui e retorna `204`.
- A descrição do cadastro e o schema de edição definem nome útil de 1 a 120
  caracteres, com remoção de espaços externos.

O schema formal do request de cadastro omite `minLength` e `maxLength`, embora a
descrição da operação declare 1 a 120. Esta tarefa deve aplicar a regra descrita
de forma consistente e registrar a divergência como limitação do contrato.

## Requisitos funcionais

- Criar tela “Disciplinas” com título, contagem e ação “Cadastrar disciplina”.
- Exibir tabela semântica com Nome e Ações, ordenada localmente por nome com
  comparação determinística para `pt-BR`.
- Implementar criação e edição com formulário reativo estritamente tipado.
- Editar a partir do item da lista, pois não existe GET por ID.
- Exigir confirmação antes de excluir, mostrando nome e permanência da ação.
- Atualizar o estado apenas com resposta confirmada pelo backend.
- Exibir mensagens de sucesso de forma contextual e anunciável.

## Validação e estados

- Usar label persistente “Nome” e validar o valor útil entre 1 e 120 caracteres.
- Tratar espaços externos de forma consistente em cadastro e edição sem alterar
  silenciosamente o conteúdo durante a digitação.
- Mapear violação reconhecida de `name`; violações com formato desconhecido vão
  para o resumo do formulário.
- Preservar o valor digitado em `400` ou falha de rede.
- Em `404` de edição ou exclusão, informar possível remoção concorrente e
  recarregar a lista.
- Implementar loading, vazio, erro com nova tentativa, atualização e sucesso.
- Nunca repetir mutações automaticamente.

## Requisitos técnicos e não funcionais

- Consumir apenas o cliente de disciplinas da TASK-002.
- Usar UUID para identidade da linha e estado derivado para ordenação.
- Impedir duplo envio e manter a interface operável durante rede lenta.
- Aplicar os padrões de foco, teclado, tabela responsiva, formulário e diálogo da
  TASK-003.
- Garantir funcionamento a partir de `320px` e com nomes no limite máximo.
- Não extrair abstração genérica apenas por semelhança visual com cursos.

## Critérios de aceitação

- Uma coleção vazia apresenta “Nenhuma disciplina cadastrada”.
- Cadastro e edição aceitam nomes úteis nos limites 1 e 120 e rejeitam entrada
  composta apenas por espaços antes do envio.
- Após `201` ou `200`, a lista usa o nome normalizado devolvido pelo backend.
- Erros recuperáveis preservam o formulário e podem ser corrigidos por teclado.
- A exclusão remove a linha somente após `204` e restaura o foco logicamente.
- Nenhuma relação com curso ou turma é exibida ou enviada.
- A divergência de validação do schema está documentada no README final ou na
  seção de limitações adotada pelo projeto.

## Testes e verificações

- Testar loading, vazio, ordenação determinística, erro e retry de leitura.
- Testar valores vazio, somente espaços, 1 e 120 caracteres.
- Testar payloads e respostas de criação e edição.
- Testar violações conhecidas e desconhecidas, `404` e exclusão `204`.
- Testar duplo envio, foco do diálogo, viewport estreito e teclado.
- Executar testes, lint e build disponíveis.

## Fora de escopo

- Associação da disciplina a curso, turma, professor ou grade.
- Código, ementa, carga horária ou pré-requisitos.
- Página de detalhe, GET por ID, busca remota ou paginação.
