# TASK-013 — Consolidar testes e auditoria de acessibilidade

**Prioridade:** obrigatória

**Dependências:** TASK-001 a TASK-012

**Resultado:** cobertura dos riscos críticos e validação final da interface

## História de usuário

Como pessoa avaliadora e mantenedora, quero uma suíte confiável e evidências de
acessibilidade para validar o comportamento do frontend e evoluí-lo com segurança.

## Objetivo

Revisar os testes adicionados em cada tarefa, preencher lacunas de risco e
executar uma auditoria final. Testes devem validar comportamento público, não
detalhes internos, e usar as ferramentas realmente configuradas no projeto.

## Cobertura obrigatória da integração HTTP

- Verificar URL, método, parâmetros e body das 21 operações do OpenAPI.
- Cobrir arrays diretos e vazios, criações `201`, edições `200`, exclusões `204`
  sem body e transições de matrícula.
- Cobrir erro válido com e sem `violations`, payload malformado e falha de rede.
- Confirmar que não existem retries automáticos de mutação.
- Usar o mecanismo de teste HTTP compatível com a versão instalada do Angular,
  sem acessar o backend real nos testes determinísticos.

## Cobertura obrigatória das features

- Alunos, cursos, disciplinas e turmas: loading, vazio, erro, cadastro, edição,
  exclusão, validação, conflito documentado e prevenção de submissão duplicada.
- Matrícula: listas auxiliares, criação pendente, duplicidade, turma fechada e
  entidade removida.
- Consultas: dois eixos, seleção obrigatória, array vazio, estados traduzidos,
  ordenação determinística e respostas fora de ordem.
- Transições: matriz de ações por estado, confirmação, cancelamento, lotação,
  conflito de estado e atualização pela resposta oficial.
- Erros: mapeamento de violations, fallback, `traceId`, preservação dos dados e
  encerramento de loading.
- Rotas e shell: destinos, item ativo, rota desconhecida e drawer responsivo.

## Estratégia de testes

- Priorizar testes unitários para transformação, ordenação e normalização de
  erros.
- Testar ViewModels ou estado de feature para comandos, concorrência e estados
  assíncronos quando essa camada existir.
- Usar testes de componente para formulários, diálogos, foco, tabelas e feedback.
- Consultar elementos por papel, nome acessível e texto visível; evitar seletores
  baseados em classes de CSS ou estrutura privada.
- Usar interação próxima da pessoa usuária e espera assíncrona, sem sleeps.
- Mockar somente fronteiras externas e manter tempo, rede e estado
  determinísticos.
- Cobrir ao menos uma jornada crítica no maior nível de integração sustentável
  pela ferramenta adotada. Se não houver runner E2E, registrar a decisão e
  executar a jornada como verificação manual reproduzível, sem inventar script.

## Auditoria de acessibilidade

- Executar auditoria automatizada com ferramenta já disponível ou com a menor
  dependência mantida e compatível que o projeto justificar.
- Não aceitar violações críticas ou sérias sem correção ou justificativa explícita.
- Percorrer somente com teclado: navegação, CRUD completo, criação, consulta,
  confirmação e cancelamento de matrícula.
- Verificar link de salto, landmarks, headings, labels, nomes acessíveis, tabelas,
  `aria-current`, mensagens e foco de overlays.
- Confirmar que estados, erros e seleções não dependem somente de cor.
- Verificar leitor de tela pelo menos nos formulários, mensagens de erro,
  resultados de consulta e alterações de status.

## Matriz manual responsiva e de robustez

- Testar larguras de `320px`, `768px`, `1024px` e `1440px`.
- Testar zoom em `200%` e reflow equivalente a `400%` onde aplicável.
- Confirmar que apenas regiões de tabela têm rolagem horizontal.
- Testar `prefers-reduced-motion: reduce`.
- Testar nomes com 120 caracteres, e-mail com 254, UUIDs completos e listas
  vazias.
- Simular rede lenta, offline, respostas fora de ordem e códigos `400`, `404`,
  `409` e `500`.
- Verificar exclusão bloqueada de aluno e turma, redução inválida de vagas e
  confirmação sem capacidade.

## Requisitos técnicos e não funcionais

- Não reduzir opções estritas do TypeScript para facilitar testes.
- Não duplicar fixtures incompatíveis com os DTOs; usar builders pequenos apenas
  quando houver repetição semântica real.
- Manter testes independentes de ordem e sem estado global vazando entre casos.
- Não exigir backend compartilhado para a suíte padrão.
- Medir cobertura somente como indicador; os cenários de risco têm prioridade
  sobre percentual arbitrário.
- Corrigir flakiness e warnings relevantes em vez de ocultá-los.

## Critérios de aceitação

- Todos os comportamentos obrigatórios acima possuem teste automatizado ou, para
  verificações inerentemente manuais, evidência reproduzível documentada.
- A suíte falha se URL, verbo, payload ou enum do contrato for alterado
  incorretamente.
- Os testes demonstram que respostas obsoletas não substituem a seleção atual.
- Todas as jornadas críticas podem ser realizadas somente por teclado.
- A auditoria automatizada não possui violações críticas ou sérias pendentes.
- Os quatro viewports e os níveis de zoom definidos são utilizáveis sem perda de
  conteúdo essencial.
- Testes, lint, checagem de tipos e build de produção passam sem logs temporários.

## Verificações finais

- Executar instalação determinística a partir do lockfile.
- Executar todos os scripts de qualidade declarados no `package.json`.
- Executar build de produção.
- Registrar comandos e resultados reais para uso na TASK-014.
- Revisar console do navegador, navegação por teclado e painel de acessibilidade.

## Fora de escopo

- Testes internos do backend, banco, Docker ou concorrência transacional.
- Percentual de cobertura inventado sem requisito do desafio.
- Ferramentas redundantes ou uma segunda stack de testes sem justificativa.
