import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { AcademicClass, AcademicClassesApi } from '../academic-classes/academic-classes-api';
import { Student, StudentsApi } from '../students/students-api';
import { Enrollment, EnrollmentsApi } from './enrollments-api';
import {
  EnrollmentsViewModel,
  sortAcademicClasses,
  sortEnrollments,
  sortStudentsByName,
} from './enrollments-viewmodel';

describe('EnrollmentsViewModel', () => {
  let viewModel: EnrollmentsViewModel;
  let enrollmentsApiMock: {
    enrollStudent: ReturnType<typeof vi.fn>;
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
    { id: 'std-2', name: 'Bruno Costa', email: 'bruno@email.com' },
    { id: 'std-1', name: 'Ana Silva', email: 'ana@email.com' },
  ];

  const sampleClasses: readonly AcademicClass[] = [
    { id: 'class-closed-1', openingStatus: 'CLOSED', seatLimit: 20 },
    { id: 'class-open-2', openingStatus: 'OPEN', seatLimit: 15 },
    { id: 'class-open-1', openingStatus: 'OPEN', seatLimit: 30 },
  ];

  beforeEach(() => {
    enrollmentsApiMock = {
      enrollStudent: vi.fn(),
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
      providers: [
        EnrollmentsViewModel,
        { provide: EnrollmentsApi, useValue: enrollmentsApiMock },
        { provide: StudentsApi, useValue: studentsApiMock },
        { provide: AcademicClassesApi, useValue: academicClassesApiMock },
      ],
    });

    viewModel = TestBed.inject(EnrollmentsViewModel);
  });

  it('should sort students alphabetically by name', () => {
    const sorted = sortStudentsByName(sampleStudents);
    expect(sorted.map((s) => s.name)).toEqual(['Ana Silva', 'Bruno Costa']);
  });

  it('should sort academic classes with OPEN status first and then by ID', () => {
    const sorted = sortAcademicClasses(sampleClasses);
    expect(sorted.map((c) => c.id)).toEqual(['class-open-1', 'class-open-2', 'class-closed-1']);
  });

  it('should sort enrollments deterministically by status priority (PENDING, CONFIRMED, CANCELED) then by ID', () => {
    const enrollments: readonly Enrollment[] = [
      { id: 'enr-3', studentId: 'std-1', academicClassId: 'class-1', status: 'CANCELED' },
      { id: 'enr-2', studentId: 'std-1', academicClassId: 'class-2', status: 'CONFIRMED' },
      { id: 'enr-4', studentId: 'std-1', academicClassId: 'class-1', status: 'PENDING' },
      { id: 'enr-1', studentId: 'std-1', academicClassId: 'class-3', status: 'CONFIRMED' },
    ];

    const sorted = sortEnrollments(enrollments);
    expect(sorted.map((e) => e.id)).toEqual(['enr-4', 'enr-1', 'enr-2', 'enr-3']);

    // Reverse order input should yield identical sorted order
    const reverseSorted = sortEnrollments([...enrollments].reverse());
    expect(reverseSorted.map((e) => e.id)).toEqual(['enr-4', 'enr-1', 'enr-2', 'enr-3']);
  });

  it('should load students and academic classes options independently', () => {
    studentsApiMock.listStudents.mockReturnValue(of(sampleStudents));
    academicClassesApiMock.listAcademicClasses.mockReturnValue(of(sampleClasses));

    viewModel.loadStudents();
    expect(viewModel.students().map((s) => s.name)).toEqual(['Ana Silva', 'Bruno Costa']);

    viewModel.loadAcademicClasses();
    expect(viewModel.academicClasses().map((c) => c.id)).toEqual([
      'class-open-1',
      'class-open-2',
      'class-closed-1',
    ]);
    expect(viewModel.openAcademicClasses().map((c) => c.id)).toEqual([
      'class-open-1',
      'class-open-2',
    ]);
    expect(viewModel.hasOpenAcademicClasses()).toBe(true);
  });

  it('should resolve student by ID from loaded students collection', () => {
    studentsApiMock.listStudents.mockReturnValue(of(sampleStudents));
    viewModel.loadStudents();

    const std = viewModel.getStudentById('std-1');
    expect(std?.name).toBe('Ana Silva');

    const unknown = viewModel.getStudentById('std-unknown');
    expect(unknown).toBeUndefined();
  });

  it('should manage query axis selection and reset state when changed', () => {
    expect(viewModel.selectedAxis()).toBeNull();
    expect(viewModel.queryState()).toEqual({ status: 'idle' });

    viewModel.setQueryAxis('student');
    expect(viewModel.selectedAxis()).toBe('student');
    expect(viewModel.queryState()).toEqual({ status: 'idle' });

    viewModel.setQueryAxis('class');
    expect(viewModel.selectedAxis()).toBe('class');
    expect(viewModel.queryState()).toEqual({ status: 'idle' });
  });

  it('should execute student query and update queryState to success or empty', () => {
    const mockEnrollments: readonly Enrollment[] = [
      { id: 'enr-1', studentId: 'std-1', academicClassId: 'class-open-1', status: 'CONFIRMED' },
    ];
    enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));

    viewModel.setQueryAxis('student');
    viewModel.selectStudent('std-1');

    expect(enrollmentsApiMock.listEnrollmentsByStudent).toHaveBeenCalledWith('std-1');
    expect(viewModel.queryState()).toEqual({
      status: 'success',
      axis: 'student',
      targetId: 'std-1',
      enrollments: mockEnrollments,
    });

    // Empty result test
    enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of([]));
    viewModel.selectStudent('std-2');

    expect(viewModel.queryState()).toEqual({
      status: 'empty',
      axis: 'student',
      targetId: 'std-2',
    });
  });

  it('should execute class query and update queryState to success or empty', () => {
    const mockEnrollments: readonly Enrollment[] = [
      { id: 'enr-2', studentId: 'std-2', academicClassId: 'class-open-1', status: 'PENDING' },
    ];
    enrollmentsApiMock.listEnrollmentsByAcademicClass.mockReturnValue(of(mockEnrollments));

    viewModel.setQueryAxis('class');
    viewModel.selectClass('class-open-1');

    expect(enrollmentsApiMock.listEnrollmentsByAcademicClass).toHaveBeenCalledWith('class-open-1');
    expect(viewModel.queryState()).toEqual({
      status: 'success',
      axis: 'class',
      targetId: 'class-open-1',
      enrollments: mockEnrollments,
    });
  });

  it('should handle query failure and support retryQuery', () => {
    const apiError = new ApiClientError('api', 500, 'SERVER_ERROR', 'Falha na consulta', null);
    enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(throwError(() => apiError));

    viewModel.setQueryAxis('student');
    viewModel.selectStudent('std-1');

    expect(viewModel.queryState()).toEqual({
      status: 'error',
      axis: 'student',
      targetId: 'std-1',
      message: 'Falha na consulta',
    });

    const mockEnrollments: readonly Enrollment[] = [
      { id: 'enr-1', studentId: 'std-1', academicClassId: 'class-1', status: 'CONFIRMED' },
    ];
    enrollmentsApiMock.listEnrollmentsByStudent.mockReturnValue(of(mockEnrollments));

    viewModel.retryQuery();

    expect(viewModel.queryState()).toEqual({
      status: 'success',
      axis: 'student',
      targetId: 'std-1',
      enrollments: mockEnrollments,
    });
  });

  it('should ignore outdated response when rapid selections are made (switchMap race condition test)', () => {
    const std1Subject = new Subject<readonly Enrollment[]>();
    const std2Subject = new Subject<readonly Enrollment[]>();

    enrollmentsApiMock.listEnrollmentsByStudent.mockImplementation((studentId: string) => {
      if (studentId === 'std-1') return std1Subject;
      if (studentId === 'std-2') return std2Subject;
      return of([]);
    });

    viewModel.setQueryAxis('student');
    viewModel.selectStudent('std-1');
    expect(viewModel.queryState()).toEqual({
      status: 'loading',
      axis: 'student',
      targetId: 'std-1',
    });

    // Rapidly switch to std-2 before std-1 completes
    viewModel.selectStudent('std-2');
    expect(viewModel.queryState()).toEqual({
      status: 'loading',
      axis: 'student',
      targetId: 'std-2',
    });

    // std-1 finishes late
    const std1Enrollments: readonly Enrollment[] = [
      { id: 'enr-old', studentId: 'std-1', academicClassId: 'class-1', status: 'CONFIRMED' },
    ];
    std1Subject.next(std1Enrollments);

    // queryState should STILL be loading std-2, NOT overwritten by std-1
    expect(viewModel.queryState()).toEqual({
      status: 'loading',
      axis: 'student',
      targetId: 'std-2',
    });

    // std-2 completes
    const std2Enrollments: readonly Enrollment[] = [
      { id: 'enr-new', studentId: 'std-2', academicClassId: 'class-2', status: 'PENDING' },
    ];
    std2Subject.next(std2Enrollments);

    expect(viewModel.queryState()).toEqual({
      status: 'success',
      axis: 'student',
      targetId: 'std-2',
      enrollments: std2Enrollments,
    });
  });

  it('should handle student loading failure independently', () => {
    const apiError = new ApiClientError(
      'api',
      500,
      'INTERNAL_ERROR',
      'Erro ao carregar alunos.',
      null,
    );
    studentsApiMock.listStudents.mockReturnValue(throwError(() => apiError));
    academicClassesApiMock.listAcademicClasses.mockReturnValue(of(sampleClasses));

    viewModel.loadOptions();

    expect(viewModel.isStudentsError()).toBe(true);
    expect(viewModel.studentsErrorMessage()).toBe('Erro ao carregar alunos.');
    expect(viewModel.students()).toEqual([]);

    expect(viewModel.isClassesError()).toBe(false);
    expect(viewModel.hasOpenAcademicClasses()).toBe(true);
  });

  it('should handle academic classes loading failure independently', () => {
    const apiError = new ApiClientError(
      'api',
      500,
      'INTERNAL_ERROR',
      'Erro ao carregar turmas.',
      null,
    );
    studentsApiMock.listStudents.mockReturnValue(of(sampleStudents));
    academicClassesApiMock.listAcademicClasses.mockReturnValue(throwError(() => apiError));

    viewModel.loadOptions();

    expect(viewModel.isStudentsError()).toBe(false);
    expect(viewModel.students().length).toBe(2);

    expect(viewModel.isClassesError()).toBe(true);
    expect(viewModel.classesErrorMessage()).toBe('Erro ao carregar turmas.');
    expect(viewModel.academicClasses()).toEqual([]);
    expect(viewModel.hasOpenAcademicClasses()).toBe(false);
  });

  it('should report hasOpenAcademicClasses as false when no OPEN classes exist', () => {
    const closedClasses: readonly AcademicClass[] = [
      { id: 'class-closed-1', openingStatus: 'CLOSED', seatLimit: 20 },
    ];
    studentsApiMock.listStudents.mockReturnValue(of(sampleStudents));
    academicClassesApiMock.listAcademicClasses.mockReturnValue(of(closedClasses));

    viewModel.loadOptions();

    expect(viewModel.openAcademicClasses()).toEqual([]);
    expect(viewModel.hasOpenAcademicClasses()).toBe(false);
  });

  it('should enroll student successfully and return created enrollment', () => {
    const createdEnrollment: Enrollment = {
      id: 'enr-100',
      studentId: 'std-1',
      academicClassId: 'class-open-1',
      status: 'PENDING',
    };
    enrollmentsApiMock.enrollStudent.mockReturnValue(of(createdEnrollment));

    let result: Enrollment | undefined;
    viewModel
      .enrollStudent({ studentId: 'std-1', academicClassId: 'class-open-1' })
      .subscribe((res) => (result = res));

    expect(result).toEqual(createdEnrollment);
  });

  it('should reload academic classes on 400 error when enrolling student', () => {
    const apiError = new ApiClientError('api', 400, 'CLASS_CLOSED', 'Turma fechada.', null);
    enrollmentsApiMock.enrollStudent.mockReturnValue(throwError(() => apiError));
    academicClassesApiMock.listAcademicClasses.mockReturnValue(of(sampleClasses));

    let caughtError: unknown;
    viewModel.enrollStudent({ studentId: 'std-1', academicClassId: 'class-open-1' }).subscribe({
      error: (err) => (caughtError = err),
    });

    expect(caughtError).toBe(apiError);
    expect(academicClassesApiMock.listAcademicClasses).toHaveBeenCalled();
  });

  it('should reload students and academic classes on 404 error when enrolling student', () => {
    const apiError = new ApiClientError(
      'api',
      404,
      'NOT_FOUND',
      'Aluno ou turma não encontrado.',
      null,
    );
    enrollmentsApiMock.enrollStudent.mockReturnValue(throwError(() => apiError));
    studentsApiMock.listStudents.mockReturnValue(of(sampleStudents));
    academicClassesApiMock.listAcademicClasses.mockReturnValue(of(sampleClasses));

    let caughtError: unknown;
    viewModel.enrollStudent({ studentId: 'std-1', academicClassId: 'class-open-1' }).subscribe({
      error: (err) => (caughtError = err),
    });

    expect(caughtError).toBe(apiError);
    expect(studentsApiMock.listStudents).toHaveBeenCalled();
    expect(academicClassesApiMock.listAcademicClasses).toHaveBeenCalled();
  });
});
