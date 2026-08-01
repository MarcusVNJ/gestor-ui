# Gestor Acadêmico [![CI](https://github.com/MarcusVNJ/gestor-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/MarcusVNJ/gestor-ui/actions/workflows/ci.yml)

Frontend para o sistema de gestão acadêmica, desenvolvido com Angular 22, TypeScript estrito, arquitetura MVVM com Signals, acessibilidade WCAG AA e design system flat azul. Esta aplicação consome os serviços de uma API RESTful de gestão acadêmica.

---

## Sumário

- [Executando com Docker Compose](#executando-com-docker-compose)
- [Comandos do Projeto](#comandos-do-projeto)
- [Rotas da Aplicação](#rotas-da-aplicação)
- [Decisões Técnicas e Arquitetura](#decisões-técnicas-e-arquitetura)
- [Design System, Responsividade e Acessibilidade](#design-system-responsividade-e-acessibilidade)
- [Estratégia de Testes](#estratégia-de-testes)
- [Declaração do Uso de Inteligência Artificial](#declaração-do-uso-de-inteligência-artificial)

---

## Executando com Docker Compose

O avaliador precisa apenas do Docker com suporte ao Docker Compose. Na raiz do projeto, execute:

```bash
docker compose up --build
```

O Compose constrói o frontend e inicia automaticamente todos os serviços necessários. Depois da inicialização, acesse [http://localhost](http://localhost).

Somente o frontend é publicado no host. Para usar outra porta, defina `FRONTEND_PORT` no arquivo `.env`, por exemplo:

```dotenv
FRONTEND_PORT=4200
```

Nesse caso, acesse `http://localhost:4200`.

---

## Comandos do Projeto

Todos os comandos disponíveis no repositório utilizam os scripts definidos no `package.json`:

| Comando                | Descrição                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `npm start`            | Inicia o servidor de desenvolvimento Angular com proxy local em `http://localhost:4200/`. |
| `npm test`             | Executa a suíte completa de testes unitários e de componentes usando o **Vitest**.        |
| `npm run format:check` | Verifica se os arquivos do projeto cumprem as regras do **Prettier**.                     |
| `npm run format`       | Aplica a formatação automática em código TypeScript, HTML, CSS e JSON.                    |
| `npm run build`        | Gera o build otimizado de produção no diretório `dist/gestor-academico`.                  |

---

## Rotas da Aplicação

- `/` — Redireciona automaticamente para `/alunos`.
- `/alunos` — Interface de gerenciamento de Alunos.
- `/cursos` — Interface de gerenciamento de Cursos.
- `/disciplinas` — Interface de gerenciamento de Disciplinas.
- `/turmas` — Interface de gerenciamento de Turmas.
- `/matriculas` — Interface para realização e consulta de Matrículas.
- `/*` — Página de erro 404 para rotas não mapeadas.

---

## Decisões Técnicas e Arquitetura

### Tecnologias Principais

- **Angular 22** e **Angular CLI 22.1.2**
- **TypeScript 6.0** com modo estrito ativado (`strict: true`)
- **Vitest 4.0** para testes automatizados rápidos e determinísticos
- **Prettier 3.8** para padronização de código

### Arquitetura Standalone e MVVM

1. **Standalone Components**: A aplicação não utiliza `NgModules`. Todos os componentes, diretivas e pipes utilizam a flag `standalone: true`, permitindo um carregamento modular e declarativo.
2. **Padrão MVVM (Model-View-ViewModel)**:
   - **Model**: Tipos estritos, DTOs e serviços HTTP de infraestrutura em `src/app/core/api/`.
   - **View**: Templates HTML semânticos e orientados à apresentação.
   - **ViewModel**: Classes dedicadas em cada feature (ex.: `StudentsViewModel`, `EnrollmentsViewModel`) que gerenciam o estado da tela, ordenação local, filtros e orquestração de comandos assíncronos.

### Uso de Signals e RxJS

- **Signals**: Utilizados para gerenciar o estado síncrono e de apresentação da interface. Writable Signals permanecem privados nas ViewModels e expõem apenas variações somente-leitura (`asReadonly()`) ou estados derivados reativos com `computed()`.
- **RxJS**: Empregado para gerenciar operações assíncronas HTTP, sequências de chamadas, cancelamento automático de requisições obsoletas (`switchMap`) e desvinculação limpa com `takeUntilDestroyed`.
- **Interoperabilidade**: A transição entre RxJS e Signals é realizada com as funções `toSignal` e `toObservable`.

### Resiliência e Tratamento de Erros (`application/problem+json`)

- O frontend trata respostas de erro no formato padrão RFC 7807 (`ApiError`).
- Erros de conflito HTTP 409 recebidos pela aplicação são interpretados e exibidos em mensagens claras e contextuais.
- Todos os fluxos contam com estados explícitos de **Carregamento (Loading)**, **Lista Vazia (Empty State)** e **Banner de Erro (Error State)** com suporte a nova tentativa (_retry_).

---

## Design System, Responsividade e Acessibilidade

### Design System Flat Azul

- **Paleta de Cores**: Identidade visual baseada em tons planos de azul (Flat Blue), transmitindo clareza acadêmica sem o uso de gradientes ou decorações desnecessárias.
- **Tipografia do Sistema**: Pilha de fontes nativas do sistema operacional (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`), eliminando requisições a fontes externas e otimizando o carregamento.

### Responsividade

- Desenvolvido sob o conceito **Mobile-First**, garantindo usabilidade a partir de visores estreitos de `320px`.
- Utilização de CSS Grid, Flexbox e unidades relativas (`rem`, `%`). Não há dependência de cálculos de layout via JavaScript.

### Acessibilidade (WCAG AA)

- **Semântica HTML**: Uso rigoroso de elementos estruturais nativos (`<main>`, `<nav>`, `<header>`, `<table>`, `<button>`).
- **Navegação por Teclado**: Todo o sistema é operável sem mouse. Foco visível preservado e destacado em todos os elementos interativos.
- **Formulários e Erros**: Associação de rótulos (`<label>`) aos inputs e indicação acessível de erros de validação via `aria-describedby` e `aria-invalid`.
- **Diálogos Acessíveis**: O componente `AppDialogComponent` gerencia o foco com travamento (_focus trap_), fechamento por tecla `Escape` e devolução de foco ao elemento acionador.

---

## Estratégia de Testes

A suíte de testes utiliza o **Vitest** integrado ao Angular CLI e cobre diferentes níveis da aplicação:

- **Serviços e Contratos de API**: Validação da transformação de DTOs, montagem de parâmetros e tratamento de erros HTTP.
- **ViewModels**: Teste das regras de estado, derivações com `computed`, comandos e concorrência sem necessidade de renderizar o DOM.
- **Componentes e Interface**: Validação de renderização de templates, bindings de dados, disparo de eventos, exibição de modais e requisitos de acessibilidade.

Para executar os 187 testes automatizados do projeto:

```bash
npm test
```

---

## Declaração do Uso de Inteligência Artificial

Esta aplicação foi desenvolvida com o suporte de Inteligência Artificial Generativa (modelo Gemini integrado ao agente `senior-angular-developer` no ambiente OpenCode):

- **Escopo do Apoio de IA**: Auxílio no planejamento e quebra das tarefas do backlog, estruturação dos padrões reativos com Angular Signals e RxJS, apoio na elaboração dos componentes standalone e design system flat azul, escrita da suíte de testes automatizados com Vitest e geração preliminar da documentação.
- **Revisão e Responsabilidade Humanas**: Todo o código, arquitetura, testes, estilos e documentação foram minuciosamente inspecionados, executados, corrigidos e validados. O resultado final e as decisões tomadas refletem a verificação completa e estão sob total responsabilidade do desenvolvedor responsável pela entrega.
