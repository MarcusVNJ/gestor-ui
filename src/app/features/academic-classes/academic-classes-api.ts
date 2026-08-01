import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL, buildApiUrl } from '../../core/api/api-base-url';
import { malformedApiResponseError } from '../../core/api/api-error';
import {
  parseArray,
  responsePositiveInteger,
  responseRecord,
  responseString,
} from '../../core/api/api-response';

export type OpeningStatus = 'OPEN' | 'CLOSED';

export interface AcademicClass {
  readonly id: string;
  readonly openingStatus: OpeningStatus;
  readonly seatLimit: number;
}

interface AcademicClassDetails {
  readonly openingStatus: OpeningStatus;
  readonly seatLimit: number;
}

export type RegisterAcademicClassRequest = AcademicClassDetails;
export type EditAcademicClassRequest = AcademicClassDetails;

function parseAcademicClass(value: unknown): AcademicClass {
  const record = responseRecord(value);
  const openingStatus = responseString(record, 'openingStatus');
  if (openingStatus !== 'OPEN' && openingStatus !== 'CLOSED') {
    throw malformedApiResponseError();
  }

  return {
    id: responseString(record, 'id'),
    openingStatus,
    seatLimit: responsePositiveInteger(record, 'seatLimit'),
  };
}

@Injectable({ providedIn: 'root' })
export class AcademicClassesApi {
  private readonly http = inject(HttpClient);
  private readonly url = buildApiUrl(inject(API_BASE_URL), 'academic-classes/v1');

  listAcademicClasses(): Observable<readonly AcademicClass[]> {
    return this.http
      .get<unknown>(this.url)
      .pipe(map((value) => parseArray(value, parseAcademicClass)));
  }

  registerAcademicClass(request: RegisterAcademicClassRequest): Observable<AcademicClass> {
    return this.http.post<unknown>(this.url, request).pipe(map(parseAcademicClass));
  }

  editAcademicClass(id: string, request: EditAcademicClassRequest): Observable<AcademicClass> {
    return this.http
      .put<unknown>(`${this.url}/${encodeURIComponent(id)}`, request)
      .pipe(map(parseAcademicClass));
  }

  deleteAcademicClass(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`);
  }
}
