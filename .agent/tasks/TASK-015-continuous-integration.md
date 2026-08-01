# TASK-015 — Configurar integração contínua

**Prioridade:** diferencial recomendado

**Dependências:** TASK-013 e TASK-014

**Resultado:** validação automática e reproduzível das mudanças do frontend

## História de usuário

Como pessoa mantenedora e avaliadora, quero que cada mudança seja validada
automaticamente para identificar regressões antes da entrega ou integração.

## Objetivo

Criar workflow de GitHub Actions proporcional ao frontend final. O workflow deve
usar apenas versões, gerenciador, lockfile e scripts já estabelecidos pelo
projeto, sem inventar comandos nem depender do backend em execução para testes
que usam fronteiras mockadas.

## Requisitos funcionais

- Criar workflow em `.github/workflows/` para pull requests e pushes nos ramos
  relevantes do repositório.
- Fixar a versão de Node.js compatível e documentada no projeto.
- Habilitar cache do gerenciador usando o lockfile como chave.
- Executar instalação determinística apropriada ao gerenciador escolhido.
- Executar os scripts existentes de lint, checagem de tipos, testes e build de
  produção, sem duplicar trabalho quando um script já compõe outro.
- Publicar resumo claro de falha pelo próprio job; artefatos são opcionais e só
  devem ser adicionados quando ajudarem a avaliação.
- Manter os mesmos comandos documentados no README.

## Confiabilidade e segurança

- Definir permissões mínimas para o token do GitHub.
- Não usar secrets para valores públicos nem armazenar credenciais no workflow.
- Não usar versões flutuantes de ferramentas instaladas manualmente durante o
  job.
- Configurar cancelamento de execuções obsoletas do mesmo pull request quando
  isso não ocultar resultados necessários.
- Manter testes determinísticos sem API ou banco compartilhado.
- Não iniciar o container do backend salvo se uma suíte integrada real exigir,
  o procedimento estiver documentado e os dados forem isolados.
- Falhas não devem ser mascaradas com `continue-on-error` nos gates obrigatórios.

## Desempenho e manutenção

- Preferir um job simples enquanto a duração não justificar paralelização.
- Evitar matrizes de versões não exigidas pelo desafio.
- Definir timeout razoável para impedir jobs presos.
- Evitar download ou build duplicado e não versionar saída gerada.
- Atualizar README somente com status e instruções que existam de fato.

## Critérios de aceitação

- Uma execução em ambiente limpo instala dependências pelo lockfile.
- Lint, tipos, testes e build falham o workflow quando encontram regressão.
- A versão de Node e os comandos são iguais aos documentados localmente.
- O workflow não depende de segredos, API compartilhada ou estado anterior.
- Pull requests recebem resultado automático e pushes relevantes também são
  validados.
- Não há permissões de escrita sem necessidade nem etapas ignorando falhas.
- O YAML é válido e todas as actions usadas estão fixadas em versões estáveis.

## Testes e verificações

- Validar sintaxe e caminhos do workflow com ferramenta disponível.
- Executar localmente os mesmos comandos e na mesma ordem antes de enviar.
- Conferir comportamento de cache por inspeção da primeira execução disponível.
- Verificar que uma falha proposital em teste seria propagada pelo script, sem
  manter essa alteração no repositório.
- Revisar logs para garantir ausência de dados sensíveis.

## Fora de escopo

- Deploy automático, hospedagem, domínio ou publicação de imagem Docker.
- Pipeline do backend ou do banco de dados.
- Matriz extensa de navegadores ou versões sem requisito.
- Automação que contorne testes instáveis em vez de corrigi-los.
