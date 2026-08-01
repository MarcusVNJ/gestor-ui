import { Routes } from '@angular/router';

const loadFeaturePage = () =>
  import('./pages/feature-page/feature-page').then(({ FeaturePage }) => FeaturePage);

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'alunos',
    pathMatch: 'full',
  },
  {
    path: 'alunos',
    loadComponent: () =>
      import('./features/students/students-page').then(({ StudentsPage }) => StudentsPage),
    title: 'Alunos | Gestor acadêmico',
    data: {
      heading: 'Alunos',
      description: 'Consulte e gerencie os registros de alunos nesta área.',
    },
  },
  {
    path: 'cursos',
    loadComponent: () =>
      import('./features/courses/courses-page').then(({ CoursesPage }) => CoursesPage),
    title: 'Cursos | Gestor acadêmico',
    data: {
      heading: 'Cursos',
      description: 'Consulte e gerencie os cursos oferecidos pela instituição.',
    },
  },
  {
    path: 'disciplinas',
    loadComponent: () =>
      import('./features/disciplines/disciplines-page').then(
        ({ DisciplinesPage }) => DisciplinesPage,
      ),
    title: 'Disciplinas | Gestor acadêmico',
    data: {
      heading: 'Disciplinas',
      description: 'Consulte e gerencie as disciplinas da estrutura acadêmica.',
    },
  },
  {
    path: 'turmas',
    loadComponent: () =>
      import('./features/academic-classes/academic-classes-page').then(
        ({ AcademicClassesPage }) => AcademicClassesPage,
      ),
    title: 'Turmas | Gestor acadêmico',
    data: {
      heading: 'Turmas',
      description: 'Consulte e gerencie as turmas disponíveis para matrícula.',
    },
  },
  {
    path: 'matriculas',
    loadComponent: loadFeaturePage,
    title: 'Matrículas | Gestor acadêmico',
    data: {
      heading: 'Matrículas',
      description: 'Consulte e gerencie os vínculos de alunos com as turmas.',
    },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then(({ NotFound }) => NotFound),
    title: 'Página não encontrada | Gestor acadêmico',
  },
];
