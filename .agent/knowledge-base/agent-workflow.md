# Fluxo de trabalho do agente

Use este processo para qualquer tarefa de implementação, correção ou revisão.

## 1. Entender antes de alterar

- Leia o pedido, os critérios de aceitação e as restrições.
- Localize a raiz do projeto e identifique gerenciador de pacotes, scripts,
  framework, versão do TypeScript e estrutura de pastas.
- Leia os arquivos diretamente relacionados e seus testes.
- Procure implementações semelhantes antes de criar um novo padrão.
- Verifique o estado do Git e preserve alterações que não pertencem à tarefa.
- Não assuma bibliotecas ou comandos que não estejam declarados no projeto.

Se um requisito mudar comportamento público e houver mais de uma interpretação
plausível, esclareça a intenção. Para detalhes internos reversíveis, escolha a
solução mais simples compatível com o código atual.

## 2. Planejar pelo comportamento

Antes de escrever código, defina:

- qual comportamento observável deve mudar;
- quais módulos serão afetados;
- quais estados existem: carregando, sucesso, vazio, erro e indisponível;
- quais entradas externas precisam de validação;
- como a mudança será verificada.

Evite ampliar o escopo. Refatorações auxiliares só devem ocorrer quando forem
necessárias para implementar com segurança ou quando reduzirem claramente o
risco da própria mudança.

## 3. Implementar em incrementos

- Faça a menor alteração funcional possível.
- Mantenha regras de negócio fora de detalhes de UI e transporte.
- Preserve os contratos existentes, salvo quando a tarefa exigir sua mudança.
- Use nomes do domínio, tipos explícitos nos limites e retornos previsíveis.
- Trate falhas onde houver contexto para recuperá-las ou apresentá-las.
- Não silencie erros com `any`, assertions ou blocos `catch` vazios.

## 4. Verificar

Execute os scripts definidos pelo projeto, preferencialmente nesta ordem:

1. testes diretamente relacionados;
2. verificação de tipos;
3. lint e formatter em modo de verificação;
4. suíte completa de testes;
5. build de produção.

Não invente nomes de scripts. Consulte `package.json` e a documentação do
repositório. Se alguma verificação não puder ser executada, informe exatamente
qual e por quê.

Além da automação, confira manualmente:

- fluxo principal e casos de borda;
- navegação por teclado e foco;
- layout em telas pequenas e grandes;
- mensagens de erro e possibilidade de recuperação;
- ausência de dados sensíveis no cliente e nos logs.

## 5. Revisar o próprio diff

- O diff contém somente mudanças relacionadas?
- Há duplicação ou complexidade acidental?
- Os nomes explicam a intenção?
- Todo `any`, assertion, comentário e abstração nova é realmente necessário?
- Os testes verificam comportamento e falhariam sem a implementação?
- Foram removidos logs, TODOs temporários, imports e código não usados?

## 6. Comunicar o resultado

Relate de forma objetiva:

- o comportamento implementado;
- os principais arquivos alterados;
- as verificações executadas e seus resultados;
- riscos, limitações ou passos pendentes reais.

Não declare sucesso para comandos que não foram executados.
