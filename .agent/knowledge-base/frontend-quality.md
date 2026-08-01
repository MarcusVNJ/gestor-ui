# Qualidade frontend

Qualidade inclui acessibilidade, segurança, desempenho, compatibilidade e
observabilidade. Essas propriedades devem ser consideradas durante o desenho da
funcionalidade, não apenas depois da implementação.

## Acessibilidade

### Semântica e interação

- Use HTML semântico antes de adicionar ARIA.
- Use `button` para ações e `a` para navegação.
- Todo controle deve ter nome acessível e estado perceptível.
- Inputs precisam de label associado; placeholder não substitui label.
- Garanta operação completa por teclado, ordem de foco lógica e indicador de
  foco visível.
- Não use apenas cor para transmitir significado.
- Imagens informativas precisam de texto alternativo; decorativas devem ser
  ignoradas por tecnologias assistivas.

### Conteúdo dinâmico

- Ao abrir modal, mova o foco adequadamente, restrinja-o quando necessário e o
  devolva ao elemento de origem ao fechar.
- Anuncie mensagens assíncronas importantes sem provocar leitura excessiva.
- Erros de formulário devem explicar como corrigir e estar associados ao campo.
- Após navegação ou falha de submissão, posicione o foco de forma previsível.
- Respeite preferências como redução de movimento.

### Verificação

Teste com teclado, zoom e ferramenta automatizada disponível. Automação detecta
apenas parte dos problemas; confirme nomes, ordem de leitura e fluxo manualmente.

## Segurança

- Trate toda entrada externa como não confiável, inclusive URL, storage e API.
- Escape conteúdo por padrão e evite inserir HTML bruto. Quando inevitável,
  sanitize com solução mantida e política explícita.
- Não construa URLs, seletores ou comandos por concatenação insegura.
- Não armazene tokens ou dados sensíveis sem entender o modelo de ameaça.
- Nunca coloque chaves secretas em código, variáveis expostas pelo bundler ou
  repositório.
- Não registre senhas, tokens, dados pessoais ou respostas integrais sensíveis.
- A UI pode ocultar ações, mas autorização deve ser garantida pelo servidor.
- Use dependências mantidas e siga o processo de auditoria do projeto.
- Para links externos em nova aba, aplique proteção contra acesso à janela de
  origem conforme APIs e framework utilizados.
- Considere CSRF, XSS, redirecionamento aberto, upload malicioso e vazamento de
  dados de acordo com a funcionalidade.

Não implemente criptografia caseira. Use APIs e bibliotecas consolidadas e
preserve as políticas de conteúdo e cabeçalhos configuradas pela aplicação.

## Desempenho

### Medir antes de otimizar

- Defina qual métrica ou interação está ruim e obtenha uma linha de base.
- Considere carregamento, responsividade e estabilidade visual.
- Valide em build de produção, rede limitada e dispositivo representativo.
- Não adicione memoização por padrão; ela possui custo e complexidade.

### Práticas

- Divida bundles em fronteiras de rota ou funcionalidades realmente pesadas.
- Evite importar bibliotecas inteiras para uma operação pequena.
- Comprima e dimensione imagens; reserve espaço para evitar layout shift.
- Evite trabalho pesado e leituras/escritas alternadas de layout no thread
  principal.
- Use debounce ou throttle somente quando a semântica da interação permitir.
- Virtualize listas apenas quando o volume justificar e preserve acessibilidade.
- Cacheie dados conforme sua política de atualização, não indefinidamente.
- Cancele requisições obsoletas e evite cascatas de chamadas.

Otimizações devem manter testes e legibilidade. Registre a razão quando a
solução não for evidente e confirme a melhoria com nova medição.

## Responsividade e compatibilidade

- Desenvolva para conteúdo e espaço disponíveis, não para modelos específicos
  de aparelho.
- Verifique larguras pequenas e grandes, zoom, orientação e texto longo.
- Evite depender de hover para ações essenciais.
- Use progressive enhancement quando uma API moderna não for universal no
  conjunto de navegadores suportados.
- Consulte a matriz de navegadores e ferramentas do projeto antes de adicionar
  polyfills.

## Observabilidade e privacidade

- Registre eventos úteis para diagnosticar falhas sem coletar dados excessivos.
- Mensagens técnicas devem incluir contexto seguro e identificadores de
  correlação quando disponíveis.
- Analytics deve ter nomes consistentes e não duplicar eventos em re-renderizações.
- Respeite consentimento, retenção e regras de privacidade aplicáveis.
- Nunca apresente detalhes internos ao usuário; forneça mensagem clara e ação
  de recuperação.

## Checklist

- A funcionalidade opera com teclado e possui semântica correta.
- Conteúdo dinâmico, foco e erros são acessíveis.
- Entradas e saídas inseguras foram tratadas nas fronteiras.
- Não há segredos nem dados sensíveis no bundle ou logs.
- Não foram adicionados custos significativos sem medição.
- Layout e comportamento funcionam nos tamanhos e navegadores suportados.
- Falhas podem ser diagnosticadas sem violar privacidade.
