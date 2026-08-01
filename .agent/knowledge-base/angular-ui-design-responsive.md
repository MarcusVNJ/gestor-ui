# Design, interação e responsividade no Angular

## Escopo

Este guia reúne fundamentos de design de interfaces, interação web e layout
responsivo aplicados a projetos TypeScript criados com Angular CLI. Ele não
define uma identidade visual específica. Cores, tipografia, espaçamento e
componentes devem seguir o produto e o design system do projeto.

As orientações complementam os documentos de
[arquitetura frontend](./frontend-architecture.md),
[MVVM com Signals](./angular-mvvm-signals.md) e
[qualidade frontend](./frontend-quality.md). Antes de usar APIs como Signals,
controle de fluxo moderno ou inputs baseados em Signals, confirme a versão do
Angular instalada no `package.json`.

## Objetivos de uma boa interface

Uma interface deve permitir que a pessoa:

- entenda onde está e o que pode fazer;
- identifique rapidamente a ação principal;
- execute tarefas com teclado, mouse, toque ou tecnologia assistiva;
- receba feedback claro após cada ação;
- reconheça, evite e recupere-se de erros;
- use o conteúdo em telas pequenas, grandes e com zoom;
- confie que ações têm resultados previsíveis.

Design não é somente aparência. Hierarquia, conteúdo, estados, acessibilidade,
desempenho e comportamento fazem parte da solução.

## Processo de design e implementação

Antes de criar componentes:

1. Identifique o objetivo da tela e sua ação principal.
2. Liste conteúdo, ações e estados necessários.
3. Organize a informação em uma hierarquia compreensível.
4. Desenhe primeiro o fluxo com menor espaço útil.
5. Defina como o layout cresce, quebra e reorganiza conforme o conteúdo.
6. Projete carregamento, vazio, erro, sucesso e permissões.
7. Defina navegação por teclado, foco e anúncios importantes.
8. Implemente com tokens e componentes existentes.
9. Verifique em diferentes tamanhos, entradas e condições de rede.

Não comece escolhendo um breakpoint ou copiando um componente visual sem
entender a tarefa do usuário.

## Hierarquia visual

Use contraste, tamanho, peso, posição e espaço para comunicar importância.

- Deve existir uma ação principal clara por contexto.
- Títulos descrevem conteúdo, não apenas categorias genéricas.
- Agrupe elementos relacionados por proximidade e alinhamento.
- Separe grupos diferentes com espaço antes de adicionar bordas e caixas.
- Evite muitos elementos com o mesmo peso visual.
- Preserve uma ordem de leitura lógica no DOM; CSS não deve criar uma ordem
  visual contraditória para teclado e leitor de tela.
- Conteúdo essencial vem antes de detalhes complementares.

Uma interface não deve depender somente de cor, posição ou ícone para explicar
uma ação. Use texto ou nome acessível quando o significado não for universal.

## Espaçamento e alinhamento

Adote uma escala limitada de espaçamento. Tokens tornam ritmo e manutenção
previsíveis.

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
}
```

Os valores são exemplo, não uma escala obrigatória. Reutilize os tokens do
projeto antes de criar novos.

- Use `gap` em layouts flex e grid para espaçamento entre filhos.
- Evite margens negativas e deslocamentos arbitrários para corrigir estrutura.
- Mantenha alinhamentos consistentes entre título, conteúdo e ações.
- Use espaço interno para delimitar componentes e espaço externo para separar
  grupos.
- Não reduza espaço a ponto de prejudicar toque, leitura ou localização visual.
- Permita que o conteúdo determine altura; evite alturas fixas em texto.

## Tipografia

- Use poucas famílias, pesos e tamanhos com papéis definidos.
- Corpo de texto deve permanecer legível com zoom e em telas estreitas.
- Defina tamanhos em `rem`; use `clamp` quando uma escala fluida tiver benefício.
- Use `line-height` proporcional e evite comprimir parágrafos.
- Limite largura de linhas longas com `ch`, sem cortar conteúdo curto.
- Não transforme frases extensas em caixa alta.
- Não dependa de fontes web para exibir ícones essenciais.
- Reserve espaço e configure fallback para reduzir mudanças de layout durante o
  carregamento da fonte.

```css
.page-title {
  font-size: clamp(1.75rem, 1.25rem + 2vw, 3rem);
  line-height: 1.1;
}

.article-content {
  max-inline-size: 70ch;
  line-height: 1.6;
}
```

## Cor, contraste e temas

Use tokens semânticos em vez de nomes ligados à cor física.

```css
:root {
  color-scheme: light;
  --color-surface: #ffffff;
  --color-surface-muted: #f3f5f7;
  --color-text: #17202a;
  --color-text-muted: #52606d;
  --color-action: #075fc7;
  --color-danger: #b42318;
  --color-focus: #8a3ffc;
}
```

- Verifique contraste de texto, ícones informativos, bordas de controles e foco.
- Estados não devem ser diferenciados apenas por cor.
- Hover, focus, active, disabled e selected precisam ser distinguíveis.
- Tema escuro exige revisão de contraste, sombras, imagens e cores de estado;
  não basta inverter valores.
- Respeite preferências do sistema quando essa for a política do produto.
- Não crie um seletor de tema global sem requisito e persistência definidos.

## Design tokens e componentes

Tokens representam decisões reutilizáveis: cor, espaço, tipografia, raio,
sombra, duração e camadas. Componentes usam tokens; features não devem replicar
valores arbitrários.

Um componente de UI compartilhado deve:

- representar um conceito recorrente com a mesma semântica;
- oferecer estados necessários sem dezenas de flags contraditórias;
- preservar elementos HTML e nomes acessíveis corretos;
- permitir composição de conteúdo sem expor detalhes internos frágeis;
- documentar variantes, tamanhos, estados e limitações;
- funcionar isoladamente e dentro dos layouts suportados.

Não mova um componente para `shared` após um único uso. Primeiro confirme que
seu contrato é estável e realmente comum.

## Responsividade orientada ao conteúdo

Responsividade significa adaptar conteúdo, prioridade e interação ao espaço e
às capacidades disponíveis. Não significa apenas reduzir tudo para caber.

### Mobile first

Escreva o estilo base para o menor espaço suportado e acrescente melhorias com
`min-width` quando houver espaço. Isso não implica desenhar apenas para celular;
o fluxo deve ser verificado em toda a faixa de tamanhos.

```css
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 48rem) {
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 75rem) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

Escolha breakpoints onde o conteúdo deixa de funcionar, não por modelos de
aparelho. Centralize breakpoints ou documente os valores adotados para evitar
pequenas variações espalhadas.

### Layout fluido

Antes de adicionar media query, use ferramentas naturais do CSS:

- `max-inline-size` para limitar conteúdo sem fixar largura;
- Grid com `minmax`, `auto-fit` e `auto-fill`;
- Flexbox com `flex-wrap`;
- unidades relativas, `min()`, `max()` e `clamp()`;
- `aspect-ratio` para reservar proporção de mídia;
- propriedades lógicas como `margin-inline` e `padding-block`.

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-6);
}
```

Use `min-width: 0` em filhos de Grid ou Flex quando conteúdo longo impedir
encolhimento. Trate quebra de palavras e overflow no componente que conhece o
conteúdo; não aplique `overflow: hidden` globalmente para esconder o problema.

### Container queries

Use container queries quando o componente deve responder ao espaço do seu
container, não ao viewport. Confirme suporte nos navegadores do projeto.

```css
.results-panel {
  container-type: inline-size;
}

.result-card {
  display: grid;
  gap: var(--space-3);
}

@container (min-width: 36rem) {
  .result-card {
    grid-template-columns: 8rem 1fr auto;
    align-items: center;
  }
}
```

Container query é preferível a TypeScript para reorganização puramente visual.

## CSS ou TypeScript?

Use CSS para:

- tamanho, posição, fluxo, colunas e espaçamento;
- mostrar uma apresentação alternativa do mesmo conteúdo;
- ajustes de tipografia e densidade;
- orientação, contraste, esquema de cores e redução de movimento;
- respostas ao viewport ou container.

Use TypeScript quando a mudança for comportamental e não puder ser expressa de
forma robusta por CSS, por exemplo:

- alterar quantidade de dados buscados por limitação real do produto;
- ativar uma estratégia de interação diferente;
- coordenar um overlay, foco ou virtualização;
- integrar uma API que depende da capacidade do ambiente.

Não leia `window.innerWidth` durante renderização nem mantenha listeners de
`resize` em cada componente. Isso duplica breakpoints, dificulta testes, pode
causar problemas em SSR e produz trabalho excessivo.

Quando TypeScript precisar conhecer uma media query e Angular CDK já estiver no
projeto, use `BreakpointObserver` e converta o resultado para Signal:

```ts
import { BreakpointObserver } from "@angular/cdk/layout";
import { computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";

const COMPACT_QUERY = "(max-width: 47.99rem)";

export class ResultsComponent {
  private readonly breakpoints = inject(BreakpointObserver);

  private readonly compactMatch = toSignal(
    this.breakpoints
      .observe(COMPACT_QUERY)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  readonly pageSize = computed(() => (this.compactMatch() ? 10 : 24));
}
```

Não instale Angular CDK apenas para substituir uma media query de layout. Em
aplicações com SSR, avalie o valor inicial e possível diferença durante
hidratação. Uma decisão visual deve continuar em CSS sempre que possível.

## Exemplo de navegação responsiva com Signals

Signals são adequados para estado local de interação. O estado gravável fica
privado e a View recebe somente leitura e comandos.

```ts
import { ChangeDetectionStrategy, Component, signal } from "@angular/core";

@Component({
  selector: "app-primary-navigation",
  standalone: true,
  templateUrl: "./primary-navigation.component.html",
  styleUrls: ["./primary-navigation.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryNavigationComponent {
  private readonly menuOpenState = signal(false);

  readonly isMenuOpen = this.menuOpenState.asReadonly();

  toggleMenu(): void {
    this.menuOpenState.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpenState.set(false);
  }
}
```

```html
<button
  class="menu-toggle"
  type="button"
  aria-controls="primary-navigation-links"
  [attr.aria-expanded]="isMenuOpen()"
  (click)="toggleMenu()"
>
  Menu
</button>

<nav
  id="primary-navigation-links"
  aria-label="Navegação principal"
  class="navigation-links"
  [class.navigation-links--open]="isMenuOpen()"
>
  <a routerLink="/products" (click)="closeMenu()">Produtos</a>
  <a routerLink="/orders" (click)="closeMenu()">Pedidos</a>
</nav>
```

```css
:host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.navigation-links {
  display: none;
  flex-basis: 100%;
  flex-direction: column;
  gap: var(--space-2);
}

.navigation-links--open {
  display: flex;
}

@media (min-width: 48rem) {
  .menu-toggle {
    display: none;
  }

  .navigation-links {
    display: flex;
    flex-basis: auto;
    flex-direction: row;
  }
}
```

Em uma navegação de produção, também defina destaque da rota atual e
comportamento ao navegar. Se oferecer fechamento por Escape, devolva o foco ao
botão. Se o menu funcionar como overlay, prefira os recursos de overlay e foco
já adotados pelo projeto.

## Interações previsíveis

Toda ação deve possuir início, processamento e resultado compreensíveis.

- Botões descrevem ações: “Salvar alterações”, não apenas “OK”.
- Links navegam; botões executam ações.
- Controles devem mostrar hover, foco, active, selected e disabled quando
  aplicável.
- Não esconda ação essencial apenas em hover.
- Mantenha alvos de toque confortáveis e espaço suficiente entre ações.
- Preserve valores digitados após erro recuperável.
- Evite mudar posição da ação enquanto a pessoa tenta interagir.
- Não faça uma linha inteira clicável se isso ocultar links ou ações internas.
- Não use cursor de link em elemento que não é interativo.

O estado `disabled` impede interação, mas pode dificultar a descoberta da razão.
Quando necessário, mantenha a ação disponível e explique validações ao tentar,
ou apresente orientação próxima ao controle.

## Feedback e operações assíncronas

- Mostre feedback no contexto da ação.
- Para carregamento inicial, represente a estrutura sem simular conteúdo falso.
- Para atualização, preserve conteúdo útil quando ele ainda for válido.
- Botões em submissão devem indicar progresso e impedir duplicação conforme a
  regra da operação.
- Mensagens de sucesso não devem interromper o fluxo sem necessidade.
- Erros devem informar o que ocorreu, impacto e possível recuperação.
- Retry só deve existir quando repetir a ação for seguro.
- Operações otimistas precisam de rollback ou reconciliação.
- Evite indicadores que piscam em operações instantâneas; adote a estratégia de
  atraso já definida pelo design system.

Modele estados explicitamente em TypeScript, preferencialmente com união
discriminada, em vez de combinar vários booleanos inconsistentes.

## Formulários

- Todo campo possui label persistente e associado.
- Use tipo de input, `autocomplete`, teclado virtual e formato adequados.
- Instruções e restrições aparecem antes de a pessoa errar quando forem
  necessárias para preencher.
- Valide no momento útil: não exiba erro agressivo antes da interação.
- Após submit inválido, apresente resumo quando apropriado e leve foco ao
  primeiro problema ou ao resumo.
- Associe mensagem ao campo com os atributos acessíveis suportados.
- Não apague campos válidos porque outro campo falhou.
- Diferencie opcional de obrigatório de forma consistente.
- Em telas estreitas, prefira uma coluna salvo quando campos curtos e relacionados
  continuarem claros lado a lado.
- Botões de submit devem permanecer próximos ao contexto do formulário.

Máscaras não substituem validação. O valor enviado ao domínio deve ser
normalizado sem impedir edição, colagem ou tecnologias assistivas.

## Busca, filtros e listas

- Defina se a busca ocorre ao digitar, ao confirmar ou em ambos os casos.
- Use debounce somente para chamadas acionadas por digitação e preserve resposta
  imediata para Enter ou botão.
- Cancele leituras obsoletas com política apropriada, como `switchMap`.
- Reflita filtros compartilháveis na URL quando isso beneficiar navegação e
  histórico.
- Mostre filtros ativos e ofereça maneira clara de removê-los.
- Estado vazio deve diferenciar “não existem dados” de “nenhum resultado para
  estes filtros”.
- Paginação, carregamento incremental e virtualização devem preservar foco,
  posição e anúncio de resultados.

Em listas Angular, forneça identidade estável (`trackBy` ou `track` conforme a
versão) para evitar recriação desnecessária de DOM e perda de foco.

## Tabelas e dados densos

Não transforme automaticamente toda tabela em cartões no mobile; isso pode
remover comparabilidade e aumentar muito a rolagem.

Escolha conforme a tarefa:

- rolagem horizontal com primeira coluna ou ações identificáveis;
- seleção das colunas prioritárias e acesso explícito aos detalhes;
- visualização alternativa em cartões quando a comparação não for essencial;
- paginação ou virtualização para grandes volumes;
- resumo antes dos detalhes.

Não esconda dados ou ações essenciais com CSS sem um caminho equivalente. Cabeçalhos
devem manter associação semântica com células.

## Modais, menus e overlays

Antes de criar um overlay manual, use componente ou Angular CDK já adotado pelo
projeto. Um modal correto precisa:

- título e descrição acessíveis;
- foco inicial coerente;
- contenção de foco enquanto estiver modal;
- fechamento por Escape quando seguro;
- retorno de foco ao elemento de origem;
- bloqueio de interação e rolagem no conteúdo de fundo;
- comportamento para conteúdo alto e teclado virtual;
- confirmação proporcional para ações destrutivas.

Menus, tooltips e popovers têm semânticas e interações diferentes. Não trate
todo conteúdo flutuante como `div` posicionado.

## Imagens, ícones e mídia

- Defina `width`, `height` ou `aspect-ratio` para reservar espaço.
- Entregue tamanho e formato adequados; use imagens responsivas quando útil.
- Imagem informativa possui `alt` que comunica sua função no contexto.
- Imagem decorativa usa `alt=""`.
- Ícone sozinho precisa de nome acessível ou texto visível.
- Vídeo precisa de controles acessíveis, legendas e alternativa quando aplicável.
- Não reproduza áudio automaticamente.
- Lazy loading deve considerar prioridade: não atrase a mídia principal acima da
  dobra sem medir o impacto.

Quando disponível na versão do Angular, o recurso oficial de otimização de
imagens pode ser usado conforme a documentação do projeto.

## Animação e movimento

Animação deve explicar relação, mudança de estado ou continuidade. Não deve
atrasar tarefas.

- Prefira `transform` e `opacity` a propriedades que recalculam layout.
- Use durações e curvas definidas por tokens.
- Não anime grandes áreas sem medir desempenho.
- Preserve foco e estado durante transições.
- Respeite `prefers-reduced-motion` e ofereça alternativa sem movimento
  essencial.
- Não dependa da animação para comunicar sucesso ou erro.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto;
  }

  .decorative-transition {
    animation: none;
    transition: none;
  }
}
```

Evite desativar indiscriminadamente toda animação se alguma mudança instantânea
puder causar perda de contexto; projete uma alternativa reduzida apropriada.

## Estilos em Angular

- Use encapsulamento padrão do Angular salvo necessidade documentada.
- Estilize o host com `:host`.
- Mantenha tokens globais e estilos de componentes em seus escopos apropriados.
- Evite seletores profundos, dependência da marcação interna de terceiros e
  `::ng-deep`.
- Não use style binding para regras que o CSS resolve melhor.
- Classes devem representar estado ou papel, não detalhes frágeis da árvore DOM.
- Reutilize mixins ou utilitários somente quando já fizerem parte da estratégia
  do projeto.

Ao integrar uma biblioteca de componentes, use sua API de tema e extensão. Não
copie CSS interno que pode mudar em uma atualização.

## Angular CLI

Use o CLI local do workspace e consulte as opções da versão instalada:

```bash
ng generate component shared/ui/empty-state --standalone --change-detection=OnPush
ng generate component features/orders/presentation/order-list --standalone --change-detection=OnPush
ng generate directive shared/ui/autofocus --standalone
ng test
ng build
```

- Gere um componente compartilhado somente após definir contrato reutilizável.
- Prefira `OnPush` e estado reativo compatível com a versão do projeto.
- Não desabilite testes, estilos ou verificações globalmente para acelerar uma
  geração isolada.
- Não assuma que `standalone` é padrão em todas as versões; confira o workspace.
- Use os scripts do `package.json` quando envolverem configuração adicional.

## Testes de interação e responsividade

Automação deve verificar comportamento; inspeção visual complementa a suíte.

### Testes de componente

- elementos são encontrados por papel e nome acessível;
- Signals e estados corretos aparecem na View;
- cliques, teclado, submit, Escape e retry executam o comando esperado;
- foco é movido e restaurado quando necessário;
- loading, vazio, erro e disabled possuem comunicação adequada;
- conteúdo longo e ausência de dados não quebram o componente.

### Testes end-to-end

- cubra jornadas críticas em viewport estreito e amplo;
- use tamanhos representativos, não dezenas de modelos de aparelho;
- teste teclado além de clique;
- verifique navegação, histórico, rotação quando relevante e recuperação de erro;
- evite assertions de posição por pixel quando o contrato é semântico.

### Verificação manual

Confira pelo menos:

- faixa estreita, intermediária e larga, inclusive entre breakpoints;
- zoom de navegador e aumento de texto;
- mouse, teclado e toque quando disponíveis;
- conteúdo traduzido, nomes longos, números grandes e listas vazias;
- rede lenta, offline, erro e resposta fora de ordem;
- tema e redução de movimento suportados;
- navegadores definidos pelo projeto.

Ferramentas de screenshot e regressão visual ajudam a detectar mudanças, mas
precisam de baseline revisado e não substituem teste de interação.

## Anti-patterns

- Breakpoints baseados em marcas ou modelos de aparelho.
- Layout calculado com `window.innerWidth` em cada componente.
- Uma árvore de componentes para desktop e outra para mobile com lógica duplicada.
- Alturas fixas para áreas com texto variável.
- `overflow: hidden` usado para esconder conteúdo quebrado.
- Ação essencial disponível somente em hover ou gesto não explicado.
- `div` clicável no lugar de botão ou link.
- Placeholder usado como label.
- Cores e espaços arbitrários fora dos tokens.
- Modal manual sem foco, Escape e retorno ao elemento de origem.
- Spinner de página inteira para qualquer pequena atualização.
- Signal duplicando estado que já existe em formulário, URL ou store.
- `effect` para aplicar classes ou dimensões que CSS poderia controlar.
- Media queries diferentes em TypeScript e CSS sem fonte de verdade documentada.
- Ocultar informação crítica no mobile sem alternativa.
- Adicionar memoização, virtualização ou lazy loading sem necessidade medida.

## Checklist de entrega

- Objetivo, ação principal e hierarquia da tela estão claros.
- Tokens e componentes existentes foram reutilizados.
- HTML é semântico e o DOM possui ordem lógica.
- Layout funciona continuamente entre tamanhos, não apenas nos breakpoints.
- CSS controla apresentação; TypeScript controla somente comportamento real.
- Teclado, toque, foco, zoom e redução de movimento foram considerados.
- Loading, vazio, sucesso, erro e retry foram projetados.
- Formulários preservam dados e comunicam erros de forma acessível.
- Conteúdo longo, traduzido e dinâmico não é cortado.
- Imagens e fontes não causam mudanças de layout evitáveis.
- Interações assíncronas têm feedback e política de concorrência.
- Componentes Angular mantêm estado gravável encapsulado.
- Testes relacionados, lint, checagem de tipos e build passam.
- A interface foi verificada nas faixas e navegadores suportados.
