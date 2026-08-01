import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { Observable, Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { Discipline, DisciplinesApi } from './disciplines-api';
import { DisciplinesPage, disciplineNameValidator } from './disciplines-page';

describe('DisciplinesPage', () => {
  let fixture: ComponentFixture<DisciplinesPage>;
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
      imports: [DisciplinesPage],
      providers: [{ provide: DisciplinesApi, useValue: disciplinesApiMock }],
    });
  });

  it('accepts useful names at lengths 1 and 120 and rejects whitespace or 121 characters', () => {
    const control = new FormControl('', { validators: [disciplineNameValidator] });

    control.setValue(' ');
    expect(control.errors?.['required']).toBe(true);
    control.setValue(' A ');
    expect(control.valid).toBe(true);
    control.setValue(` ${'A'.repeat(120)} `);
    expect(control.valid).toBe(true);
    control.setValue('A'.repeat(121));
    expect(control.errors?.['maxlength']).toEqual({ requiredLength: 120, actualLength: 121 });
  });

  it('renders the title, count and successful empty state without a nested main landmark', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;

    expect(requiredElement(root, '#disciplines-heading').textContent?.trim()).toBe('Disciplinas');
    expect(requiredElement(root, '.ui-badge').textContent?.trim()).toContain('0 disciplinas');
    expect(root.textContent).toContain('Nenhuma disciplina cadastrada');
    expect(root.querySelector('main')).toBeNull();
    expect(findButton(root, 'Cadastrar disciplina')).toBeTruthy();
  });

  it('renders a semantic table sorted locally by name', () => {
    renderWith(
      of([
        { id: '8ee2995c-e2c4-4f44-9cc9-9af757357f78', name: 'Zootecnia' },
        { id: 'bb2cab67-c961-4a3e-a63b-adcb424cd847', name: 'Álgebra Linear' },
      ]),
    );
    const root = fixture.nativeElement as HTMLElement;
    const rows = root.querySelectorAll('tbody tr');

    expect(requiredElement(root, 'table caption').textContent).toContain('Disciplinas cadastradas');
    expect(root.querySelectorAll('thead th[scope="col"]').length).toBe(2);
    expect(rows[0].textContent).toContain('Álgebra Linear');
    expect(rows[1].textContent).toContain('Zootecnia');
    expect(rows[0].querySelector('th[scope="row"]')).not.toBeNull();
  });

  it('shows a read error and retries without retrying automatically', () => {
    const error = new ApiClientError('network', 0, null, 'Falha ao carregar disciplinas.', null);
    disciplinesApiMock.listDisciplines
      .mockReturnValueOnce(throwError(() => error))
      .mockReturnValueOnce(of([]));
    createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const errorState = requiredElement(root, '.ui-async-state[role="alert"]');
    expect(errorState.textContent).toContain('Falha ao carregar disciplinas.');
    expect(disciplinesApiMock.listDisciplines).toHaveBeenCalledOnce();

    findButton(errorState, 'Tentar novamente').click();
    fixture.detectChanges();

    expect(disciplinesApiMock.listDisciplines).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain('Nenhuma disciplina cadastrada');
  });

  it('creates with the trimmed payload and displays the normalized API response', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);
    disciplinesApiMock.registerDiscipline.mockReturnValue(
      of({ id: '09de8747-3407-4e36-a712-49ed3b7b26c0', name: 'Cálculo I' }),
    );
    setInputValue(requiredElement(root, '#discipline-name'), '  calculo i  ');

    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(disciplinesApiMock.registerDiscipline).toHaveBeenCalledWith({
      name: 'calculo i',
    });
    expect(requiredElement(root, 'tbody tr').textContent).toContain('Cálculo I');
    expect(root.textContent).toContain('cadastrada com sucesso');
  });

  it('edits from the listed record and sends only the documented name field', () => {
    const discipline: Discipline = { id: 'disc-1', name: 'Algoritmos' };
    renderWith(of([discipline]));
    const root = fixture.nativeElement as HTMLElement;

    findButton(requiredElement(root, 'tbody'), 'Editar').click();
    fixture.detectChanges();
    const nameInput = requiredElement<HTMLInputElement>(root, '#discipline-name');
    expect(nameInput.value).toBe('Algoritmos');
    disciplinesApiMock.editDiscipline.mockReturnValue(
      of({ id: 'disc-1', name: 'Algoritmos Avançados' }),
    );
    setInputValue(nameInput, 'Algoritmos Avançados');
    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(disciplinesApiMock.editDiscipline).toHaveBeenCalledWith('disc-1', {
      name: 'Algoritmos Avançados',
    });
    expect(requiredElement(root, 'tbody tr').textContent).toContain('Algoritmos Avançados');
  });

  it('keeps the typed name, maps name violations and preserves unknown violations in the summary', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);
    const validationError = new ApiClientError(
      'api',
      400,
      'VALIDATION_ERROR',
      'Dados inválidos.',
      null,
      [
        { field: 'name', message: 'Nome já utilizado.' },
        { field: 'externalRule', message: 'Regra institucional não atendida.' },
      ],
    );
    disciplinesApiMock.registerDiscipline.mockReturnValue(throwError(() => validationError));
    const nameInput = requiredElement<HTMLInputElement>(root, '#discipline-name');
    setInputValue(nameInput, 'Física I');

    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(nameInput.value).toBe('Física I');
    expect(requiredElement(root, '#discipline-name-error').textContent).toContain(
      'Nome já utilizado.',
    );
    expect(requiredElement(root, 'form .ui-message--danger').textContent).toContain(
      'Regra institucional não atendida.',
    );
  });

  it('keeps the dialog and typed name after a network failure', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);
    disciplinesApiMock.registerDiscipline.mockReturnValue(
      throwError(
        () => new ApiClientError('network', 0, null, 'Não foi possível salvar a disciplina.', null),
      ),
    );
    const nameInput = requiredElement<HTMLInputElement>(root, '#discipline-name');
    setInputValue(nameInput, 'Química General');

    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(nameInput.value).toBe('Química General');
    expect(requiredElement(root, 'form .ui-message--danger').textContent).toContain(
      'Não foi possível salvar a disciplina.',
    );
    expect(requiredElement<HTMLDialogElement>(root, 'app-dialog dialog').open).toBe(true);
  });

  it('blocks duplicate submission while the first creation is pending', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);
    const response = new Subject<Discipline>();
    disciplinesApiMock.registerDiscipline.mockReturnValue(response);
    setInputValue(requiredElement(root, '#discipline-name'), 'Química');
    const form = requiredElement<HTMLFormElement>(root, 'form');

    submit(form);
    submit(form);
    fixture.detectChanges();

    expect(disciplinesApiMock.registerDiscipline).toHaveBeenCalledOnce();
    expect(findButton(form, 'Cadastrando...').disabled).toBe(true);
  });

  it('identifies permanent deletion, waits for 204 and moves focus after removing the row', () => {
    vi.useFakeTimers();
    try {
      renderWith(of([{ id: 'disc-1', name: 'Arquitetura de Computadores' }]));
      const root = fixture.nativeElement as HTMLElement;
      const deletion = new Subject<void>();
      disciplinesApiMock.deleteDiscipline.mockReturnValue(deletion);

      findButton(requiredElement(root, 'tbody'), 'Excluir').click();
      fixture.detectChanges();
      const deleteDialog = requiredElement(root, 'app-dialog[title="Excluir disciplina?"]');
      expect(deleteDialog.textContent).toContain('Arquitetura de Computadores');
      expect(deleteDialog.textContent).toContain('permanente');
      expect(requiredElement(deleteDialog, 'button[autofocus]').textContent?.trim()).toBe(
        'Cancelar',
      );

      findButton(deleteDialog, 'Excluir disciplina').click();
      fixture.detectChanges();
      expect(root.querySelectorAll('tbody tr').length).toBe(1);

      deletion.next();
      deletion.complete();
      fixture.detectChanges();
      vi.runAllTimers();

      expect(root.querySelectorAll('tbody tr').length).toBe(0);
      expect(root.textContent).toContain('Nenhuma disciplina cadastrada');
      expect(document.activeElement).toBe(requiredElement(root, '#disciplines-heading'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('restores focus to the opener when a dialog is canceled', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    const createButton = findButton(root, 'Cadastrar disciplina');
    createButton.focus();
    createButton.click();
    fixture.detectChanges();

    expect(requiredElement(root, '#discipline-name').hasAttribute('autofocus')).toBe(true);
    findButton(requiredElement(root, 'app-dialog'), 'Cancelar').click();

    expect(document.activeElement).toBe(createButton);
  });

  function renderWith(disciplines: Observable<readonly Discipline[]>): void {
    disciplinesApiMock.listDisciplines.mockReturnValue(disciplines);
    createFixture();
  }

  function createFixture(): void {
    fixture = TestBed.createComponent(DisciplinesPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement as HTMLElement);
  }

  function openCreateDialog(root: HTMLElement): void {
    findButton(root, 'Cadastrar disciplina').click();
    fixture.detectChanges();
  }
});

function setupDialogMocks(root: HTMLElement): void {
  root.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
    let isOpen = false;
    Object.defineProperty(dialog, 'open', { configurable: true, get: () => isOpen });
    dialog.showModal = vi.fn(() => {
      isOpen = true;
      dialog.querySelector<HTMLElement>('[autofocus]')?.focus();
    });
    dialog.close = vi.fn(() => {
      isOpen = false;
      dialog.dispatchEvent(new Event('close'));
    });
  });
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function submit(form: HTMLFormElement): void {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function findButton(root: ParentNode, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll<HTMLButtonElement>('button')].find((candidate) =>
    candidate.textContent?.trim().startsWith(text),
  );
  if (!button) {
    throw new Error(`Expected button starting with ${text}`);
  }
  return button;
}

function requiredElement<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected test element matching ${selector}`);
  }
  return element;
}
