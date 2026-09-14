const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface Empresa {
  id: number;
  nomeFantasia: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: Empresa;
}

export async function checkHealth(): Promise<{ database: string }> {
  const res = await fetch(`${API_URL}/health/db`);
  if (!res.ok) {
    throw new Error(`Backend respondeu ${res.status}`);
  }
  return res.json() as Promise<{ database: string }>;
}

export async function loginEmpresa(
  email: string,
  senha: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login/empresa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<LoginResponse>;
}

export { API_URL };
