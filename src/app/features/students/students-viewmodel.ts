import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';

import { normalizeApiError } from '../../core/api/api-error';
import { EditStudentRequest, SignUpStudentRequest, Student, StudentsApi } from './students-api';

export type StudentsListState =
  | { status: 'loading' }
  | { status: 'success'; students: readonly Student[] }
  | { status: 'error'; message: string };

export function sortStudents(students: readonly Student[]): readonly Student[] {
  return [...students].sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name, 'pt-BR');
    if (nameCompare !== 0) {
      return nameCompare;
    }
    return a.id.localeCompare(b.id);
  });
}

@Injectable()
export class StudentsViewModel {
  private readonly studentsApi = inject(StudentsApi);

  private readonly listState = signal<StudentsListState>({ status: 'loading' });
  private readonly announcementState = signal<string | null>(null);

  readonly state = this.listState.asReadonly();
  readonly announcement = this.announcementState.asReadonly();

  readonly isLoading = computed(() => this.listState().status === 'loading');
  readonly isError = computed(() => this.listState().status === 'error');
  readonly errorMessage = computed(() => {
    const state = this.listState();
    return state.status === 'error' ? state.message : null;
  });

  readonly students = computed(() => {
    const state = this.listState();
    return state.status === 'success' ? state.students : [];
  });

  readonly itemCount = computed(() => this.students().length);
  readonly isEmpty = computed(
    () => this.listState().status === 'success' && this.students().length === 0,
  );

  loadStudents(): void {
    this.listState.set({ status: 'loading' });
    this.studentsApi.listStudents().subscribe({
      next: (students) => {
        this.listState.set({
          status: 'success',
          students: sortStudents(students),
        });
      },
      error: (error: unknown) => {
        const apiError = normalizeApiError(error);
        this.listState.set({ status: 'error', message: apiError.detail });
      },
    });
  }

  setAnnouncement(message: string): void {
    this.announcementState.set(message);
  }

  clearAnnouncement(): void {
    this.announcementState.set(null);
  }

  signUpStudent(request: SignUpStudentRequest): Observable<Student> {
    return this.studentsApi.signUpStudent(request).pipe(
      map((newStudent) => {
        const currentList = this.students();
        this.listState.set({
          status: 'success',
          students: sortStudents([...currentList, newStudent]),
        });
        this.setAnnouncement(`Aluno "${newStudent.name}" cadastrado com sucesso.`);
        return newStudent;
      }),
    );
  }

  editStudent(id: string, request: EditStudentRequest): Observable<Student> {
    return this.studentsApi.editStudent(id, request).pipe(
      map((updatedStudent) => {
        const currentList = this.students().filter((s) => s.id !== id);
        this.listState.set({
          status: 'success',
          students: sortStudents([...currentList, updatedStudent]),
        });
        this.setAnnouncement(`Aluno "${updatedStudent.name}" atualizado com sucesso.`);
        return updatedStudent;
      }),
      catchError((error: unknown) => {
        const apiError = normalizeApiError(error);
        if (apiError.status === 404) {
          this.setAnnouncement('O aluno não foi encontrado. A lista de alunos foi recarregada.');
          this.loadStudents();
        }
        throw apiError;
      }),
    );
  }

  deleteStudent(id: string): Observable<void> {
    const student = this.students().find((s) => s.id === id);
    const studentName = student ? student.name : '';

    return this.studentsApi.deleteStudent(id).pipe(
      map(() => {
        const updatedList = this.students().filter((s) => s.id !== id);
        this.listState.set({
          status: 'success',
          students: updatedList,
        });
        if (studentName) {
          this.setAnnouncement(`Aluno "${studentName}" excluído com sucesso.`);
        } else {
          this.setAnnouncement('Aluno excluído com sucesso.');
        }
      }),
      catchError((error: unknown) => {
        const apiError = normalizeApiError(error);
        if (apiError.status === 404) {
          this.setAnnouncement('O aluno não foi encontrado. A lista de alunos foi recarregada.');
          this.loadStudents();
        }
        throw apiError;
      }),
    );
  }
}
