import { Routes } from '@angular/router';

import { Home } from './home/home';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Início | Gestor acadêmico',
    pathMatch: 'full',
  },
  { path: 'alunos', redirectTo: '', pathMatch: 'full' },
  { path: 'cursos', redirectTo: '', pathMatch: 'full' },
  { path: 'disciplinas', redirectTo: '', pathMatch: 'full' },
  { path: 'turmas', redirectTo: '', pathMatch: 'full' },
  { path: 'matriculas', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
