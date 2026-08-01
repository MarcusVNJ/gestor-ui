import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL, buildApiUrl } from '../../core/api/api-base-url';
import { parseArray, parseNamedEntity } from '../../core/api/api-response';

export interface Discipline {
  readonly id: string;
  readonly name: string;
}

interface DisciplineDetails {
  readonly name: string;
}

export type RegisterDisciplineRequest = DisciplineDetails;
export type EditDisciplineRequest = DisciplineDetails;

@Injectable({ providedIn: 'root' })
export class DisciplinesApi {
  private readonly http = inject(HttpClient);
  private readonly url = buildApiUrl(inject(API_BASE_URL), 'disciplines/v1');

  listDisciplines(): Observable<readonly Discipline[]> {
    return this.http
      .get<unknown>(this.url)
      .pipe(map((value) => parseArray(value, parseNamedEntity)));
  }

  registerDiscipline(request: RegisterDisciplineRequest): Observable<Discipline> {
    return this.http.post<unknown>(this.url, request).pipe(map(parseNamedEntity));
  }

  editDiscipline(id: string, request: EditDisciplineRequest): Observable<Discipline> {
    return this.http
      .put<unknown>(`${this.url}/${encodeURIComponent(id)}`, request)
      .pipe(map(parseNamedEntity));
  }

  deleteDiscipline(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`);
  }
}
