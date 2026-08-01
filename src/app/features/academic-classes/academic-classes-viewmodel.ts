import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, switchMap, throwError } from 'rxjs';

import { normalizeApiError } from '../../core/api/api-error';
import {
  AcademicClass,
  AcademicClassesApi,
  EditAcademicClassRequest,
  OpeningStatus,
  RegisterAcademicClassRequest,
} from './academic-classes-api';

export type AcademicClassesListState =
  | { status: 'loading' }
  | { status: 'success'; academicClasses: readonly AcademicClass[] }
  | { status: 'updating'; academicClasses: readonly AcademicClass[] }
  | {
      status: 'error';
      message: string;
      traceId?: string | null;
      academicClasses: readonly AcademicClass[] | null;
    };

export type AcademicClassesNotice = {
  readonly tone: 'success' | 'warning';
  readonly message: string;
};

const STATUS_PRIORITY: Record<OpeningStatus, number> = {
  OPEN: 1,
  CLOSED: 2,
};

export function sortAcademicClasses(classes: readonly AcademicClass[]): readonly AcademicClass[] {
  return [...classes].sort((first, second) => {
    const statusDiff = STATUS_PRIORITY[first.openingStatus] - STATUS_PRIORITY[second.openingStatus];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return first.id.localeCompare(second.id);
  });
}

@Injectable()
export class AcademicClassesViewModel {
  private readonly academicClassesApi = inject(AcademicClassesApi);
  private readonly loadRequests = new Subject<void>();
  private readonly listState = signal<AcademicClassesListState>({ status: 'loading' });
  private readonly noticeState = signal<AcademicClassesNotice | null>(null);

  readonly state = this.listState.asReadonly();
  readonly notice = this.noticeState.asReadonly();

  readonly isLoading = computed(() => this.listState().status === 'loading');
  readonly isUpdating = computed(() => this.listState().status === 'updating');
  readonly isError = computed(() => this.listState().status === 'error');
  readonly errorMessage = computed(() => {
    const state = this.listState();
    return state.status === 'error' ? state.message : null;
  });
  readonly errorTraceId = computed(() => {
    const state = this.listState();
    return state.status === 'error' ? (state.traceId ?? null) : null;
  });

  readonly academicClasses = computed(() => this.resolvedAcademicClasses() ?? []);
  readonly hasResolvedAcademicClasses = computed(() => this.resolvedAcademicClasses() !== null);
  readonly itemCount = computed(() => this.academicClasses().length);
  readonly isEmpty = computed(
    () => this.hasResolvedAcademicClasses() && this.academicClasses().length === 0,
  );

  constructor() {
    this.loadRequests
      .pipe(
        switchMap(() => {
          const currentClasses = this.resolvedAcademicClasses();
          this.listState.set(
            currentClasses === null
              ? { status: 'loading' }
              : { status: 'updating', academicClasses: currentClasses },
          );

          return this.academicClassesApi.listAcademicClasses().pipe(
            map((classes): AcademicClassesListState => ({
              status: 'success',
              academicClasses: sortAcademicClasses(classes),
            })),
            catchError((error: unknown) => {
              const apiError = normalizeApiError(error);
              return of<AcademicClassesListState>({
                status: 'error',
                message: apiError.detail,
                traceId: apiError.traceId,
                academicClasses: currentClasses,
              });
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.listState.set(state));
  }

  loadAcademicClasses(): void {
    this.loadRequests.next();
  }

  clearNotice(): void {
    this.noticeState.set(null);
  }

  registerAcademicClass(request: RegisterAcademicClassRequest): Observable<AcademicClass> {
    return this.academicClassesApi.registerAcademicClass(request).pipe(
      map((createdClass) => {
        this.setAcademicClasses([...this.academicClasses(), createdClass]);
        this.noticeState.set({
          tone: 'success',
          message: 'Turma cadastrada com sucesso.',
        });
        return createdClass;
      }),
    );
  }

  editAcademicClass(id: string, request: EditAcademicClassRequest): Observable<AcademicClass> {
    return this.academicClassesApi.editAcademicClass(id, request).pipe(
      map((updatedClass) => {
        this.setAcademicClasses([
          ...this.academicClasses().filter((cls) => cls.id !== id),
          updatedClass,
        ]);
        this.noticeState.set({
          tone: 'success',
          message: 'Turma atualizada com sucesso.',
        });
        return updatedClass;
      }),
      catchError((error: unknown) => this.handleConcurrentRemoval(error)),
    );
  }

  deleteAcademicClass(id: string): Observable<void> {
    return this.academicClassesApi.deleteAcademicClass(id).pipe(
      map(() => {
        this.setAcademicClasses(this.academicClasses().filter((cls) => cls.id !== id));
        this.noticeState.set({
          tone: 'success',
          message: 'Turma excluída com sucesso.',
        });
      }),
      catchError((error: unknown) => this.handleConcurrentRemoval(error)),
    );
  }

  private resolvedAcademicClasses(): readonly AcademicClass[] | null {
    const state = this.listState();
    if (state.status === 'loading') {
      return null;
    }
    return state.academicClasses;
  }

  private setAcademicClasses(classes: readonly AcademicClass[]): void {
    this.listState.set({ status: 'success', academicClasses: sortAcademicClasses(classes) });
  }

  private handleConcurrentRemoval(error: unknown): Observable<never> {
    const apiError = normalizeApiError(error);
    if (apiError.status === 404) {
      this.noticeState.set({
        tone: 'warning',
        message: 'A turma foi removida por outra pessoa. A lista de turmas está sendo recarregada.',
      });
      this.loadAcademicClasses();
    }
    return throwError(() => apiError);
  }
}
