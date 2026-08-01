import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL, buildApiUrl } from '../../core/api/api-base-url';
import { parseArray, parseStudent } from '../../core/api/api-response';

export interface Student {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

interface StudentDetails {
  readonly name: string;
  readonly email: string;
}

export type SignUpStudentRequest = StudentDetails;
export type EditStudentRequest = StudentDetails;

@Injectable({ providedIn: 'root' })
export class StudentsApi {
  private readonly http = inject(HttpClient);
  private readonly url = buildApiUrl(inject(API_BASE_URL), 'students/v1');

  listStudents(): Observable<readonly Student[]> {
    return this.http.get<unknown>(this.url).pipe(map((value) => parseArray(value, parseStudent)));
  }

  signUpStudent(request: SignUpStudentRequest): Observable<Student> {
    return this.http.post<unknown>(this.url, request).pipe(map(parseStudent));
  }

  editStudent(id: string, request: EditStudentRequest): Observable<Student> {
    return this.http
      .put<unknown>(`${this.url}/${encodeURIComponent(id)}`, request)
      .pipe(map(parseStudent));
  }

  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`);
  }
}
