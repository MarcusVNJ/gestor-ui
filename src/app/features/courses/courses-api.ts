import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL, buildApiUrl } from '../../core/api/api-base-url';
import { parseArray, parseNamedEntity } from '../../core/api/api-response';

export interface Course {
  readonly id: string;
  readonly name: string;
}

interface CourseDetails {
  readonly name: string;
}

export type RegisterCourseRequest = CourseDetails;
export type EditCourseRequest = CourseDetails;

@Injectable({ providedIn: 'root' })
export class CoursesApi {
  private readonly http = inject(HttpClient);
  private readonly url = buildApiUrl(inject(API_BASE_URL), 'courses/v1');

  listCourses(): Observable<readonly Course[]> {
    return this.http
      .get<unknown>(this.url)
      .pipe(map((value) => parseArray(value, parseNamedEntity)));
  }

  registerCourse(request: RegisterCourseRequest): Observable<Course> {
    return this.http.post<unknown>(this.url, request).pipe(map(parseNamedEntity));
  }

  editCourse(id: string, request: EditCourseRequest): Observable<Course> {
    return this.http
      .put<unknown>(`${this.url}/${encodeURIComponent(id)}`, request)
      .pipe(map(parseNamedEntity));
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`);
  }
}
