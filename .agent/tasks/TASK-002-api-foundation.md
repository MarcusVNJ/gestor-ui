# TASK-002 — Criar a fundação de integração com a API

**Prioridade:** obrigatória

**Dependências:** TASK-001

**Resultado:** contrato HTTP tipado, configuração de ambiente e erros normalizados

## História de usuário

Como pessoa usuária do sistema acadêmico, quero que os dados exibidos e enviados
pelo frontend correspondam ao backend para realizar operações sem inconsistência
ou mensagens técnicas incompreensíveis.

## Fontes obrigatórias

- `.agent/knowledge-base/api-docs.json` é a fonte oficial de endpoints e DTOs.
- `.agent/knowledge-base/typescript.md` orienta tipagem e validação de fronteiras.
- `.agent/knowledge-base/frontend-architecture.md` orienta separação de camadas.

## Requisitos funcionais

- Configurar `HttpClient` de acordo com a versão instalada do Angular.
- Definir uma URL-base configurável e usar `/api` com proxy de desenvolvimento
  quando isso evitar CORS local.
- Criar clientes ou repositories tipados para alunos, cursos, disciplinas,
  turmas e matrículas.
- Cobrir exatamente as 21 operações declaradas no OpenAPI, sem criar métodos
  para endpoints inexistentes.
- Normalizar respostas `application/problem+json` em um erro de aplicação que
  preserve `status`, `code`, `detail`, `traceId` e `violations` válidos.
- Oferecer fallback seguro para erro de rede ou payload de erro malformado.

## Contratos mínimos

- `OpeningStatus`: `OPEN | CLOSED`.
- `EnrollmentStatus`: `PENDING | CONFIRMED | CANCELED`.
- Aluno: `id`, `name`, `email`.
- Curso e disciplina: `id`, `name`.
- Turma: `id`, `openingStatus`, `seatLimit`.
- Matrícula: `id`, `studentId`, `academicClassId`, `status`.
- `ApiValidationViolation`: `field`, `message`.
- `ApiError`: campos obrigatórios do OpenAPI e `violations` opcional.

O agente deve decidir, com base na arquitetura criada, se DTOs idênticos podem
compartilhar tipos sem apagar diferenças semânticas entre operações.

## Requisitos técnicos e não funcionais

- Não usar `any`, non-null assertions ou casts amplos para aceitar respostas.
- Tratar conteúdo HTTP como não confiável na fronteira; validar pelo menos o
  formato de erro antes de acessar campos opcionais.
- Não repetir URL-base em serviços.
- Não repetir a conversão de `HttpErrorResponse` em cada feature.
- Não repetir automaticamente `POST`, `PUT` ou `DELETE`.
- Não registrar payloads, dados pessoais, e-mails ou respostas completas no
  console.
- Manter clientes HTTP independentes de componentes e de detalhes visuais.
- Usar respostas reais para atualizar estado; evitar sucesso otimista sem
  rollback.

## Critérios de aceitação

- Cada método usa URL, verbo, parâmetros, body e tipo de resposta do OpenAPI.
- Exclusões aceitam resposta `204` sem tentar interpretar JSON.
- Listagens aceitam arrays vazios como sucesso.
- Erro com `violations` pode ser consumido por formulários sem conhecer
  `HttpErrorResponse`.
- Erro desconhecido produz mensagem segura e permite distinguir falha de rede.
- Configuração local aponta para `http://localhost:8080` direta ou indiretamente
  pelo proxy, sem fixar esse host nos componentes.
- Não existem clientes para GET por ID, paginação, autenticação ou relações
  curso-disciplina-turma.

## Testes e verificações

- Testar URL, método, body e resposta de ao menos uma operação de cada domínio.
- Testar `201`, `204`, array vazio, `400` com violações, `409`, `500`, erro de
  rede e erro malformado.
- Verificar que mutações não são reenviadas automaticamente.
- Executar testes, lint e build disponíveis.

## Riscos e bloqueios

- O OpenAPI não confirma CORS. Se o proxy local não for suficiente para o
  ambiente de entrega, registrar dependência do backend ou gateway.
- Não há catálogo dos valores de `ApiError.code`; não criar enum fictício.
- O formato de `violations.field` não é formalizado; o mapeamento para campos
  deve ter fallback para erro geral.
