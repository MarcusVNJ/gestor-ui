import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, switchMap, throwError } from 'rxjs';

import { normalizeApiError } from '../../core/api/api-error';
import { Course, CoursesApi, EditCourseRequest, RegisterCourseRequest } from './courses-api';

export type CoursesListState =
  | { status: 'loading' }
  | { status: 'success'; courses: readonly Course[] }
  | { status: 'updating'; courses: readonly Course[] }
  | { status: 'error'; message: string; courses: readonly Course[] | null };

export type CoursesNotice = {
  readonly tone: 'success' | 'warning';
  readonly message: string;
};

export function sortCourses(courses: readonly Course[]): readonly Course[] {
  return [...courses].sort((first, second) => {
    const nameComparison = first.name.localeCompare(second.name, 'pt-BR');
    return nameComparison !== 0 ? nameComparison : first.id.localeCompare(second.id);
  });
}

@Injectable()
export class CoursesViewModel {
  private readonly coursesApi = inject(CoursesApi);
  private readonly loadRequests = new Subject<void>();
  private readonly listState = signal<CoursesListState>({ status: 'loading' });
  private readonly noticeState = signal<CoursesNotice | null>(null);

  readonly state = this.listState.asReadonly();
  readonly notice = this.noticeState.asReadonly();

  readonly isLoading = computed(() => this.listState().status === 'loading');
  readonly isUpdating = computed(() => this.listState().status === 'updating');
  readonly isError = computed(() => this.listState().status === 'error');
  readonly errorMessage = computed(() => {
    const state = this.listState();
    return state.status === 'error' ? state.message : null;
  });

  readonly courses = computed(() => this.resolvedCourses() ?? []);
  readonly hasResolvedCourses = computed(() => this.resolvedCourses() !== null);
  readonly itemCount = computed(() => this.courses().length);
  readonly isEmpty = computed(() => this.hasResolvedCourses() && this.courses().length === 0);

  constructor() {
    this.loadRequests
      .pipe(
        switchMap(() => {
          const currentCourses = this.resolvedCourses();
          this.listState.set(
            currentCourses === null
              ? { status: 'loading' }
              : { status: 'updating', courses: currentCourses },
          );

          return this.coursesApi.listCourses().pipe(
            map((courses): CoursesListState => ({
              status: 'success',
              courses: sortCourses(courses),
            })),
            catchError((error: unknown) => {
              const apiError = normalizeApiError(error);
              return of<CoursesListState>({
                status: 'error',
                message: apiError.detail,
                courses: currentCourses,
              });
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.listState.set(state));
  }

  loadCourses(): void {
    this.loadRequests.next();
  }

  clearNotice(): void {
    this.noticeState.set(null);
  }

  registerCourse(request: RegisterCourseRequest): Observable<Course> {
    return this.coursesApi.registerCourse(request).pipe(
      map((createdCourse) => {
        this.setCourses([...this.courses(), createdCourse]);
        this.noticeState.set({
          tone: 'success',
          message: `Curso "${createdCourse.name}" cadastrado com sucesso.`,
        });
        return createdCourse;
      }),
    );
  }

  editCourse(id: string, request: EditCourseRequest): Observable<Course> {
    return this.coursesApi.editCourse(id, request).pipe(
      map((updatedCourse) => {
        this.setCourses([...this.courses().filter((course) => course.id !== id), updatedCourse]);
        this.noticeState.set({
          tone: 'success',
          message: `Curso "${updatedCourse.name}" atualizado com sucesso.`,
        });
        return updatedCourse;
      }),
      catchError((error: unknown) => this.handleConcurrentRemoval(error)),
    );
  }

  deleteCourse(id: string): Observable<void> {
    const courseName = this.courses().find((course) => course.id === id)?.name;

    return this.coursesApi.deleteCourse(id).pipe(
      map(() => {
        this.setCourses(this.courses().filter((course) => course.id !== id));
        this.noticeState.set({
          tone: 'success',
          message: courseName
            ? `Curso "${courseName}" excluído com sucesso.`
            : 'Curso excluído com sucesso.',
        });
      }),
      catchError((error: unknown) => this.handleConcurrentRemoval(error)),
    );
  }

  private resolvedCourses(): readonly Course[] | null {
    const state = this.listState();
    if (state.status === 'loading') {
      return null;
    }
    return state.courses;
  }

  private setCourses(courses: readonly Course[]): void {
    this.listState.set({ status: 'success', courses: sortCourses(courses) });
  }

  private handleConcurrentRemoval(error: unknown): Observable<never> {
    const apiError = normalizeApiError(error);
    if (apiError.status === 404) {
      this.noticeState.set({
        tone: 'warning',
        message: 'O curso foi removido por outra pessoa. A lista de cursos está sendo recarregada.',
      });
      this.loadCourses();
    }
    return throwError(() => apiError);
  }
}
