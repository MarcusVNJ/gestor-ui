# Arquitetura frontend

## Objetivo

A arquitetura deve tornar funcionalidades fáceis de localizar, manter regras
testáveis e limitar o impacto de mudanças externas. Adote apenas a estrutura
proporcional ao tamanho e à complexidade reais do produto.

## Organização por funcionalidade

Em projetos novos ou quando já for a convenção, prefira agrupar por feature em
vez de criar grandes pastas globais por tipo técnico.

```text
src/
  app/                 # inicialização, rotas e providers
  features/
    checkout/
      components/
      checkout-api.ts
      checkout-model.ts
      checkout-service.ts
      checkout.test.ts
  shared/
    components/        # componentes realmente reutilizados
    lib/               # utilitários sem domínio específico
  assets/
```

Esta árvore é uma referência, não uma obrigação. Use nomes e convenções do
framework e do projeto. Não mova arquivos existentes apenas para imitar o
exemplo.

## Direção das dependências

Uma divisão útil, quando a complexidade justificar, é:

- **UI:** renderização, interação, foco e tradução de eventos para intenções.
- **Aplicação:** coordenação dos casos de uso e estados da operação.
- **Domínio:** regras e modelos independentes de framework.
- **Infraestrutura:** HTTP, storage, analytics e SDKs externos.

As regras centrais não devem importar componentes, clientes HTTP ou detalhes do
framework. A composição na borda liga as camadas. Features podem ser menores e
combinar camadas no mesmo módulo desde que as responsabilidades continuem
claras.

## Componentes

- Um componente deve representar uma unidade coesa de interface.
- Mantenha estado o mais próximo possível de onde ele é usado.
- Passe dados necessários, não objetos globais ou serviços inteiros.
- Emita eventos com significado de domínio, como `onOrderConfirmed`, em vez de
  expor detalhes internos do clique.
- Evite lógica de negócio complexa no template ou ciclo de renderização.
- Prefira composição a componentes com muitas flags de modo.
- Extraia componente quando houver conceito reutilizável, responsabilidade
  própria ou complexidade que prejudique leitura; não por contagem de linhas.

## Estado

Classifique o estado antes de escolher uma ferramenta:

- **Estado local de UI:** modal aberto, item focado, campo temporário.
- **Estado de formulário:** valores, erros, touched e submissão.
- **Estado de servidor:** dados remotos, cache, revalidação e mutações.
- **Estado de URL:** filtros, paginação e seleção que devem ser compartilháveis
  ou sobreviver a recarga.
- **Estado global do cliente:** sessão, tema ou preferências realmente globais.

Não copie estado de servidor para um store global sem necessidade. Não mantenha
o mesmo fato em dois lugares; derive valores baratos em vez de sincronizá-los
com efeitos. Ao fazer atualização otimista, defina rollback e comportamento em
caso de concorrência.

## Integração com API

- Centralize configuração comum: URL base, autenticação, timeout e tratamento
  de protocolo.
- Mantenha endpoints próximos da feature quando forem específicos dela.
- Verifique status HTTP; uma promise resolvida não significa resposta bem-sucedida.
- Valide payloads externos e mapeie DTOs para modelos internos quando necessário.
- Não exponha detalhes de transporte a toda a UI.
- Trate cancelamento, repetição, idempotência e respostas fora de ordem conforme
  o risco da operação.
- Nunca coloque segredos no bundle frontend.

## Estados da interface

Toda tela baseada em dados deve considerar explicitamente:

- carregamento inicial;
- atualização sem apagar desnecessariamente conteúdo útil;
- sucesso com dados;
- resultado vazio com orientação apropriada;
- erro recuperável com ação de tentar novamente;
- erro sem recuperação e autorização insuficiente;
- conectividade lenta ou ausente, quando relevante.

Evite saltos de layout e ações duplicadas durante submissão. Desabilitar um
botão não substitui idempotência no servidor para operações críticas.

## Design system e estilos

- Reutilize tokens, componentes e padrões existentes antes de criar novos.
- Não use valores visuais arbitrários quando existir token semântico.
- Componentes compartilhados devem preservar semântica HTML e permitir
  acessibilidade, estados e composição necessários.
- Evite CSS global para detalhes de uma feature.
- Verifique desktop, mobile, zoom e conteúdo traduzido ou longo.

## Fronteiras públicas

Cada feature deve expor apenas o necessário. Evite importar arquivos internos
de outra feature. Dependências compartilhadas devem representar conceitos
estáveis, não uma pasta `utils` que concentre código sem relação.

Antes de mover algo para `shared`, confirme que há consumidores reais e que o
conceito tem a mesma semântica para todos eles.

## Checklist

- A funcionalidade é fácil de localizar.
- Regras de domínio podem ser testadas sem renderizar a UI.
- Estado possui uma fonte de verdade e está no escopo correto.
- APIs externas estão isoladas e validadas.
- Todos os estados relevantes da interface foram projetados.
- Dependências entre features e módulos seguem uma direção clara.
