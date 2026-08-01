import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { Course, CoursesApi } from './courses-api';
import { CoursesViewModel, sortCourses } from './courses-viewmodel';

describe('CoursesViewModel', () => {
  let viewModel: CoursesViewModel;
  let coursesApiMock: {
    listCourses: ReturnType<typeof vi.fn>;
    registerCourse: ReturnType<typeof vi.fn>;
    editCourse: ReturnType<typeof vi.fn>;
    deleteCourse: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    coursesApiMock = {
      listCourses: vi.fn(),
      registerCourse: vi.fn(),
      editCourse: vi.fn(),
      deleteCourse: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [CoursesViewModel, { provide: CoursesApi, useValue: coursesApiMock }],
    });
    viewModel = TestBed.inject(CoursesViewModel);
  });

  it('sorts by name in pt-BR and uses the id as deterministic tiebreaker', () => {
    const original: Course[] = [
      { id: '2', name: 'Zélia' },
      { id: '3', name: 'Ana' },
      { id: '1', name: 'Álvaro' },
      { id: '2-a', name: 'Ana' },
    ];

    const sorted = sortCourses(original);

    expect(sorted.map((course) => `${course.id}:${course.name}`)).toEqual([
      '1:Álvaro',
      '2-a:Ana',
      '3:Ana',
      '2:Zélia',
    ]);
    expect(original[0].name).toBe('Zélia');
  });

  it('treats an empty response as a successful empty collection', () => {
    coursesApiMock.listCourses.mockReturnValue(of([]));

    viewModel.loadCourses();

    expect(viewModel.isLoading()).toBe(false);
    expect(viewModel.isError()).toBe(false);
    expect(viewModel.isEmpty()).toBe(true);
    expect(viewModel.itemCount()).toBe(0);
  });

  it('keeps current courses visible while updating and after a refresh error', () => {
    const currentCourse: Course = { id: 'course-1', name: 'Administração' };
    coursesApiMock.listCourses.mockReturnValueOnce(of([currentCourse]));
    viewModel.loadCourses();

    const refresh = new Subject<readonly Course[]>();
    coursesApiMock.listCourses.mockReturnValueOnce(refresh);
    viewModel.loadCourses();

    expect(viewModel.isUpdating()).toBe(true);
    expect(viewModel.courses()).toEqual([currentCourse]);

    refresh.error(
      new ApiClientError('network', 0, null, 'Não foi possível atualizar os cursos.', null),
    );

    expect(viewModel.isError()).toBe(true);
    expect(viewModel.errorMessage()).toBe('Não foi possível atualizar os cursos.');
    expect(viewModel.courses()).toEqual([currentCourse]);
  });

  it('adds the course returned and normalized by the API only after success', () => {
    coursesApiMock.listCourses.mockReturnValue(of([]));
    viewModel.loadCourses();
    const response = new Subject<Course>();
    coursesApiMock.registerCourse.mockReturnValue(response);

    viewModel.registerCourse({ name: 'Nome enviado' }).subscribe();
    expect(viewModel.courses()).toEqual([]);

    response.next({ id: 'course-1', name: 'Nome normalizado' });
    response.complete();

    expect(viewModel.courses()).toEqual([{ id: 'course-1', name: 'Nome normalizado' }]);
    expect(viewModel.notice()).toEqual({
      tone: 'success',
      message: 'Curso "Nome normalizado" cadastrado com sucesso.',
    });
  });

  it('replaces an edited course with the API response', () => {
    coursesApiMock.listCourses.mockReturnValue(of([{ id: 'course-1', name: 'Computação' }]));
    viewModel.loadCourses();
    coursesApiMock.editCourse.mockReturnValue(
      of({ id: 'course-1', name: 'Ciência da Computação' }),
    );

    viewModel.editCourse('course-1', { name: 'Ciência da Computação' }).subscribe();

    expect(coursesApiMock.editCourse).toHaveBeenCalledWith('course-1', {
      name: 'Ciência da Computação',
    });
    expect(viewModel.courses()).toEqual([{ id: 'course-1', name: 'Ciência da Computação' }]);
  });

  it('reports concurrent removal and reloads after an edit returns 404', () => {
    coursesApiMock.listCourses
      .mockReturnValueOnce(of([{ id: 'course-1', name: 'Computação' }]))
      .mockReturnValueOnce(of([]));
    viewModel.loadCourses();
    const notFound = new ApiClientError('api', 404, 'NOT_FOUND', 'Curso não encontrado.', null);
    coursesApiMock.editCourse.mockReturnValue(throwError(() => notFound));

    let receivedError: unknown;
    viewModel.editCourse('course-1', { name: 'Computação' }).subscribe({
      error: (error: unknown) => (receivedError = error),
    });

    expect(receivedError).toBe(notFound);
    expect(coursesApiMock.listCourses).toHaveBeenCalledTimes(2);
    expect(viewModel.isEmpty()).toBe(true);
    expect(viewModel.notice()?.message).toContain('removido por outra pessoa');
  });

  it('removes a course only when deletion completes successfully', () => {
    coursesApiMock.listCourses.mockReturnValue(of([{ id: 'course-1', name: 'Computação' }]));
    viewModel.loadCourses();
    const deletion = new Subject<void>();
    coursesApiMock.deleteCourse.mockReturnValue(deletion);

    viewModel.deleteCourse('course-1').subscribe();
    expect(viewModel.itemCount()).toBe(1);

    deletion.next();
    deletion.complete();

    expect(viewModel.itemCount()).toBe(0);
    expect(viewModel.notice()?.message).toBe('Curso "Computação" excluído com sucesso.');
  });

  it('reports concurrent removal and reloads after deletion returns 404', () => {
    coursesApiMock.listCourses
      .mockReturnValueOnce(of([{ id: 'course-1', name: 'Computação' }]))
      .mockReturnValueOnce(of([]));
    viewModel.loadCourses();
    coursesApiMock.deleteCourse.mockReturnValue(
      throwError(() => new ApiClientError('api', 404, 'NOT_FOUND', 'Curso não encontrado.', null)),
    );

    viewModel.deleteCourse('course-1').subscribe({ error: () => undefined });

    expect(coursesApiMock.listCourses).toHaveBeenCalledTimes(2);
    expect(viewModel.isEmpty()).toBe(true);
    expect(viewModel.notice()?.tone).toBe('warning');
  });
});
