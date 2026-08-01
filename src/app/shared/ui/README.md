# Contratos de interface compartilhados

Os estilos globais em `src/styles/` complementam elementos HTML nativos. Use componentes Angular
compartilhados apenas quando eles encapsularem comportamento, como o badge de status e o diálogo.
Não existe rota pública de demonstração do design system.

## Ações e links

- Use `button.ui-button` para ações e `a.ui-link` para navegação.
- Escolha uma variante de botão: `ui-button--primary`, `ui-button--secondary` ou
  `ui-button--destructive`.
- Durante uma operação, mantenha texto explícito (por exemplo, “Salvando…”) e aplique
  `aria-busy="true"`. Prefira o atributo `disabled` quando uma segunda ativação não for válida.
- Links que funcionam como ação destacada também recebem `ui-link--action`; links no meio de texto
  não precisam de alvo mínimo isolado.
- Em fundos escuros, aplique `ui-inverse` no contêiner para usar o anel de foco claro. Nunca use o
  foco azul padrão sobre a navegação azul-marinho.

## Campos

Cada controle mantém um `label` visível. Ajuda e erro têm IDs estáveis e são associados com
`aria-describedby`; controles inválidos recebem `aria-invalid="true"`.

```html
<div class="ui-field">
  <label class="ui-label" for="nome">Nome</label>
  <input class="ui-control" id="nome" aria-describedby="nome-ajuda nome-erro" aria-invalid="true" />
  <p class="ui-field-help" id="nome-ajuda">Informe o nome completo.</p>
  <p class="ui-field-error" id="nome-erro">O nome é obrigatório.</p>
</div>
```

## Mensagens e estados assíncronos

- Use `role="status"` para progresso e confirmações que não interrompem o usuário.
- Use `role="alert"` somente para falhas que exigem anúncio imediato.
- Loading, vazio e erro sempre têm texto específico. Erros recuperáveis incluem um botão “Tentar
  novamente”. Durante atualização, preserve os dados existentes quando possível.
- Combine `ui-message` com uma variante de tom, ou use `ui-async-state` para estados de página.

## Tabelas

Preserve `table`, `caption`, `th scope="col"` e `th scope="row"`. Em telas estreitas, envolva a
tabela em uma região nomeada e focável; a rolagem fica limitada a essa região.

```html
<div class="ui-table-region" role="region" aria-label="Turmas cadastradas" tabindex="0">
  <table class="ui-table">
    <caption>Turmas cadastradas</caption>
    <!-- cabeçalho e corpo -->
  </table>
</div>
```

## Status

`app-status-badge` aceita somente `OPEN`, `CLOSED`, `PENDING`, `CONFIRMED` e `CANCELED`. O
componente sempre exibe o texto correspondente em português; não apresente o valor interno da API.

## Diálogos

`app-dialog` usa `dialog.showModal()` para modalidade, Escape e contenção de foco nativos. Forneça
título visível, descrição quando necessária e ações com o atributo `dialog-actions`. Marque a ação
segura inicial com `autofocus`. Abra com `open(elementoAcionador)` para garantir a restauração de
foco; enquanto `busy` for verdadeiro, Escape e `close()` são bloqueados.
