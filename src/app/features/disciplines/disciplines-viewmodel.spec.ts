import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { Discipline, DisciplinesApi } from './disciplines-api';
import { DisciplinesViewModel, sortDisciplines } from './disciplines-viewmodel';

describe('DisciplinesViewModel', () => {
  let viewModel: DisciplinesViewModel;
  let disciplinesApiMock: {
    listDisciplines: ReturnType<typeof vi.fn>;
    registerDiscipline: ReturnType<typeof vi.fn>;
    editDiscipline: ReturnType<typeof vi.fn>;
    deleteDiscipline: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    disciplinesApiMock = {
      listDisciplines: vi.fn(),
      registerDiscipline: vi.fn(),
      editDiscipline: vi.fn(),
      deleteDiscipline: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [DisciplinesViewModel, { provide: DisciplinesApi, useValue: disciplinesApiMock }],
    });
    viewModel = TestBed.inject(DisciplinesViewModel);
  });

  it('sorts by name in pt-BR and uses the id as deterministic tiebreaker', () => {
    const original: Discipline[] = [
      { id: '2', name: 'Zootecnia' },
      { id: '3', name: 'Algoritmos' },
      { id: '1', name: 'Álgebra' },
      { id: '2-a', name: 'Algoritmos' },
    ];

    const sorted = sortDisciplines(original);

    expect(sorted.map((d) => `${d.id}:${d.name}`)).toEqual([
      '1:Álgebra',
      '2-a:Algoritmos',
      '3:Algoritmos',
      '2:Zootecnia',
    ]);
    expect(original[0].name).toBe('Zootecnia');
  });

  it('treats an empty response as a successful empty collection', () => {
    disciplinesApiMock.listDisciplines.mockReturnValue(of([]));

    viewModel.loadDisciplines();

    expect(viewModel.isLoading()).toBe(false);
    expect(viewModel.isError()).toBe(false);
    expect(viewModel.isEmpty()).toBe(true);
    expect(viewModel.itemCount()).toBe(0);
  });

  it('keeps current disciplines visible while updating and after a refresh error', () => {
    const currentDiscipline: Discipline = { id: 'disc-1', name: 'Cálculo I' };
    disciplinesApiMock.listDisciplines.mockReturnValueOnce(of([currentDiscipline]));
    viewModel.loadDisciplines();

    const refresh = new Subject<readonly Discipline[]>();
    disciplinesApiMock.listDisciplines.mockReturnValueOnce(refresh);
    viewModel.loadDisciplines();

    expect(viewModel.isUpdating()).toBe(true);
    expect(viewModel.disciplines()).toEqual([currentDiscipline]);

    refresh.error(
      new ApiClientError('network', 0, null, 'Não foi possível atualizar as disciplinas.', null),
    );

    expect(viewModel.isError()).toBe(true);
    expect(viewModel.errorMessage()).toBe('Não foi possível atualizar as disciplinas.');
    expect(viewModel.disciplines()).toEqual([currentDiscipline]);
  });

  it('adds the discipline returned and normalized by the API only after success', () => {
    disciplinesApiMock.listDisciplines.mockReturnValue(of([]));
    viewModel.loadDisciplines();
    const response = new Subject<Discipline>();
    disciplinesApiMock.registerDiscipline.mockReturnValue(response);

    viewModel.registerDiscipline({ name: 'Nome enviado' }).subscribe();
    expect(viewModel.disciplines()).toEqual([]);

    response.next({ id: 'disc-1', name: 'Nome normalizado' });
    response.complete();

    expect(viewModel.disciplines()).toEqual([{ id: 'disc-1', name: 'Nome normalizado' }]);
    expect(viewModel.notice()).toEqual({
      tone: 'success',
      message: 'Disciplina "Nome normalizado" cadastrada com sucesso.',
    });
  });

  it('replaces an edited discipline with the API response', () => {
    disciplinesApiMock.listDisciplines.mockReturnValue(
      of([{ id: 'disc-1', name: 'Algoritmos I' }]),
    );
    viewModel.loadDisciplines();
    disciplinesApiMock.editDiscipline.mockReturnValue(
      of({ id: 'disc-1', name: 'Algoritmos e Estrutura de Dados I' }),
    );

    viewModel.editDiscipline('disc-1', { name: 'Algoritmos e Estrutura de Dados I' }).subscribe();

    expect(disciplinesApiMock.editDiscipline).toHaveBeenCalledWith('disc-1', {
      name: 'Algoritmos e Estrutura de Dados I',
    });
    expect(viewModel.disciplines()).toEqual([
      { id: 'disc-1', name: 'Algoritmos e Estrutura de Dados I' },
    ]);
  });

  it('reports concurrent removal and reloads after an edit returns 404', () => {
    disciplinesApiMock.listDisciplines
      .mockReturnValueOnce(of([{ id: 'disc-1', name: 'Algoritmos' }]))
      .mockReturnValueOnce(of([]));
    viewModel.loadDisciplines();
    const notFound = new ApiClientError(
      'api',
      404,
      'NOT_FOUND',
      'Disciplina não encontrada.',
      null,
    );
    disciplinesApiMock.editDiscipline.mockReturnValue(throwError(() => notFound));

    let receivedError: unknown;
    viewModel.editDiscipline('disc-1', { name: 'Algoritmos' }).subscribe({
      error: (error: unknown) => (receivedError = error),
    });

    expect(receivedError).toBe(notFound);
    expect(disciplinesApiMock.listDisciplines).toHaveBeenCalledTimes(2);
    expect(viewModel.isEmpty()).toBe(true);
    expect(viewModel.notice()?.message).toContain('removida por outra pessoa');
  });

  it('removes a discipline only when deletion completes successfully', () => {
    disciplinesApiMock.listDisciplines.mockReturnValue(of([{ id: 'disc-1', name: 'Algoritmos' }]));
    viewModel.loadDisciplines();
    const deletion = new Subject<void>();
    disciplinesApiMock.deleteDiscipline.mockReturnValue(deletion);

    viewModel.deleteDiscipline('disc-1').subscribe();
    expect(viewModel.itemCount()).toBe(1);

    deletion.next();
    deletion.complete();

    expect(viewModel.itemCount()).toBe(0);
    expect(viewModel.notice()?.message).toBe('Disciplina "Algoritmos" excluída com sucesso.');
  });

  it('reports concurrent removal and reloads after deletion returns 404', () => {
    disciplinesApiMock.listDisciplines
      .mockReturnValueOnce(of([{ id: 'disc-1', name: 'Algoritmos' }]))
      .mockReturnValueOnce(of([]));
    viewModel.loadDisciplines();
    disciplinesApiMock.deleteDiscipline.mockReturnValue(
      throwError(
        () => new ApiClientError('api', 404, 'NOT_FOUND', 'Disciplina não encontrada.', null),
      ),
    );

    viewModel.deleteDiscipline('disc-1').subscribe({ error: () => undefined });

    expect(disciplinesApiMock.listDisciplines).toHaveBeenCalledTimes(2);
    expect(viewModel.isEmpty()).toBe(true);
    expect(viewModel.notice()?.tone).toBe('warning');
  });
});
