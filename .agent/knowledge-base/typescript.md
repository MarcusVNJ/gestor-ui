# TypeScript para frontend

## Objetivo

Use o sistema de tipos para representar estados válidos, tornar contratos
visíveis e detectar erros antes da execução. Dados externos continuam sendo
desconhecidos até serem validados em tempo de execução.

## Configuração

- Prefira `strict: true` em projetos novos.
- Não enfraqueça o `tsconfig` para contornar um erro localizado.
- Respeite as opções já adotadas, incluindo resolução de módulos e aliases.
- Use a checagem mais estrita suportada pelo projeto, como
  `noUncheckedIndexedAccess`, de forma planejada e sem migrações incidentais.

## Tipos nos limites

Declare tipos em entradas e saídas públicas: props, funções exportadas, APIs,
armazenamento, eventos e integração com bibliotecas. Dentro de uma função,
permita que o TypeScript faça inferência quando o resultado continuar claro.

```ts
type User = {
  readonly id: string;
  name: string;
};

export async function loadUser(id: string): Promise<User> {
  // A resposta deve ser validada ou mapeada antes de ser tratada como User.
  return userRepository.findById(id);
}
```

Regras importantes:

- Use `unknown` para valores sem garantia e refine o tipo antes do uso.
- Evite `any`; ele remove as garantias também de operações derivadas.
- Evite `as` e `!`. Uma assertion não valida o valor em execução.
- Valide respostas HTTP, parâmetros de URL, `localStorage`, formulários e
  mensagens de terceiros com verificações explícitas ou a biblioteca adotada.
- Diferencie DTOs externos dos modelos internos quando formatos ou regras forem
  diferentes.

```ts
function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string" && typeof candidate.name === "string";
}
```

Uma assertion localizada dentro de uma função de validação pode ser necessária
para inspecionar propriedades; não deixe esse detalhe escapar para consumidores.

## Modelagem

### Uniões discriminadas

Modele estados mutuamente exclusivos com uma propriedade discriminante. Isso
evita combinações impossíveis como `data`, `error` e `isLoading` ativos ao mesmo
tempo.

```ts
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```

Ao tratar uma união, prefira cobertura exaustiva quando novos estados não
possam ser ignorados com segurança.

```ts
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
```

### Ausência e valores padrão

- Use `null` quando a ausência fizer parte explícita do domínio.
- Use propriedade opcional quando ela puder não existir no objeto.
- Não use valores falsy como substituto genérico para ausência; `0`, `false` e
  string vazia podem ser valores válidos.
- Prefira `??` a `||` quando somente `null` e `undefined` indicarem ausência.

### Imutabilidade

Use `readonly`, cópias e funções puras quando isso evitar mutação compartilhada.
Não faça cópias profundas indiscriminadas nem adote imutabilidade cerimonial em
variáveis locais sem risco de compartilhamento.

### Constantes e enums

Para conjuntos simples, uniões literais ou objetos `as const` normalmente têm
boa interoperabilidade. Use `enum` quando ele já for padrão do projeto ou tiver
uma vantagem concreta. Nunca codifique valores de negócio repetidos em strings
espalhadas pelo código.

## Funções

- Uma função deve operar em um nível de abstração coerente.
- Prefira poucos parâmetros relacionados; agrupe-os em objeto quando houver
  ganho de legibilidade, especialmente em funções públicas.
- Evite parâmetros booleanos que mudam completamente o comportamento.
- Use retorno antecipado para precondições e erros simples.
- Não altere argumentos recebidos salvo se o contrato declarar essa mutação.
- Use funções puras para cálculos e isole efeitos como rede, DOM e storage.

```ts
type PriceInput = {
  subtotal: number;
  discount: number;
};

function calculateTotal({ subtotal, discount }: PriceInput): number {
  if (subtotal < 0 || discount < 0) {
    throw new RangeError("Prices cannot be negative");
  }
  return Math.max(0, subtotal - discount);
}
```

## Erros e assincronismo

- Lance objetos `Error`, não strings.
- Preserve a causa ao converter um erro técnico em erro de domínio quando o
  ambiente suportar `cause`.
- Não capture um erro se não puder acrescentar contexto, recuperar ou traduzi-lo.
- Mensagens para usuários não devem expor stack traces ou detalhes internos.
- Trate cancelamento e concorrência em requisições que podem ficar obsoletas.
- Use `AbortSignal` quando a API e o ciclo de vida permitirem.
- Use `Promise.all` para tarefas independentes e execução sequencial quando uma
  depender da anterior.

```ts
async function searchProducts(query: string, signal: AbortSignal) {
  const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Product search failed with status ${response.status}`);
  }

  return validateProducts(await response.json());
}
```

## Módulos e exports

- Mantenha módulos coesos e dependências explícitas.
- Evite ciclos entre módulos.
- Prefira exports nomeados para facilitar busca e refatoração, salvo convenção
  do framework.
- Não crie arquivos barrel (`index.ts`) se eles ocultarem ciclos ou ampliarem o
  bundle; use-os somente quando definirem uma API pública clara.
- Use `import type` quando exigido ou útil para deixar dependências de tipo
  explícitas.

## Checklist

- Não há `any` novo sem justificativa documentada.
- Dados externos são validados antes de ganhar um tipo confiável.
- Estados inválidos são difíceis ou impossíveis de representar.
- Erros, ausência, cancelamento e concorrência foram considerados.
- APIs públicas possuem tipos claros e estáveis.
- O compilador passa sem desativar regras.
