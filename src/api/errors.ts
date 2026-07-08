import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/auth';

export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.mensaje ?? fallback;
  }
  return fallback;
}
