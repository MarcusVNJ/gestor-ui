import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, switchMap, throwError } from 'rxjs';

import { normalizeApiError } from '../../core/api/api-error';
import {
  Discipline,
  DisciplinesApi,
  EditDisciplineRequest,
  RegisterDisciplineRequest,
} from './disciplines-api';

export type DisciplinesListState =
  | { status: 'loading' }
  | { status: 'success'; disciplines: readonly Discipline[] }
  | { status: 'updating'; disciplines: readonly Discipline[] }
  | { status: 'error'; message: string; disciplines: readonly Discipline[] | null };

export type DisciplinesNotice = {
  readonly tone: 'success' | 'warning';
  readonly message: string;
};

export function sortDisciplines(disciplines: readonly Discipline[]): readonly Discipline[] {
  return [...disciplines].sort((first, second) => {
    const nameComparison = first.name.localeCompare(second.name, 'pt-BR');
    return nameComparison !== 0 ? nameComparison : first.id.localeCompare(second.id);
  });
}

@Injectable()
export class DisciplinesViewModel {
  private readonly disciplinesApi = inject(DisciplinesApi);
  private readonly loadRequests = new Subject<void>();
  private readonly listState = signal<DisciplinesListState>({ status: 'loading' });
  private readonly noticeState = signal<DisciplinesNotice | null>(null);

  readonly state = this.listState.asReadonly();
  readonly notice = this.noticeState.asReadonly();

  readonly isLoading = computed(() => this.listState().status === 'loading');
  readonly isUpdating = computed(() => this.listState().status === 'updating');
  readonly isError = computed(() => this.listState().status === 'error');
  readonly errorMessage = computed(() => {
    const state = this.listState();
    return state.status === 'error' ? state.message : null;
  });

  readonly disciplines = computed(() => this.resolvedDisciplines() ?? []);
  readonly hasResolvedDisciplines = computed(() => this.resolvedDisciplines() !== null);
  readonly itemCount = computed(() => this.disciplines().length);
  readonly isEmpty = computed(
    () => this.hasResolvedDisciplines() && this.disciplines().length === 0,
  );

  constructor() {
    this.loadRequests
      .pipe(
        switchMap(() => {
          const currentDisciplines = this.resolvedDisciplines();
          this.listState.set(
            currentDisciplines === null
              ? { status: 'loading' }
              : { status: 'updating', disciplines: currentDisciplines },
          );

          return this.disciplinesApi.listDisciplines().pipe(
            map((disciplines): DisciplinesListState => ({
              status: 'success',
              disciplines: sortDisciplines(disciplines),
            })),
            catchError((error: unknown) => {
              const apiError = normalizeApiError(error);
              return of<DisciplinesListState>({
                status: 'error',
                message: apiError.detail,
                disciplines: currentDisciplines,
              });
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.listState.set(state));
  }

  loadDisciplines(): void {
    this.loadRequests.next();
  }

  clearNotice(): void {
    this.noticeState.set(null);
  }

  registerDiscipline(request: RegisterDisciplineRequest): Observable<Discipline> {
    return this.disciplinesApi.registerDiscipline(request).pipe(
      map((createdDiscipline) => {
        this.setDisciplines([...this.disciplines(), createdDiscipline]);
        this.noticeState.set({
          tone: 'success',
          message: `Disciplina "${createdDiscipline.name}" cadastrada com sucesso.`,
        });
        return createdDiscipline;
      }),
    );
  }

  editDiscipline(id: string, request: EditDisciplineRequest): Observable<Discipline> {
    return this.disciplinesApi.editDiscipline(id, request).pipe(
      map((updatedDiscipline) => {
        this.setDisciplines([
          ...this.disciplines().filter((discipline) => discipline.id !== id),
          updatedDiscipline,
        ]);
        this.noticeState.set({
          tone: 'success',
          message: `Disciplina "${updatedDiscipline.name}" atualizada com sucesso.`,
        });
        return updatedDiscipline;
      }),
      catchError((error: unknown) => this.handleConcurrentRemoval(error)),
    );
  }

  deleteDiscipline(id: string): Observable<void> {
    const disciplineName = this.disciplines().find((discipline) => discipline.id === id)?.name;

    return this.disciplinesApi.deleteDiscipline(id).pipe(
      map(() => {
        this.setDisciplines(this.disciplines().filter((discipline) => discipline.id !== id));
        this.noticeState.set({
          tone: 'success',
          message: disciplineName
            ? `Disciplina "${disciplineName}" excluída com sucesso.`
            : 'Disciplina excluída com sucesso.',
        });
      }),
      catchError((error: unknown) => this.handleConcurrentRemoval(error)),
    );
  }

  private resolvedDisciplines(): readonly Discipline[] | null {
    const state = this.listState();
    if (state.status === 'loading') {
      return null;
    }
    return state.disciplines;
  }

  private setDisciplines(disciplines: readonly Discipline[]): void {
    this.listState.set({ status: 'success', disciplines: sortDisciplines(disciplines) });
  }

  private handleConcurrentRemoval(error: unknown): Observable<never> {
    const apiError = normalizeApiError(error);
    if (apiError.status === 404) {
      this.noticeState.set({
        tone: 'warning',
        message:
          'A disciplina foi removida por outra pessoa. A lista de disciplinas está sendo recarregada.',
      });
      this.loadDisciplines();
    }
    return throwError(() => apiError);
  }
}
