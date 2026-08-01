import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { Observable, Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { Course, CoursesApi } from './courses-api';
import { CoursesPage, courseNameValidator } from './courses-page';

describe('CoursesPage', () => {
  let fixture: ComponentFixture<CoursesPage>;
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
      imports: [CoursesPage],
      providers: [{ provide: CoursesApi, useValue: coursesApiMock }],
    });
  });

  it('accepts useful names at lengths 1 and 120 and rejects whitespace or 121 characters', () => {
    const control = new FormControl('', { validators: [courseNameValidator] });

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

    expect(requiredElement(root, '#courses-heading').textContent?.trim()).toBe('Cursos');
    expect(requiredElement(root, '.ui-badge').textContent?.trim()).toContain('0 cursos');
    expect(root.textContent).toContain('Nenhum curso cadastrado');
    expect(root.querySelector('main')).toBeNull();
    expect(findButton(root, 'Cadastrar curso')).toBeTruthy();
  });

  it('renders a semantic table sorted locally by name', () => {
    renderWith(
      of([
        { id: '8ee2995c-e2c4-4f44-9cc9-9af757357f78', name: 'Zootecnia' },
        { id: 'bb2cab67-c961-4a3e-a63b-adcb424cd847', name: 'Administração' },
      ]),
    );
    const root = fixture.nativeElement as HTMLElement;
    const rows = root.querySelectorAll('tbody tr');

    expect(requiredElement(root, 'table caption').textContent).toContain('Cursos cadastrados');
    expect(root.querySelectorAll('thead th[scope="col"]').length).toBe(2);
    expect(rows[0].textContent).toContain('Administração');
    expect(rows[1].textContent).toContain('Zootecnia');
    expect(rows[0].querySelector('th[scope="row"]')).not.toBeNull();
  });

  it('shows a read error and retries without retrying automatically', () => {
    const error = new ApiClientError('network', 0, null, 'Falha ao carregar cursos.', null);
    coursesApiMock.listCourses
      .mockReturnValueOnce(throwError(() => error))
      .mockReturnValueOnce(of([]));
    createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const errorState = requiredElement(root, '.ui-async-state[role="alert"]');
    expect(errorState.textContent).toContain('Falha ao carregar cursos.');
    expect(coursesApiMock.listCourses).toHaveBeenCalledOnce();

    findButton(errorState, 'Tentar novamente').click();
    fixture.detectChanges();

    expect(coursesApiMock.listCourses).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain('Nenhum curso cadastrado');
  });

  it('creates with the trimmed payload and displays the normalized API response', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);
    coursesApiMock.registerCourse.mockReturnValue(
      of({ id: '09de8747-3407-4e36-a712-49ed3b7b26c0', name: 'Ciência da Computação' }),
    );
    setInputValue(requiredElement(root, '#course-name'), '  ciencia da computacao  ');

    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(coursesApiMock.registerCourse).toHaveBeenCalledWith({
      name: 'ciencia da computacao',
    });
    expect(requiredElement(root, 'tbody tr').textContent).toContain('Ciência da Computação');
    expect(root.textContent).toContain('cadastrado com sucesso');
  });

  it('edits from the listed record and sends only the documented name field', () => {
    const course: Course = { id: 'course-1', name: 'Computação' };
    renderWith(of([course]));
    const root = fixture.nativeElement as HTMLElement;

    findButton(requiredElement(root, 'tbody'), 'Editar').click();
    fixture.detectChanges();
    const nameInput = requiredElement<HTMLInputElement>(root, '#course-name');
    expect(nameInput.value).toBe('Computação');
    coursesApiMock.editCourse.mockReturnValue(
      of({ id: 'course-1', name: 'Sistemas de Informação' }),
    );
    setInputValue(nameInput, 'Sistemas de Informação');
    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(coursesApiMock.editCourse).toHaveBeenCalledWith('course-1', {
      name: 'Sistemas de Informação',
    });
    expect(requiredElement(root, 'tbody tr').textContent).toContain('Sistemas de Informação');
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
    coursesApiMock.registerCourse.mockReturnValue(throwError(() => validationError));
    const nameInput = requiredElement<HTMLInputElement>(root, '#course-name');
    setInputValue(nameInput, 'Engenharia');

    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(nameInput.value).toBe('Engenharia');
    expect(requiredElement(root, '#course-name-error').textContent).toContain('Nome já utilizado.');
    expect(requiredElement(root, 'form .ui-message--danger').textContent).toContain(
      'Regra institucional não atendida.',
    );
  });

  it('keeps the dialog and typed name after a network failure', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);
    coursesApiMock.registerCourse.mockReturnValue(
      throwError(
        () => new ApiClientError('network', 0, null, 'Não foi possível salvar o curso.', null),
      ),
    );
    const nameInput = requiredElement<HTMLInputElement>(root, '#course-name');
    setInputValue(nameInput, 'Direito');

    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(nameInput.value).toBe('Direito');
    expect(requiredElement(root, 'form .ui-message--danger').textContent).toContain(
      'Não foi possível salvar o curso.',
    );
    expect(requiredElement<HTMLDialogElement>(root, 'app-dialog dialog').open).toBe(true);
  });

  it('blocks duplicate submission while the first creation is pending', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);
    const response = new Subject<Course>();
    coursesApiMock.registerCourse.mockReturnValue(response);
    setInputValue(requiredElement(root, '#course-name'), 'Direito');
    const form = requiredElement<HTMLFormElement>(root, 'form');

    submit(form);
    submit(form);
    fixture.detectChanges();

    expect(coursesApiMock.registerCourse).toHaveBeenCalledOnce();
    expect(findButton(form, 'Cadastrando...').disabled).toBe(true);
  });

  it('identifies permanent deletion, waits for 204 and moves focus after removing the row', () => {
    vi.useFakeTimers();
    try {
      renderWith(of([{ id: 'course-1', name: 'Arquitetura' }]));
      const root = fixture.nativeElement as HTMLElement;
      const deletion = new Subject<void>();
      coursesApiMock.deleteCourse.mockReturnValue(deletion);

      findButton(requiredElement(root, 'tbody'), 'Excluir').click();
      fixture.detectChanges();
      const deleteDialog = requiredElement(root, 'app-dialog[title="Excluir curso?"]');
      expect(deleteDialog.textContent).toContain('Arquitetura');
      expect(deleteDialog.textContent).toContain('permanente');
      expect(requiredElement(deleteDialog, 'button[autofocus]').textContent?.trim()).toBe(
        'Cancelar',
      );

      findButton(deleteDialog, 'Excluir curso').click();
      fixture.detectChanges();
      expect(root.querySelectorAll('tbody tr').length).toBe(1);

      deletion.next();
      deletion.complete();
      fixture.detectChanges();
      vi.runAllTimers();

      expect(root.querySelectorAll('tbody tr').length).toBe(0);
      expect(root.textContent).toContain('Nenhum curso cadastrado');
      expect(document.activeElement).toBe(requiredElement(root, '#courses-heading'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('restores focus to the opener when a dialog is canceled', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    const createButton = findButton(root, 'Cadastrar curso');
    createButton.focus();
    createButton.click();
    fixture.detectChanges();

    expect(requiredElement(root, '#course-name').hasAttribute('autofocus')).toBe(true);
    findButton(requiredElement(root, 'app-dialog'), 'Cancelar').click();

    expect(document.activeElement).toBe(createButton);
  });

  it('clears control apiError when control value changes and displays traceId in error summary', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);

    const validationError = new ApiClientError(
      'api',
      400,
      'VALIDATION_ERROR',
      'Dados inválidos.',
      'trace-abc-123',
      [{ field: 'name', message: 'Nome já utilizado.' }],
    );
    coursesApiMock.registerCourse.mockReturnValue(throwError(() => validationError));

    const nameInput = requiredElement<HTMLInputElement>(root, '#course-name');
    setInputValue(nameInput, 'Engenharia');
    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(requiredElement(root, '#course-name-error').textContent).toContain('Nome já utilizado.');

    // User types a new value in the control
    setInputValue(nameInput, 'Engenharia Civil');
    fixture.detectChanges();

    // apiError on the control should be cleared
    expect(root.querySelector('#course-name-error')).toBeNull();
  });

  it('displays traceId and uncertainty guidance on 500 server mutation error', () => {
    renderWith(of([]));
    const root = fixture.nativeElement as HTMLElement;
    openCreateDialog(root);

    const serverError = new ApiClientError(
      'api',
      500,
      'SERVER_ERROR',
      'Ocorreu uma falha interna no servidor.',
      'trace-500-err',
    );
    coursesApiMock.registerCourse.mockReturnValue(throwError(() => serverError));

    setInputValue(requiredElement(root, '#course-name'), 'Arquitetura');
    submit(requiredElement(root, 'form'));
    fixture.detectChanges();

    const summary = requiredElement(root, 'form .ui-message--danger');
    expect(summary.textContent).toContain('Ocorreu uma falha interna no servidor.');
    expect(summary.textContent).toContain('Código para suporte: trace-500-err');
    expect(summary.textContent).toContain(
      'Atualize a lista para verificar o estado real antes de tentar novamente.',
    );
  });

  function renderWith(courses: Observable<readonly Course[]>): void {
    coursesApiMock.listCourses.mockReturnValue(courses);
    createFixture();
  }

  function createFixture(): void {
    fixture = TestBed.createComponent(CoursesPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement as HTMLElement);
  }

  function openCreateDialog(root: HTMLElement): void {
    findButton(root, 'Cadastrar curso').click();
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
