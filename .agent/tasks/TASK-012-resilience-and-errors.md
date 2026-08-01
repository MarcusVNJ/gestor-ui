# TASK-012 — Consolidar resiliência e tratamento de erros

**Prioridade:** obrigatória

**Dependências:** TASK-005 a TASK-011

**Resultado:** comportamento consistente em validação, conflitos e falhas de rede

## História de usuário

Como pessoa usuária do sistema acadêmico, quero entender falhas e conseguir me
recuperar delas sem perder meu trabalho ou executar ações duplicadas.

## Objetivo

Auditar e consolidar todos os fluxos já implementados usando a normalização da
TASK-002. Esta tarefa não cria uma segunda infraestrutura de erros nem substitui
mensagens contextuais por um interceptor global sem contexto.

## Formato de erro aplicável

Erros válidos `application/problem+json` podem conter:

- `type`, `title`, `status`, `detail`, `instance`, `code` e `traceId`
  obrigatórios;
- `violations` opcional, com pares `field` e `message`.

O formato de `violations.field` e o catálogo de `code` não estão documentados.
Todo payload deve ser validado defensivamente e possuir fallback seguro.

## Requisitos funcionais

- Distinguir pelo menos falha de rede/offline, validação `400`, não encontrado
  `404`, conflito de negócio `409`, erro interno `500` e payload desconhecido.
- Apresentar erros de leitura na região afetada, mantendo o restante do shell
  utilizável.
- Oferecer “Tentar novamente” para GETs e operações comprovadamente seguras.
- Não oferecer retry automático para `POST`, `PUT` ou `DELETE`.
- Preservar valores, seleção e contexto após falhas recuperáveis.
- Exibir `traceId` válido como “Código para suporte” em falhas de servidor, sem
  expor stack trace, endpoint, headers ou payload.
- Renderizar `detail` ou mensagens de violação apenas como texto; usar mensagem
  segura de fallback quando o contrato não puder ser validado.
- Anunciar sucesso e erro em regiões apropriadas sem repetir anúncios de badges
  ou linhas estáticas.

## Erros de formulário

- Manter um mapa explícito por formulário entre campos conhecidos da API e
  controles existentes.
- Associar violações conhecidas ao controle com erro de servidor e
  `aria-describedby`.
- Exibir violações desconhecidas em resumo focável no início do formulário, sem
  descartá-las.
- Limpar o erro de servidor de um campo quando seu valor for alterado, mantendo
  outros erros ainda válidos.
- Em submit inválido, focar o primeiro controle inválido ou o resumo, conforme o
  padrão escolhido.
- Não exibir erros antes de interação ou tentativa de envio.

## Resiliência assíncrona

- Garantir que todo loading termine em sucesso, erro ou cancelamento.
- Evitar respostas obsoletas em consultas, mudanças rápidas de filtros e
  navegação entre rotas.
- Desabilitar a ação responsável durante mutações sem bloquear leitura ou
  navegação desnecessariamente.
- Não remover conteúdo confirmado enquanto uma atualização está em andamento.
- Não aplicar sucesso otimista em criação, edição, exclusão ou transições.
- Após falha de resultado incerto em mutação, orientar sincronização por leitura
  antes de uma nova tentativa.
- Evitar tempestade de notificações quando múltiplas áreas falharem juntas.

## Requisitos técnicos e não funcionais

- Centralizar somente a tradução técnica comum; decisões de UX permanecem na
  feature que conhece a operação.
- Não usar `any`, casts amplos, `innerHTML` ou mensagens técnicas cruas.
- Não registrar dados pessoais, identificadores em massa ou respostas completas.
- Manter estados de erro tipados e mutuamente compreensíveis.
- Garantir que mensagens tenham contraste, texto explícito e acesso por teclado.
- Notificações temporárias, se usadas, devem permanecer tempo suficiente, pausar
  com hover/foco e não ser a única fonte da informação.
- Respeitar `prefers-reduced-motion` em indicadores e notificações.

## Critérios de aceitação

- Todos os formulários mapeiam campos conhecidos e preservam violações
  desconhecidas no resumo.
- Payload de erro malformado nunca quebra a tela e resulta em mensagem segura.
- Falha de rede é distinguível de rejeição de negócio.
- `traceId` válido pode ser copiado ou selecionado para suporte sem expor outros
  dados técnicos.
- GET com erro oferece retry e mutações não são reenviadas automaticamente.
- Nenhum loading permanece ativo indefinidamente após erro ou cancelamento.
- Respostas antigas não sobrescrevem estados de rota ou filtro mais recentes.
- Dados digitados permanecem disponíveis após `400`, `409`, `500` ou offline.

## Testes e verificações

- Testar `400` com violações conhecidas, desconhecidas e ausentes.
- Testar `404`, `409`, `500` com `traceId`, erro de rede e payload malformado.
- Testar limpeza de erro de servidor após alteração do campo.
- Testar preservação de dados e finalização de loading em todos os formulários.
- Testar retry de leitura e ausência de retry automático de mutação.
- Testar respostas fora de ordem, navegação durante requests e anúncios
  acessíveis.
- Inspecionar console e rede para confirmar ausência de logs sensíveis e
  requisições duplicadas.
- Executar testes, lint e build disponíveis.

## Fora de escopo

- Catálogo inventado de `ApiError.code` ou convenção não documentada de campos.
- Telemetria externa, monitoramento de backend ou coleta de dados pessoais.
- Correção de CORS, indisponibilidade do container ou regras do servidor no
  frontend.
