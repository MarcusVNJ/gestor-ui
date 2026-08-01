# TASK-009 — Implementar a criação de matrícula

**Prioridade:** obrigatória

**Dependências:** TASK-005 e TASK-008

**Resultado:** matrícula pendente criada a partir de aluno e turma reais

## História de usuário

Como pessoa responsável pela gestão acadêmica, quero matricular um aluno em uma
turma aberta para iniciar o processo de matrícula com situação pendente.

## Contrato aplicável

- `POST /api/enrollments/v1` recebe `studentId` e `academicClassId`.
- O sucesso retorna `201` com `id`, os dois IDs relacionados e status `PENDING`.
- Turma fechada ou dados inválidos podem retornar `400`.
- Aluno ou turma inexistente pode retornar `404`.
- Matrícula duplicada para o mesmo aluno e turma retorna `409`.

Não existe endpoint de listagem global ou de consulta da matrícula criada por ID.
O header `Location` do `201` não deve ser usado para presumir um GET inexistente.

## Requisitos funcionais

- Disponibilizar ação clara “Nova matrícula” na área de Matrículas.
- Carregar alunos e turmas pelos endpoints existentes para compor o formulário.
- Selecionar aluno por nome e e-mail, mantendo o UUID associado ao valor enviado.
- Selecionar turma por UUID completo, situação traduzida e limite de vagas.
- Disponibilizar para matrícula somente turmas conhecidas como `OPEN`; informar
  quando não existir turma aberta.
- Explicar que a validação definitiva da situação e da matrícula pertence ao
  backend e pode mudar enquanto o formulário está aberto.
- Enviar somente `studentId` e `academicClassId`.
- Após `201`, apresentar os dados confirmados e o status “Pendente”.
- Oferecer retorno previsível ao formulário vazio ou continuidade para a área de
  consulta, sem depender de GET por ID.

## Validação e erros

- Ambos os seletores são obrigatórios e devem aceitar apenas IDs provenientes
  das coleções carregadas.
- Falha ao carregar alunos ou turmas deve identificar a área afetada e oferecer
  nova tentativa.
- Não permitir submissão enquanto as opções obrigatórias não estiverem
  disponíveis ou o formulário for inválido.
- Em `400` por turma fechada, preservar as escolhas, explicar a mudança e
  atualizar a coleção de turmas antes de nova tentativa.
- Em `404`, informar que aluno ou turma pode ter sido removido e recarregar a
  coleção correspondente.
- Em `409`, explicar a matrícula duplicada sem apagar as seleções.
- Violações reconhecidas de `studentId` e `academicClassId` devem ser associadas
  aos seletores; demais violações ficam no resumo.
- Não repetir o POST automaticamente.

## Requisitos técnicos e não funcionais

- Usar os clientes HTTP tipados existentes; componentes não constroem URLs.
- Tratar as coleções como snapshots e sempre respeitar a resposta do backend.
- Não calcular vagas disponíveis nem prometer que existe vaga: matrículas
  pendentes não confirmam capacidade e a API não expõe ocupação.
- Impedir duplo envio e anunciar progresso e resultado sem depender apenas de
  animação.
- Ordenar opções de alunos por nome e turmas por situação e UUID.
- Garantir labels persistentes, descrição dos seletores, foco no primeiro erro e
  funcionamento completo por teclado.
- Em viewport estreito, o formulário deve continuar em uma coluna, sem overflow.

## Critérios de aceitação

- Dado que existem alunos e turmas abertas, quando a tela é exibida, então ambos
  podem ser selecionados por rótulos derivados de dados reais.
- Dado que não há turma aberta, quando o carregamento termina, então a ausência é
  explicada e o envio permanece indisponível.
- Dado formulário válido, quando a API retorna `201`, então o resultado exibe
  “Pendente” e os IDs devolvidos pelo servidor.
- Dado que a turma fecha antes do envio, quando a API rejeita a operação, então a
  interface não apresenta sucesso e atualiza as opções disponíveis.
- Dado conflito de duplicidade, quando a API retorna `409`, então o contexto do
  formulário é preservado e nenhuma segunda requisição automática ocorre.
- Nenhuma turma recebe nome, disciplina, curso ou indicação de vaga disponível
  inventados pelo frontend.

## Testes e verificações

- Testar carregamento independente, vazio e falha das listas de alunos e turmas.
- Testar filtro de turmas abertas e rótulos derivados de dados reais.
- Testar obrigatoriedade, payload exato e sucesso `201` com `PENDING`.
- Testar `400` por turma fechada, `404`, `409`, violações e falha de rede.
- Testar prevenção de duplo envio, preservação das escolhas e operação por
  teclado em `320px`.
- Executar testes, lint e build disponíveis.

## Fora de escopo

- Confirmação ou cancelamento, tratados na TASK-011.
- Reserva ou cálculo de vagas.
- Criação de aluno ou turma dentro deste formulário.
- Matrícula em lote, reativação, exclusão ou consulta por ID.
