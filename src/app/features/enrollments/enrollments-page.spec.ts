import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { AcademicClass, AcademicClassesApi } from '../academic-classes/academic-classes-api';
import { Student, StudentsApi } from '../students/students-api';
import { Enrollment, EnrollmentsApi } from './enrollments-api';
import { EnrollmentsPage } from './enrollments-page';

describe('EnrollmentsPage', () => {
  let fixture: ComponentFixture<EnrollmentsPage>;
  let enrollmentsApiMock: {
    enrollStudent: ReturnType<typeof vi.fn>;
  };
  let studentsApiMock: {
    listStudents: ReturnType<typeof vi.fn>;
  };
  let academicClassesApiMock: {
    listAcademicClasses: ReturnType<typeof vi.fn>;
  };

  const sampleStudents: readonly Student[] = [
    { id: 'std-1', name: 'Ana Silva', email: 'ana@email.com' },
    { id: 'std-2', name: 'Bruno Costa', email: 'bruno@email.com' },
  ];

  const sampleClasses: readonly AcademicClass[] = [
    { id: 'class-open-1', openingStatus: 'OPEN', seatLimit: 30 },
    { id: 'class-closed-1', openingStatus: 'CLOSED', seatLimit: 20 },
  ];

  beforeEach(() => {
    enrollmentsApiMock = {
      enrollStudent: vi.fn(),
    };
    studentsApiMock = {
      listStudents: vi.fn(),
    };
    academicClassesApiMock = {
      listAcademicClasses: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [EnrollmentsPage],
      providers: [
        { provide: EnrollmentsApi, useValue: enrollmentsApiMock },
        { provide: StudentsApi, useValue: studentsApiMock },
        { provide: AcademicClassesApi, useValue: academicClassesApiMock },
      ],
    });
  });

  it('renders page title and description', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    expect(requiredElement(root, '#enrollments-heading').textContent?.trim()).toBe('Matrículas');
    expect(root.textContent).toContain('Consulte e gerencie os vínculos de alunos com as turmas.');
  });

  it('populates select options with labels derived from real data', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    openCreateDialog(root);

    const studentSelect = requiredElement<HTMLSelectElement>(root, '#enrollment-student');
    const classSelect = requiredElement<HTMLSelectElement>(root, '#enrollment-class');

    const studentOptions = [...studentSelect.options].map((opt) => opt.text);
    expect(studentOptions).toContain('Ana Silva (ana@email.com)');
    expect(studentOptions).toContain('Bruno Costa (bruno@email.com)');

    const classOptions = [...classSelect.options].map((opt) => opt.text);
    expect(classOptions.some((txt) => txt.includes('class-open-1') && txt.includes('Aberta'))).toBe(
      true,
    );
    // Closed class should NOT be in the options for creation
    expect(classOptions.some((txt) => txt.includes('class-closed-1'))).toBe(false);
  });

  it('explains when no OPEN classes exist and disables submit button', () => {
    const closedClasses: readonly AcademicClass[] = [
      { id: 'class-closed-1', openingStatus: 'CLOSED', seatLimit: 20 },
    ];
    renderWithData(of(sampleStudents), of(closedClasses));
    const root = fixture.nativeElement as HTMLElement;

    openCreateDialog(root);

    expect(root.textContent).toContain(
      'Não há turmas abertas disponíveis para matrícula no momento.',
    );
    const submitBtn = findButton(root, 'Criar matrícula');
    expect(submitBtn.disabled).toBe(true);
  });

  it('creates enrollment returning 201 with PENDING status and displaying server IDs', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    openCreateDialog(root);

    const created: Enrollment = {
      id: 'enr-999',
      studentId: 'std-1',
      academicClassId: 'class-open-1',
      status: 'PENDING',
    };
    enrollmentsApiMock.enrollStudent.mockReturnValue(of(created));

    setSelectValue(requiredElement(root, '#enrollment-student'), 'std-1');
    setSelectValue(requiredElement(root, '#enrollment-class'), 'class-open-1');

    submitForm(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(enrollmentsApiMock.enrollStudent).toHaveBeenCalledWith({
      studentId: 'std-1',
      academicClassId: 'class-open-1',
    });

    expect(root.textContent).toContain('Matrícula criada com sucesso');
    expect(root.textContent).toContain('enr-999');
    expect(root.textContent).toContain('Pendente');
  });

  it('handles 400 error (e.g. class closed before submit): preserves selections, shows summary error and updates classes', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    openCreateDialog(root);

    const error400 = new ApiClientError(
      'api',
      400,
      'CLASS_CLOSED',
      'A turma selecionada foi fechada.',
      null,
    );
    enrollmentsApiMock.enrollStudent.mockReturnValue(throwError(() => error400));
    academicClassesApiMock.listAcademicClasses.mockReturnValue(of([]));

    const studentSelect = requiredElement<HTMLSelectElement>(root, '#enrollment-student');
    const classSelect = requiredElement<HTMLSelectElement>(root, '#enrollment-class');

    setSelectValue(studentSelect, 'std-1');
    setSelectValue(classSelect, 'class-open-1');

    submitForm(requiredElement(root, 'form'));
    fixture.detectChanges();

    // Choices preserved in form model
    const pageInstance = fixture.componentInstance;
    expect(studentSelect.value).toBe('std-1');
    expect(pageInstance['enrollmentForm'].controls.academicClassId.value).toBe('class-open-1');

    // Error explained
    expect(root.textContent).toContain('A turma selecionada foi fechada.');

    // Academic classes reloaded
    expect(academicClassesApiMock.listAcademicClasses).toHaveBeenCalled();
  });

  it('handles 409 conflict error (duplicate enrollment): preserves form selections without auto-retry', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    openCreateDialog(root);

    const error409 = new ApiClientError(
      'api',
      409,
      'ENROLLMENT_CONFLICT',
      'Matrícula duplicada: este aluno já está matriculado nesta turma.',
      null,
    );
    enrollmentsApiMock.enrollStudent.mockReturnValue(throwError(() => error409));

    const studentSelect = requiredElement<HTMLSelectElement>(root, '#enrollment-student');
    const classSelect = requiredElement<HTMLSelectElement>(root, '#enrollment-class');

    setSelectValue(studentSelect, 'std-1');
    setSelectValue(classSelect, 'class-open-1');

    submitForm(requiredElement(root, 'form'));
    fixture.detectChanges();

    // Choices preserved
    expect(studentSelect.value).toBe('std-1');
    expect(classSelect.value).toBe('class-open-1');

    // Error explained
    expect(root.textContent).toContain('Matrícula duplicada');

    // Single request was made
    expect(enrollmentsApiMock.enrollStudent).toHaveBeenCalledOnce();
  });

  it('handles 404 error: shows error and reloads student and class collections', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    openCreateDialog(root);

    const error404 = new ApiClientError(
      'api',
      404,
      'NOT_FOUND',
      'Aluno ou turma não foi encontrada.',
      null,
    );
    enrollmentsApiMock.enrollStudent.mockReturnValue(throwError(() => error404));

    setSelectValue(requiredElement(root, '#enrollment-student'), 'std-1');
    setSelectValue(requiredElement(root, '#enrollment-class'), 'class-open-1');

    submitForm(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(root.textContent).toContain('Aluno ou turma não foi encontrada.');
    expect(studentsApiMock.listStudents).toHaveBeenCalled();
    expect(academicClassesApiMock.listAcademicClasses).toHaveBeenCalled();
  });

  it('prevents duplicate submit while creation request is in progress', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    openCreateDialog(root);

    const response$ = new Subject<Enrollment>();
    enrollmentsApiMock.enrollStudent.mockReturnValue(response$);

    setSelectValue(requiredElement(root, '#enrollment-student'), 'std-1');
    setSelectValue(requiredElement(root, '#enrollment-class'), 'class-open-1');

    const form = requiredElement<HTMLFormElement>(root, 'form');
    submitForm(form);
    submitForm(form);
    fixture.detectChanges();

    expect(enrollmentsApiMock.enrollStudent).toHaveBeenCalledOnce();
    expect(findButton(form, 'Criando...').disabled).toBe(true);
  });

  it('restores focus to opener when dialog is canceled', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    const newBtn = findButton(root, 'Nova matrícula');
    newBtn.focus();
    newBtn.click();
    fixture.detectChanges();

    findButton(requiredElement(root, 'app-dialog'), 'Cancelar').click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(newBtn);
  });

  function renderWithData(
    students: Observable<readonly Student[]>,
    classes: Observable<readonly AcademicClass[]>,
  ): void {
    studentsApiMock.listStudents.mockReturnValue(students);
    academicClassesApiMock.listAcademicClasses.mockReturnValue(classes);
    createFixture();
  }

  function createFixture(): void {
    fixture = TestBed.createComponent(EnrollmentsPage);
    fixture.detectChanges();
    setupDialogMocks(fixture.nativeElement as HTMLElement);
  }

  function openCreateDialog(root: HTMLElement): void {
    findButton(root, 'Nova matrícula').click();
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

function setSelectValue(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function submitForm(form: HTMLFormElement): void {
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
