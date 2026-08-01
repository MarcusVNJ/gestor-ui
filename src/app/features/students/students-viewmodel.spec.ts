import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { Student, StudentsApi } from './students-api';
import { StudentsViewModel, sortStudents } from './students-viewmodel';

describe('StudentsViewModel', () => {
  let viewModel: StudentsViewModel;
  let studentsApiMock: {
    listStudents: ReturnType<typeof vi.fn>;
    signUpStudent: ReturnType<typeof vi.fn>;
    editStudent: ReturnType<typeof vi.fn>;
    deleteStudent: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    studentsApiMock = {
      listStudents: vi.fn(),
      signUpStudent: vi.fn(),
      editStudent: vi.fn(),
      deleteStudent: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [StudentsViewModel, { provide: StudentsApi, useValue: studentsApiMock }],
    });

    viewModel = TestBed.inject(StudentsViewModel);
  });

  describe('sortStudents', () => {
    it('sorts students deterministically according to pt-BR locale and fallback id', () => {
      const unsorted: Student[] = [
        { id: '2', name: 'Zélia', email: 'zelia@test.com' },
        { id: '1', name: 'Ana', email: 'ana@test.com' },
        { id: '4', name: 'Álvaro', email: 'alvaro@test.com' },
        { id: '3', name: 'Ana', email: 'ana2@test.com' },
      ];

      const sorted = sortStudents(unsorted);

      expect(sorted.map((s) => `${s.id}:${s.name}`)).toEqual([
        '4:Álvaro',
        '1:Ana',
        '3:Ana',
        '2:Zélia',
      ]);
    });
  });

  describe('loadStudents', () => {
    it('sets state to loading and then success with sorted students', () => {
      const students$: Subject<Student[]> = new Subject();
      studentsApiMock.listStudents.mockReturnValue(students$);

      viewModel.loadStudents();
      expect(viewModel.isLoading()).toBe(true);
      expect(viewModel.students()).toEqual([]);

      const mockStudents: Student[] = [
        { id: 'b', name: 'Bruno', email: 'bruno@test.com' },
        { id: 'a', name: 'Alice', email: 'alice@test.com' },
      ];
      students$.next(mockStudents);

      expect(viewModel.isLoading()).toBe(false);
      expect(viewModel.isEmpty()).toBe(false);
      expect(viewModel.itemCount()).toBe(2);
      expect(viewModel.students()[0].name).toBe('Alice');
      expect(viewModel.students()[1].name).toBe('Bruno');
    });

    it('sets state to empty when API returns an empty array', () => {
      studentsApiMock.listStudents.mockReturnValue(of([]));

      viewModel.loadStudents();

      expect(viewModel.isLoading()).toBe(false);
      expect(viewModel.isEmpty()).toBe(true);
      expect(viewModel.students()).toEqual([]);
      expect(viewModel.itemCount()).toBe(0);
    });

    it('sets state to error when API fails and captures errorTraceId', () => {
      const error = new ApiClientError(
        'api',
        500,
        'SERVER_ERROR',
        'Não foi possível conectar ao serviço.',
        'trace-student-err',
      );
      studentsApiMock.listStudents.mockReturnValue(throwError(() => error));

      viewModel.loadStudents();

      expect(viewModel.isLoading()).toBe(false);
      expect(viewModel.isError()).toBe(true);
      expect(viewModel.errorMessage()).toBe('Não foi possível conectar ao serviço.');
      expect(viewModel.errorTraceId()).toBe('trace-student-err');
    });

    it('cancels stale queries when multiple load requests are issued in quick succession', () => {
      const req1$ = new Subject<Student[]>();
      const req2$ = new Subject<Student[]>();

      studentsApiMock.listStudents.mockReturnValueOnce(req1$).mockReturnValueOnce(req2$);

      viewModel.loadStudents();
      expect(viewModel.isLoading()).toBe(true);

      viewModel.loadStudents();

      // Emit stale response for req1
      req1$.next([{ id: '1', name: 'Stale Student', email: 'stale@test.com' }]);
      req1$.complete();

      // View model should still be loading because req1 was unsubscribed by switchMap
      expect(viewModel.isLoading()).toBe(true);
      expect(viewModel.students()).toEqual([]);

      // Emit current response for req2
      req2$.next([{ id: '2', name: 'Current Student', email: 'current@test.com' }]);
      req2$.complete();

      expect(viewModel.isLoading()).toBe(false);
      expect(viewModel.students().length).toBe(1);
      expect(viewModel.students()[0].name).toBe('Current Student');
    });

    it('supports retryQuery after a query failure', () => {
      const error = new ApiClientError('network', 0, null, 'Falha de rede', null);
      studentsApiMock.listStudents.mockReturnValueOnce(throwError(() => error));

      viewModel.loadStudents();
      expect(viewModel.isError()).toBe(true);

      const mockStudents: Student[] = [{ id: '1', name: 'Ana', email: 'ana@test.com' }];
      studentsApiMock.listStudents.mockReturnValueOnce(of(mockStudents));

      viewModel.loadStudents();

      expect(viewModel.isLoading()).toBe(false);
      expect(viewModel.isError()).toBe(false);
      expect(viewModel.students()).toEqual(mockStudents);
    });
  });

  describe('signUpStudent', () => {
    it('adds created student to collection and sets announcement', () => {
      studentsApiMock.listStudents.mockReturnValue(
        of([{ id: '1', name: 'Bruno', email: 'bruno@test.com' }]),
      );
      viewModel.loadStudents();

      const newStudent: Student = { id: '2', name: 'Ana', email: 'ana@test.com' };
      studentsApiMock.signUpStudent.mockReturnValue(of(newStudent));

      let result: Student | undefined;
      viewModel
        .signUpStudent({ name: 'Ana', email: 'ana@test.com' })
        .subscribe((student) => (result = student));

      expect(result).toEqual(newStudent);
      expect(viewModel.itemCount()).toBe(2);
      expect(viewModel.students()[0].name).toBe('Ana');
      expect(viewModel.announcement()).toBe('Aluno "Ana" cadastrado com sucesso.');
    });
  });

  describe('editStudent', () => {
    it('updates student in collection and sets announcement', () => {
      studentsApiMock.listStudents.mockReturnValue(
        of([{ id: '1', name: 'Ana', email: 'ana@test.com' }]),
      );
      viewModel.loadStudents();

      const updated: Student = { id: '1', name: 'Ana Maria', email: 'anamaria@test.com' };
      studentsApiMock.editStudent.mockReturnValue(of(updated));

      viewModel.editStudent('1', { name: 'Ana Maria', email: 'anamaria@test.com' }).subscribe();

      expect(viewModel.students()[0].name).toBe('Ana Maria');
      expect(viewModel.announcement()).toBe('Aluno "Ana Maria" atualizado com sucesso.');
    });

    it('reloads collection on 404 error during edit', () => {
      studentsApiMock.listStudents.mockReturnValue(
        of([{ id: '1', name: 'Ana', email: 'ana@test.com' }]),
      );
      viewModel.loadStudents();

      const error404 = new ApiClientError('api', 404, 'NOT_FOUND', 'Aluno não encontrado', null);
      studentsApiMock.editStudent.mockReturnValue(throwError(() => error404));

      studentsApiMock.listStudents.mockReturnValue(of([]));

      let caughtError: unknown;
      viewModel
        .editStudent('1', { name: 'Ana', email: 'ana@test.com' })
        .subscribe({ error: (err) => (caughtError = err) });

      expect(caughtError).toBe(error404);
      expect(viewModel.announcement()).toBe(
        'O aluno não foi encontrado. A lista de alunos foi recarregada.',
      );
      expect(studentsApiMock.listStudents).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteStudent', () => {
    it('removes student from collection on 204 success and sets announcement', () => {
      studentsApiMock.listStudents.mockReturnValue(
        of([{ id: '1', name: 'Ana', email: 'ana@test.com' }]),
      );
      viewModel.loadStudents();

      studentsApiMock.deleteStudent.mockReturnValue(of(undefined));

      viewModel.deleteStudent('1').subscribe();

      expect(viewModel.itemCount()).toBe(0);
      expect(viewModel.isEmpty()).toBe(true);
      expect(viewModel.announcement()).toBe('Aluno "Ana" excluído com sucesso.');
    });

    it('reloads collection on 404 error during delete', () => {
      studentsApiMock.listStudents.mockReturnValue(
        of([{ id: '1', name: 'Ana', email: 'ana@test.com' }]),
      );
      viewModel.loadStudents();

      const error404 = new ApiClientError('api', 404, 'NOT_FOUND', 'Aluno não encontrado', null);
      studentsApiMock.deleteStudent.mockReturnValue(throwError(() => error404));
      studentsApiMock.listStudents.mockReturnValue(of([]));

      let caughtError: unknown;
      viewModel.deleteStudent('1').subscribe({ error: (err) => (caughtError = err) });

      expect(caughtError).toBe(error404);
      expect(viewModel.announcement()).toBe(
        'O aluno não foi encontrado. A lista de alunos foi recarregada.',
      );
      expect(studentsApiMock.listStudents).toHaveBeenCalledTimes(2);
    });
  });
});
