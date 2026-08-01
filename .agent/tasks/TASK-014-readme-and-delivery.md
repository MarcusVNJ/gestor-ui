# TASK-014 — Preparar README e entrega reproduzível

**Prioridade:** obrigatória

**Dependências:** TASK-001 a TASK-013

**Resultado:** repositório documentado, reproduzível e pronto para avaliação

## História de usuário

Como pessoa avaliadora, quero instalar, executar, testar e compreender o frontend
sem conhecimento prévio para verificar a solução e suas decisões técnicas.

## Requisitos funcionais da documentação

- Criar ou concluir o `README.md` da raiz com nome e objetivo do sistema.
- Listar funcionalidades entregues e deixar claro que este repositório contém o
  frontend Angular que consome um backend já existente.
- Documentar pré-requisitos com versões reais de Node.js e do gerenciador
  adotado.
- Informar instalação determinística usando o lockfile versionado.
- Documentar comandos reais de desenvolvimento, testes, lint, checagem de tipos
  e build; não citar scripts inexistentes.
- Explicar como apontar o frontend para `http://localhost:8080`, incluindo proxy
  local, configuração por ambiente e implicações de CORS.
- Incluir o procedimento confirmado para iniciar o backend em Docker ou Compose.
  Se ele não for fornecido até esta tarefa, registrar o bloqueio e pedir a
  informação em vez de inventar um comando.
- Informar URL local e rotas principais da aplicação.

## Decisões técnicas obrigatórias

- Registrar versões e principais tecnologias utilizadas.
- Resumir organização por features e responsabilidades de apresentação, estado
  e integração HTTP realmente adotadas.
- Explicar uso de Signals e RxJS conforme a versão Angular e as necessidades de
  estado, cancelamento e concorrência.
- Descrever a estratégia de erros `application/problem+json` e o tratamento de
  conflitos do backend.
- Explicar as decisões de design flat azul, tipografia do sistema,
  responsividade e acessibilidade.
- Descrever estratégia e níveis de teste, incluindo comandos e verificações
  manuais.
- Registrar decisões relevantes sem transformar o README em cópia do código.

## Limitações e contrato

- Referenciar `.agent/knowledge-base/api-docs.json` como contrato usado.
- Documentar que não há GET por ID, paginação ou ordenação garantida.
- Informar que curso, disciplina e turma não possuem relações no contrato.
- Informar que turma não possui nome e que a API não expõe ocupação ou vagas
  disponíveis.
- Informar que matrículas não têm listagem global, exclusão ou reativação.
- Registrar a divergência de validação do cadastro de disciplina.
- Explicar dependências ainda abertas de CORS, gateway ou execução do backend,
  caso permaneçam sem confirmação.
- Não apresentar limitações do backend como defeitos implementados ou corrigidos
  no frontend.

## Uso de inteligência artificial

- Incluir a declaração de uso de IA solicitada pelo desafio.
- Informar de forma objetiva onde a IA apoiou, por exemplo planejamento,
  implementação, testes ou documentação, apenas se isso corresponder ao trabalho
  realizado.
- Declarar que o resultado foi revisado e que as decisões e o código permanecem
  sob responsabilidade da pessoa autora.
- Não atribuir à IA atividades que não ocorreram nem ocultar seu uso.

## Reprodutibilidade e segurança

- Fixar um único gerenciador e versionar o lockfile correspondente.
- Não exigir arquivo com segredo para execução local.
- Fornecer exemplo de configuração somente para valores públicos e necessários.
- Confirmar que artefatos locais, caches e configurações pessoais estão
  ignorados sem remover arquivos de outras pessoas.
- Testar as instruções a partir de instalação limpa no ambiente disponível.
- Garantir que o README e o `package.json` descrevam os mesmos comandos.

## Critérios de aceitação

- Uma pessoa consegue instalar dependências, iniciar o frontend, executar testes
  e gerar build seguindo apenas o README e informações fornecidas do backend.
- Todos os comandos copiados do README existem e foram executados com resultado
  registrado durante a entrega.
- A conexão local com a API está explicada sem fixar host em componentes.
- Arquitetura, decisões visuais, testes, limitações e uso de IA estão descritos.
- O README não promete autenticação, dashboard, relações, paginação ou outras
  funcionalidades ausentes.
- Nenhum segredo, dado pessoal, log temporário ou artefato de build indevido é
  incluído.
- O diff final contém somente mudanças relacionadas ao desafio.

## Verificações finais

- Seguir o README em uma instalação limpa, na medida permitida pelo ambiente.
- Executar todos os comandos documentados e o build de produção.
- Validar os links internos, caminhos de arquivos e exemplos de configuração.
- Comparar funcionalidades descritas com as rotas e o contrato reais.
- Revisar a aplicação em desktop, mobile e teclado antes da entrega.

## Informações externas necessárias

- Comando ou arquivo Compose usado para iniciar o backend fornecido.
- Política de CORS ou URL do gateway para um frontend em outra origem.
- Restrições externas de Node.js ou gerenciador de pacotes, se existirem.

Essas informações não bloqueiam a implementação funcional, mas devem estar
confirmadas para que a documentação integrada seja completamente reproduzível.

## Fora de escopo

- Documentar implementação interna do backend sem fonte verificável.
- Criar container, migrations ou scripts de banco para o backend.
- Publicação, domínio ou infraestrutura de produção não solicitados.
