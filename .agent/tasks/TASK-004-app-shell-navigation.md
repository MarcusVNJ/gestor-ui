# TASK-004 — Implementar shell, navegação e rotas

**Prioridade:** obrigatória

**Dependências:** TASK-001 e TASK-003

**Resultado:** estrutura de navegação responsiva para todas as áreas

## História de usuário

Como pessoa usuária do sistema acadêmico, quero navegar entre os cadastros e as
matrículas de maneira previsível para concluir minhas atividades sem me perder.

## Requisitos funcionais

- Criar shell com link “Ir para o conteúdo”, identidade do sistema, navegação
  principal e região de conteúdo.
- Disponibilizar links para Alunos, Cursos, Disciplinas, Turmas e Matrículas.
- Definir rota inicial previsível, preferencialmente redirecionando para a
  primeira área funcional enquanto não houver dashboard requerido.
- Exibir item atual com indicação visual e `aria-current="page"`.
- Implementar página de rota não encontrada com ação de retorno segura.
- Atualizar o título do documento conforme a rota.
- Quando aplicável, mover o foco para o `h1` após navegação iniciada pelo usuário.

## Layout responsivo

- Em telas largas, usar navegação lateral de aproximadamente `15rem` e conteúdo
  limitado a cerca de `90rem`.
- Abaixo do breakpoint orientado pelo conteúdo, usar barra superior e drawer.
- O botão do drawer deve possuir nome acessível e `aria-expanded` correto.
- `Escape` fecha o drawer, o fundo fica inerte enquanto ele estiver aberto e o
  foco retorna ao acionador.
- Desktop e mobile devem compartilhar o mesmo conteúdo e a mesma lógica.
- Não deve existir rolagem horizontal na página.

## Requisitos técnicos e não funcionais

- Usar `nav`, `main`, headings e links semânticos; ações usam `button`.
- Manter a ordem do DOM compatível com a ordem visual.
- Considerar lazy loading por feature se suportado e proporcional ao projeto.
- Não controlar layout puramente visual por `window.innerWidth` ou Signals.
- Usar CSS para responsividade; JavaScript somente para comportamento real do
  drawer e foco.
- Garantir alvo de toque mínimo e foco visível em fundo azul-marinho.
- Não criar menu de usuário, autenticação, notificações ou dashboard sem
  requisito.

## Critérios de aceitação

- Todos os cinco destinos podem ser acessados por mouse, toque e teclado.
- O link de salto aparece ao receber foco e leva ao conteúdo principal.
- O item atual não depende apenas de cor para ser reconhecido.
- Drawer mantém o foco, fecha com `Escape` e restaura o foco corretamente.
- Recarregar uma rota conhecida não quebra o shell.
- Rota desconhecida apresenta página 404 interna sem erro no console.
- O layout funciona em `320px` e desktop sem duplicação de árvores de conteúdo.

## Testes e verificações

- Testar renderização dos links e estado ativo.
- Testar abertura, fechamento, foco e tecla `Escape` do drawer.
- Testar título da página e rota desconhecida.
- Percorrer toda a navegação somente com teclado.
- Verificar zoom, redução de movimento e viewports definidos na TASK-003.
- Executar testes, lint e build disponíveis.

## Fora de escopo

- Conteúdo funcional dos CRUDs.
- Autenticação ou autorização.
- Dashboard ou indicadores acadêmicos.
