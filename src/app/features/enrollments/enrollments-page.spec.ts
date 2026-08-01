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
    confirmEnrollment: ReturnType<typeof vi.fn>;
    cancelEnrollment: ReturnType<typeof vi.fn>;
    listEnrollmentsByStudent: ReturnType<typeof vi.fn>;
    listEnrollmentsByAcademicClass: ReturnType<typeof vi.fn>;
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
      confirmEnrollment: vi.fn(),
      cancelEnrollment: vi.fn(),
      listEnrollmentsByStudent: vi.fn(),
      listEnrollmentsByAcademicClass: vi.fn(),
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

  it('renders initial query interface without triggering enrollment endpoints before selection', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Consultar matrículas');
    expect(root.textContent).toContain('Escolha entre Consultar por aluno ou Consultar por turma');

    expect(enrollmentsApiMock.listEnrollmentsByStudent).not.toHaveBeenCalled();
    expect(enrollmentsApiMock.listEnrollmentsByAcademicClass).not.toHaveBeenCalled();
  });

  it('queries enrollments by student when student axis and student are selected', () => {
    const mockEnrollments: readonly Enrollment[] = [
      { id: 'enr-1', studentId: 'std-1', academicClassId: 'class-open-1', status: 'CONFIRMED' },
    ];
    enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));

    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    // Select student query axis
    const studentRadio = requiredElement<HTMLInputElement>(
      root,
      'input[name="queryAxis"][value="student"]',
    );
    studentRadio.click();
    fixture.detectChanges();

    const select = requiredElement<HTMLSelectElement>(root, '#query-student-select');
    setSelectValue(select, 'std-1');
    fixture.detectChanges();

    expect(enrollmentsApiMock.listEnrollmentsByStudent).toHaveBeenCalledWith('std-1');
    expect(enrollmentsApiMock.listEnrollmentsByAcademicClass).not.toHaveBeenCalled();

    expect(root.textContent).toContain('1 matrícula encontrada');
    expect(root.textContent).toContain('Ana Silva (ana@email.com)');
    expect(root.textContent).toContain('enr-1');
    expect(root.textContent).toContain('class-open-1');
    expect(root.textContent).toContain('Confirmada');
  });

  it('queries enrollments by class when class axis and class are selected', () => {
    const mockEnrollments: readonly Enrollment[] = [
      { id: 'enr-1', studentId: 'std-1', academicClassId: 'class-open-1', status: 'PENDING' },
      {
        id: 'enr-2',
        studentId: 'std-unknown',
        academicClassId: 'class-open-1',
        status: 'CANCELED',
      },
    ];
    enrollmentsApiMock.listEnrollmentsByAcademicClass.mockReturnValue(of(mockEnrollments));

    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    // Select class query axis
    const classRadio = requiredElement<HTMLInputElement>(
      root,
      'input[name="queryAxis"][value="class"]',
    );
    classRadio.click();
    fixture.detectChanges();

    const select = requiredElement<HTMLSelectElement>(root, '#query-class-select');
    setSelectValue(select, 'class-open-1');
    fixture.detectChanges();

    expect(enrollmentsApiMock.listEnrollmentsByAcademicClass).toHaveBeenCalledWith('class-open-1');
    expect(enrollmentsApiMock.listEnrollmentsByStudent).not.toHaveBeenCalled();

    expect(root.textContent).toContain('2 matrículas encontradas');
    expect(root.textContent).toContain('Turma ID: class-open-1');

    // Known student resolved by name and email
    expect(root.textContent).toContain('Ana Silva (ana@email.com)');
    expect(root.textContent).toContain('Pendente');

    // Unknown student falls back to UUID and neutral unavailability text
    expect(root.textContent).toContain('std-unknown');
    expect(root.textContent).toContain('(Dados do aluno indisponíveis)');
    expect(root.textContent).toContain('Cancelada');
  });

  it('displays empty query results message without asserting nonexistence', () => {
    enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of([]));
    enrollmentsApiMock.listEnrollmentsByAcademicClass.mockReturnValue(of([]));

    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    // Test student empty query
    const studentRadio = requiredElement<HTMLInputElement>(
      root,
      'input[name="queryAxis"][value="student"]',
    );
    studentRadio.click();
    fixture.detectChanges();

    setSelectValue(requiredElement(root, '#query-student-select'), 'std-1');
    fixture.detectChanges();

    expect(root.textContent).toContain('Nenhuma matrícula encontrada para este aluno.');

    // Test class empty query
    const classRadio = requiredElement<HTMLInputElement>(
      root,
      'input[name="queryAxis"][value="class"]',
    );
    classRadio.click();
    fixture.detectChanges();

    setSelectValue(requiredElement(root, '#query-class-select'), 'class-open-1');
    fixture.detectChanges();

    expect(root.textContent).toContain('Nenhuma matrícula encontrada para esta turma.');
  });

  it('handles query error and retries upon user action', () => {
    const error500 = new ApiClientError(
      'api',
      500,
      'INTERNAL_ERROR',
      'Erro ao consultar matrículas.',
      null,
    );
    enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(throwError(() => error500));

    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    const studentRadio = requiredElement<HTMLInputElement>(
      root,
      'input[name="queryAxis"][value="student"]',
    );
    studentRadio.click();
    fixture.detectChanges();

    setSelectValue(requiredElement(root, '#query-student-select'), 'std-1');
    fixture.detectChanges();

    expect(root.textContent).toContain('Erro ao consultar matrículas.');

    const mockEnrollments: readonly Enrollment[] = [
      { id: 'enr-10', studentId: 'std-1', academicClassId: 'class-open-1', status: 'CONFIRMED' },
    ];
    enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));

    findButton(root, 'Tentar novamente').click();
    fixture.detectChanges();

    expect(root.textContent).toContain('1 matrícula encontrada');
    expect(root.textContent).toContain('enr-10');
  });

  it('only displays latest query response when selections change rapidly', () => {
    const std1Subject = new Subject<readonly Enrollment[]>();
    const std2Subject = new Subject<readonly Enrollment[]>();

    enrollmentsApiMock.listEnrollmentsByStudent.mockImplementation((studentId: string) => {
      if (studentId === 'std-1') return std1Subject;
      if (studentId === 'std-2') return std2Subject;
      return of([]);
    });

    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    const studentRadio = requiredElement<HTMLInputElement>(
      root,
      'input[name="queryAxis"][value="student"]',
    );
    studentRadio.click();
    fixture.detectChanges();

    const select = requiredElement<HTMLSelectElement>(root, '#query-student-select');

    // Trigger std-1 query
    setSelectValue(select, 'std-1');
    fixture.detectChanges();
    expect(root.textContent).toContain('Carregando matrículas...');

    // Trigger std-2 query before std-1 finishes
    setSelectValue(select, 'std-2');
    fixture.detectChanges();

    // std-1 finishes late
    std1Subject.next([
      { id: 'enr-old', studentId: 'std-1', academicClassId: 'class-open-1', status: 'CONFIRMED' },
    ]);
    fixture.detectChanges();

    expect(root.textContent).not.toContain('enr-old');

    // std-2 finishes
    std2Subject.next([
      { id: 'enr-new', studentId: 'std-2', academicClassId: 'class-open-1', status: 'PENDING' },
    ]);
    fixture.detectChanges();

    expect(root.textContent).toContain('enr-new');
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

  it('clears control apiError when control value changes and displays traceId in error summary', () => {
    renderWithData(of(sampleStudents), of(sampleClasses));
    const root = fixture.nativeElement as HTMLElement;

    openCreateDialog(root);

    const error400 = new ApiClientError(
      'api',
      400,
      'VALIDATION_FAILED',
      'Revise os dados informados.',
      'trace-enr-123',
      [
        { field: 'studentId', message: 'Aluno indisponível.' },
        { field: 'global', message: 'Restrição do sistema.' },
      ],
    );
    enrollmentsApiMock.enrollStudent.mockReturnValue(throwError(() => error400));

    const studentSelect = requiredElement<HTMLSelectElement>(root, '#enrollment-student');
    const classSelect = requiredElement<HTMLSelectElement>(root, '#enrollment-class');

    setSelectValue(studentSelect, 'std-1');
    setSelectValue(classSelect, 'class-open-1');

    submitForm(requiredElement(root, 'form'));
    fixture.detectChanges();

    expect(requiredElement(root, '#enrollment-student-error').textContent).toContain(
      'Aluno indisponível.',
    );
    expect(requiredElement(root, 'form .ui-message--danger').textContent).toContain(
      'Código para suporte: trace-enr-123',
    );

    // Change selection
    setSelectValue(studentSelect, 'std-2');
    fixture.detectChanges();

    expect(root.querySelector('#enrollment-student-error')).toBeNull();
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

    const pageInstance = fixture.componentInstance;
    expect(studentSelect.value).toBe('std-1');
    expect(pageInstance['enrollmentForm'].controls.academicClassId.value).toBe('class-open-1');

    expect(root.textContent).toContain('A turma selecionada foi fechada.');
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

    expect(studentSelect.value).toBe('std-1');
    expect(classSelect.value).toBe('class-open-1');

    expect(root.textContent).toContain('Matrícula duplicada');
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

  describe('Enrollment status transitions & action button matrix', () => {
    it('renders correct action button matrix by enrollment status (PENDING -> Confirm, CONFIRMED -> Cancel, CANCELED -> None)', () => {
      const mockEnrollments: readonly Enrollment[] = [
        {
          id: 'enr-pending',
          studentId: 'std-1',
          academicClassId: 'class-open-1',
          status: 'PENDING',
        },
        {
          id: 'enr-confirmed',
          studentId: 'std-1',
          academicClassId: 'class-open-1',
          status: 'CONFIRMED',
        },
        {
          id: 'enr-canceled',
          studentId: 'std-1',
          academicClassId: 'class-open-1',
          status: 'CANCELED',
        },
      ];
      enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));

      renderWithData(of(sampleStudents), of(sampleClasses));
      const root = fixture.nativeElement as HTMLElement;

      const studentRadio = requiredElement<HTMLInputElement>(
        root,
        'input[name="queryAxis"][value="student"]',
      );
      studentRadio.click();
      fixture.detectChanges();

      setSelectValue(requiredElement(root, '#query-student-select'), 'std-1');
      fixture.detectChanges();

      const rowPending = requiredElement(root, '#enrollment-row-enr-pending');
      expect(findButton(rowPending, 'Confirmar matrícula')).toBeDefined();

      const rowConfirmed = requiredElement(root, '#enrollment-row-enr-confirmed');
      expect(findButton(rowConfirmed, 'Cancelar matrícula')).toBeDefined();

      const rowCanceled = requiredElement(root, '#enrollment-row-enr-canceled');
      expect(rowCanceled.textContent).toContain('Nenhuma ação disponível');
      expect(rowCanceled.querySelector('button')).toBeNull();
    });

    it('confirms pending enrollment successfully and shows feedback message and live announcement', () => {
      const mockEnrollments: readonly Enrollment[] = [
        { id: 'enr-1', studentId: 'std-1', academicClassId: 'class-open-1', status: 'PENDING' },
      ];
      enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));
      enrollmentsApiMock.confirmEnrollment.mockReturnValue(
        of({
          id: 'enr-1',
          studentId: 'std-1',
          academicClassId: 'class-open-1',
          status: 'CONFIRMED',
        }),
      );

      renderWithData(of(sampleStudents), of(sampleClasses));
      const root = fixture.nativeElement as HTMLElement;

      requiredElement<HTMLInputElement>(root, 'input[name="queryAxis"][value="student"]').click();
      fixture.detectChanges();
      setSelectValue(requiredElement(root, '#query-student-select'), 'std-1');
      fixture.detectChanges();

      const confirmBtn = findButton(root, 'Confirmar matrícula');
      confirmBtn.click();
      fixture.detectChanges();

      expect(enrollmentsApiMock.confirmEnrollment).toHaveBeenCalledWith('enr-1');
      expect(root.textContent).toContain('Matrícula confirmada com sucesso.');
      expect(requiredElement(root, '.sr-only[role="status"]').textContent).toContain(
        'Matrícula confirmada',
      );
    });

    it('handles 409 capacity conflict error when confirming enrollment without auto retrying query', () => {
      const mockEnrollments: readonly Enrollment[] = [
        { id: 'enr-1', studentId: 'std-1', academicClassId: 'class-open-1', status: 'PENDING' },
      ];
      enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));
      const error409 = new ApiClientError(
        'api',
        409,
        'CLASS_FULL',
        'Não há vagas disponíveis na turma para confirmar esta matrícula no momento.',
        'trace-409',
      );
      enrollmentsApiMock.confirmEnrollment.mockReturnValue(throwError(() => error409));

      renderWithData(of(sampleStudents), of(sampleClasses));
      const root = fixture.nativeElement as HTMLElement;

      requiredElement<HTMLInputElement>(root, 'input[name="queryAxis"][value="student"]').click();
      fixture.detectChanges();
      setSelectValue(requiredElement(root, '#query-student-select'), 'std-1');
      fixture.detectChanges();

      enrollmentsApiMock.listEnrollmentsByStudent.mockClear();

      findButton(root, 'Confirmar matrícula').click();
      fixture.detectChanges();

      expect(root.textContent).toContain('Não há vagas disponíveis na turma');
      expect(root.textContent).toContain('Código para suporte: trace-409');
      expect(enrollmentsApiMock.listEnrollmentsByStudent).not.toHaveBeenCalled();
    });

    it('handles 409 status conflict or 404 error on confirm by showing error feedback and triggering query reload', () => {
      const mockEnrollments: readonly Enrollment[] = [
        { id: 'enr-1', studentId: 'std-1', academicClassId: 'class-open-1', status: 'PENDING' },
      ];
      enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));
      const error409 = new ApiClientError(
        'api',
        409,
        'STATE_CONFLICT',
        'A situação desta matrícula foi alterada por outro processo.',
        'trace-conflict',
      );
      enrollmentsApiMock.confirmEnrollment.mockReturnValue(throwError(() => error409));

      renderWithData(of(sampleStudents), of(sampleClasses));
      const root = fixture.nativeElement as HTMLElement;

      requiredElement<HTMLInputElement>(root, 'input[name="queryAxis"][value="student"]').click();
      fixture.detectChanges();
      setSelectValue(requiredElement(root, '#query-student-select'), 'std-1');
      fixture.detectChanges();

      enrollmentsApiMock.listEnrollmentsByStudent.mockClear();

      findButton(root, 'Confirmar matrícula').click();
      fixture.detectChanges();

      expect(root.textContent).toContain(
        'A situação desta matrícula foi alterada por outro processo.',
      );
      expect(enrollmentsApiMock.listEnrollmentsByStudent).toHaveBeenCalledWith('std-1');
    });

    it('cancels confirmed enrollment through dialog confirmation and updates UI with live announcement', () => {
      const mockEnrollments: readonly Enrollment[] = [
        { id: 'enr-2', studentId: 'std-1', academicClassId: 'class-open-1', status: 'CONFIRMED' },
      ];
      enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));
      enrollmentsApiMock.cancelEnrollment.mockReturnValue(
        of({
          id: 'enr-2',
          studentId: 'std-1',
          academicClassId: 'class-open-1',
          status: 'CANCELED',
        }),
      );

      renderWithData(of(sampleStudents), of(sampleClasses));
      const root = fixture.nativeElement as HTMLElement;

      requiredElement<HTMLInputElement>(root, 'input[name="queryAxis"][value="student"]').click();
      fixture.detectChanges();
      setSelectValue(requiredElement(root, '#query-student-select'), 'std-1');
      fixture.detectChanges();

      // Click cancel button in table row to open confirmation dialog
      const cancelBtn = findButton(root, 'Cancelar matrícula');
      cancelBtn.click();
      fixture.detectChanges();

      expect(root.textContent).toContain('Cancelar matrícula?');
      expect(root.textContent).toContain('Esta ação não pode ser desfeita.');

      // Confirm in dialog
      const dialog = requiredElement(root, '#cancelDialog');
      findButton(dialog, 'Confirmar cancelamento').click();
      fixture.detectChanges();

      expect(enrollmentsApiMock.cancelEnrollment).toHaveBeenCalledWith('enr-2');
      expect(root.textContent).toContain('Matrícula cancelada com sucesso.');
      expect(requiredElement(root, '.sr-only[role="status"]').textContent).toContain(
        'Matrícula cancelada',
      );
    });

    it('handles error when canceling enrollment and displays error feedback', () => {
      const mockEnrollments: readonly Enrollment[] = [
        { id: 'enr-2', studentId: 'std-1', academicClassId: 'class-open-1', status: 'CONFIRMED' },
      ];
      enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));
      const error500 = new ApiClientError(
        'api',
        500,
        'INTERNAL_ERROR',
        'Erro ao cancelar matrícula.',
        'trace-cancel-err',
      );
      enrollmentsApiMock.cancelEnrollment.mockReturnValue(throwError(() => error500));

      renderWithData(of(sampleStudents), of(sampleClasses));
      const root = fixture.nativeElement as HTMLElement;

      requiredElement<HTMLInputElement>(root, 'input[name="queryAxis"][value="student"]').click();
      fixture.detectChanges();
      setSelectValue(requiredElement(root, '#query-student-select'), 'std-1');
      fixture.detectChanges();

      findButton(root, 'Cancelar matrícula').click();
      fixture.detectChanges();

      const dialog = requiredElement(root, '#cancelDialog');
      findButton(dialog, 'Confirmar cancelamento').click();
      fixture.detectChanges();

      expect(root.textContent).toContain('Ocorreu uma falha na comunicação com o servidor.');
    });
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
