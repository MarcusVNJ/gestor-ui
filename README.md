# Gestor acadêmico

Base frontend do gestor acadêmico, criada com Angular standalone, TypeScript estrito,
roteamento e testes unitários com Vitest.

## Versões de referência

- Angular Core `22.1.0` e Angular CLI `22.1.2`, versões estáveis disponíveis na criação deste
  projeto.
- Node.js `22.23.2`, registrado em `.nvmrc` e compatível com o requisito do Angular CLI
  (`^22.22.3`).
- npm `10.9.8`, definido pelo campo `packageManager` do `package.json`.

Use a versão registrada do Node.js antes de instalar as dependências. Nenhum outro gerenciador
de pacotes é usado no projeto.

## Instalação

```bash
npm ci
```

O comando usa exclusivamente o `package-lock.json` e reproduz a árvore de dependências validada.

## Desenvolvimento

```bash
npm start
```

A aplicação ficará disponível no endereço informado pelo Angular CLI, normalmente
`http://localhost:4200/`.

As chamadas da aplicação usam `/api` e o servidor de desenvolvimento encaminha esse caminho para
o endereço configurado em `.env`:

```dotenv
API_TARGET=http://localhost:8080
```

Quando o backend estiver fora do contêiner do frontend, substitua `localhost` pelo host ou IP
alcançável a partir deste contêiner. Reinicie `npm start` após alterar o arquivo.

As rotas `/alunos`, `/cursos`, `/disciplinas`, `/turmas` e `/matriculas` estão reservadas. Até que
suas telas sejam implementadas, elas redirecionam para a página inicial. Endereços desconhecidos
também redirecionam para a página inicial.

## Verificações

```bash
npm test
npm run format:check
npm run build
```

Para aplicar a formatação configurada:

```bash
npm run format
```
