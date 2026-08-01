import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { Observable, Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { AcademicClass, AcademicClassesApi } from './academic-classes-api';
import {
  AcademicClassesPage,
  openingStatusValidator,
  seatLimitValidator,
} from './academic-classes-page';

describe('AcademicClassesPage', () => {
  let fixture: ComponentFixture<AcademicClassesPage>;
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
      imports: [AcademicClassesPage],
      providers: [{ provide: AcademicClassesApi, useValue: academicClassesApiMock }],
    });
  });

  it('validates seatLimit: accepts integers >= 1 and rejects empty, decimal, 0 or negative', () => {
    const control = new FormControl<unknown>(null, { validators: [seatLimitValidator] });

    control.setValue('');
    expect(control.errors?.['required']).toBe(true);

    control.setValue(0);
    expect(control.errors?.['minSeatLimit']).toBe(true);

    control.setValue(-5);
    expect(control.errors?.['minSeatLimit']).toBe(true);

    control.setValue(3.5);
    expect(control.errors?.['decimalSeatLimit']).toBe(true);

    control.setValue(1);
    expect(control.valid).toBe(true);

    control.setValue(100);
    expect(control.valid).toBe(true);
  });

  it('validates openingStatus: accepts OPEN and CLOSED and rejects invalid values', () => {
    const control = new FormControl<unknown>('OPEN', { validators: [openingStatusValidator] });

    expect(control.valid).toBe(true);

    control.setValue('CLOSED');
    expect(control.valid).toBe(true);

    control.setValue('INVALID');
    expect(control.errors?.['invalidOpeningStatus']).toBe(true);
  });

  it('renders title, count badge and empty state "Nenhuma turma cadastrada"', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;

    expect(requiredElement(root, '#academic-classes-heading').textContent?.trim()).toBe('Turmas');
    expect(requiredElement(root, '.ui-badge').textContent?.trim()).toContain('0 turmas');
    expect(root.textContent).toContain('Nenhuma turma cadastrada');
    expect(findButton(root, 'Cadastrar turma')).toBeTruthy();
  });

  it('renders a semantic table sorted by openingStatus (OPEN then CLOSED) and UUID', () => {
    const classes: AcademicClass[] = [
      { id: 'uuid-closed-1', openingStatus: 'CLOSED', seatLimit: 20 },
      { id: 'uuid-open-2', openingStatus: 'OPEN', seatLimit: 50 },
      { id: 'uuid-open-1', openingStatus: 'OPEN', seatLimit: 30 },
    ];
    renderWith(of(classes));
    const root = fixture.nativeElement as HTMLElement;
    const rows = root.querySelectorAll('tbody tr');

    expect(requiredElement(root, 'table caption').textContent).toContain('Turmas cadastradas');
    expect(root.querySelectorAll('thead th[scope="col"]').length).toBe(4);
    expect(rows.length).toBe(3);

    expect(rows[0].textContent).toContain('uuid-open-1');
    expect(rows[0].textContent).toContain('Aberta');
    expect(rows[0].textContent).toContain('30');

    expect(rows[1].textContent).toContain('uuid-open-2');
    expect(rows[1].textContent).toContain('Aberta');
    expect(rows[1].textContent).toContain('50');

    expect(rows[2].textContent).toContain('uuid-closed-1');
    expect(rows[2].textContent).toContain('Fechada');
    expect(rows[2].textContent).toContain('20');
  });

  it('shows a read error and retries without retrying automatically', () => {
    const error = new ApiClientError('network', 0, null, 'Falha ao carregar turmas.', null);
    academicClassesApiMock.listAcademicClasses
      .mockReturnValueOnce(throwError(() => error))
      .mockReturnValueOnce(of([]));
    createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const errorState = requiredElement(root, '.ui-async-state[role="alert"]');
    expect(errorState.textContent).toContain('Falha ao carregar turmas.');
    expect(academicClassesApiMock.listAcademicClasses).toHaveBeenCalledOnce();

    findButton(errorState, 'Tentar novamente').click();
    fixture.detectChanges();

    expect(academicClassesApiMock.listAcademicClasses).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain('Nenhuma turma cadastrada');
  });

  it('creates class sending exact openingStatus and seatLimit payload', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);

    academicClassesApiMock.registerAcademicClass.mockReturnValue(
      of({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', openingStatus: 'OPEN', seatLimit: 40 }),
    );

    setSelectValue(requiredElement(root, '#academic-class-opening-status'), 'OPEN');
    setInputValue(requiredElement(root, '#academic-class-seat-limit'), '40');

    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(academicClassesApiMock.registerAcademicClass).toHaveBeenCalledWith({
      openingStatus: 'OPEN',
      seatLimit: 40,
    });
    expect(requiredElement(root, 'tbody tr').textContent).toContain(
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    );
    expect(root.textContent).toContain('Turma cadastrada com sucesso.');
  });

  it('edits class sending both mandatory fields in PUT even if only seatLimit changed', () => {
    const classItem: AcademicClass = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      openingStatus: 'OPEN',
      seatLimit: 30,
    };
    renderWith(of([classItem]));
    const root = fixture.nativeElement as HTMLElement;

    findButton(requiredElement(root, 'tbody'), 'Editar').click();
    fixture.detectChanges();

    const limitInput = requiredElement<HTMLInputElement>(root, '#academic-class-seat-limit');
    expect(limitInput.value).toBe('30');

    academicClassesApiMock.editAcademicClass.mockReturnValue(
      of({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', openingStatus: 'OPEN', seatLimit: 45 }),
    );

    setInputValue(limitInput, '45');
    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(academicClassesApiMock.editAcademicClass).toHaveBeenCalledWith(
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      { openingStatus: 'OPEN', seatLimit: 45 },
    );
    expect(requiredElement(root, 'tbody tr').textContent).toContain('45');
  });

  it('handles 409 conflict when reducing seat limit: keeps form open, preserves values, shows message', () => {
    const classItem: AcademicClass = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      openingStatus: 'OPEN',
      seatLimit: 30,
    };
    renderWith(of([classItem]));
    const root = fixture.nativeElement as HTMLElement;

    findButton(requiredElement(root, 'tbody'), 'Editar').click();
    fixture.detectChanges();

    const conflictError = new ApiClientError(
      'api',
      409,
      'CONFLICT',
      'O limite de vagas não pode ser menor que o total de matrículas confirmadas.',
      null,
      [{ field: 'seatLimit', message: 'Limite abaixo das matrículas confirmadas.' }],
    );
    academicClassesApiMock.editAcademicClass.mockReturnValue(throwError(() => conflictError));

    const limitInput = requiredElement<HTMLInputElement>(root, '#academic-class-seat-limit');
    setInputValue(limitInput, '5');

    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(limitInput.value).toBe('5');
    expect(requiredElement<HTMLDialogElement>(root, 'app-dialog dialog').open).toBe(true);
    expect(requiredElement(root, '#academic-class-seat-limit-error').textContent).toContain(
      'Limite abaixo das matrículas confirmadas.',
    );
  });

  it('identifies permanent deletion, handles 409 conflict on delete by keeping dialog open', () => {
    const classItem: AcademicClass = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      openingStatus: 'OPEN',
      seatLimit: 30,
    };
    renderWith(of([classItem]));
    const root = fixture.nativeElement as HTMLElement;

    findButton(requiredElement(root, 'tbody'), 'Excluir').click();
    fixture.detectChanges();

    const deleteDialog = requiredElement(root, 'app-dialog[title="Excluir turma?"]');
    expect(deleteDialog.textContent).toContain('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    expect(deleteDialog.textContent).toContain('permanente');

    const conflictError = new ApiClientError(
      'api',
      409,
      'CONFLICT',
      'Não é possível excluir a turma pois existem matrículas vinculadas.',
      null,
    );
    academicClassesApiMock.deleteAcademicClass.mockReturnValue(throwError(() => conflictError));

    findButton(deleteDialog, 'Excluir turma').click();
    fixture.detectChanges();

    expect(requiredElement<HTMLDialogElement>(deleteDialog, 'dialog').open).toBe(true);
    expect(deleteDialog.textContent).toContain(
      'Não é possível excluir a turma pois existem matrículas vinculadas.',
    );
  });

  it('completes deletion after 204 response and restores focus', () => {
    vi.useFakeTimers();
    try {
      const classItem: AcademicClass = {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        openingStatus: 'OPEN',
        seatLimit: 30,
      };
      renderWith(of([classItem]));
      const root = fixture.nativeElement as HTMLElement;
      const deletion = new Subject<void>();
      academicClassesApiMock.deleteAcademicClass.mockReturnValue(deletion);

      findButton(requiredElement(root, 'tbody'), 'Excluir').click();
      fixture.detectChanges();

      const deleteDialog = requiredElement(root, 'app-dialog[title="Excluir turma?"]');
      findButton(deleteDialog, 'Excluir turma').click();
      fixture.detectChanges();

      deletion.next();
      deletion.complete();
      fixture.detectChanges();
      vi.runAllTimers();

      expect(root.querySelectorAll('tbody tr').length).toBe(0);
      expect(root.textContent).toContain('Nenhuma turma cadastrada');
      expect(document.activeElement).toBe(requiredElement(root, '#academic-classes-heading'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('blocks duplicate submission while creation is pending', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);

    const response = new Subject<AcademicClass>();
    academicClassesApiMock.registerAcademicClass.mockReturnValue(response);

    setSelectValue(requiredElement(root, '#academic-class-opening-status'), 'OPEN');
    setInputValue(requiredElement(root, '#academic-class-seat-limit'), '20');
    const form = requiredElement<HTMLFormElement>(root, 'form');

    submit(form);
    submit(form);
    fixture.detectChanges();

    expect(academicClassesApiMock.registerAcademicClass).toHaveBeenCalledOnce();
    expect(findButton(form, 'Cadastrando...').disabled).toBe(true);
  });

  it('restores focus to the opener when dialog is canceled', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    const createButton = findButton(root, 'Cadastrar turma');
    createButton.focus();
    createButton.click();
    fixture.detectChanges();

    expect(requiredElement(root, '#academic-class-opening-status').hasAttribute('autofocus')).toBe(
      true,
    );
    findButton(requiredElement(root, 'app-dialog'), 'Cancelar').click();

    expect(document.activeElement).toBe(createButton);
  });

  function renderWith(classes: Observable<readonly AcademicClass[]>): void {
    academicClassesApiMock.listAcademicClasses.mockReturnValue(classes);
    createFixture();
  }

  function createFixture(): void {
    fixture = TestBed.createComponent(AcademicClassesPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement as HTMLElement);
  }

  function openCreateDialog(root: HTMLElement): void {
    findButton(root, 'Cadastrar turma').click();
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

function setSelectValue(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
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
