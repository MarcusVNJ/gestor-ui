# TASK-001 — Inicializar a aplicação Angular

**Prioridade:** obrigatória

**Dependências:** nenhuma

**Resultado:** aplicação Angular mínima, executável e verificável

## História de usuário

Como pessoa avaliadora, quero instalar e iniciar o frontend de forma previsível
para validar a solução sem corrigir configurações locais ou adivinhar comandos.

## Contexto

O repositório ainda não possui uma aplicação scaffoldada. A versão do Angular,
do Node.js, o gerenciador de pacotes e o runner de testes devem ser definidos por
configuração real nesta tarefa, e não presumidos pelas tarefas posteriores.

## Requisitos funcionais

- Criar uma aplicação Angular com TypeScript, roteamento e estilos globais.
- Exibir uma página inicial mínima que confirme que a aplicação carregou.
- Preparar rotas para as áreas `alunos`, `cursos`, `disciplinas`, `turmas` e
  `matriculas`, sem implementar antecipadamente suas telas.
- Manter a aplicação frontend na raiz do repositório, salvo impedimento técnico
  documentado.

## Requisitos técnicos e não funcionais

- Consultar a versão estável disponível no ambiente no momento da execução e
  registrar a versão escolhida; não usar APIs incompatíveis com ela.
- Preferir componentes standalone se forem o padrão estável da versão instalada.
- Habilitar as opções estritas do TypeScript e dos templates Angular.
- Escolher um único gerenciador de pacotes e versionar seu lockfile.
- Registrar uma versão de Node.js compatível, por exemplo em `.nvmrc` ou campo
  equivalente suportado pelo projeto.
- Configurar scripts reais para desenvolvimento, build e testes. Adicionar lint
  e formatter apenas com configuração explícita e comandos funcionais.
- Não instalar biblioteca de componentes, estado ou CSS sem necessidade
  demonstrada pelas tarefas.
- Não incluir segredos nem a URL da API diretamente em componentes.
- Preservar `AGENTS.md`, `.agent/`, `.opencode/` e alterações preexistentes.

## Critérios de aceitação

- Em uma instalação limpa, o comando documentado instala dependências a partir
  do lockfile.
- O servidor de desenvolvimento abre uma página sem erros de runtime.
- Uma rota desconhecida possui tratamento previsível, mesmo que temporário.
- A checagem estrita de TypeScript e templates permanece habilitada.
- Testes iniciais e build de produção passam usando scripts do `package.json`.
- Não existem dependências sem uso ou código gerado de exemplo sem finalidade.

## Testes e verificações

- Executar instalação determinística com o comando do gerenciador escolhido.
- Executar os scripts de teste, lint/format check quando existentes e build.
- Verificar manualmente carregamento em viewport de `320px` e desktop.
- Registrar no resultado os comandos executados e as versões principais.

## Fora de escopo

- Implementação de qualquer CRUD.
- Definição detalhada do design system.
- Integração HTTP com o backend.
- Alterações no backend ou em seu container.
