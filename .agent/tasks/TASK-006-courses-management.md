# TASK-006 — Implementar a gestão de cursos

**Prioridade:** obrigatória

**Dependências:** TASK-002, TASK-003 e TASK-004

**Resultado:** cadastro, listagem, edição e exclusão de cursos integrados à API

## História de usuário

Como pessoa responsável pela gestão acadêmica, quero manter o cadastro de cursos
para que as informações institucionais estejam organizadas no sistema.

## Contrato aplicável

- `GET /api/courses/v1`: retorna array completo, sem ordenação garantida.
- `POST /api/courses/v1`: cria curso com `name` e retorna `201`.
- `PUT /api/courses/v1/{id}`: substitui o nome.
- `DELETE /api/courses/v1/{id}`: exclui e retorna `204`.
- Nome: obrigatório, de 1 a 120 caracteres.

Curso possui somente `id` e `name`. Não existe GET por ID nem relação contratada
com disciplinas ou turmas.

## Requisitos funcionais

- Criar tela “Cursos” com título, contagem e ação “Cadastrar curso”.
- Listar todos os cursos em tabela semântica com Nome e Ações.
- Ordenar localmente pelo nome com comparação determinística para `pt-BR`.
- Implementar criação e edição com formulário reativo tipado e label “Nome”.
- Editar a partir do registro carregado na lista, sem consulta individual.
- Exigir confirmação de exclusão com nome do curso e aviso de permanência.
- Refletir mutações somente após resposta de sucesso do backend.
- Apresentar feedback de sucesso contextual e acessível.

## Validação e estados

- Validar o nome obrigatório entre 1 e 120 caracteres, considerando o valor útil
  após remoção de espaços externos.
- Mapear violação reconhecida de `name` ao controle e manter violações
  desconhecidas no resumo do formulário.
- Preservar o nome após `400` ou falha de rede.
- Em `404` de edição ou exclusão, informar remoção concorrente e recarregar a
  lista.
- Distinguir loading, coleção vazia, erro de leitura, atualização e sucesso.
- Oferecer nova tentativa para leitura; não repetir criação, edição ou exclusão
  automaticamente.

## Requisitos técnicos e não funcionais

- Usar o cliente HTTP da TASK-002, sem chamadas diretamente no componente.
- Manter estado da feature isolado e derivar a ordenação sem duplicar coleções
  mutáveis.
- Bloquear duplo envio e manter conteúdo válido visível durante atualizações.
- Usar UUID como identidade de renderização.
- Aplicar o padrão acessível de tabela, formulário e diálogo da TASK-003.
- Garantir reflow desde `320px`, foco restaurado e operação completa por teclado.
- Não generalizar este fluxo com um CRUD universal se isso apagar semântica ou
  dificultar os testes.

## Critérios de aceitação

- Uma resposta vazia apresenta “Nenhum curso cadastrado” sem ser tratada como
  erro.
- Um curso criado com sucesso aparece com o nome devolvido e normalizado pela
  API.
- A edição envia somente o campo `name` documentado e atualiza a linha após o
  sucesso.
- Uma falha de formulário não fecha o contexto nem apaga o nome digitado.
- A exclusão só remove o curso após a resposta `204`.
- A tela não exibe curso relacionado, disciplinas, turmas, carga horária, código
  ou qualquer dado inexistente no contrato.

## Testes e verificações

- Testar lista vazia, ordenação local, erro e nova tentativa.
- Testar nome obrigatório e limites de 1 e 120 caracteres.
- Testar criação e edição, incluindo payload e valor normalizado da resposta.
- Testar violação de campo, erro geral, `404` e exclusão `204`.
- Testar prevenção de submissão duplicada, diálogo e navegação por teclado.
- Executar testes, lint e build disponíveis.

## Fora de escopo

- Associação entre curso, disciplina ou turma.
- Código, descrição, duração, carga horária ou grade curricular.
- Página de detalhe, GET por ID, busca remota ou paginação.
