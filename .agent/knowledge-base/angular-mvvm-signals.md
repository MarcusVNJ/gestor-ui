# MVVM com Signals no Angular

## Escopo e compatibilidade

Este guia trata do Angular moderno, também chamado de Angular 2+ para
diferenciá-lo do AngularJS. Signals fazem parte do Angular a partir da versão
16. Antes de usar qualquer API, consulte a versão instalada em `package.json`,
a documentação correspondente e os schematics disponíveis no Angular CLI.

Alguns recursos surgiram depois da API básica de Signals. Por exemplo, o novo
controle de fluxo de templates (`@if`, `@for`), inputs baseados em signals e APIs
reativas de recursos ou formulários podem não existir ou não ser estáveis na
versão do projeto. A arquitetura não deve depender deles. Use a alternativa
estável suportada pelo projeto.

Este documento complementa os guias de TypeScript, Clean Code, SOLID,
arquitetura e testes desta pasta. Em caso de conflito, aplique a ordem de
precedência descrita no [índice](./README.md).

## Objetivo do MVVM

MVVM separa a renderização do estado e do comportamento da tela:

- **Model:** entidades, regras, casos de uso, contratos de repositório e dados.
- **View:** template e componente Angular responsáveis por renderização,
  acessibilidade e tradução de eventos do usuário.
- **ViewModel:** estado de apresentação e comandos da tela, expostos à View por
  Signals e métodos com intenção clara.

Fluxo recomendado:

```text
evento da View -> comando da ViewModel -> caso de uso/repositório
                                             |
View <- Signals readonly <- novo estado <----+
```

A View conhece a ViewModel. A ViewModel conhece contratos e regras da aplicação,
mas não deve manipular DOM, componentes ou detalhes do template. Model e regras
de negócio não dependem de Angular.

MVVM deve tornar uma tela complexa mais fácil de compreender e testar. Um
componente puramente visual, com poucas props e eventos, não precisa de uma
ViewModel separada.

## Responsabilidades

### Model

- Representar conceitos e invariantes do domínio.
- Executar regras que continuariam válidas sem a interface Angular.
- Definir contratos necessários para persistência e serviços externos.
- Validar ou mapear dados recebidos nas fronteiras.
- Não importar componentes, templates, Signals ou APIs do navegador.

### View

- Renderizar Signals da ViewModel.
- Encaminhar eventos como busca, confirmação e retry.
- Manter detalhes estritamente visuais, como referência de elemento e foco.
- Aplicar HTML semântico, estilos, responsividade e acessibilidade.
- Não chamar `HttpClient`, storage ou SDKs diretamente.
- Não implementar regras de negócio no template.

O componente TypeScript faz parte da View. Ele deve ser fino: compõe a
ViewModel, adapta eventos do Angular e gerencia somente ciclo de vida ou detalhes
visuais que não pertencem ao estado de apresentação.

### ViewModel

- Expor o estado necessário à tela como `Signal` somente para leitura.
- Derivar valores com `computed` em vez de armazenar cópias sincronizadas.
- Expor comandos nomeados pelo domínio, como `search`, `retry` e `confirmOrder`.
- Coordenar casos de uso, concorrência, carregamento e falhas recuperáveis.
- Traduzir erros técnicos para estados de apresentação seguros.
- Não retornar componentes, acessar elementos ou produzir HTML.
- Não conter regra de domínio que deveria ser reutilizável fora da tela.

## Estrutura de pastas

Adapte a estrutura ao projeto. Uma feature pode ser organizada assim:

```text
src/app/
  core/
    http/
  features/
    products/
      domain/
        product.ts
        product-repository.ts
      data/
        http-product-repository.ts
        product.dto.ts
      application/
        search-products.ts
      presentation/
        product-list/
          product-list.component.ts
          product-list.component.html
          product-list.component.scss
          product-list.viewmodel.ts
          product-list.viewmodel.spec.ts
```

Features pequenas não precisam começar com todas essas pastas. Preserve a
direção das dependências mesmo quando arquivos coesos estiverem próximos. Crie
uma camada somente quando ela representar uma responsabilidade real.

## Geração com Angular CLI

Use o CLI local e as opções compatíveis com a versão do workspace. Exemplos:

```bash
ng generate component features/products/presentation/product-list --standalone --change-detection=OnPush
ng generate service features/products/presentation/product-list/product-list-viewmodel
ng generate service features/products/data/http-product-repository
ng generate interface features/products/domain/product
```

Confira `ng generate <schematic> --help` antes de usar flags em um projeto de
versão diferente. Renomear manualmente o serviço para `.viewmodel.ts` é aceitável
se esse for o padrão adotado. Não gere testes vazios apenas por convenção: o
teste da ViewModel deve verificar comportamentos reais.

## Contrato do Model e infraestrutura

Defina o contrato conforme a necessidade da aplicação, não como cópia de
`HttpClient`.

```ts
import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export type Product = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
};

export interface ProductRepository {
  search(query: string): Observable<readonly Product[]>;
}

export const PRODUCT_REPOSITORY = new InjectionToken<ProductRepository>(
  "PRODUCT_REPOSITORY",
);
```

O adaptador HTTP implementa esse contrato. O tipo genérico de `HttpClient` não
valida o JSON em tempo de execução; valide e mapeie o DTO antes de devolvê-lo
como modelo confiável.

```ts
import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";

@Injectable()
export class HttpProductRepository implements ProductRepository {
  private readonly http = inject(HttpClient);

  search(query: string): Observable<readonly Product[]> {
    return this.http
      .get<unknown>("/api/products", { params: { query } })
      .pipe(map(validateAndMapProducts));
  }
}
```

`validateAndMapProducts` pertence à fronteira de dados. Ela deve rejeitar ou
tratar payload inválido segundo o contrato do produto, sem espalhar assertions
pela ViewModel.

## Estado da ViewModel com Signals

Represente estados mutuamente exclusivos com uma união discriminada.

```ts
type ProductListState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; products: readonly Product[] }
  | { status: "error"; message: string };

const INITIAL_PRODUCT_LIST_STATE: ProductListState = { status: "idle" };
```

Uma ViewModel pode usar RxJS para operações assíncronas e converter o resultado
para Signal com `toSignal`. Isso aproveita operadores maduros de cancelamento e
concorrência sem expor subscriptions à View.

```ts
import { computed, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Subject, catchError, concat, map, of, switchMap } from "rxjs";

@Injectable()
export class ProductListViewModel {
  private readonly repository = inject(PRODUCT_REPOSITORY);
  private readonly searchRequests = new Subject<string>();

  private readonly state$ = this.searchRequests.pipe(
    switchMap((query) =>
      concat(
        of<ProductListState>({ status: "loading" }),
        this.repository.search(query).pipe(
          map(
            (products): ProductListState => ({
              status: "success",
              products,
            }),
          ),
          catchError(() =>
            of<ProductListState>({
              status: "error",
              message: "Não foi possível carregar os produtos.",
            }),
          ),
        ),
      ),
    ),
  );

  private readonly queryState = signal("");

  readonly query = this.queryState.asReadonly();
  readonly state = toSignal(this.state$, {
    initialValue: INITIAL_PRODUCT_LIST_STATE,
  });
  readonly products = computed(() => {
    const state = this.state();
    return state.status === "success" ? state.products : [];
  });
  readonly isLoading = computed(() => this.state().status === "loading");
  readonly isEmpty = computed(
    () => this.state().status === "success" && this.products().length === 0,
  );
  readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === "error" ? state.message : null;
  });

  setQuery(query: string): void {
    this.queryState.set(query);
  }

  search(): void {
    this.searchRequests.next(this.queryState().trim());
  }

  retry(): void {
    this.search();
  }
}
```

O exemplo mantém o Signal gravável privado, expõe leitura pública e usa
`computed` para derivados. `switchMap` cancela logicamente uma busca anterior
quando uma nova começa, impedindo que resposta antiga substitua a mais recente.
A constante tipada do estado inicial preserva a união sem uma assertion.

## View Angular

Forneça a ViewModel no escopo da tela para que cada instância tenha estado
independente. Adaptadores e repositórios sem estado de tela podem ser fornecidos
na raiz ou na composição da feature.

```ts
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";

@Component({
  selector: "app-product-list",
  standalone: true,
  templateUrl: "./product-list.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductListViewModel],
})
export class ProductListComponent implements OnInit {
  readonly vm = inject(ProductListViewModel);

  ngOnInit(): void {
    this.vm.search();
  }
}
```

Exemplo de template com o controle de fluxo disponível no Angular 17+:

```html
<label for="product-search">Buscar produtos</label>
<input
  #searchInput
  id="product-search"
  type="search"
  [value]="vm.query()"
  (input)="vm.setQuery(searchInput.value)"
  (keyup.enter)="vm.search()"
/>
<button type="button" (click)="vm.search()" [disabled]="vm.isLoading()">
  Buscar
</button>

@if (vm.isLoading()) {
  <p role="status">Carregando produtos...</p>
} @else if (vm.errorMessage(); as message) {
  <p role="alert">{{ message }}</p>
  <button type="button" (click)="vm.retry()">Tentar novamente</button>
} @else if (vm.isEmpty()) {
  <p>Nenhum produto encontrado.</p>
} @else {
  <ul>
    @for (product of vm.products(); track product.id) {
      <li>{{ product.name }}</li>
    }
  </ul>
}
```

Em Angular 16, implemente o mesmo comportamento com `*ngIf` e `*ngFor`. Não
atualize a versão do framework apenas para copiar a sintaxe do exemplo.

Ao ler um Signal no template, Angular registra a dependência e atualiza o
componente `OnPush` quando seu valor muda. Não chame métodos de cálculo no
template a cada detecção; represente valores derivados com `computed`.

## Regras para Signals

### Estado gravável privado

- Declare `signal()` como `private` quando a View não puder alterá-lo livremente.
- Exponha `asReadonly()` ou um `computed`.
- Altere estado por comandos que preservem as invariantes da ViewModel.
- Use `set` para substituir e `update` quando o próximo valor depender do atual.
- Não mute objetos ou arrays guardados em Signal; produza uma nova referência.

```ts
private readonly selectedIdsState = signal<ReadonlySet<string>>(new Set());

toggleSelection(id: string): void {
  this.selectedIdsState.update((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}
```

### Estado derivado com `computed`

- Use `computed` para filtros, totais, permissões e flags derivados.
- Não sincronize dois Signals com `effect` se um puder ser calculado do outro.
- Mantenha o cálculo puro: sem requests, escrita em storage ou alteração de
  outro Signal.
- Não use igualdade customizada sem necessidade medida e contrato claro.

### Efeitos com `effect`

`effect` é destinado a efeitos colaterais que precisam reagir a Signals, como
integração controlada com API imperativa, analytics ou persistência local. Não o
use como primeira opção para:

- copiar valor entre Signals;
- executar regras deriváveis;
- iniciar cadeias de requests sem política de cancelamento;
- corrigir estado depois da renderização;
- substituir um fluxo RxJS já claro.

Um efeito deve ter ciclo de vida conhecido, cleanup quando necessário e não
causar loops de escrita. Nunca use `untracked` apenas para esconder uma
dependência problemática.

## RxJS e Signals

Signals representam muito bem estado atual e derivação síncrona. Observables
representam bem sequências assíncronas, eventos, cancelamento e composição
temporal. Use cada ferramenta pela sua semântica:

- `toSignal` para consumir um Observable como estado atual na View.
- `toObservable` para aplicar operadores temporais a um Signal.
- `takeUntilDestroyed` para subscriptions imperativas realmente necessárias.
- `async` pipe quando não houver benefício em converter para Signal.

Escolha o operador conforme a regra de concorrência:

- `switchMap`: descartar busca ou leitura obsoleta.
- `exhaustMap`: ignorar novos envios enquanto uma operação crítica está ativa.
- `concatMap`: preservar ordem e enfileirar operações.
- `mergeMap`: permitir operações independentes em paralelo.

Não escolha sempre `switchMap`: cancelar uma mutação iniciada no cliente não
garante que o servidor a cancelou.

`toSignal` deve ser criado em contexto de injeção, normalmente em inicializador
de campo de uma classe criada pelo Angular. Evite criá-lo repetidamente em
métodos ou getters. Defina valor inicial quando o Observable não emitir de forma
síncrona.

## Formulários

Use a API estável de formulários disponível na versão do projeto. Com Reactive
Forms:

- a View pode possuir o `FormGroup` quando ele representa controles e validação
  de apresentação;
- a ViewModel recebe um comando tipado no submit;
- regras de domínio permanecem no Model ou caso de uso;
- não mantenha cópias bidirecionais de todos os campos em FormControl e Signals;
- converta `valueChanges` para Signal somente quando houver derivação real que
  se beneficie disso;
- erros do servidor devem ser mapeados para estado da tela ou controles sem
  apagar entradas do usuário.

APIs de formulários baseadas em Signals devem ser adotadas apenas se estiverem
disponíveis e aprovadas para a versão do projeto. Não baseie a arquitetura em
API experimental sem decisão explícita.

## Navegação, inputs e outputs

- A View adapta parâmetros de rota e inputs para comandos da ViewModel.
- A ViewModel não deve depender do DOM ou do componente pai.
- Use inputs baseados em Signals somente quando suportados pela versão;
  `@Input` continua válido em versões anteriores.
- Outputs representam eventos da View para seu consumidor, não uma cópia de
  cada alteração interna da ViewModel.
- Estado compartilhável e restaurável, como filtros e paginação, pode pertencer
  à URL em vez de um serviço global.

## Escopo de injeção e ciclo de vida

- Forneça ViewModels em `providers` do componente ou rota por padrão.
- Use singleton na raiz apenas quando o estado for intencionalmente global.
- Não use `providedIn: "root"` para estado temporário de toda tela por
  conveniência.
- Adaptadores stateless podem ser singletons.
- Recursos iniciados pela ViewModel devem terminar com seu escopo. APIs como
  `toSignal` e `takeUntilDestroyed` integram cleanup ao ciclo de vida Angular.
- Não faça trabalho pesado no construtor. Inicialização explícita ou um fluxo
  reativo de entrada torna o comportamento mais previsível.

## Erros e estados da tela

Modele explicitamente `idle`, `loading`, `success` e `error`. Acrescente estados
como `saving`, `unauthorized` ou `offline` apenas quando tiverem comportamento
próprio. Estado vazio geralmente pode ser derivado de sucesso com coleção vazia.

- Preserve dados anteriores durante refresh se isso melhorar a experiência e
  estiver representado no tipo.
- Não mostre erros técnicos ou dados sensíveis ao usuário.
- Disponibilize retry somente quando a operação for segura para repetição.
- Bloqueie ou coordene submissões duplicadas conforme a regra da operação.
- Registre falhas na infraestrutura de observabilidade, não em `console.log`
  permanente na ViewModel.

## Testes da ViewModel

Teste a ViewModel sem renderizar componente. Substitua contratos externos por
fakes controláveis e verifique Signals públicos e comandos.

```ts
import { TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";

describe("ProductListViewModel", () => {
  let products$: Subject<readonly Product[]>;

  beforeEach(() => {
    products$ = new Subject<readonly Product[]>();
    TestBed.configureTestingModule({
      providers: [
        ProductListViewModel,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: { search: () => products$ },
        },
      ],
    });
  });

  it("exposes products after a successful search", () => {
    const viewModel = TestBed.inject(ProductListViewModel);

    viewModel.setQuery("keyboard");
    viewModel.search();
    expect(viewModel.isLoading()).toBe(true);

    products$.next([{ id: "1", name: "Keyboard", price: 100 }]);

    expect(viewModel.isLoading()).toBe(false);
    expect(viewModel.products()).toHaveLength(1);
    expect(viewModel.errorMessage()).toBeNull();
  });
});
```

Crie um novo `Subject` em cada teste para evitar vazamento entre casos. O trecho
é abreviado para enfatizar o comportamento observado.

Teste também:

- estado inicial e carregamento;
- resultado vazio;
- tradução segura de erros;
- retry;
- normalização de entrada;
- política de concorrência;
- regras de permissão e comandos desabilitados.

Testes do componente devem focar binding, acessibilidade e eventos: renderizar o
estado da ViewModel, encaminhar ações e gerenciar foco. Não repita na View todos
os testes de regras já cobertos na ViewModel.

## Anti-patterns

- ViewModel global para todas as telas.
- Um Signal público gravável para cada detalhe interno.
- `effect` copiando Signals ou encadeando várias escritas.
- Subscription manual sem cleanup.
- Requests disparados repetidamente por getter ou template.
- ViewModel conhecendo `ElementRef`, seletor CSS, modal concreto ou HTML.
- Componente acessando repositório e ViewModel para a mesma operação.
- Estado duplicado em Signal, store, FormControl e URL.
- Herança de uma `BaseViewModel` com loading e error genéricos para domínios
  diferentes.
- Criar interface para cada ViewModel sem consumidor ou implementação alternativa.
- Retornar `Observable` e `Signal` públicos para o mesmo estado sem necessidade.
- Colocar todas as regras no ViewModel e reduzir o Model a tipos sem comportamento.

## Checklist de implementação

- A versão do Angular suporta todas as APIs utilizadas.
- Model, View e ViewModel possuem responsabilidades claras.
- A ViewModel tem escopo compatível com a vida da tela.
- Signals graváveis são privados e valores derivados usam `computed`.
- `effect` existe somente para efeito colateral inevitável e possui cleanup.
- Operações assíncronas têm política explícita de cancelamento ou concorrência.
- DTOs externos são validados antes de entrarem no Model.
- Estados de carregamento, vazio, erro e retry são acessíveis.
- Regras de domínio podem ser testadas sem Angular.
- ViewModel pode ser testada sem renderizar o componente.
- A View permanece fina, sem infraestrutura nem regra de negócio.
- Testes, checagem de tipos, lint e build do projeto passam.
