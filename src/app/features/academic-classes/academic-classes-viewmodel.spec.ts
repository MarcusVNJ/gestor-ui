import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { AcademicClass, AcademicClassesApi } from './academic-classes-api';
import { AcademicClassesViewModel, sortAcademicClasses } from './academic-classes-viewmodel';

describe('AcademicClassesViewModel', () => {
  let viewModel: AcademicClassesViewModel;
  let academicClassesApiMock: {
    listAcademicClasses: ReturnType<typeof vi.fn>;
    registerAcademicClass: ReturnType<typeof vi.fn>;
    editAcademicClass: ReturnType<typeof vi.fn>;
    deleteAcademicClass: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    academicClassesApiMock = {
      listAcademicClasses: vi.fn(),
      registerAcademicClass: vi.fn(),
      editAcademicClass: vi.fn(),
      deleteAcademicClass: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        AcademicClassesViewModel,
        { provide: AcademicClassesApi, useValue: academicClassesApiMock },
      ],
    });
    viewModel = TestBed.inject(AcademicClassesViewModel);
  });

  it('sorts by openingStatus (OPEN first, CLOSED second) and UUID as deterministic tiebreaker', () => {
    const original: AcademicClass[] = [
      { id: 'b-closed-id', openingStatus: 'CLOSED', seatLimit: 20 },
      { id: 'z-open-id', openingStatus: 'OPEN', seatLimit: 30 },
      { id: 'a-open-id', openingStatus: 'OPEN', seatLimit: 10 },
      { id: 'a-closed-id', openingStatus: 'CLOSED', seatLimit: 15 },
    ];

    const sorted = sortAcademicClasses(original);

    expect(sorted.map((item) => `${item.openingStatus}:${item.id}`)).toEqual([
      'OPEN:a-open-id',
      'OPEN:z-open-id',
      'CLOSED:a-closed-id',
      'CLOSED:b-closed-id',
    ]);
  });

  it('treats an empty response as a successful empty collection', () => {
    academicClassesApiMock.listAcademicClasses.mockReturnValue(of([]));

    viewModel.loadAcademicClasses();

    expect(viewModel.isLoading()).toBe(false);
    expect(viewModel.isError()).toBe(false);
    expect(viewModel.isEmpty()).toBe(true);
    expect(viewModel.itemCount()).toBe(0);
  });

  it('keeps current classes visible while updating and after a refresh error', () => {
    const currentClass: AcademicClass = {
      id: '8ee2995c-e2c4-4f44-9cc9-9af757357f78',
      openingStatus: 'OPEN',
      seatLimit: 30,
    };
    academicClassesApiMock.listAcademicClasses.mockReturnValueOnce(of([currentClass]));
    viewModel.loadAcademicClasses();

    const refresh = new Subject<readonly AcademicClass[]>();
    academicClassesApiMock.listAcademicClasses.mockReturnValueOnce(refresh);
    viewModel.loadAcademicClasses();

    expect(viewModel.isUpdating()).toBe(true);
    expect(viewModel.academicClasses()).toEqual([currentClass]);

    refresh.error(
      new ApiClientError('network', 0, null, 'Não foi possível atualizar as turmas.', null),
    );

    expect(viewModel.isError()).toBe(true);
    expect(viewModel.errorMessage()).toBe('Não foi possível atualizar as turmas.');
    expect(viewModel.academicClasses()).toEqual([currentClass]);
  });

  it('adds the class returned and normalized by the API only after success', () => {
    academicClassesApiMock.listAcademicClasses.mockReturnValue(of([]));
    viewModel.loadAcademicClasses();
    const response = new Subject<AcademicClass>();
    academicClassesApiMock.registerAcademicClass.mockReturnValue(response);

    viewModel.registerAcademicClass({ openingStatus: 'OPEN', seatLimit: 25 }).subscribe();
    expect(viewModel.academicClasses()).toEqual([]);

    response.next({
      id: '09de8747-3407-4e36-a712-49ed3b7b26c0',
      openingStatus: 'OPEN',
      seatLimit: 25,
    });
    response.complete();

    expect(viewModel.academicClasses()).toEqual([
      {
        id: '09de8747-3407-4e36-a712-49ed3b7b26c0',
        openingStatus: 'OPEN',
        seatLimit: 25,
      },
    ]);
    expect(viewModel.notice()).toEqual({
      tone: 'success',
      message: 'Turma cadastrada com sucesso.',
    });
  });

  it('replaces an edited class with the API response', () => {
    const initialClass: AcademicClass = {
      id: 'class-1',
      openingStatus: 'OPEN',
      seatLimit: 30,
    };
    academicClassesApiMock.listAcademicClasses.mockReturnValue(of([initialClass]));
    viewModel.loadAcademicClasses();
    academicClassesApiMock.editAcademicClass.mockReturnValue(
      of({ id: 'class-1', openingStatus: 'CLOSED', seatLimit: 35 }),
    );

    viewModel.editAcademicClass('class-1', { openingStatus: 'CLOSED', seatLimit: 35 }).subscribe();

    expect(academicClassesApiMock.editAcademicClass).toHaveBeenCalledWith('class-1', {
      openingStatus: 'CLOSED',
      seatLimit: 35,
    });
    expect(viewModel.academicClasses()).toEqual([
      { id: 'class-1', openingStatus: 'CLOSED', seatLimit: 35 },
    ]);
  });

  it('reports concurrent removal and reloads after an edit returns 404', () => {
    academicClassesApiMock.listAcademicClasses
      .mockReturnValueOnce(of([{ id: 'class-1', openingStatus: 'OPEN', seatLimit: 30 }]))
      .mockReturnValueOnce(of([]));
    viewModel.loadAcademicClasses();
    const notFound = new ApiClientError('api', 404, 'NOT_FOUND', 'Turma não encontrada.', null);
    academicClassesApiMock.editAcademicClass.mockReturnValue(throwError(() => notFound));

    let receivedError: unknown;
    viewModel.editAcademicClass('class-1', { openingStatus: 'OPEN', seatLimit: 20 }).subscribe({
      error: (error: unknown) => (receivedError = error),
    });

    expect(receivedError).toBe(notFound);
    expect(academicClassesApiMock.listAcademicClasses).toHaveBeenCalledTimes(2);
    expect(viewModel.isEmpty()).toBe(true);
    expect(viewModel.notice()?.message).toContain('removida por outra pessoa');
  });

  it('removes a class only when deletion completes successfully', () => {
    academicClassesApiMock.listAcademicClasses.mockReturnValue(
      of([{ id: 'class-1', openingStatus: 'OPEN', seatLimit: 30 }]),
    );
    viewModel.loadAcademicClasses();
    const deletion = new Subject<void>();
    academicClassesApiMock.deleteAcademicClass.mockReturnValue(deletion);

    viewModel.deleteAcademicClass('class-1').subscribe();
    expect(viewModel.itemCount()).toBe(1);

    deletion.next();
    deletion.complete();

    expect(viewModel.itemCount()).toBe(0);
    expect(viewModel.notice()?.message).toBe('Turma excluída com sucesso.');
  });

  it('reports concurrent removal and reloads after deletion returns 404', () => {
    academicClassesApiMock.listAcademicClasses
      .mockReturnValueOnce(of([{ id: 'class-1', openingStatus: 'OPEN', seatLimit: 30 }]))
      .mockReturnValueOnce(of([]));
    viewModel.loadAcademicClasses();
    academicClassesApiMock.deleteAcademicClass.mockReturnValue(
      throwError(() => new ApiClientError('api', 404, 'NOT_FOUND', 'Turma não encontrada.', null)),
    );

    viewModel.deleteAcademicClass('class-1').subscribe({ error: () => undefined });

    expect(academicClassesApiMock.listAcademicClasses).toHaveBeenCalledTimes(2);
    expect(viewModel.isEmpty()).toBe(true);
    expect(viewModel.notice()?.tone).toBe('warning');
  });
});
