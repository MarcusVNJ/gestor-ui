import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, concat, map, of, switchMap, throwError } from 'rxjs';

import { normalizeApiError } from '../../core/api/api-error';
import {
  AcademicClass,
  AcademicClassesApi,
  OpeningStatus,
} from '../academic-classes/academic-classes-api';
import { Student, StudentsApi } from '../students/students-api';
import {
  EnrollStudentRequest,
  Enrollment,
  EnrollmentStatus,
  EnrollmentsApi,
} from './enrollments-api';

export type StudentsListState =
  | { status: 'loading' }
  | { status: 'success'; students: readonly Student[] }
  | { status: 'error'; message: string };

export type AcademicClassesListState =
  | { status: 'loading' }
  | { status: 'success'; academicClasses: readonly AcademicClass[] }
  | { status: 'error'; message: string };

export type QueryAxis = 'student' | 'class';

export type QueryState =
  | { status: 'idle' }
  | { status: 'loading'; axis: QueryAxis; targetId: string }
  | { status: 'empty'; axis: QueryAxis; targetId: string }
  | { status: 'success'; axis: QueryAxis; targetId: string; enrollments: readonly Enrollment[] }
  | { status: 'error'; axis: QueryAxis; targetId: string; message: string };

const STATUS_PRIORITY: Record<OpeningStatus, number> = {
  OPEN: 1,
  CLOSED: 2,
};

const ENROLLMENT_STATUS_PRIORITY: Record<EnrollmentStatus, number> = {
  PENDING: 1,
  CONFIRMED: 2,
  CANCELED: 3,
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

export function sortEnrollments(enrollments: readonly Enrollment[]): readonly Enrollment[] {
  return [...enrollments].sort((first, second) => {
    const statusDiff =
      ENROLLMENT_STATUS_PRIORITY[first.status] - ENROLLMENT_STATUS_PRIORITY[second.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    const idDiff = first.id.localeCompare(second.id);
    if (idDiff !== 0) {
      return idDiff;
    }
    const studentDiff = first.studentId.localeCompare(second.studentId);
    if (studentDiff !== 0) {
      return studentDiff;
    }
    return first.academicClassId.localeCompare(second.academicClassId);
  });
}

@Injectable()
export class EnrollmentsViewModel {
  private readonly enrollmentsApi = inject(EnrollmentsApi);
  private readonly studentsApi = inject(StudentsApi);
  private readonly academicClassesApi = inject(AcademicClassesApi);

  private readonly loadStudentsRequests = new Subject<void>();
  private readonly loadClassesRequests = new Subject<void>();
  private readonly queryTargetRequests = new Subject<{ axis: QueryAxis; id: string } | null>();

  private readonly studentsListState = signal<StudentsListState>({ status: 'loading' });
  private readonly classesListState = signal<AcademicClassesListState>({ status: 'loading' });

  private readonly selectedAxisSignal = signal<QueryAxis | null>(null);
  private readonly selectedStudentIdSignal = signal<string>('');
  private readonly selectedClassIdSignal = signal<string>('');
  private readonly queryStateSignal = signal<QueryState>({ status: 'idle' });

  readonly studentsState = this.studentsListState.asReadonly();
  readonly classesState = this.classesListState.asReadonly();

  readonly selectedAxis = this.selectedAxisSignal.asReadonly();
  readonly selectedStudentId = this.selectedStudentIdSignal.asReadonly();
  readonly selectedClassId = this.selectedClassIdSignal.asReadonly();
  readonly queryState = this.queryStateSignal.asReadonly();

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

  readonly selectedStudent = computed(() => {
    const id = this.selectedStudentIdSignal();
    if (!id) {
      return null;
    }
    return this.students().find((s) => s.id === id) ?? null;
  });

  readonly selectedClass = computed(() => {
    const id = this.selectedClassIdSignal();
    if (!id) {
      return null;
    }
    return this.academicClasses().find((c) => c.id === id) ?? null;
  });

  readonly studentMap = computed(() => {
    const map = new Map<string, Student>();
    for (const student of this.students()) {
      map.set(student.id, student);
    }
    return map;
  });

  getStudentById(studentId: string): Student | undefined {
    return this.studentMap().get(studentId);
  }

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

    this.queryTargetRequests
      .pipe(
        switchMap((target) => {
          if (!target || !target.id) {
            return of<QueryState>({ status: 'idle' });
          }

          const { axis, id } = target;
          const request$ =
            axis === 'student'
              ? this.enrollmentsApi.listEnrollmentsByStudent(id)
              : this.enrollmentsApi.listEnrollmentsByAcademicClass(id);

          return concat(
            of<QueryState>({ status: 'loading', axis, targetId: id }),
            request$.pipe(
              map((enrollments): QueryState => {
                const sorted = sortEnrollments(enrollments);
                if (sorted.length === 0) {
                  return { status: 'empty', axis, targetId: id };
                }
                return { status: 'success', axis, targetId: id, enrollments: sorted };
              }),
              catchError((error: unknown) => {
                const apiError = normalizeApiError(error);
                return of<QueryState>({
                  status: 'error',
                  axis,
                  targetId: id,
                  message: apiError.detail || 'Não foi possível carregar as matrículas.',
                });
              }),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.queryStateSignal.set(state));
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

  setQueryAxis(axis: QueryAxis | null): void {
    this.selectedAxisSignal.set(axis);
    this.selectedStudentIdSignal.set('');
    this.selectedClassIdSignal.set('');
    this.queryTargetRequests.next(null);
  }

  selectStudent(studentId: string): void {
    this.selectedStudentIdSignal.set(studentId);
    if (studentId) {
      this.queryTargetRequests.next({ axis: 'student', id: studentId });
    } else {
      this.queryTargetRequests.next(null);
    }
  }

  selectClass(classId: string): void {
    this.selectedClassIdSignal.set(classId);
    if (classId) {
      this.queryTargetRequests.next({ axis: 'class', id: classId });
    } else {
      this.queryTargetRequests.next(null);
    }
  }

  retryQuery(): void {
    const axis = this.selectedAxisSignal();
    const id = axis === 'student' ? this.selectedStudentIdSignal() : this.selectedClassIdSignal();
    if (axis && id) {
      this.queryTargetRequests.next({ axis, id });
    }
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
