import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { Student, StudentsApi } from './students-api';
import { StudentsPage } from './students-page';

describe('StudentsPage', () => {
  let fixture: ComponentFixture<StudentsPage>;
  let component: StudentsPage;
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
      imports: [StudentsPage],
      providers: [{ provide: StudentsApi, useValue: studentsApiMock }],
    });
  });

  function setupDialogMocks(root: HTMLElement): void {
    const dialogs = root.querySelectorAll<HTMLDialogElement>('dialog');
    dialogs.forEach((dialog) => {
      let isOpen = false;
      Object.defineProperty(dialog, 'open', {
        configurable: true,
        get: () => isOpen,
      });
      dialog.showModal = vi.fn(() => {
        isOpen = true;
      });
      dialog.close = vi.fn(() => {
        isOpen = false;
      });
    });
  }

  it('renders heading "Alunos" and shows empty state when list is empty', () => {
    studentsApiMock.listStudents.mockReturnValue(of([]));
    fixture = TestBed.createComponent(StudentsPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const heading = root.querySelector('#students-heading');
    expect(heading?.textContent?.trim()).toBe('Alunos');

    const asyncState = root.querySelector('.ui-async-state');
    expect(asyncState?.textContent?.trim()).toContain('Nenhum aluno cadastrado');

    const createButton = root.querySelector<HTMLButtonElement>('.students-header__actions button');
    expect(createButton).not.toBeNull();
    expect(createButton?.textContent?.trim()).toBe('Cadastrar aluno');
  });

  it('renders table with sorted students and item count', () => {
    const students: Student[] = [
      { id: '2', name: 'Bernardo', email: 'bernardo@test.com' },
      { id: '1', name: 'Alice', email: 'alice@test.com' },
    ];
    studentsApiMock.listStudents.mockReturnValue(of(students));

    fixture = TestBed.createComponent(StudentsPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const badge = root.querySelector('.ui-badge');
    expect(badge?.textContent?.trim()).toContain('2 alunos');

    const tableRows = root.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(2);
    expect(tableRows[0].textContent).toContain('Alice');
    expect(tableRows[1].textContent).toContain('Bernardo');
  });

  it('shows error state with "Tentar novamente" on list load failure', () => {
    const networkError = new ApiClientError(
      'network',
      0,
      null,
      'Não foi possível conectar ao serviço.',
      null,
    );
    studentsApiMock.listStudents.mockReturnValue(throwError(() => networkError));

    fixture = TestBed.createComponent(StudentsPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const asyncState = root.querySelector('.ui-async-state[role="alert"]');
    expect(asyncState?.textContent).toContain('Não foi possível conectar ao serviço.');

    const retryButton = asyncState?.querySelector('button');
    expect(retryButton?.textContent?.trim()).toBe('Tentar novamente');

    studentsApiMock.listStudents.mockReturnValue(of([]));
    retryButton?.click();
    fixture.detectChanges();

    expect(studentsApiMock.listStudents).toHaveBeenCalledTimes(2);
    expect(root.querySelector('.ui-async-state')?.textContent).toContain('Nenhum aluno cadastrado');
  });

  it('validates required fields in create form before sending request', () => {
    studentsApiMock.listStudents.mockReturnValue(of([]));
    fixture = TestBed.createComponent(StudentsPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement);

    const root = fixture.nativeElement as HTMLElement;
    const createButton = root.querySelector<HTMLButtonElement>('.students-header__actions button')!;
    createButton.click();
    fixture.detectChanges();

    const form = root.querySelector<HTMLFormElement>('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(studentsApiMock.signUpStudent).not.toHaveBeenCalled();
    const nameError = root.querySelector('#student-name-error');
    const emailError = root.querySelector('#student-email-error');
    expect(nameError?.textContent?.trim()).toBe('Nome é obrigatório.');
    expect(emailError?.textContent?.trim()).toBe('E-mail é obrigatório.');
  });

  it('creates student on valid form submit (201 success)', () => {
    studentsApiMock.listStudents.mockReturnValue(of([]));
    fixture = TestBed.createComponent(StudentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement);

    const root = fixture.nativeElement as HTMLElement;
    const createButton = root.querySelector<HTMLButtonElement>('.students-header__actions button')!;
    createButton.click();
    fixture.detectChanges();

    const createdStudent: Student = { id: '10', name: 'Carlos', email: 'carlos@test.com' };
    studentsApiMock.signUpStudent.mockReturnValue(of(createdStudent));

    const nameInput = root.querySelector<HTMLInputElement>('#student-name')!;
    const emailInput = root.querySelector<HTMLInputElement>('#student-email')!;

    nameInput.value = 'Carlos';
    nameInput.dispatchEvent(new Event('input'));
    emailInput.value = 'carlos@test.com';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root.querySelector<HTMLFormElement>('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(studentsApiMock.signUpStudent).toHaveBeenCalledWith({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    const tableRows = root.querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(1);
    expect(tableRows[0].textContent).toContain('Carlos');
  });

  it('preserves form values and maps email conflict on 409 error', () => {
    studentsApiMock.listStudents.mockReturnValue(of([]));
    fixture = TestBed.createComponent(StudentsPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement);

    const root = fixture.nativeElement as HTMLElement;
    const createButton = root.querySelector<HTMLButtonElement>('.students-header__actions button')!;
    createButton.click();
    fixture.detectChanges();

    const conflictError = new ApiClientError(
      'api',
      409,
      'EMAIL_CONFLICT',
      'O e-mail informado já está em uso.',
      null,
    );
    studentsApiMock.signUpStudent.mockReturnValue(throwError(() => conflictError));

    const nameInput = root.querySelector<HTMLInputElement>('#student-name')!;
    const emailInput = root.querySelector<HTMLInputElement>('#student-email')!;

    nameInput.value = 'Carlos';
    nameInput.dispatchEvent(new Event('input'));
    emailInput.value = 'duplicado@test.com';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root.querySelector<HTMLFormElement>('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(nameInput.value).toBe('Carlos');
    expect(emailInput.value).toBe('duplicado@test.com');

    const emailError = root.querySelector('#student-email-error');
    expect(emailError?.textContent?.trim()).toBe('O e-mail informado já está em uso.');
  });

  it('opens edit dialog with current student data without GET by ID', () => {
    const student: Student = { id: '1', name: 'Daniela', email: 'daniela@test.com' };
    studentsApiMock.listStudents.mockReturnValue(of([student]));

    fixture = TestBed.createComponent(StudentsPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement);

    const root = fixture.nativeElement as HTMLElement;
    const editButton = root.querySelector<HTMLButtonElement>('tbody button')!;
    editButton.click();
    fixture.detectChanges();

    const nameInput = root.querySelector<HTMLInputElement>('#student-name')!;
    const emailInput = root.querySelector<HTMLInputElement>('#student-email')!;

    expect(nameInput.value).toBe('Daniela');
    expect(emailInput.value).toBe('daniela@test.com');

    const updatedStudent: Student = { id: '1', name: 'Daniela Silva', email: 'daniela@test.com' };
    studentsApiMock.editStudent.mockReturnValue(of(updatedStudent));

    nameInput.value = 'Daniela Silva';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root.querySelector<HTMLFormElement>('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(studentsApiMock.editStudent).toHaveBeenCalledWith('1', {
      name: 'Daniela Silva',
      email: 'daniela@test.com',
    });
  });

  it('clears control apiError when control value changes and displays traceId in error summary', () => {
    studentsApiMock.listStudents.mockReturnValue(of([]));
    fixture = TestBed.createComponent(StudentsPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement);

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('header button')?.click();
    fixture.detectChanges();

    const validationError = new ApiClientError(
      'api',
      400,
      'VALIDATION_ERROR',
      'Dados inválidos.',
      'trace-student-123',
      [{ field: 'email', message: 'E-mail já está em uso.' }],
    );
    studentsApiMock.signUpStudent.mockReturnValue(throwError(() => validationError));

    const nameInput = root.querySelector<HTMLInputElement>('#student-name')!;
    const emailInput = root.querySelector<HTMLInputElement>('#student-email')!;

    nameInput.value = 'Carlos';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.value = 'carlos@test.com';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));

    const form = root.querySelector<HTMLFormElement>('form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(root.querySelector('#student-email-error')?.textContent).toContain(
      'E-mail já está em uso.',
    );

    // User modifies email input
    emailInput.value = 'carlos.novo@test.com';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(root.querySelector('#student-email-error')).toBeNull();
  });

  it('shows restriction message in dialog when deletion returns 409 (enrollments)', () => {
    const student: Student = { id: '1', name: 'Eduardo', email: 'eduardo@test.com' };
    studentsApiMock.listStudents.mockReturnValue(of([student]));

    fixture = TestBed.createComponent(StudentsPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement);

    const root = fixture.nativeElement as HTMLElement;
    const deleteButton = root.querySelectorAll<HTMLButtonElement>('tbody button')[1];
    deleteButton.click();
    fixture.detectChanges();

    const conflictError = new ApiClientError(
      'api',
      409,
      'STUDENT_HAS_ENROLLMENTS',
      'Este aluno possui matrículas vinculadas e não pode ser excluído.',
      null,
    );
    studentsApiMock.deleteStudent.mockReturnValue(throwError(() => conflictError));

    const confirmDeleteButton = root.querySelector<HTMLButtonElement>(
      'app-dialog[title="Excluir aluno?"] .ui-button--destructive',
    )!;
    confirmDeleteButton.click();
    fixture.detectChanges();

    expect(studentsApiMock.deleteStudent).toHaveBeenCalledWith('1');
    expect(root.querySelectorAll('tbody tr').length).toBe(1);

    const alertMessage = root.querySelector('.delete-confirmation-content .ui-message--danger');
    expect(alertMessage?.textContent).toContain(
      'Este aluno possui matrículas vinculadas e não pode ser excluído.',
    );
  });

  it('removes line on 204 delete success', () => {
    const student: Student = { id: '1', name: 'Fernanda', email: 'fernanda@test.com' };
    studentsApiMock.listStudents.mockReturnValue(of([student]));

    fixture = TestBed.createComponent(StudentsPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement);

    const root = fixture.nativeElement as HTMLElement;
    const deleteButton = root.querySelectorAll<HTMLButtonElement>('tbody button')[1];
    deleteButton.click();
    fixture.detectChanges();

    studentsApiMock.deleteStudent.mockReturnValue(of(undefined));

    const confirmDeleteButton = root.querySelector<HTMLButtonElement>(
      'app-dialog[title="Excluir aluno?"] .ui-button--destructive',
    )!;
    confirmDeleteButton.click();
    fixture.detectChanges();

    expect(studentsApiMock.deleteStudent).toHaveBeenCalledWith('1');
    expect(root.querySelectorAll('tbody tr').length).toBe(0);
    expect(root.querySelector('.ui-async-state')?.textContent).toContain('Nenhum aluno cadastrado');
  });
});
