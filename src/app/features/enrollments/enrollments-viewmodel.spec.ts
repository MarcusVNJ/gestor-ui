import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiClientError } from '../../core/api/api-error';
import { AcademicClass, AcademicClassesApi } from '../academic-classes/academic-classes-api';
import { Student, StudentsApi } from '../students/students-api';
import { Enrollment, EnrollmentsApi } from './enrollments-api';
import {
  EnrollmentsViewModel,
  sortAcademicClasses,
  sortStudentsByName,
} from './enrollments-viewmodel';

describe('EnrollmentsViewModel', () => {
  let viewModel: EnrollmentsViewModel;
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
