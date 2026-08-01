# Backlog do frontend do desafio Lyceum

Este diretório transforma o desafio técnico em entregas pequenas e ordenadas
para o agente `senior-angular-developer`. O escopo aqui é exclusivamente o
frontend. O backend já existe e seu contrato oficial está em
[`../knowledge-base/api-docs.json`](../knowledge-base/api-docs.json).

## Objetivo do produto

Entregar uma aplicação Angular para gestão acadêmica que permita:

- cadastrar, listar, editar e excluir alunos, cursos, disciplinas e turmas;
- matricular um aluno em uma turma aberta;
- consultar matrículas por aluno e por turma;
- confirmar matrículas pendentes e cancelar matrículas confirmadas;
- representar erros e estados assíncronos de forma clara, acessível e
  responsiva;
- ser executada, testada e avaliada de maneira reproduzível.

## Como executar este backlog

1. Selecione o agente `senior-angular-developer` no OpenCode.
2. Solicite uma tarefa por vez, informando o caminho completo do arquivo.
3. O agente deve ler `AGENTS.md`, seu perfil em
   `.agent/agents/senior-angular-developer.md`, a tarefa e os documentos da base
   de conhecimento indicados pela tarefa.
4. Antes de implementar, o agente deve inspecionar o estado real do projeto e
   validar se as dependências da tarefa foram concluídas.
5. A tarefa só pode ser considerada pronta após atender seus critérios de
   aceitação e executar as verificações disponíveis no projeto.
6. Caso o contrato real impeça um critério, o agente não deve inventar um
   endpoint: deve registrar o bloqueio e solicitar uma decisão.

Exemplo de solicitação:

```text
Implemente a tarefa .agent/tasks/TASK-005-students-management.md por completo.
```

## Ordem e dependências

| Ordem | Tarefa | Dependências | Prioridade |
| --- | --- | --- | --- |
| 1 | [TASK-001 — Inicializar Angular](./TASK-001-bootstrap-angular.md) | Nenhuma | Obrigatória |
| 2 | [TASK-002 — Integração com API](./TASK-002-api-foundation.md) | 001 | Obrigatória |
| 3 | [TASK-003 — Design system flat azul](./TASK-003-flat-blue-design-system.md) | 001 | Obrigatória |
| 4 | [TASK-004 — Shell e navegação](./TASK-004-app-shell-navigation.md) | 001, 003 | Obrigatória |
| 5 | [TASK-005 — Gestão de alunos](./TASK-005-students-management.md) | 002, 003, 004 | Obrigatória |
| 6 | [TASK-006 — Gestão de cursos](./TASK-006-courses-management.md) | 002, 003, 004 | Obrigatória |
| 7 | [TASK-007 — Gestão de disciplinas](./TASK-007-disciplines-management.md) | 002, 003, 004 | Obrigatória |
| 8 | [TASK-008 — Gestão de turmas](./TASK-008-academic-classes-management.md) | 002, 003, 004 | Obrigatória |
| 9 | [TASK-009 — Criar matrícula](./TASK-009-enrollment-creation.md) | 005, 008 | Obrigatória |
| 10 | [TASK-010 — Consultar matrículas](./TASK-010-enrollment-queries.md) | 005, 008, 009 | Obrigatória |
| 11 | [TASK-011 — Confirmar e cancelar](./TASK-011-enrollment-transitions.md) | 010 | Obrigatória |
| 12 | [TASK-012 — Resiliência e erros](./TASK-012-resilience-and-errors.md) | 005–011 | Obrigatória |
| 13 | [TASK-013 — Testes e auditoria](./TASK-013-tests-and-a11y.md) | 001–012 | Obrigatória |
| 14 | [TASK-014 — README e entrega](./TASK-014-readme-and-delivery.md) | 001–013 | Obrigatória |
| 15 | [TASK-015 — Integração contínua](./TASK-015-continuous-integration.md) | 013, 014 | Diferencial recomendado |

As tarefas 002 e 003 podem avançar em paralelo depois da 001. As tarefas 005 a
008 também podem ser implementadas em paralelo quando suas dependências comuns
estiverem estáveis. Testes proporcionais devem acompanhar cada tarefa; a tarefa
013 consolida cenários transversais e a auditoria final.

## Restrições confirmadas da API

- URL documentada: `http://localhost:8080`.
- As listas são arrays completos, sem paginação e sem ordenação garantida.
- Não existem endpoints `GET` por ID.
- Cursos, disciplinas e turmas não possuem relacionamentos no contrato.
- Turmas possuem somente `id`, `openingStatus` e `seatLimit`.
- Não há contagem de vagas ocupadas ou disponíveis.
- Matrículas possuem somente IDs e status, sem nomes relacionados.
- Não existe listagem global de matrículas; a consulta exige aluno ou turma.
- Não existem exclusão ou reativação de matrícula.
- O frontend não deve criar parâmetros, campos, relações ou operações ausentes.

## Diretrizes globais de produto

- Idioma da interface: português do Brasil.
- Visual: flat design, simples, claro, predominantemente azul e sem gradientes.
- Tipografia: pilha de fontes do sistema definida na TASK-003, sem dependência de
  carregamento externo.
- Responsividade: funcionamento contínuo a partir de `320px`.
- Acessibilidade: HTML semântico, teclado, foco visível, contraste WCAG AA,
  labels e mensagens associadas.
- Estado: Signals para estado síncrono quando a versão instalada suportar;
  RxJS para HTTP, cancelamento e sequências assíncronas.
- API: DTOs estritos, validação defensiva de erros e nenhuma utilização de
  `any`.
- Consistência: o backend é a autoridade para unicidade, vagas e transições de
  matrícula; validações no frontend servem apenas à experiência do usuário.
- Simplicidade: não criar dashboard, autenticação, relatórios, paginação,
  associações acadêmicas ou abstrações genéricas sem requisito real.

## Requisitos do PDF fora do frontend

O desafio também avalia Spring Boot, camadas do backend, JPA/Hibernate,
migrations, transações, banco relacional, Swagger e testes da API. Esses itens
não devem gerar implementação neste repositório de frontend, pois o backend foi
informado como pronto. O frontend deve apenas consumir e documentar o contrato
fornecido, sem tentar reproduzir regras autoritativas no navegador.

## Definição global de pronto

Uma tarefa está pronta quando:

- seu comportamento observável e seus critérios de aceitação foram atendidos;
- loading, vazio, erro e sucesso relevantes foram tratados;
- o fluxo funciona por teclado e em viewport móvel;
- testes proporcionais ao risco foram adicionados;
- lint, testes, checagem de tipos e build existentes foram executados;
- o diff não contém código morto, logs, segredos ou mudanças fora do escopo;
- decisões e limitações novas foram registradas no lugar apropriado.

## Informações ainda necessárias para a entrega final

As tarefas funcionais podem ser executadas com o OpenAPI atual. Para concluir a
documentação e a validação integrada, será necessário confirmar:

- como o avaliador deve iniciar o container ou Compose do backend;
- se o backend permite CORS para a origem do frontend ou se todo acesso local
  deve passar pelo proxy do Angular;
- quais versões de Node.js e gerenciador de pacotes devem ser preferidas, caso
  exista uma restrição externa ao repositório.
