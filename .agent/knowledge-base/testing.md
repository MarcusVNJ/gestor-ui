# Testes de frontend

## Objetivo

Testes devem aumentar confiança em comportamento importante com baixo custo de
manutenção. Teste contratos e resultados observáveis, não a estrutura interna
da implementação.

## Estratégia por risco

Use uma combinação proporcional:

- **Teste unitário:** regras, cálculos, validações, reducers e formatadores.
- **Teste de componente ou integração:** renderização, interação, formulários,
  navegação local e integração de módulos.
- **Teste end-to-end:** jornadas críticas com aplicação e serviços integrados.
- **Teste de contrato:** formatos e expectativas em fronteiras com APIs, quando
  o projeto dispuser dessa infraestrutura.

Priorize fluxos que envolvam dinheiro, autenticação, autorização, persistência,
regras complexas e falhas que já ocorreram. Não busque cobertura de 100% como
substituto de bons cenários.

## Estrutura dos testes

- Organize em Arrange, Act e Assert sem precisar comentar cada seção.
- Dê nomes que descrevam contexto, ação e resultado.
- Cada teste deve possuir uma razão clara para falhar.
- Use dados mínimos que tornem o cenário evidente.
- Teste caminho feliz, limites e falhas relevantes.
- Um teste de regressão deve falhar antes da correção e passar depois dela.

```ts
describe("calculateTotal", () => {
  it("never returns a negative total when discount exceeds subtotal", () => {
    expect(calculateTotal({ subtotal: 20, discount: 25 })).toBe(0);
  });
});
```

## Testes de UI

- Consulte elementos pelo papel, nome acessível e texto percebido pelo usuário.
- Interaja como o usuário: clique, digitação, teclado e submissão.
- Verifique o resultado visível e não o estado interno do componente.
- Prefira APIs assíncronas de espera a timers ou sleeps fixos.
- Inclua carregamento, vazio, erro, retry, permissões e prevenção de submissão
  duplicada quando forem relevantes.
- Snapshots grandes não substituem assertions semânticas.
- Não teste o comportamento interno do framework ou de bibliotecas confiáveis.

## Mocks e fronteiras

- Mocke rede, tempo, aleatoriedade e serviços externos na fronteira apropriada.
- Prefira um servidor HTTP de teste ou fake de contrato a mocks profundos de
  funções internas.
- Não faça mock da unidade que deseja testar.
- Fakes devem preservar a semântica do contrato real, inclusive falhas e
  assincronismo.
- Restaure relógio, handlers e estado global após cada teste.

Mocks excessivos e assertions sobre número ou ordem de chamadas internas tornam
testes frágeis. Verifique chamadas somente quando a própria interação for parte
do contrato, como analytics, persistência ou prevenção de duplicidade.

## Determinismo

- Controle relógio e timezone quando influírem no resultado.
- Forneça IDs ou aleatoriedade previsíveis.
- Isole storage, cache e banco de teste entre casos.
- Não dependa da ordem de execução.
- Evite chamadas reais a serviços externos na suíte comum.
- Corrija testes instáveis; não os resolva apenas com novas tentativas.

## Cobertura

Use cobertura para encontrar áreas não exercitadas, não como objetivo isolado.
Uma linha coberta pode não ter assertion útil. Dê prioridade a branches de regra
e comportamento de alto risco. Código trivial de composição pode exigir menos
testes do que uma pequena função financeira.

## Checklist

- Os testes descrevem comportamento e critérios de aceitação.
- Falham de forma útil quando o comportamento quebra.
- Não dependem de detalhes privados desnecessários.
- Casos de borda e falhas de maior risco estão cobertos.
- A suíte é independente, determinística e rápida no nível adequado.
- Os comandos de teste definidos pelo projeto passam.
