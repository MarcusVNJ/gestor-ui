import { malformedApiResponseError } from './api-error';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw malformedApiResponseError();
  }
  return value;
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw malformedApiResponseError();
  }
  return value;
}

export function parseStudent(value: unknown): {
  readonly id: string;
  readonly name: string;
  readonly email: string;
} {
  const record = requireRecord(value);
  return {
    id: requireString(record, 'id'),
    name: requireString(record, 'name'),
    email: requireString(record, 'email'),
  };
}

export function parseNamedEntity(value: unknown): { readonly id: string; readonly name: string } {
  const record = requireRecord(value);
  return {
    id: requireString(record, 'id'),
    name: requireString(record, 'name'),
  };
}

export function parseArray<T>(value: unknown, parseItem: (item: unknown) => T): readonly T[] {
  if (!Array.isArray(value)) {
    throw malformedApiResponseError();
  }
  return value.map(parseItem);
}

export function responseRecord(value: unknown): Record<string, unknown> {
  return requireRecord(value);
}

export function responseString(record: Record<string, unknown>, key: string): string {
  return requireString(record, key);
}

export function responsePositiveInteger(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw malformedApiResponseError();
  }
  return value;
}
