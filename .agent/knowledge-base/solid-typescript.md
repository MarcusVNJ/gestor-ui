# SOLID com TypeScript

SOLID é um conjunto de heurísticas para controlar dependências e facilitar
mudanças. Não é uma exigência de criar classes ou uma camada para cada letra.
Em frontend, funções, módulos, componentes e hooks também podem seguir esses
princípios.

## S - Single Responsibility Principle

Um módulo deve ter um motivo principal para mudar e atender a um ator ou regra
coerente. Separe apresentação, regra de negócio e infraestrutura quando elas
evoluírem por razões diferentes.

```ts
function calculateInvoiceTotal(lines: readonly InvoiceLine[]): number {
  return lines.reduce((total, line) => total + line.price * line.quantity, 0);
}

async function saveInvoice(invoice: Invoice): Promise<void> {
  await invoiceApi.create(toInvoiceDto(invoice));
}
```

O cálculo não precisa conhecer HTTP. A separação não significa que cada função
deve estar em um arquivo próprio; mantenha itens coesos juntos.

## O - Open/Closed Principle

Código estável deve aceitar extensões sem exigir alteração de condicionais
centrais a cada nova variante. Use composição ou tabelas de estratégia quando
a variação for real e frequente.

```ts
type DiscountPolicy = (subtotal: number) => number;

const discountPolicies: Record<CustomerTier, DiscountPolicy> = {
  standard: () => 0,
  silver: (subtotal) => subtotal * 0.05,
  gold: (subtotal) => subtotal * 0.1,
};

function calculateDiscount(tier: CustomerTier, subtotal: number): number {
  return discountPolicies[tier](subtotal);
}
```

Um `if` simples para duas regras estáveis é melhor que uma arquitetura de
plugins prematura. Aplique OCP quando o ponto de variação já estiver claro.

## L - Liskov Substitution Principle

Uma implementação deve poder substituir seu contrato sem surpreender o
consumidor. Ela não deve exigir precondições mais fortes, devolver garantias
mais fracas nem mudar a semântica esperada.

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

class HttpUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    // 404 deve manter a semântica do contrato e resultar em null.
    return fetchUserFromApi(id);
  }
}
```

Se uma implementação lança erro para "não encontrado" enquanto as demais
retornam `null`, ela viola a expectativa. Documente no contrato erros, ausência,
ordenação, mutabilidade e efeitos relevantes.

Não use herança apenas para reutilizar código. Composição costuma tornar as
garantias mais explícitas.

## I - Interface Segregation Principle

Consumidores não devem depender de operações que não usam. Modele contratos
pequenos pelo ponto de vista do consumidor.

```ts
interface UserReader {
  findById(id: string): Promise<User | null>;
}

interface UserWriter {
  save(user: User): Promise<void>;
}

async function showProfile(users: UserReader, id: string): Promise<User | null> {
  return users.findById(id);
}
```

Não fragmente interfaces mecanicamente em tipos de um método. Separe quando
existirem permissões, ciclos de mudança ou consumidores diferentes.

## D - Dependency Inversion Principle

Regras de alto nível não devem depender diretamente de detalhes como `fetch`,
`localStorage` ou SDKs. Ambas dependem de um contrato definido pela necessidade
da regra.

```ts
interface SessionStore {
  read(): Session | null;
  clear(): void;
}

function createLogout(store: SessionStore, redirect: (path: string) => void) {
  return () => {
    store.clear();
    redirect("/login");
  };
}
```

Na composição da aplicação, conecte contratos a adaptadores reais. Em testes,
use uma implementação simples em memória. Não crie interfaces para cada função
ou biblioteca; introduza a inversão quando ela isolar uma fronteira instável,
permitir teste útil ou proteger uma regra importante.

## Aplicação em componentes

- Componentes visuais devem receber dados e emitir intenções claras.
- Orquestração de casos de uso pode ficar em um container, controller, hook ou
  módulo equivalente previsto pelo framework.
- Regras reutilizáveis e independentes da tela pertencem a funções ou módulos
  de domínio, não a templates.
- Acesso a HTTP, storage e analytics deve ser encapsulado na fronteira adequada.
- Props não devem expor um serviço inteiro quando o componente usa apenas uma
  operação.

## Quando não aplicar uma abstração

Não introduza classes, interfaces, factories ou injeção de dependência quando:

- existe uma única implementação simples e estável;
- o código concreto já é pequeno, claro e facilmente testável;
- não há regra de negócio a proteger;
- a abstração apenas replica a API de uma biblioteca;
- o custo de navegação e manutenção supera a variação prevista.

Comece concreto. Extraia um contrato quando a segunda necessidade revelar a
forma correta ou quando uma fronteira de alto risco justificar isso desde o
início.

## Checklist

- Cada módulo possui responsabilidade e fronteiras compreensíveis.
- Pontos de variação reais podem ser estendidos sem condicionais espalhadas.
- Implementações preservam totalmente seus contratos.
- Consumidores dependem apenas das capacidades necessárias.
- Regras importantes não estão acopladas a infraestrutura instável.
- SOLID reduziu complexidade; não aumentou cerimônia sem benefício.
