# TASK-005 — Implementar a gestão de alunos

**Prioridade:** obrigatória

**Dependências:** TASK-002, TASK-003 e TASK-004

**Resultado:** cadastro, listagem, edição e exclusão de alunos integrados à API

## História de usuário

Como pessoa responsável pela gestão acadêmica, quero manter os dados dos alunos
para utilizar cadastros válidos nos fluxos de matrícula.

## Contrato aplicável

- `GET /api/students/v1`: retorna array completo, inclusive vazio.
- `POST /api/students/v1`: cria aluno e retorna `201`.
- `PUT /api/students/v1/{id}`: substitui nome e e-mail.
- `DELETE /api/students/v1/{id}`: exclui e retorna `204`.
- Nome: obrigatório, de 2 a 120 caracteres.
- E-mail: obrigatório, com no máximo 254 caracteres e unicidade garantida pelo
  backend.

Não existe consulta de aluno por ID. A edição deve partir do item da coleção
carregada, sem criar uma rota que dependa de endpoint inexistente.

## Requisitos funcionais

- Criar tela “Alunos” com título, contagem de itens e ação “Cadastrar aluno”.
- Carregar a coleção ao entrar na tela e ordená-la localmente por nome, de forma
  determinística e adequada a `pt-BR`.
- Exibir tabela semântica com Nome, E-mail e Ações; todos os registros recebidos
  devem permanecer acessíveis.
- Implementar cadastro e edição com formulário reativo estritamente tipado.
- Usar campos persistentes “Nome” e “E-mail”; o e-mail deve usar `type="email"`
  e autocomplete apropriado.
- No `PUT`, enviar nome e e-mail mesmo quando apenas um deles tiver sido alterado.
- Atualizar a coleção somente com o resultado confirmado pelo backend ou por uma
  nova leitura após sucesso.
- Exigir confirmação antes da exclusão, identificando o aluno e informando que a
  ação é permanente.
- Exibir sucesso de criação, edição e exclusão em região anunciável sem deslocar
  o foco para uma notificação.

## Validação e erros

- Validar obrigatoriedade e limites conhecidos sem substituir a validação do
  servidor.
- Preservar valores do formulário após `400`, `409` ou falha de rede.
- Mapear violações reconhecidas de `name` e `email` para seus controles; exibir
  violações desconhecidas no resumo do formulário.
- Em conflito de e-mail, manter o formulário aberto e associar o erro ao e-mail
  somente quando o erro normalizado permitir essa associação com segurança.
- Em exclusão bloqueada porque existem matrículas, manter o diálogo aberto e
  explicar que o aluno não pode ser excluído.
- Em `404` durante edição ou exclusão, informar que o registro pode ter sido
  removido e recarregar a coleção.
- Em falha de leitura, exibir “Tentar novamente”; mutações não devem ser
  repetidas automaticamente.

## Requisitos técnicos e não funcionais

- Modelar loading inicial, atualização, vazio, erro e sucesso sem estados
  contraditórios.
- Impedir submissão duplicada e manter o botão com indicação textual de
  progresso.
- Usar identidade estável por UUID na renderização da coleção.
- Não registrar nomes, e-mails ou payloads no console.
- O diálogo deve conter foco, fechar com `Escape` quando não houver operação em
  andamento, deixar o fundo inerte e restaurar o foco ao acionador.
- A tabela deve ficar em região horizontal nomeada e focável em telas estreitas,
  sem provocar overflow da página.
- O fluxo completo deve funcionar por teclado, leitor de tela e a partir de
  `320px`.

## Critérios de aceitação

- Dado que a API retorna `[]`, quando a tela termina de carregar, então é exibido
  “Nenhum aluno cadastrado” e a ação de cadastro continua disponível.
- Dado um formulário válido, quando o cadastro retorna `201`, então o aluno
  confirmado aparece na lista e o sucesso é anunciado uma única vez.
- Dado um e-mail já utilizado, quando a API retorna `409`, então os valores são
  preservados e o usuário consegue corrigir o e-mail.
- Dado um aluno selecionado, quando a edição é aberta, então nome e e-mail atuais
  estão disponíveis sem executar GET por ID.
- Dado um aluno com matrícula, quando sua exclusão retorna `409`, então a linha
  não é removida e a restrição é apresentada no diálogo.
- Dado sucesso `204`, quando a exclusão termina, então a linha é removida e o
  foco vai para a ação lógica seguinte ou para o título da tabela.
- Duas respostas com os mesmos alunos em ordens diferentes produzem a mesma
  ordem visual.

## Testes e verificações

- Testar loading, vazio, sucesso de listagem, erro e nova tentativa.
- Testar validação de nome nos limites 2 e 120 e e-mail com 254 caracteres.
- Testar payloads completos de cadastro e edição.
- Testar conflito de e-mail, violações conhecidas e desconhecidas e preservação
  do formulário.
- Testar confirmação de exclusão, `204`, `404` e bloqueio `409`.
- Testar prevenção de duplo envio, foco do diálogo e uso somente por teclado.
- Executar testes, lint e build disponíveis.

## Fora de escopo

- Perfil ou página de detalhe de aluno.
- Paginação, busca ou ordenação no servidor.
- Exclusão em cascata ou alteração das matrículas do aluno.
- Autenticação, importação em lote ou campos não presentes no contrato.
