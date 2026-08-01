import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AcademicClassesApi } from '../../features/academic-classes/academic-classes-api';
import { CoursesApi } from '../../features/courses/courses-api';
import { DisciplinesApi } from '../../features/disciplines/disciplines-api';
import { EnrollmentsApi } from '../../features/enrollments/enrollments-api';
import { StudentsApi } from '../../features/students/students-api';
import { apiErrorInterceptor } from './api-error.interceptor';

const studentId = '5aa5c249-4fe8-4d90-8998-e54d62831e95';
const courseId = '87d9f20c-f83d-4f3b-a0a8-8619f397054d';
const disciplineId = '5db15937-772d-4cb7-bdf7-83e296f09393';
const academicClassId = '8f00484d-652f-4014-8f48-22b89938c098';
const enrollmentId = '82072942-0719-48f1-bb32-d459349411bc';

function apiProblem(status: number, code: string) {
  return {
    type: 'https://example.com/problems/request-error',
    title: 'Request error',
    status,
    detail: 'Não foi possível processar a solicitação.',
    instance: 'https://example.com/requests/123',
    code,
    traceId: 'trace-123',
  };
}

describe('API foundation & OpenAPI endpoints', () => {
  let httpTesting: HttpTestingController;
  let studentsApi: StudentsApi;
  let coursesApi: CoursesApi;
  let disciplinesApi: DisciplinesApi;
  let academicClassesApi: AcademicClassesApi;
  let enrollmentsApi: EnrollmentsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    studentsApi = TestBed.inject(StudentsApi);
    coursesApi = TestBed.inject(CoursesApi);
    disciplinesApi = TestBed.inject(DisciplinesApi);
    academicClassesApi = TestBed.inject(AcademicClassesApi);
    enrollmentsApi = TestBed.inject(EnrollmentsApi);
  });

  afterEach(() => httpTesting.verify());

  describe('Students API (4 operations)', () => {
    it('1. listStudents: GET /api/students/v1 (returns list or empty array)', async () => {
      const response = firstValueFrom(studentsApi.listStudents());
      const request = httpTesting.expectOne('/api/students/v1');

      expect(request.request.method).toBe('GET');
      request.flush([]);

      await expect(response).resolves.toEqual([]);
    });

    it('2. signUpStudent: POST /api/students/v1 (201 Created with full payload)', async () => {
      const body = { name: 'Ana Silva', email: 'ana.silva@example.com' };
      const response = firstValueFrom(studentsApi.signUpStudent(body));
      const request = httpTesting.expectOne('/api/students/v1');

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(body);
      request.flush({ id: studentId, ...body }, { status: 201, statusText: 'Created' });

      await expect(response).resolves.toEqual({ id: studentId, ...body });
    });

    it('3. editStudent: PUT /api/students/v1/{id} (200 OK with payload)', async () => {
      const body = { name: 'Ana Silva Editada', email: 'ana.editada@example.com' };
      const response = firstValueFrom(studentsApi.editStudent(studentId, body));
      const request = httpTesting.expectOne(`/api/students/v1/${studentId}`);

      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual(body);
      request.flush({ id: studentId, ...body });

      await expect(response).resolves.toEqual({ id: studentId, ...body });
    });

    it('4. deleteStudent: DELETE /api/students/v1/{id} (204 No Content without body)', async () => {
      const response = firstValueFrom(studentsApi.deleteStudent(studentId));
      const request = httpTesting.expectOne(`/api/students/v1/${studentId}`);

      expect(request.request.method).toBe('DELETE');
      expect(request.request.body).toBeNull();
      request.flush(null, { status: 204, statusText: 'No Content' });

      await expect(response).resolves.toBeNull();
    });
  });

  describe('Courses API (4 operations)', () => {
    it('5. listCourses: GET /api/courses/v1 (returns list or empty array)', async () => {
      const response = firstValueFrom(coursesApi.listCourses());
      const request = httpTesting.expectOne('/api/courses/v1');

      expect(request.request.method).toBe('GET');
      request.flush([{ id: courseId, name: 'Engenharia de Software' }]);

      await expect(response).resolves.toEqual([{ id: courseId, name: 'Engenharia de Software' }]);
    });

    it('6. registerCourse: POST /api/courses/v1 (201 Created with full payload)', async () => {
      const body = { name: 'Ciência da Computação' };
      const response = firstValueFrom(coursesApi.registerCourse(body));
      const request = httpTesting.expectOne('/api/courses/v1');

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(body);
      request.flush({ id: courseId, ...body }, { status: 201, statusText: 'Created' });

      await expect(response).resolves.toEqual({ id: courseId, ...body });
    });

    it('7. editCourse: PUT /api/courses/v1/{id} (200 OK with payload)', async () => {
      const body = { name: 'Ciência da Computação Renovado' };
      const response = firstValueFrom(coursesApi.editCourse(courseId, body));
      const request = httpTesting.expectOne(`/api/courses/v1/${courseId}`);

      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual(body);
      request.flush({ id: courseId, ...body });

      await expect(response).resolves.toEqual({ id: courseId, ...body });
    });

    it('8. deleteCourse: DELETE /api/courses/v1/{id} (204 No Content without body)', async () => {
      const response = firstValueFrom(coursesApi.deleteCourse(courseId));
      const request = httpTesting.expectOne(`/api/courses/v1/${courseId}`);

      expect(request.request.method).toBe('DELETE');
      expect(request.request.body).toBeNull();
      request.flush(null, { status: 204, statusText: 'No Content' });

      await expect(response).resolves.toBeNull();
    });
  });

  describe('Disciplines API (4 operations)', () => {
    it('9. listDisciplines: GET /api/disciplines/v1 (returns list or empty array)', async () => {
      const response = firstValueFrom(disciplinesApi.listDisciplines());
      const request = httpTesting.expectOne('/api/disciplines/v1');

      expect(request.request.method).toBe('GET');
      request.flush([]);

      await expect(response).resolves.toEqual([]);
    });

    it('10. registerDiscipline: POST /api/disciplines/v1 (201 Created)', async () => {
      const body = { name: 'Algoritmos e Estruturas de Dados' };
      const response = firstValueFrom(disciplinesApi.registerDiscipline(body));
      const request = httpTesting.expectOne('/api/disciplines/v1');

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(body);
      request.flush({ id: disciplineId, ...body }, { status: 201, statusText: 'Created' });

      await expect(response).resolves.toEqual({ id: disciplineId, ...body });
    });

    it('11. editDiscipline: PUT /api/disciplines/v1/{id} (200 OK)', async () => {
      const body = { name: 'Algoritmos Avançados' };
      const response = firstValueFrom(disciplinesApi.editDiscipline(disciplineId, body));
      const request = httpTesting.expectOne(`/api/disciplines/v1/${disciplineId}`);

      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual(body);
      request.flush({ id: disciplineId, ...body });

      await expect(response).resolves.toEqual({ id: disciplineId, ...body });
    });

    it('12. deleteDiscipline: DELETE /api/disciplines/v1/{id} (204 No Content without body)', async () => {
      const response = firstValueFrom(disciplinesApi.deleteDiscipline(disciplineId));
      const request = httpTesting.expectOne(`/api/disciplines/v1/${disciplineId}`);

      expect(request.request.method).toBe('DELETE');
      expect(request.request.body).toBeNull();
      request.flush(null, { status: 204, statusText: 'No Content' });

      await expect(response).resolves.toBeNull();
    });
  });

  describe('Academic Classes API (4 operations)', () => {
    it('13. listAcademicClasses: GET /api/academic-classes/v1 (returns empty array)', async () => {
      const response = firstValueFrom(academicClassesApi.listAcademicClasses());
      const request = httpTesting.expectOne('/api/academic-classes/v1');

      expect(request.request.method).toBe('GET');
      request.flush([]);

      await expect(response).resolves.toEqual([]);
    });

    it('14. registerAcademicClass: POST /api/academic-classes/v1 (201 Created)', async () => {
      const body = { openingStatus: 'OPEN' as const, seatLimit: 30 };
      const response = firstValueFrom(academicClassesApi.registerAcademicClass(body));
      const request = httpTesting.expectOne('/api/academic-classes/v1');

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(body);
      request.flush({ id: academicClassId, ...body }, { status: 201, statusText: 'Created' });

      await expect(response).resolves.toEqual({ id: academicClassId, ...body });
    });

    it('15. editAcademicClass: PUT /api/academic-classes/v1/{id} (200 OK)', async () => {
      const body = { openingStatus: 'CLOSED' as const, seatLimit: 25 };
      const response = firstValueFrom(academicClassesApi.editAcademicClass(academicClassId, body));
      const request = httpTesting.expectOne(`/api/academic-classes/v1/${academicClassId}`);

      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual(body);
      request.flush({ id: academicClassId, ...body });

      await expect(response).resolves.toEqual({ id: academicClassId, ...body });
    });

    it('16. deleteAcademicClass: DELETE /api/academic-classes/v1/{id} (204 No Content without body)', async () => {
      const response = firstValueFrom(academicClassesApi.deleteAcademicClass(academicClassId));
      const request = httpTesting.expectOne(`/api/academic-classes/v1/${academicClassId}`);

      expect(request.request.method).toBe('DELETE');
      expect(request.request.body).toBeNull();
      request.flush(null, { status: 204, statusText: 'No Content' });

      await expect(response).resolves.toBeNull();
    });
  });

  describe('Enrollments API (5 operations)', () => {
    it('17. enrollStudent: POST /api/enrollments/v1 (201 Created with initial PENDING status)', async () => {
      const body = { studentId, academicClassId };
      const response = firstValueFrom(enrollmentsApi.enrollStudent(body));
      const request = httpTesting.expectOne('/api/enrollments/v1');

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(body);
      request.flush(
        { id: enrollmentId, studentId, academicClassId, status: 'PENDING' },
        { status: 201, statusText: 'Created' },
      );

      await expect(response).resolves.toEqual({
        id: enrollmentId,
        studentId,
        academicClassId,
        status: 'PENDING',
      });
    });

    it('18. confirmEnrollment: POST /api/enrollments/v1/{id}/confirmation (200 OK, transition to CONFIRMED)', async () => {
      const response = firstValueFrom(enrollmentsApi.confirmEnrollment(enrollmentId));
      const request = httpTesting.expectOne(`/api/enrollments/v1/${enrollmentId}/confirmation`);

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toBeNull();
      request.flush({
        id: enrollmentId,
        studentId,
        academicClassId,
        status: 'CONFIRMED',
      });

      await expect(response).resolves.toEqual({
        id: enrollmentId,
        studentId,
        academicClassId,
        status: 'CONFIRMED',
      });
    });

    it('19. cancelEnrollment: POST /api/enrollments/v1/{id}/cancellation (200 OK, transition to CANCELED)', async () => {
      const response = firstValueFrom(enrollmentsApi.cancelEnrollment(enrollmentId));
      const request = httpTesting.expectOne(`/api/enrollments/v1/${enrollmentId}/cancellation`);

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toBeNull();
      request.flush({
        id: enrollmentId,
        studentId,
        academicClassId,
        status: 'CANCELED',
      });

      await expect(response).resolves.toEqual({
        id: enrollmentId,
        studentId,
        academicClassId,
        status: 'CANCELED',
      });
    });

    it('20. listEnrollmentsByStudent: GET /api/enrollments/v1/students/{studentId}', async () => {
      const response = firstValueFrom(enrollmentsApi.listEnrollmentsByStudent(studentId));
      const request = httpTesting.expectOne(`/api/enrollments/v1/students/${studentId}`);

      expect(request.request.method).toBe('GET');
      request.flush([{ id: enrollmentId, studentId, academicClassId, status: 'CONFIRMED' }]);

      await expect(response).resolves.toEqual([
        { id: enrollmentId, studentId, academicClassId, status: 'CONFIRMED' },
      ]);
    });

    it('21. listEnrollmentsByAcademicClass: GET /api/enrollments/v1/academic-classes/{academicClassId}', async () => {
      const response = firstValueFrom(
        enrollmentsApi.listEnrollmentsByAcademicClass(academicClassId),
      );
      const request = httpTesting.expectOne(
        `/api/enrollments/v1/academic-classes/${academicClassId}`,
      );

      expect(request.request.method).toBe('GET');
      request.flush([]);

      await expect(response).resolves.toEqual([]);
    });
  });

  describe('Error normalization, validation, and resilience', () => {
    it('preserves valid field violations from a 400 problem response', async () => {
      const response = firstValueFrom(studentsApi.signUpStudent({ name: 'A', email: 'invalid' }));
      const expectation = expect(response).rejects.toMatchObject({
        name: 'ApiClientError',
        kind: 'api',
        status: 400,
        code: 'VALIDATION_FAILED',
        detail: 'Revise os campos informados.',
        traceId: 'trace-validation',
        violations: [{ field: 'email', message: 'E-mail inválido.' }],
      });
      const request = httpTesting.expectOne('/api/students/v1');

      request.flush(
        {
          ...apiProblem(400, 'VALIDATION_FAILED'),
          detail: 'Revise os campos informados.',
          traceId: 'trace-validation',
          violations: [{ field: 'email', message: 'E-mail inválido.' }],
        },
        { status: 400, statusText: 'Bad Request' },
      );

      await expectation;
    });

    it('normalizes 400 problem response without field violations', async () => {
      const response = firstValueFrom(enrollmentsApi.enrollStudent({ studentId, academicClassId }));
      const expectation = expect(response).rejects.toMatchObject({
        kind: 'api',
        status: 400,
        code: 'BAD_REQUEST',
        violations: [],
      });
      const request = httpTesting.expectOne('/api/enrollments/v1');

      request.flush(
        { ...apiProblem(400, 'BAD_REQUEST'), violations: [] },
        { status: 400, statusText: 'Bad Request' },
      );

      await expectation;
    });

    it.each([
      [409, 'CONFLICT'],
      [500, 'INTERNAL_ERROR'],
    ])('normalizes a valid %i problem response', async (status, code) => {
      const response = firstValueFrom(coursesApi.listCourses());
      const expectation = expect(response).rejects.toMatchObject({
        kind: 'api',
        status,
        code,
        traceId: 'trace-123',
      });
      const request = httpTesting.expectOne('/api/courses/v1');

      request.flush(apiProblem(status, code), { status, statusText: 'Request failed' });

      await expectation;
    });

    it('distinguishes a network failure (status 0) without exposing technical details', async () => {
      const response = firstValueFrom(academicClassesApi.listAcademicClasses());
      const expectation = expect(response).rejects.toMatchObject({
        kind: 'network',
        status: 0,
        code: null,
        traceId: null,
        violations: [],
      });
      const request = httpTesting.expectOne('/api/academic-classes/v1');

      request.error(new ProgressEvent('error'));

      await expectation;
    });

    it('uses a safe fallback for a malformed error payload', async () => {
      const response = firstValueFrom(disciplinesApi.listDisciplines());
      const expectation = expect(response).rejects.toMatchObject({
        kind: 'unexpected',
        status: 500,
        code: null,
        detail: 'Não foi possível concluir a operação. Tente novamente.',
        traceId: null,
        violations: [],
      });
      const request = httpTesting.expectOne('/api/disciplines/v1');

      request.flush({ detail: 123 }, { status: 500, statusText: 'Server Error' });

      await expectation;
    });

    it('does not resend a failed mutation automatically', async () => {
      const body = { studentId, academicClassId };
      const response = firstValueFrom(enrollmentsApi.enrollStudent(body));
      const expectation = expect(response).rejects.toMatchObject({ kind: 'api', status: 500 });
      const request = httpTesting.expectOne('/api/enrollments/v1');

      expect(request.request.method).toBe('POST');
      request.flush(apiProblem(500, 'INTERNAL_ERROR'), {
        status: 500,
        statusText: 'Server Error',
      });

      await expectation;
      httpTesting.expectNone('/api/enrollments/v1');
    });
  });
});
