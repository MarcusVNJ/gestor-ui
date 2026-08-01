import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, switchMap, throwError } from 'rxjs';

import { normalizeApiError } from '../../core/api/api-error';
import {
  AcademicClass,
  AcademicClassesApi,
  OpeningStatus,
} from '../academic-classes/academic-classes-api';
import { Student, StudentsApi } from '../students/students-api';
import { EnrollStudentRequest, Enrollment, EnrollmentsApi } from './enrollments-api';

export type StudentsListState =
  | { status: 'loading' }
  | { status: 'success'; students: readonly Student[] }
  | { status: 'error'; message: string };

export type AcademicClassesListState =
  | { status: 'loading' }
  | { status: 'success'; academicClasses: readonly AcademicClass[] }
  | { status: 'error'; message: string };

const STATUS_PRIORITY: Record<OpeningStatus, number> = {
  OPEN: 1,
  CLOSED: 2,
};

export function sortStudentsByName(students: readonly Student[]): readonly Student[] {
  return [...students].sort((first, second) =>
    first.name.localeCompare(second.name, undefined, { sensitivity: 'base' }),
  );
}

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
export class EnrollmentsViewModel {
  private readonly enrollmentsApi = inject(EnrollmentsApi);
  private readonly studentsApi = inject(StudentsApi);
  private readonly academicClassesApi = inject(AcademicClassesApi);

  private readonly loadStudentsRequests = new Subject<void>();
  private readonly loadClassesRequests = new Subject<void>();

  private readonly studentsListState = signal<StudentsListState>({ status: 'loading' });
  private readonly classesListState = signal<AcademicClassesListState>({ status: 'loading' });

  readonly studentsState = this.studentsListState.asReadonly();
  readonly classesState = this.classesListState.asReadonly();

  readonly isStudentsLoading = computed(() => this.studentsListState().status === 'loading');
  readonly isStudentsError = computed(() => this.studentsListState().status === 'error');
  readonly studentsErrorMessage = computed(() => {
    const state = this.studentsListState();
    return state.status === 'error' ? state.message : null;
  });
  readonly students = computed(() => {
    const state = this.studentsListState();
    return state.status === 'success' ? state.students : [];
  });

  readonly isClassesLoading = computed(() => this.classesListState().status === 'loading');
  readonly isClassesError = computed(() => this.classesListState().status === 'error');
  readonly classesErrorMessage = computed(() => {
    const state = this.classesListState();
    return state.status === 'error' ? state.message : null;
  });
  readonly academicClasses = computed(() => {
    const state = this.classesListState();
    return state.status === 'success' ? state.academicClasses : [];
  });

  readonly openAcademicClasses = computed(() =>
    this.academicClasses().filter((cls) => cls.openingStatus === 'OPEN'),
  );

  readonly hasOpenAcademicClasses = computed(() => this.openAcademicClasses().length > 0);

  readonly isOptionsLoading = computed(() => this.isStudentsLoading() || this.isClassesLoading());

  constructor() {
    this.loadStudentsRequests
      .pipe(
        switchMap(() => {
          this.studentsListState.set({ status: 'loading' });
          return this.studentsApi.listStudents().pipe(
            map((students): StudentsListState => ({
              status: 'success',
              students: sortStudentsByName(students),
            })),
            catchError((error: unknown) => {
              const apiError = normalizeApiError(error);
              return of<StudentsListState>({
                status: 'error',
                message: apiError.detail || 'Não foi possível carregar a lista de alunos.',
              });
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.studentsListState.set(state));

    this.loadClassesRequests
      .pipe(
        switchMap(() => {
          this.classesListState.set({ status: 'loading' });
          return this.academicClassesApi.listAcademicClasses().pipe(
            map((classes): AcademicClassesListState => ({
              status: 'success',
              academicClasses: sortAcademicClasses(classes),
            })),
            catchError((error: unknown) => {
              const apiError = normalizeApiError(error);
              return of<AcademicClassesListState>({
                status: 'error',
                message: apiError.detail || 'Não foi possível carregar a lista de turmas.',
              });
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.classesListState.set(state));
  }

  loadStudents(): void {
    this.loadStudentsRequests.next();
  }

  loadAcademicClasses(): void {
    this.loadClassesRequests.next();
  }

  loadOptions(): void {
    this.loadStudents();
    this.loadAcademicClasses();
  }

  enrollStudent(request: EnrollStudentRequest): Observable<Enrollment> {
    return this.enrollmentsApi.enrollStudent(request).pipe(
      catchError((error: unknown) => {
        const apiError = normalizeApiError(error);
        if (apiError.status === 400) {
          this.loadAcademicClasses();
        } else if (apiError.status === 404) {
          this.loadStudents();
          this.loadAcademicClasses();
        }
        return throwError(() => apiError);
      }),
    );
  }
}
