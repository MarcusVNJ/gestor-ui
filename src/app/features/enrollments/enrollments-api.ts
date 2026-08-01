import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL, buildApiUrl } from '../../core/api/api-base-url';
import { malformedApiResponseError } from '../../core/api/api-error';
import { parseArray, responseRecord, responseString } from '../../core/api/api-response';

export type EnrollmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED';

export interface Enrollment {
  readonly id: string;
  readonly studentId: string;
  readonly academicClassId: string;
  readonly status: EnrollmentStatus;
}

export interface ConfirmedEnrollment extends Enrollment {
  readonly status: 'CONFIRMED';
}

export interface CanceledEnrollment extends Enrollment {
  readonly status: 'CANCELED';
}

export interface EnrollStudentRequest {
  readonly studentId: string;
  readonly academicClassId: string;
}

function parseEnrollment(value: unknown): Enrollment {
  const record = responseRecord(value);
  const status = responseString(record, 'status');
  if (status !== 'PENDING' && status !== 'CONFIRMED' && status !== 'CANCELED') {
    throw malformedApiResponseError();
  }

  return {
    id: responseString(record, 'id'),
    studentId: responseString(record, 'studentId'),
    academicClassId: responseString(record, 'academicClassId'),
    status,
  };
}

function parseConfirmedEnrollment(value: unknown): ConfirmedEnrollment {
  const enrollment = parseEnrollment(value);
  if (enrollment.status !== 'CONFIRMED') {
    throw malformedApiResponseError();
  }
  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    academicClassId: enrollment.academicClassId,
    status: 'CONFIRMED',
  };
}

function parseCanceledEnrollment(value: unknown): CanceledEnrollment {
  const enrollment = parseEnrollment(value);
  if (enrollment.status !== 'CANCELED') {
    throw malformedApiResponseError();
  }
  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    academicClassId: enrollment.academicClassId,
    status: 'CANCELED',
  };
}

@Injectable({ providedIn: 'root' })
export class EnrollmentsApi {
  private readonly http = inject(HttpClient);
  private readonly url = buildApiUrl(inject(API_BASE_URL), 'enrollments/v1');

  enrollStudent(request: EnrollStudentRequest): Observable<Enrollment> {
    return this.http.post<unknown>(this.url, request).pipe(map(parseEnrollment));
  }

  confirmEnrollment(id: string): Observable<ConfirmedEnrollment> {
    return this.http
      .post<unknown>(`${this.url}/${encodeURIComponent(id)}/confirmation`, null)
      .pipe(map(parseConfirmedEnrollment));
  }

  cancelEnrollment(id: string): Observable<CanceledEnrollment> {
    return this.http
      .post<unknown>(`${this.url}/${encodeURIComponent(id)}/cancellation`, null)
      .pipe(map(parseCanceledEnrollment));
  }

  listEnrollmentsByStudent(studentId: string): Observable<readonly Enrollment[]> {
    return this.http
      .get<unknown>(`${this.url}/students/${encodeURIComponent(studentId)}`)
      .pipe(map((value) => parseArray(value, parseEnrollment)));
  }

  listEnrollmentsByAcademicClass(academicClassId: string): Observable<readonly Enrollment[]> {
    return this.http
      .get<unknown>(`${this.url}/academic-classes/${encodeURIComponent(academicClassId)}`)
      .pipe(map((value) => parseArray(value, parseEnrollment)));
  }
}
