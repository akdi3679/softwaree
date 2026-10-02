import { ErrorContractSchema } from '../../contracts/src/errors/contract';

export class CloudHttpError extends Error {
  readonly status: number;
  readonly contract?: unknown;

  constructor(status: number, message: string, contract?: unknown) {
    super(message);
    this.name = 'CloudHttpError';
    this.status = status;
    this.contract = contract;
  }
}

export async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let contract;
    try {
      contract = await res.json();
      const parsed = ErrorContractSchema.safeParse(contract);
      if (parsed.success) contract = parsed.data;
    } catch {
      contract = undefined;
    }
    const message =
      (contract && typeof contract === 'object' && 'message' in contract && String(contract.message)) ||
      res.statusText;
    throw new CloudHttpError(res.status, message, contract);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
