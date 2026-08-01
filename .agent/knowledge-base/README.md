# Base de conhecimento para agentes de frontend

Esta pasta contém as regras gerais para agentes que analisam, implementam ou
revisam código frontend em TypeScript. Os documentos são independentes de
framework e devem ser adaptados às ferramentas escolhidas pelo projeto.

## Ordem de precedência

Quando duas orientações entrarem em conflito, siga esta ordem:

1. Requisito explícito da tarefa e critérios de aceitação.
2. Configurações executáveis do projeto, como `package.json`, `tsconfig.json`,
   linter, formatter, testes e pipeline de CI.
3. Arquitetura e convenções já predominantes no código.
4. Documentos específicos do projeto.
5. Esta base de conhecimento.

Não altere configurações nem refatore código fora do escopo apenas para fazer o
projeto se adequar a estas recomendações.

## Ordem de leitura

1. [Fluxo de trabalho do agente](./agent-workflow.md)
2. [TypeScript](./typescript.md)
3. [Clean Code](./clean-code.md)
4. [SOLID com TypeScript](./solid-typescript.md)
5. [Arquitetura frontend](./frontend-architecture.md)
6. [MVVM com Signals no Angular](./angular-mvvm-signals.md)
7. [Design, interação e responsividade no Angular](./angular-ui-design-responsive.md)
8. [Testes](./testing.md)
9. [Qualidade frontend](./frontend-quality.md)

## Princípios de decisão

- Correção vem antes de elegância.
- Clareza vem antes de concisão.
- A menor mudança correta é preferível a uma grande reorganização.
- Abstrações devem resolver uma variação real, não uma possibilidade remota.
- Tipos ajudam o compilador; validação protege os limites em tempo de execução.
- Acessibilidade, segurança, estados de erro e testes fazem parte da entrega.
- Código novo deve se integrar ao sistema existente em vez de criar um segundo
  padrão concorrente.

## Definição geral de pronto

Uma alteração está pronta quando:

- atende aos critérios de aceitação e trata os estados relevantes;
- não introduz erros de tipos, lint, testes ou build;
- possui testes proporcionais ao risco da mudança;
- preserva acessibilidade, segurança e desempenho;
- não contém código morto, logs temporários ou segredos;
- mantém o diff focado e explica decisões não óbvias no lugar adequado.
