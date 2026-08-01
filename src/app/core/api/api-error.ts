import { HttpErrorResponse } from '@angular/common/http';

export interface ApiValidationViolation {
  readonly field: string;
  readonly message: string;
}

export interface ApiError {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
  readonly code: string;
  readonly traceId: string;
  readonly violations?: readonly ApiValidationViolation[];
}

export type ApiClientErrorKind = 'api' | 'network' | 'unexpected';

export class ApiClientError extends Error {
  override readonly name = 'ApiClientError';

  constructor(
    readonly kind: ApiClientErrorKind,
    readonly status: number,
    readonly code: string | null,
    readonly detail: string,
    readonly traceId: string | null,
    readonly violations: readonly ApiValidationViolation[] = [],
  ) {
    super(detail);
  }
}

const NETWORK_ERROR_DETAIL =
  'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.';
const UNEXPECTED_ERROR_DETAIL = 'Não foi possível concluir a operação. Tente novamente.';
const MALFORMED_RESPONSE_DETAIL = 'O serviço retornou uma resposta inválida. Tente novamente.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseViolation(value: unknown): ApiValidationViolation | null {
  if (!isRecord(value)) {
    return null;
  }

  const field = value['field'];
  const message = value['message'];

  return typeof field === 'string' && typeof message === 'string' ? { field, message } : null;
}

function parseApiError(value: unknown): ApiError | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = value['type'];
  const title = value['title'];
  const status = value['status'];
  const detail = value['detail'];
  const instance = value['instance'];
  const code = value['code'];
  const traceId = value['traceId'];
  const rawViolations = value['violations'];

  if (
    typeof type !== 'string' ||
    typeof title !== 'string' ||
    typeof status !== 'number' ||
    !Number.isInteger(status) ||
    typeof detail !== 'string' ||
    typeof instance !== 'string' ||
    typeof code !== 'string' ||
    typeof traceId !== 'string'
  ) {
    return null;
  }

  if (rawViolations === undefined) {
    return { type, title, status, detail, instance, code, traceId };
  }

  if (!Array.isArray(rawViolations)) {
    return null;
  }

  const violations: ApiValidationViolation[] = [];
  for (const rawViolation of rawViolations) {
    const violation = parseViolation(rawViolation);
    if (violation === null) {
      return null;
    }
    violations.push(violation);
  }

  return { type, title, status, detail, instance, code, traceId, violations };
}

export function malformedApiResponseError(): ApiClientError {
  return new ApiClientError('unexpected', 0, null, MALFORMED_RESPONSE_DETAIL, null);
}

export function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (!(error instanceof HttpErrorResponse)) {
    return new ApiClientError('unexpected', 0, null, UNEXPECTED_ERROR_DETAIL, null);
  }

  if (error.status === 0) {
    return new ApiClientError('network', 0, null, NETWORK_ERROR_DETAIL, null);
  }

  const problem = parseApiError(error.error);
  if (problem === null) {
    return new ApiClientError('unexpected', error.status, null, UNEXPECTED_ERROR_DETAIL, null);
  }

  return new ApiClientError(
    'api',
    problem.status,
    problem.code,
    problem.detail,
    problem.traceId,
    problem.violations,
  );
}
