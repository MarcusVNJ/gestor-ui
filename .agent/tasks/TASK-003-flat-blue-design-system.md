# TASK-003 — Definir o design system flat em tons de azul

**Prioridade:** obrigatória

**Dependências:** TASK-001

**Resultado:** linguagem visual simples, bonita, acessível e reutilizável

## História de usuário

Como pessoa usuária administrativa, quero uma interface clara e consistente
para reconhecer ações, estados e informações rapidamente em qualquer tela.

## Direção visual

Adotar flat design contemporâneo: superfícies claras, bordas discretas,
tipografia legível, bastante espaço em branco e azul como cor de identidade e
ação. Não usar gradientes, glassmorphism, ilustrações decorativas, sombras
pesadas ou animações chamativas. Nem todo conteúdo deve virar um card.

## Tokens obrigatórios

### Cores

| Papel | Valor |
| --- | --- |
| Fundo da aplicação | `#F8FAFC` |
| Superfície | `#FFFFFF` |
| Superfície azul suave | `#EFF6FF` |
| Navegação | `#172554` |
| Primária | `#1D4ED8` |
| Primária hover | `#1E40AF` |
| Primária ativa | `#1E3A8A` |
| Primária suave | `#DBEAFE` |
| Texto principal | `#0F172A` |
| Texto secundário | `#475569` |
| Borda de controle | `#64748B` |
| Divisor | `#CBD5E1` |
| Sucesso | `#14532D` sobre `#DCFCE7` |
| Atenção | `#713F12` sobre `#FEF3C7` |
| Perigo | `#B91C1C` sobre `#FEE2E2` |

### Tipografia

Usar a pilha local, sem download externo:

```css
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

- Corpo e campos: `1rem`, peso 400, line-height 1.5.
- Título da página: escala fluida entre `1.75rem` e `2rem`, peso 700.
- Título de seção/modal: `1.25rem` a `1.5rem`, peso 700.
- Labels e botões: `0.875rem`, peso 600.
- Tabelas: `0.875rem`, line-height mínimo 1.45.
- Metadados: nunca menores que `0.75rem`.

### Espaçamento e forma

- Escala: `4`, `8`, `12`, `16`, `24`, `32` e `48px`.
- Radius: `6px` em controles, `8px` em painéis e `12px` em diálogos.
- Badges podem usar radius de `999px`.
- Sombra comum máxima: `0 1px 2px rgb(15 23 42 / 8%)`.
- Foco: outline de `3px` com offset de `2px`, visível em fundo claro e escuro.
- Alvos de toque principais: no mínimo `44 × 44px`.

## Requisitos funcionais

- Criar tokens CSS semânticos para cores, fonte, espaçamentos, radius e foco.
- Estabelecer padrões reutilizáveis para botões, links, campos, select, mensagens,
  badges, tabelas, região rolável, diálogos e estados assíncronos.
- Traduzir visualmente os enums sem exibir seus valores internos:
  `OPEN` = “Aberta”, `CLOSED` = “Fechada”, `PENDING` = “Pendente”,
  `CONFIRMED` = “Confirmada” e `CANCELED` = “Cancelada”.
- Todo badge deve possuir texto; cor nunca pode ser o único indicador.
- Criar uma página ou seção temporária de demonstração apenas se ela reduzir o
  risco de inconsistência; removê-la das rotas públicas ao concluir.

## Requisitos não funcionais

- Contraste mínimo WCAG AA: `4.5:1` para texto normal e `3:1` para componentes,
  foco e texto grande.
- Funcionar entre `320px` e telas largas, com zoom de pelo menos 200%.
- Não depender de hover para revelar ação indispensável.
- Respeitar `prefers-reduced-motion`; transições funcionais não devem exceder
  aproximadamente `180ms`.
- Não adicionar uma biblioteca visual completa apenas para os elementos acima.
- Componentes compartilhados devem existir apenas quando houver semântica e
  reutilização reais, não para embrulhar todo elemento HTML.

## Critérios de aceitação

- Tokens são a fonte única dos valores recorrentes e possuem nomes semânticos.
- Botões primário, secundário e destrutivo têm estados hover, active, focus e
  disabled distinguíveis.
- Campos possuem label persistente, ajuda e erro associados.
- Tabela preserva semântica e fica em região horizontal própria no mobile, sem
  causar rolagem da página inteira.
- O foco permanece visível em todos os componentes interativos.
- Os cinco status possuem texto em português e contraste válido.
- A interface não contém gradientes, excesso de sombras ou ornamentação sem
  função.

## Testes e verificações

- Validar contraste dos pares definidos.
- Navegar pelos padrões somente com teclado.
- Verificar `320px`, `768px`, `1024px` e `1440px`.
- Ativar redução de movimento no navegador.
- Executar testes de componentes adotados pelo projeto, lint e build.

## Fora de escopo

- Tema escuro.
- Personalização de tema pelo usuário.
- Dashboard, gráficos ou ilustrações.
- Compra ou carregamento remoto de fontes.
