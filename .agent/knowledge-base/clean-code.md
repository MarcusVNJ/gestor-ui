# Clean Code

Clean Code é código fácil de entender, alterar, testar e remover. Não é uma
meta estética nem exige funções mínimas, muitas camadas ou abstração de toda
duplicação.

## Nomes que revelam intenção

- Use termos do domínio e o mesmo vocabulário em UI, regras e testes.
- Nomeie variáveis pelo significado, não pelo tipo: `activeUsers`, não
  `userArray`.
- Use verbos para ações: `loadOrders`, `validateEmail`, `formatCurrency`.
- Use substantivos para valores e tipos: `order`, `PaymentStatus`.
- Booleanos devem formar uma afirmação: `isLoading`, `hasPermission`,
  `canSubmit`.
- Evite abreviações desconhecidas, nomes genéricos (`data`, `item`, `manager`) e
  diferenças artificiais (`userInfo`, `userData`) sem significado distinto.
- O tamanho do nome deve ser proporcional ao seu escopo.

## Funções coesas

Uma função deve ter uma responsabilidade observável e um motivo principal para
mudar. Extraia código quando isso:

- nomear uma regra ou intenção importante;
- remover duplicação relevante;
- separar cálculo puro de efeito externo;
- permitir teste isolado de lógica complexa;
- reduzir níveis de condição e facilitar leitura.

Não extraia funções que apenas renomeiam uma linha óbvia ou obrigam o leitor a
pular entre arquivos sem ganho conceitual.

```ts
// Evite misturar regra, persistência e apresentação.
async function submitOrder(input: OrderInput): Promise<void> {
  const order = createOrder(input);
  await orderRepository.save(order);
  notifications.success("Order created");
}
```

Nesse exemplo, a orquestração é clara porque cada colaborador possui uma função
distinta. Se `createOrder` for apenas um construtor trivial e usado uma vez,
mantê-lo inline também pode ser correto.

## Fluxo de controle

- Trate precondições e erros com retornos antecipados.
- Evite aninhamento profundo e condições negativas difíceis de ler.
- Nomeie condições complexas ou mova regras para funções puras.
- Use `switch` com união discriminada quando houver estados explícitos.
- Não use exceções para controle de fluxo esperado.
- Toda coleção vazia deve, em geral, ser representada por `[]`, não `null`.

## Comentários e documentação

O código deve explicar o que faz; comentários devem explicar por que uma decisão
não óbvia existe. Bons comentários registram restrições externas, decisões de
compatibilidade ou riscos. Evite comentários que repetem o código, código
comentado e TODO sem contexto ou rastreamento.

APIs públicas, regras complexas e contratos compartilhados podem exigir
documentação. Não documente cada símbolo automaticamente.

## Duplicação e abstração

- Remova duplicação de conhecimento, não apenas texto parecido.
- Duas ocorrências semelhantes podem evoluir por motivos diferentes.
- Espere um padrão ficar claro antes de criar uma abstração compartilhada.
- Prefira composição a hierarquias profundas.
- Uma abstração deve ter nome de domínio, contrato pequeno e consumidores reais.
- Não crie camada, factory, hook, service ou utilitário apenas em antecipação a
  possíveis usos futuros.

## Dependências e efeitos

- Torne rede, tempo, aleatoriedade, storage e ambiente explícitos nos pontos em
  que afetam a lógica.
- Isole efeitos para que regras possam ser testadas como funções puras.
- Evite estado global mutável.
- Não esconda operações caras ou assíncronas em getters ou helpers com nomes
  aparentemente triviais.

## Tratamento de erros

- Falhe cedo ao detectar estado inválido.
- Acrescente contexto sem perder a causa original.
- Trate o erro na camada que sabe como recuperar ou comunicar.
- Mostre ao usuário uma mensagem acionável e preserve detalhes técnicos apenas
  em observabilidade segura.
- Nunca deixe `catch` vazio nem transforme toda falha em sucesso silencioso.

## Code smells para investigar

Um smell é um sinal para analisar, não uma ordem automática de refatoração:

- função com muitos níveis ou responsabilidades;
- módulo que conhece detalhes de muitas áreas;
- parâmetros repetidos em várias chamadas;
- booleanos que ativam modos diferentes;
- condicionais repetidas sobre o mesmo tipo;
- mudanças pequenas que exigem editar muitos arquivos sem necessidade de
  domínio;
- comentários usados para compensar nomes vagos;
- componentes que buscam dados, aplicam regras e renderizam detalhes extensos;
- mocks excessivos para testar uma unidade simples.

## Processo seguro de refatoração

1. Garanta testes ou caracterize o comportamento atual.
2. Faça uma transformação pequena por vez.
3. Preserve comportamento público durante a refatoração.
4. Execute testes e checagem de tipos a cada etapa relevante.
5. Separe refatoração ampla de mudança funcional quando isso facilitar revisão.

## Checklist

- Os nomes usam o vocabulário do domínio.
- Funções e módulos têm responsabilidades compreensíveis.
- O fluxo feliz e as falhas são fáceis de seguir.
- Comentários explicam decisões, não sintaxe.
- Abstrações correspondem a necessidades reais.
- O diff não inclui limpeza não relacionada.
